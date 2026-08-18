const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      // percentage points (e.g. 10 = 10%) or a flat rupee amount,
      // depending on discountType
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative."],
    },

    // Caps how much a percentage coupon can knock off in rupees — not
    // used for flat coupons. Null means uncapped.
    maxDiscountAmount: {
      type: Number,
      default: null,
    },

    minOrderAmount: {
      type: Number,
      default: 0,
    },

    // Null = valid platform-wide; set = only valid for that event's tickets
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    usageLimit: {
      // Null = unlimited redemptions
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Coupon", couponSchema);
