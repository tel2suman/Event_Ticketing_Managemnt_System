const mongoose = require("mongoose");

const ticketTierSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative."],
    },

    quantityAvailable: {
      type: Number,
      required: true,
      min: [0, "Available quantity cannot be negative."],
    },

    quantitySold: {
      type: Number,
      default: 0,
      min: [0, "Sold quantity cannot be negative."],
    },

    benefits: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate tier names within the same event (e.g. two "VIP" tiers).
ticketTierSchema.index({ eventId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("TicketTier", ticketTierSchema);

