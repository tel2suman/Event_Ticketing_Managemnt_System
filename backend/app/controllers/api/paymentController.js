const razorpayInstance = require("../../config/razorpay");
const Payment = require("../../models/Payment");
const Ticket = require("../../models/Ticket");
const TicketTier = require("../../models/TicketTier");
const HttpStatusCode = require("../../utils/httpStatusCode");
const { sendTicketConfirmationEmail } = require("../../utils/ticketEmailHelper");
const { getRefundEligibility } = require("../../utils/refundPolicy");
const {
  verifyOrderSignature,
  verifyWebhookSignature,
} = require("../../utils/razorpaySignature");

// Releases stock back to a tier and marks a ticket as failed/cancelled.
// Mirrors the rollback logic in ticketController.cancelTicket — kept as a
// standalone function here (not a class method) for the same reason the
// Ticket module avoids `this`: Express strips object binding from route
// handlers, so cross-calling class methods via `this` would break.
async function releaseTicket(ticket) {
  if (ticket.checkedIn) {
    // Already used at the gate — don't touch stock, just log the state.
    return;
  }

  if (ticket.cancelledAt) {
    // Already released once before — decrementing stock again here
    // would double-release the same seat back into inventory.
    return;
  }

  ticket.paymentStatus = "failed";
  ticket.cancelledAt = new Date();
  await ticket.save();

  await TicketTier.findByIdAndUpdate(ticket.tierId, {
    $inc: { quantitySold: -1 },
  });
}

