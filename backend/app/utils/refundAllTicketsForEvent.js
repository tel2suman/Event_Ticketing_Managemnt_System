const razorpayInstance = require("../config/razorpay");
const Payment = require("../models/Payment");
const Ticket = require("../models/Ticket");
const { releaseTicketStock } = require("./ticketStockHelper");
const { notify } = require("./notify");

// Full-refunds every paid, refundable ticket for an event — 100% of what
// was paid, not the tiered cancellation refund-policy percentage, since
// the event itself (not the customer) is why the ticket can no longer be
// used. Shared by paymentController.refundAllForEvent (manual admin
// trigger) and eventController.deleteEvent (automatic, when a
// not-yet-happened event gets deleted).
async function refundAllTicketsForEvent(eventId, { reason } = {}) {
  const payments = await Payment.find({ eventId, status: "paid" });

  if (payments.length === 0) {
    return { refunded: 0, failed: 0, results: [] };
  }

  const results = [];

  for (const payment of payments) {
    try {
      const allTickets = await Ticket.find({ orderId: payment.orderId });

      const refundableTickets = allTickets.filter(
        (ticket) => !ticket.checkedIn && ticket.refundedAmount === 0,
      );

      if (refundableTickets.length === 0) {
        results.push({
          orderId: payment.orderId,
          status: "skipped",
          reason: "No refundable tickets (already refunded or checked in)",
        });
        continue;
      }

      const refundAmount = refundableTickets.reduce(
        (sum, ticket) => sum + ticket.priceAtPurchase,
        0,
      );

      const refund = await razorpayInstance.payments.refund(
        payment.razorpayPaymentId,
        { amount: Math.round(refundAmount * 100) },
      );

      const refundedAt = new Date();

      for (const ticket of refundableTickets) {
        payment.refunds.push({
          ticketId: ticket._id,
          razorpayRefundId: refund.id,
          amount: ticket.priceAtPurchase,
          refundedAt,
        });

        ticket.refundedAmount = ticket.priceAtPurchase;
        await releaseTicketStock(ticket);
      }

      const stillRefundable = await Ticket.exists({
        orderId: payment.orderId,
        checkedIn: false,
        refundedAmount: 0,
      });

      payment.status = stillRefundable ? "paid" : "refunded";
      payment.refundId = refund.id;
      payment.refundedAt = refundedAt;
      await payment.save();

      notify({
        userId: payment.userId,
        eventId: payment.eventId,
        type: "refund_processed",
        title: "Event cancelled — refund processed",
        message: `₹${refundAmount} has been refunded for booking ${payment.orderId} because ${reason || "the event was cancelled"}.`,
      });

      results.push({
        orderId: payment.orderId,
        status: "refunded",
        amount: refundAmount,
        ticketsRefunded: refundableTickets.length,
      });
    } catch (perPaymentError) {
      console.error(
        `Refund All For Event — order ${payment.orderId} failed:`,
        perPaymentError.message,
      );

      results.push({
        orderId: payment.orderId,
        status: "failed",
        reason: perPaymentError.message,
      });
    }
  }

  const refunded = results.filter((r) => r.status === "refunded").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return { refunded, failed, results };
}

module.exports = { refundAllTicketsForEvent };
