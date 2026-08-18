const Ticket = require("../models/Ticket");
const TicketTier = require("../models/TicketTier");

// Flips one specific seat back to "available" on an assigned-seating
// tier. No-op for a plain general-admission ticket (seatLabel is null).
const releaseSeat = async (ticket) => {
  if (!ticket.seatLabel) {
    return;
  }

  await TicketTier.updateOne(
    { _id: ticket.tierId, "seats.label": ticket.seatLabel },
    { $set: { "seats.$.status": "available" } },
  );
};

// Flips one specific seat to "sold" once its ticket is actually paid
// for — called from paymentController wherever paymentStatus flips to
// "paid" (verify + webhook). No-op for general-admission tickets.
const markSeatSold = async (ticket) => {
  if (!ticket.seatLabel) {
    return;
  }

  await TicketTier.updateOne(
    { _id: ticket.tierId, "seats.label": ticket.seatLabel },
    { $set: { "seats.$.status": "sold" } },
  );
};

// Releases stock back to a tier and marks a ticket as failed/cancelled.
// Used by: payment failure/refund handling (paymentController.js) AND
// the cron job that expires abandoned pending reservations.
// Guards against double-release (already checked-in, or already
// cancelled once before) so stock is never decremented twice for the
// same ticket.
const releaseTicketStock = async (ticket) => {
  if (ticket.checkedIn) {
    return;
  }

  if (ticket.cancelledAt) {
    return;
  }

  ticket.paymentStatus = "failed";
  ticket.cancelledAt = new Date();
  await ticket.save();

  await TicketTier.findByIdAndUpdate(ticket.tierId, {
    $inc: { quantitySold: -1 },
  });

  await releaseSeat(ticket);
};

module.exports = { releaseTicketStock, releaseSeat, markSeatSold };
