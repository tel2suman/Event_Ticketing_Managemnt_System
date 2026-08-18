const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "event_created",
        "event_updated",
        "event_deleted",
        "event_activated",
        "event_deactivated",
        "payment_success",
        "payment_failed",
        "refund_processed",
        "reservation_expiring",
        "ticket_transferred",
      ],
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    // Recipient of a personal notification (payment/refund/ticket
    // events). Null for admin-broadcast notifications (event lifecycle
    // changes), which have no single "for user X" target.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // The admin who triggered an event-lifecycle notification. Null for
    // system-generated notifications (payment webhook, cron jobs) where
    // there's no logged-in admin behind the action.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
