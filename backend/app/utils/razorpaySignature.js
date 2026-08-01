const crypto = require("crypto");

// Safely compares two strings without leaking timing info, and without
// crashing on length mismatches (crypto.timingSafeEqual throws if the
// buffers aren't the same length, so we guard against that first).
const safeCompare = (a, b) => {
  const bufferA = Buffer.from(a || "");
  const bufferB = Buffer.from(b || "");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

// Verifies the signature Razorpay's Checkout widget returns to the
// frontend after a payment, which the frontend then forwards to our
// /verify endpoint. Per Razorpay's docs, this is:
//   HMAC_SHA256(order_id + "|" + payment_id, key_secret)
const verifyOrderSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return safeCompare(expectedSignature, razorpaySignature);
};

// Verifies Razorpay's server-to-server webhook signature.
// IMPORTANT: `rawBody` must be the exact raw request body Razorpay sent
// (before JSON.parse) — signing a re-serialized object will not match.
const verifyWebhookSignature = ({ rawBody, signature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return safeCompare(expectedSignature, signature);
};

module.exports = {
  verifyOrderSignature,
  verifyWebhookSignature,
};
