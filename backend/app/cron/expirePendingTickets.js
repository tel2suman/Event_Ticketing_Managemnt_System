const Ticket = require("../models/Ticket");
const Payment = require("../models/Payment");
const { releaseTicketStock } = require("../utils/ticketStockHelper");

// How long a reserved-but-unpaid ticket is allowed to sit before we
// release its seat back into inventory. Defaults to 15 minutes — someone
// who abandons checkout shouldn't be able to hold a seat hostage forever.
const PENDING_EXPIRY_MINUTES = Number(process.env.PENDING_EXPIRY_MINUTES) || 15;

const expirePendingTickets = async () => {
  try {
    const cutoff = new Date(Date.now() - PENDING_EXPIRY_MINUTES * 60 * 1000);

    const expiredTickets = await Ticket.find({
      paymentStatus: "pending",
      cancelledAt: null,
      createdAt: { $lt: cutoff },
    });

    if (expiredTickets.length === 0) {
      return;
    }

    for (const ticket of expiredTickets) {
      await releaseTicketStock(ticket);
    }

    // Also mark the corresponding Payment records as failed, so they
    // don't sit around forever showing "created"/"paid" status.
    const orderIds = [...new Set(expiredTickets.map((t) => t.orderId))];

    await Payment.updateMany(
      { orderId: { $in: orderIds }, status: { $in: ["created"] } },
      { $set: { status: "failed", failureReason: "Payment window expired" } },
    );

    console.log(
      `[cron] Expired ${expiredTickets.length} abandoned pending ticket(s) across ${orderIds.length} order(s)`,
    );
  } catch (error) {
    console.error("[cron] expirePendingTickets failed:", error.message);
  }
};

module.exports = expirePendingTickets;
