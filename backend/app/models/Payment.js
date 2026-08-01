const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      // matches Ticket.orderId - one Payment covers the whole order,
      // which may contain multiple individual Ticket documents
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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

    amount: {
      // stored in rupees (not paise) for readability in the DB/admin views
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative."],
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Populated once Razorpay tells us how the user actually paid
    // (e.g. "upi", "card", "netbanking", "wallet")
    method: {
      type: String,
      default: null,
    },

    razorpayOrderId: {
      type: String,
      required: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    refundId: {
      // set when the ENTIRE order has been refunded in one go (admin path)
      type: String,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    // Tracks individual per-ticket refunds (self-service user cancellations).
    // status only flips to "refunded" once every ticket in the order has
    // an entry here — a partial refund leaves status as "paid".
    refunds: {
      type: [
        {
          ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
          },
          razorpayRefundId: String,
          amount: Number,
          refundedAt: Date,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Payment", paymentSchema);
