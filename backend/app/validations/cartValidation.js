const Joi = require("joi");

// Add to Cart
const addToCartValidation = Joi.object({
  eventId: Joi.string().trim().hex().length(24).required().messages({
    "any.required": "Event ID is required",
    "string.empty": "Event ID is required",
    "string.hex": "Invalid Event ID",
    "string.length": "Invalid Event ID",
  }),

  tierId: Joi.string().trim().hex().length(24).required().messages({
    "any.required": "Ticket tier ID is required",
    "string.empty": "Ticket tier ID is required",
    "string.hex": "Invalid ticket tier ID",
    "string.length": "Invalid ticket tier ID",
  }),

  quantity: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
  }),
});

// Update Cart
const updateCartValidation = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
  }),
});

// Cart ID Param
const cartIdValidation = Joi.object({
  cartId: Joi.string().trim().hex().length(24).required().messages({
    "any.required": "Cart ID is required",
    "string.empty": "Cart ID is required",
    "string.hex": "Invalid Cart ID",
    "string.length": "Invalid Cart ID",
  }),
});

module.exports = {
  addToCartValidation,
  updateCartValidation,
  cartIdValidation,
};
