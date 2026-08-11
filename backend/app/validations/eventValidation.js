const Joi = require("joi");

// createEvent validation
const createEventValidation = Joi.object({
  title: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Event title is required",
    "string.min": "Event title must be at least 3 characters",
    "string.max": "Event title cannot exceed 100 characters",
    "any.required": "Event title is required",
  }),

  description: Joi.string().trim().min(10).required().messages({
    "string.empty": "Event description is required",
    "string.min": "Event description must be at least 10 characters",
    "any.required": "Event description is required",
  }),

  location: Joi.string().trim().required().messages({
    "string.empty": "Event location is required",
    "any.required": "Event location is required",
  }),

  date: Joi.date().iso().required().messages({
    "date.base": "Please provide a valid event date",
    "date.format": "Event date must be in YYYY-MM-DD format",
    "any.required": "Event date is required",
  }),

  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.pattern.base": "Time must be in HH:mm format",
      "string.empty": "Event time is required",
      "any.required": "Event time is required",
    }),

  organizer: Joi.string().trim().required().messages({
    "string.empty": "Organizer is required",
    "any.required": "Organizer is required",
  }),

  categoryId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid category ID",
    "string.length": "Invalid category ID",
    "any.required": "Category ID is required",
  }),

  status: Joi.string().valid("active", "inactive").default("active"),
});

// update Event validation
const updateEventValidation = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "Event title must be at least 2 characters",
    "string.max": "Event title cannot exceed 200 characters",
  }),

  description: Joi.string().trim().min(5).optional().messages({
    "string.min": "Event description must be at least 5 characters",
  }),

  location: Joi.string().trim().min(2).max(200).optional(),

  date: Joi.date().optional().messages({
    "date.base": "Invalid event date",
  }),

  time: Joi.string().trim().optional(),

  organizer: Joi.string().trim().min(2).max(200).optional(),

  categoryId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Invalid category ID",
    "string.length": "Invalid category ID",
  }),

  status: Joi.string().valid("active", "inactive").optional(),
});

// search Event validation
const searchEventValidation = Joi.object({

  title: Joi.string().trim().min(2).max(100).optional(),

  location: Joi.string().trim().min(2).max(100).optional(),

  date: Joi.date().iso().optional().messages({
    "date.base": "Date must be a valid date",
    "date.format": "Date must be in YYYY-MM-DD format",
  }),
  }).or("title", "location", "date").messages({
    "object.missing": "At least one search parameter (title, location, or date) is required",
});

// get events by category validation
const getEventsByCategoryValidation = Joi.object({
  categoryId: Joi.string().hex().length(24).required().messages({
    "any.required": "Category ID is required",
    "string.length": "Invalid Category ID",
    "string.hex": "Invalid Category ID",
  }),
});

// filter events by category name
const filterEventsByCategoryNameValidation = Joi.object({
  categoryName: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Category name is required",
    "string.empty": "Category name is required",
  }),
});

// get all events validation
const getAllEventsValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  createEventValidation,
  updateEventValidation,
  searchEventValidation,
  getEventsByCategoryValidation,
  filterEventsByCategoryNameValidation,
  getAllEventsValidation,
};
