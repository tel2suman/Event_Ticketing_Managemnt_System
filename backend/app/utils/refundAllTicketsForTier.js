const razorpayInstance = require("../config/razorpay");
const Payment = require("../models/Payment");
const Ticket = require("../models/Ticket");
const { releaseTicketStock } = require("./ticketStockHelper");
const { notify } = require("./notify");

// Full-refunds every paid, refundable ticket bought under one tier — 100%
// of what was paid, same "not the customer's fault" reasoning as
// refundAllTicketsForEvent. A purchase call only ever draws from a single
// tier, so every ticket in an affected order belongs to this tier and the
// whole order is refunded, exactly like the event-wide version.
// Used by ticketTierController.deleteTicketTier when a tier that still has
// paid (but not fully sold-out) tickets is removed.
async function refundAllTicketsForTier(tierId, { reason } = {}) {
  const tierTickets = await Ticket.find({ tierId, paymentStatus: "paid" });
  const orderIds = [...new Set(tierTickets.map((ticket) => ticket.orderId))];

  if (orderIds.length === 0) {
    return { refunded: 0, failed: 0, results: [] };
  }

  const payments = await Payment.find({
    orderId: { $in: orderIds },
    status: "paid",
  });

  const results = [];

  for (const payment of payments) {
    try {
      const orderTickets = await Ticket.find({
        orderId: payment.orderId,
        tierId,
      });

      const refundableTickets = orderTickets.filter(
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
        title: "Ticket tier removed — refund processed",
        message: `₹${refundAmount} has been refunded for booking ${payment.orderId} because ${reason || "the ticket tier was removed"}.`,
      });

      results.push({
        orderId: payment.orderId,
        status: "refunded",
        amount: refundAmount,
        ticketsRefunded: refundableTickets.length,
      });
    } catch (perPaymentError) {
      console.error(
        `Refund All For Tier — order ${payment.orderId} failed:`,
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

module.exports = { refundAllTicketsForTier };
