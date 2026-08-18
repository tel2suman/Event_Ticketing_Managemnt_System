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
      // Grand total actually charged to the user (base ticket price +
      // fees below), stored in rupees (not paise) for readability in the
      // DB/admin views.
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative."],
    },

    // Convenience-fee/tax breakdown behind `amount` above. `amount` stays
    // the single source of truth for what Razorpay actually charged;
    // these fields exist purely so the checkout UI (and refunds, which
    // deliberately exclude the fee — see paymentController) can show
    // where the total came from. See utils/feeCalculator.js.
    feeBreakdown: {
      baseAmount: { type: Number, default: 0 },
      convenienceFee: { type: Number, default: 0 },
      taxOnFee: { type: Number, default: 0 },
      totalFees: { type: Number, default: 0 },
    },

    // Billing/invoice-recipient details captured at checkout. Optional —
    // older payments created before this field existed won't have it.
    billingDetails: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      email: { type: String, default: null },
      nationality: {
        type: String,
        enum: ["Indian Resident", "International Visitor", null],
        default: null,
      },
      state: { type: String, default: null },
    },

    // Coupon applied at checkout, if any. Redemption (Coupon.usedCount)
    // is reserved when this Payment is created and rolled back if the
    // payment later fails/expires — see utils/couponGiftCardHelper.js.
    couponCode: {
      type: String,
      default: null,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    // Gift card applied at checkout, if any. Same reserve/rollback
    // pattern as the coupon above.
    giftCardCode: {
      type: String,
      default: null,
    },

    giftCardAmountUsed: {
      type: Number,
      default: 0,
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
