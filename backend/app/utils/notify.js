const Notification = require("../models/Notification");

// Fire-and-forget helper for personal (per-user) notifications —
// payment success/failure, refunds, expiring reservations, ticket
// transfers. Deliberately swallows its own errors (same pattern as
// ticketEmailHelper.sendTicketConfirmationEmail): a notification that
// fails to save should never break the payment/ticket flow it's
// attached to.
const notify = async ({ userId, eventId = null, type, title, message }) => {
  try {
    await Notification.create({
      userId,
      eventId,
      type,
      title,
      message,
    });
  } catch (error) {
    console.error(`Failed to create notification (${type}) for user ${userId}:`, error.message);
  }
};

module.exports = { notify };
