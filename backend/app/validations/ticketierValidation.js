const Joi = require("joi");

// createTicketTier validation
const createTicketTierValidation = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
    "any.required": "Event ID is required",
  }),

  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Tier name is required",
    "string.min": "Tier name must be at least 2 characters",
    "string.max": "Tier name cannot exceed 50 characters",
    "any.required": "Tier name is required",
  }),

  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),

  quantityAvailable: Joi.number().integer().min(1).required().messages({
    "number.base": "Available quantity must be a number",
    "number.min": "Available quantity must be at least 1",
    "any.required": "Available quantity is required",
  }),

  benefits: Joi.array().items(Joi.string().trim()).default([]).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean().default(true),
});

// updateTicketTier validation
const updateTicketTierValidation = Joi.object({
  name: Joi.string().trim().min(2).max(50).messages({
    "string.min": "Tier name must be at least 2 characters",
    "string.max": "Tier name cannot exceed 50 characters",
  }),

  price: Joi.number().min(0).messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),

  quantityAvailable: Joi.number().integer().min(0).messages({
    "number.base": "Available quantity must be a number",
    "number.min": "Available quantity cannot be negative",
  }),

  benefits: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean(),
});

module.exports = {
  createTicketTierValidation,
  updateTicketTierValidation,
};