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

    // Short marketing tagline shown between the price and the benefits
    // bullets on the storefront (e.g. "A closer experience with premium
    // viewing."). Distinct from `benefits` — this is one sentence of
    // tier-specific copy, not a list.
    description: {
      type: String,
      trim: true,
      maxlength: [150, "Description cannot exceed 150 characters."],
      default: "",
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

    // Assigned-seating support (opt-in per tier — a plain
    // general-admission tier leaves this false and `seats` empty, and
    // continues to work exactly as it does today via
    // quantityAvailable/quantitySold).
    hasAssignedSeating: {
      type: Boolean,
      default: false,
    },

    seats: {
      type: [
        {
          label: { type: String, required: true }, // e.g. "A1"
          status: {
            type: String,
            enum: ["available", "held", "sold"],
            default: "available",
          },
        },
      ],
      default: [],
    },

    // Per-tier refund policy override — an array of the same shape as
    // REFUND_TIERS in utils/refundPolicy.js
    // ([{ minHoursBeforeEvent, percentage }, ...], sorted largest
    // threshold first). Empty array = fall back to the platform-wide
    // default policy. Set a single { minHoursBeforeEvent: 0, percentage: 0 }
    // entry to make a tier fully non-refundable.
    refundPolicyOverride: {
      type: [
        {
          minHoursBeforeEvent: { type: Number, required: true },
          percentage: { type: Number, required: true, min: 0, max: 100 },
        },
      ],
      default: [],
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

