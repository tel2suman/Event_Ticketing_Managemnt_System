const Ticket = require("../models/Ticket");
const User = require("../models/User");
const EmailUtility = require("./sendEmail");

// Sends the "here are your tickets" email for a fully-paid order.
// Deliberately swallows its own errors (logs, doesn't throw) — a failed
// email should never cause a payment confirmation request to fail or
// roll back. Called from both the client-verify path and the webhook
// path in paymentController, and both already guard against calling
// this more than once per order (they only run this branch the first
// time a payment transitions into "paid").
const sendTicketConfirmationEmail = async (orderId) => {
  try {
    const tickets = await Ticket.find({ orderId })
      .populate("eventId", "title date time location")
      .populate("tierId", "name");

    if (tickets.length === 0) {
      console.error(
        `Ticket email skipped: no tickets found for orderId ${orderId}`,
      );
      return;
    }

    const user = await User.findById(tickets[0].userId).select("name email");

    if (!user) {
      console.error(
        `Ticket email skipped: user not found for orderId ${orderId}`,
      );
      return;
    }

    const event = tickets[0].eventId;

    await EmailUtility.sendTicketConfirmationEmail(user, event, tickets);
  } catch (error) {
    console.error(
      `Failed to send ticket confirmation email for orderId ${orderId}:`,
      error.message,
    );
  }
};

module.exports = { sendTicketConfirmationEmail };
