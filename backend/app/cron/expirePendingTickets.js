const Ticket = require("../models/Ticket");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { releaseTicketStock } = require("../utils/ticketStockHelper");
const { releaseCouponAndGiftCard } = require("../utils/couponGiftCardHelper");
const { notify } = require("../utils/notify");

// How long a reserved-but-unpaid ticket is allowed to sit before we
// release its seat back into inventory. Defaults to 15 minutes — someone
// who abandons checkout shouldn't be able to hold a seat hostage forever.
// Also surfaced to the frontend via ticketController.purchaseTicket's
// response, so the checkout countdown timer never drifts from this.
const PENDING_EXPIRY_MINUTES = Number(process.env.PENDING_EXPIRY_MINUTES) || 15;

// Warn once while a reservation is in its last 20% of the hold window,
// instead of only ever telling the user after their seats are already
// gone. E.g. at the 15-minute default, that's a warning around the
// 12-minute mark, 3 minutes before release.
const WARNING_WINDOW_MINUTES = PENDING_EXPIRY_MINUTES * 0.2;

const warnExpiringSoon = async () => {
  const now = Date.now();
  const expiryCutoff = new Date(now - PENDING_EXPIRY_MINUTES * 60 * 1000);
  const warningCutoff = new Date(
    now - (PENDING_EXPIRY_MINUTES - WARNING_WINDOW_MINUTES) * 60 * 1000,
  );

  // In the warning zone: old enough to be close to expiring, not old
  // enough to have actually expired yet.
  const soonToExpire = await Ticket.find({
    paymentStatus: "pending",
    cancelledAt: null,
    createdAt: { $lt: warningCutoff, $gte: expiryCutoff },
  });

  if (soonToExpire.length === 0) {
    return;
  }

  const orderIds = [...new Set(soonToExpire.map((t) => t.orderId))];

  for (const orderId of orderIds) {
    // De-dupe: the warning zone can span more than one cron tick, so
    // only send this once per order — check whether we already warned
    // about this specific order.
    const alreadyWarned = await Notification.exists({
      type: "reservation_expiring",
      message: { $regex: orderId },
    });

    if (alreadyWarned) {
      continue;
    }

    const ticket = soonToExpire.find((t) => t.orderId === orderId);
    const minutesLeft = Math.max(
      1,
      Math.round(
        PENDING_EXPIRY_MINUTES -
          (now - new Date(ticket.createdAt).getTime()) / (60 * 1000),
      ),
    );

    notify({
      userId: ticket.userId,
      eventId: ticket.eventId,
      type: "reservation_expiring",
      title: "Your reservation is about to expire",
      message: `Booking ${orderId} will be released in about ${minutesLeft} minute(s) unless payment is completed.`,
    });
  }
};

const expirePendingTickets = async () => {
  try {
    await warnExpiringSoon();

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

    // Also mark the corresponding Payment records as failed (rolling
    // back any coupon/gift-card they'd reserved), so they don't sit
    // around forever showing "created" status.
    const orderIds = [...new Set(expiredTickets.map((t) => t.orderId))];

    const expiredPayments = await Payment.find({
      orderId: { $in: orderIds },
      status: "created",
    });

    for (const payment of expiredPayments) {
      await releaseCouponAndGiftCard(payment);

      notify({
        userId: payment.userId,
        eventId: payment.eventId,
        type: "payment_failed",
        title: "Reservation expired",
        message: `Your reservation for booking ${payment.orderId} expired before payment was completed. Your seats have been released.`,
      });
    }

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
