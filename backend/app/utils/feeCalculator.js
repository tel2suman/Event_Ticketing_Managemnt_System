// ASSUMPTION — sync this with whatever your actual convenience-fee /
// tax policy turns out to be (this is a business decision, not one I'm
// allowed to make for you). Modeled after how BookMyShow/Ticketmaster
// break down checkout: a convenience fee on the base ticket price, plus
// GST charged on that fee (not on the ticket price itself, since ticket
// price already has any applicable tax baked in by the organizer).
//
//   Convenience fee: 8% of base ticket price
//   GST on fee:       18% of the convenience fee
//
// Change the constants below to match your actual policy and every
// caller (paymentController) stays in sync automatically.
const CONVENIENCE_FEE_PERCENT = Number(process.env.CONVENIENCE_FEE_PERCENT) || 8;
const GST_ON_FEE_PERCENT = Number(process.env.GST_ON_FEE_PERCENT) || 18;

// Returns a full breakdown for a given base ticket-price amount (rupees).
// All figures are rounded to 2 decimal places, matching how Razorpay
// expects rupee amounts before the paise conversion happens downstream.
const calculateFees = (baseAmount) => {
  const convenienceFee = Math.round((baseAmount * CONVENIENCE_FEE_PERCENT) / 100 * 100) / 100;
  const taxOnFee = Math.round((convenienceFee * GST_ON_FEE_PERCENT) / 100 * 100) / 100;
  const totalFees = Math.round((convenienceFee + taxOnFee) * 100) / 100;
  const totalAmount = Math.round((baseAmount + totalFees) * 100) / 100;

  return {
    baseAmount,
    convenienceFee,
    taxOnFee,
    totalFees,
    totalAmount,
  };
};

module.exports = { calculateFees, CONVENIENCE_FEE_PERCENT, GST_ON_FEE_PERCENT };
