const Coupon = require("../models/Coupon");
const GiftCard = require("../models/GiftCard");

// Validates + "reserves" a coupon against an order — reserving means
// incrementing usedCount immediately, the same pattern
// ticketStockHelper uses for seat inventory (reserve at order-creation
// time, roll back on failure/expiry via releaseCouponAndGiftCard below).
// Throws a plain Error with a user-facing message on any validation
// failure; callers are expected to turn that into a 400 response.
const applyCoupon = async ({ code, orderAmount, eventId }) => {
  if (!code) {
    return { discountAmount: 0, coupon: null };
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!coupon) {
    throw new Error("Invalid or inactive coupon code");
  }

  const now = new Date();

  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new Error("This coupon has expired or is not yet active");
  }

  if (coupon.eventId && eventId && coupon.eventId.toString() !== eventId.toString()) {
    throw new Error("This coupon is not valid for this event");
  }

  if (orderAmount < coupon.minOrderAmount) {
    throw new Error(
      `This coupon requires a minimum order amount of Rs. ${coupon.minOrderAmount}`,
    );
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("This coupon has reached its usage limit");
  }

  let discountAmount =
    coupon.discountType === "percentage"
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue;

  if (coupon.discountType === "percentage" && coupon.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  }

  // Never discount more than the order is actually worth
  discountAmount = Math.min(Math.round(discountAmount * 100) / 100, orderAmount);

  coupon.usedCount += 1;
  await coupon.save();

  return { discountAmount, coupon };
};

// Redeems as much of a gift card's balance as the remaining order total
// needs (partial redemption — the rest of the balance stays on the
// card for a future order, like a real gift card).
const applyGiftCard = async ({ code, remainingAmount, orderId }) => {
  if (!code) {
    return { amountUsed: 0, giftCard: null };
  }

  const giftCard = await GiftCard.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!giftCard) {
    throw new Error("Invalid or inactive gift card code");
  }

  if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
    throw new Error("This gift card has expired");
  }

  if (giftCard.balance <= 0) {
    throw new Error("This gift card has no remaining balance");
  }

  const amountUsed = Math.round(Math.min(giftCard.balance, remainingAmount) * 100) / 100;

  giftCard.balance = Math.round((giftCard.balance - amountUsed) * 100) / 100;
  giftCard.redemptions.push({ orderId, amountUsed, redeemedAt: new Date() });
  await giftCard.save();

  return { amountUsed, giftCard };
};

// Rolls back a coupon/gift-card reservation when the payment they were
// applied to fails, gets its signature rejected, or its hold window
// expires unpaid — mirrors ticketStockHelper.releaseTicketStock so a
// customer never permanently loses a coupon use or gift-card balance
// over a payment that never actually completed.
const releaseCouponAndGiftCard = async (payment) => {
  if (payment.couponCode) {
    await Coupon.updateOne(
      { code: payment.couponCode },
      { $inc: { usedCount: -1 } },
    );
  }

  if (payment.giftCardCode && payment.giftCardAmountUsed > 0) {
    await GiftCard.updateOne(
      { code: payment.giftCardCode },
      { $inc: { balance: payment.giftCardAmountUsed } },
    );
  }
};

module.exports = { applyCoupon, applyGiftCard, releaseCouponAndGiftCard };