class PaymentController {
  // create a Razorpay order for a previously-reserved ticket order
  async createOrder(req, res) {
    try {
      const { orderId } = req.body;
      const userId = req.user._id;

      const tickets = await Ticket.find({ orderId });

      if (tickets.length === 0) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "No tickets found for this order",
        });
      }

      const isOwner = tickets.every(
        (ticket) => ticket.userId.toString() === userId.toString(),
      );

      if (!isOwner) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to pay for this order",
        });
      }

      const alreadyPaid = tickets.some((t) => t.paymentStatus === "paid");

      if (alreadyPaid) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "This order has already been paid for",
        });
      }

      const anyCancelled = tickets.some((t) => t.cancelledAt);

      if (anyCancelled) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This order has been cancelled and can no longer be paid for",
        });
      }

      const amount = tickets.reduce((sum, t) => sum + t.priceAtPurchase, 0);

      // Reuse an existing Payment doc for this order if one was already
      // created (e.g. user refreshed the page before paying), instead of
      // creating a duplicate Razorpay order every time.
      let payment = await Payment.findOne({ orderId });

      if (payment && payment.status === "created") {
        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: "Order already created",
          data: {
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount,
            currency: payment.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          },
        });
      }

      // Razorpay expects the amount in the smallest currency unit
      // (paise for INR), so multiply rupees by 100.
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: orderId,
      });

      payment = await Payment.create({
        orderId,
        userId,
        eventId: tickets[0].eventId,
        amount,
        razorpayOrderId: razorpayOrder.id,
        status: "created",
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Razorpay order created",
        data: {
          razorpayOrderId: razorpayOrder.id,
          amount,
          currency: "INR",
          // Public key — safe to expose to the frontend, it's not the secret
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      console.error("Create Payment Order Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // called by the frontend right after Razorpay's Checkout widget succeeds
  async verifyPayment(req, res) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        req.body;

      const payment = await Payment.findOne({ razorpayOrderId });

      if (!payment) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Payment record not found",
        });
      }

      if (payment.userId.toString() !== req.user._id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to verify this payment",
        });
      }

      // If the webhook already confirmed this payment before the
      // frontend's verify call landed, there's nothing left to do.
      if (payment.status === "paid") {
        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: "Payment already verified",
          data: payment,
        });
      }

      const isValidSignature = verifyOrderSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      if (!isValidSignature) {
        payment.status = "failed";
        payment.failureReason = "Signature verification failed";
        await payment.save();

        const tickets = await Ticket.find({ orderId: payment.orderId });
        await Promise.all(tickets.map(releaseTicket));

        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Payment verification failed — signature mismatch",
        });
      }

      payment.status = "paid";
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paidAt = new Date();
      await payment.save();

      await Ticket.updateMany(
        { orderId: payment.orderId },
        { $set: { paymentStatus: "paid" } },
      );

      // Fire-and-forget: don't await, so a slow SMTP server never delays
      // the payment confirmation response. Errors are caught and logged
      // inside the helper itself, never bubble up here.
      sendTicketConfirmationEmail(payment.orderId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Payment verified successfully",
        data: payment,
      });
    } catch (error) {
      console.error("Verify Payment Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Razorpay's server-to-server webhook — the reliable fallback in case
  // the user closes their browser right after paying, before the
  // frontend's verifyPayment call ever fires.
  async handleWebhook(req, res) {
    try {
      const signature = req.headers["x-razorpay-signature"];

      const isValidSignature = verifyWebhookSignature({
        rawBody: req.rawBody,
        signature,
      });

      if (!isValidSignature) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }

      const event = req.body.event;
      const payload = req.body.payload;

      if (event === "payment.captured") {
        const razorpayPaymentEntity = payload.payment.entity;
        const razorpayOrderId = razorpayPaymentEntity.order_id;

        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment && payment.status !== "paid") {
          payment.status = "paid";
          payment.razorpayPaymentId = razorpayPaymentEntity.id;
          payment.method = razorpayPaymentEntity.method;
          payment.paidAt = new Date();
          await payment.save();

          await Ticket.updateMany(
            { orderId: payment.orderId },
            { $set: { paymentStatus: "paid" } },
          );

          sendTicketConfirmationEmail(payment.orderId);
        }
      }

      if (event === "payment.failed") {
        const razorpayPaymentEntity = payload.payment.entity;
        const razorpayOrderId = razorpayPaymentEntity.order_id;

        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment && payment.status !== "paid") {
          payment.status = "failed";
          payment.failureReason =
            razorpayPaymentEntity.error_description || "Payment failed";
          await payment.save();

          const tickets = await Ticket.find({ orderId: payment.orderId });
          await Promise.all(tickets.map(releaseTicket));
        }
      }

      // Razorpay just needs a 200 OK to know the webhook was received —
      // it will retry with backoff if we don't respond in time.
      return res.status(HttpStatusCode.SUCCESS).json({ success: true });
    } catch (error) {
      console.error("Razorpay Webhook Error:", error);

      // Still return 200 here would hide real bugs from Razorpay's retry
      // mechanism, so we deliberately return an error status instead.
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: refund a payment — refunds every ticket in the order that
  // hasn't already been individually refunded and hasn't been checked in.
  // Use this for admin-driven cases (e.g. the whole event got cancelled).
  // For a single user cancelling their own one ticket, see
  // requestTicketRefund below instead.
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount } = req.body; // optional override — omit for the full remaining refundable amount

      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Payment not found",
        });
      }

      if (payment.status !== "paid") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Only successfully paid payments can be refunded",
        });
      }

      const allTickets = await Ticket.find({ orderId: payment.orderId });

      const refundableTickets = allTickets.filter(
        (ticket) => !ticket.checkedIn && ticket.refundedAmount === 0,
      );

      if (refundableTickets.length === 0) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "No refundable tickets remain in this order (already refunded or checked in)",
        });
      }

      const remainingRefundableAmount = refundableTickets.reduce(
        (sum, ticket) => sum + ticket.priceAtPurchase,
        0,
      );

      const refundAmount = amount || remainingRefundableAmount;

      const refund = await razorpayInstance.payments.refund(
        payment.razorpayPaymentId,
        { amount: Math.round(refundAmount * 100) },
      );

      const refundedAt = new Date();

      // Record one refund ledger entry per ticket, and cancel/release
      // each ticket's reserved stock (unless already checked in).
      for (const ticket of refundableTickets) {
        payment.refunds.push({
          ticketId: ticket._id,
          razorpayRefundId: refund.id,
          amount: ticket.priceAtPurchase,
          refundedAt,
        });

        ticket.refundedAmount = ticket.priceAtPurchase;
        await releaseTicket(ticket);
      }

      // Only mark the whole order "refunded" once nothing refundable is
      // left (i.e. every non-checked-in ticket has now been refunded).
      const stillRefundable = await Ticket.exists({
        orderId: payment.orderId,
        checkedIn: false,
        refundedAmount: 0,
      });

      payment.status = stillRefundable ? "paid" : "refunded";
      payment.refundId = refund.id;
      payment.refundedAt = refundedAt;
      await payment.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Refunded ${refundableTickets.length} ticket(s) totaling ₹${refundAmount}`,
        data: payment,
      });
    } catch (error) {
      console.error("Refund Payment Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // user: self-service cancel + refund for ONE of their own paid tickets.
  // Refund amount is determined by the refund policy (time before event).
  async requestTicketRefund(req, res) {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findById(ticketId).populate(
        "eventId",
        "title date time",
      );

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to request a refund for this ticket",
        });
      }

      if (ticket.checkedIn) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A ticket that has already been checked in cannot be refunded",
        });
      }

      if (ticket.cancelledAt) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This ticket has already been cancelled",
        });
      }

      if (ticket.paymentStatus !== "paid") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "This ticket was never paid for — cancel it directly instead of requesting a refund",
        });
      }

      const eligibility = getRefundEligibility(ticket.eventId);

      if (!eligibility.eligible) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: eligibility.reason || "This ticket is not eligible for a refund",
        });
      }

      const payment = await Payment.findOne({ orderId: ticket.orderId });

      if (!payment || !payment.razorpayPaymentId) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Payment record not found for this ticket",
        });
      }

      const refundAmount = Math.round(
        (ticket.priceAtPurchase * eligibility.percentage) / 100,
      );

      const refund = await razorpayInstance.payments.refund(
        payment.razorpayPaymentId,
        { amount: Math.round(refundAmount * 100) },
      );

      const refundedAt = new Date();

      payment.refunds.push({
        ticketId: ticket._id,
        razorpayRefundId: refund.id,
        amount: refundAmount,
        refundedAt,
      });

      // Same "is anything still refundable in this order?" check used in
      // the admin path, so both paths converge on a consistent order status.
      const stillRefundable = await Ticket.exists({
        orderId: payment.orderId,
        _id: { $ne: ticket._id },
        checkedIn: false,
        refundedAmount: 0,
      });

      payment.status = stillRefundable ? "paid" : "refunded";
      await payment.save();

      ticket.refundedAmount = refundAmount;
      await releaseTicket(ticket);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Refund of ₹${refundAmount} (${eligibility.percentage}% per policy) processed successfully`,
        data: { ticket, refundAmount, refundPercentage: eligibility.percentage },
      });
    } catch (error) {
      console.error("Request Ticket Refund Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get payment status for an order (owner or admin) — used for polling
  async getPaymentByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      const payment = await Payment.findOne({ orderId });

      if (!payment) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Payment not found for this order",
        });
      }

      const isOwner = payment.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to view this payment",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      console.error("Get Payment Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
