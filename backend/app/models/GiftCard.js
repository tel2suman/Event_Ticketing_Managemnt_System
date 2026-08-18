const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    initialBalance: {
      type: Number,
      required: true,
      min: [0, "Balance cannot be negative."],
    },

    // Decremented as it's spent (partial redemption across multiple
    // orders is allowed, like a real gift card).
    balance: {
      type: Number,
      required: true,
      min: [0, "Balance cannot be negative."],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    issuedTo: {
      // Optional — who the gift card was generated for, if known.
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Ledger of what it was spent on, so admins can see redemption history
    redemptions: {
      type: [
        {
          orderId: String,
          amountUsed: Number,
          redeemedAt: { type: Date, default: Date.now },
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

module.exports = mongoose.model("GiftCard", giftCardSchema);
