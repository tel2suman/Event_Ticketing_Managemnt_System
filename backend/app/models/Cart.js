const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
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

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One cart row per (user, event, tier) — adding the same tier again
// increments quantity on the existing row instead of creating a duplicate.
cartSchema.index({ userId: 1, eventId: 1, tierId: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
