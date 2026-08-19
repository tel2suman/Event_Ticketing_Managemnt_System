const Joi = require("joi");

const createCouponValidation = Joi.object({
  code: Joi.string().trim().min(3).max(30).required().messages({
    "any.required": "Coupon code is required",
  }),

  discountType: Joi.string().valid("percentage", "flat").required().messages({
    "any.required": "Discount type is required",
    "any.only": "Discount type must be 'percentage' or 'flat'",
  }),

  discountValue: Joi.number().min(0).required().messages({
    "any.required": "Discount value is required",
    "number.min": "Discount value cannot be negative",
  }),

  maxDiscountAmount: Joi.number().min(0).allow(null),

  minOrderAmount: Joi.number().min(0).default(0),

  eventId: Joi.string().hex().length(24).allow(null).messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
  }),

  validFrom: Joi.date(),

  validUntil: Joi.date().required().messages({
    "any.required": "Coupon expiry date is required",
  }),

  usageLimit: Joi.number().integer().min(1).allow(null),

  offerType: Joi.string().valid("event", "payment").default("event").messages({
    "any.only": "Offer type must be 'event' or 'payment'",
  }),
});

const updateCouponValidation = Joi.object({
  discountType: Joi.string().valid("percentage", "flat"),
  discountValue: Joi.number().min(0),
  maxDiscountAmount: Joi.number().min(0).allow(null),
  minOrderAmount: Joi.number().min(0),
  validFrom: Joi.date(),
  validUntil: Joi.date(),
  usageLimit: Joi.number().integer().min(1).allow(null),
  isActive: Joi.boolean(),
  offerType: Joi.string().valid("event", "payment").messages({
    "any.only": "Offer type must be 'event' or 'payment'",
  }),
});

const validateCouponValidation = Joi.object({
  code: Joi.string().trim().required().messages({
    "any.required": "Coupon code is required",
  }),

  orderAmount: Joi.number().min(0).required().messages({
    "any.required": "Order amount is required",
  }),

  eventId: Joi.string().hex().length(24).messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
  }),
});

const createGiftCardValidation = Joi.object({
  initialBalance: Joi.number().min(1).required().messages({
    "any.required": "Initial balance is required",
    "number.min": "Initial balance must be at least 1",
  }),

  expiresAt: Joi.date().allow(null),

  issuedTo: Joi.string().hex().length(24).allow(null).messages({
    "string.hex": "Invalid user ID",
    "string.length": "Invalid user ID",
  }),
});

module.exports = {
  createCouponValidation,
  updateCouponValidation,
  validateCouponValidation,
  createGiftCardValidation,
};
