const Joi = require("joi");

// createPaymentOrder validation
const createPaymentOrderValidation = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "Order ID is required",
  }),

  // Billing/invoice details — optional so existing frontend calls that
  // don't send them yet don't start failing validation.
  billingDetails: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().trim().min(7).max(15),
    email: Joi.string().trim().email(),
    nationality: Joi.string().valid("Indian Resident", "International Visitor"),
    state: Joi.string().trim().max(100),
  }).messages({
    "object.base": "Billing details must be an object",
  }),

  couponCode: Joi.string().trim().max(30),

  giftCardCode: Joi.string().trim().max(30),
});

// verifyPayment validation
const verifyPaymentValidation = Joi.object({
  razorpayOrderId: Joi.string().required().messages({
    "any.required": "Razorpay order ID is required",
  }),

  razorpayPaymentId: Joi.string().required().messages({
    "any.required": "Razorpay payment ID is required",
  }),

  razorpaySignature: Joi.string().required().messages({
    "any.required": "Razorpay signature is required",
  }),
});

// refundPayment validation
const refundPaymentValidation = Joi.object({
  amount: Joi.number().min(1).messages({
    "number.base": "Refund amount must be a number",
    "number.min": "Refund amount must be greater than 0",
  }),
});

module.exports = {
  createPaymentOrderValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
};