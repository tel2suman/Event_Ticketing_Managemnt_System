const Ticket = require("../models/Ticket");
const TicketTier = require("../models/TicketTier");

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
};

module.exports = { releaseTicketStock };
