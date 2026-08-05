const Joi = require("joi");

// createPaymentOrder validation
const createPaymentOrderValidation = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "Order ID is required",
  }),
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