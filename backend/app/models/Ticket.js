const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketTier",
      required: true,
    },

    // Groups multiple tickets bought together in a single purchase call
    orderId: {
      type: String,
      required: true,
      index: true,
    },

    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },

    qrCodeUrl: {
      type: String,
      required: true,
    },

    qrCodePublicId: {
      // Cloudinary public_id, kept so the QR image can be deleted on cancel
      type: String,
      default: null,
    },

    // Snapshot of the tier price at the time of purchase, so later price
    // changes on the tier don't retroactively change what this ticket cost
    priceAtPurchase: {
      type: Number,
      required: true,
    },

    // Only set when the tier this ticket belongs to has assigned
    // seating (TicketTier.hasAssignedSeating). Null for regular
    // general-admission tickets, exactly as today.
    seatLabel: {
      type: String,
      default: null,
    },

    // Ownership transfer history — see ticketController.transferTicket.
    // The ticketCode/QR stays the same across a transfer; only `userId`
    // (current owner) changes, with each hop logged here for an audit
    // trail.
    transferHistory: {
      type: [
        {
          fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          transferredAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    checkedIn: {
      type: Boolean,
      default: false,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    refundedAmount: {
      // 0 if never refunded; may be a partial amount per the refund policy
      type: Number,
      default: 0,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Fast lookups for "my tickets" dashboard, and for admin event-level reports
ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ eventId: 1, paymentStatus: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
