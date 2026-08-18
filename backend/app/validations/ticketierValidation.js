const Joi = require("joi");

const refundPolicyOverrideItem = Joi.object({
  minHoursBeforeEvent: Joi.number().min(0).required(),
  percentage: Joi.number().min(0).max(100).required(),
});

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

  description: Joi.string().trim().max(150).allow("").default("").messages({
    "string.max": "Description cannot exceed 150 characters",
  }),

  // For a plain general-admission tier, this is required directly. For
  // an assigned-seating tier (hasAssignedSeating: true), it's derived
  // from seatLabels.length instead — see ticketTierController.
  quantityAvailable: Joi.number()
    .integer()
    .min(1)
    .when("hasAssignedSeating", {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required(),
    })
    .messages({
      "number.base": "Available quantity must be a number",
      "number.min": "Available quantity must be at least 1",
      "any.required": "Available quantity is required",
    }),

  benefits: Joi.array().items(Joi.string().trim()).default([]).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean().default(true),

  hasAssignedSeating: Joi.boolean().default(false),

  seatLabels: Joi.array()
    .items(Joi.string().trim())
    .when("hasAssignedSeating", {
      is: true,
      then: Joi.array().min(1).required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "array.min": "At least one seat label is required for an assigned-seating tier",
      "any.required": "seatLabels is required when hasAssignedSeating is true",
    }),

  refundPolicyOverride: Joi.array().items(refundPolicyOverrideItem).default([]),
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

  description: Joi.string().trim().max(150).allow("").messages({
    "string.max": "Description cannot exceed 150 characters",
  }),

  quantityAvailable: Joi.number().integer().min(0).messages({
    "number.base": "Available quantity must be a number",
    "number.min": "Available quantity cannot be negative",
  }),

  benefits: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean(),

  refundPolicyOverride: Joi.array().items(refundPolicyOverrideItem),
});

module.exports = {
  createTicketTierValidation,
  updateTicketTierValidation,
};