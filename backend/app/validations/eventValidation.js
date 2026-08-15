const Joi = require("joi");

// createEvent validation
const createEventValidation = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Event title is required",
    "string.empty": "Event title is required",
    "string.min": "Event title must be at least 2 characters",
    "string.max": "Event title cannot exceed 200 characters",
  }),

  description: Joi.string().trim().min(5).required().messages({
    "any.required": "Event description is required",
    "string.empty": "Event description is required",
  }),

  location: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Event location is required",
    "string.empty": "Event location is required",
  }),

  date: Joi.date().required().messages({
    "any.required": "Event date is required",
    "date.base": "Invalid event date",
  }),

  time: Joi.string().trim().required().messages({
    "any.required": "Event time is required",
    "string.empty": "Event time is required",
  }),

  organizer: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Organizer is required",
    "string.empty": "Organizer is required",
  }),

  categoryId: Joi.string().hex().length(24).required().messages({
    "any.required": "Category ID is required",
    "string.hex": "Invalid category ID",
    "string.length": "Invalid category ID",
  }),

  price: Joi.number().min(0).required().messages({
    "any.required": "Event price is required",
    "number.base": "Event price must be a number",
    "number.min": "Event price cannot be negative",
  }),

  // Location details
  address: Joi.string().trim().min(2).required().messages({
    "any.required": "Location address is required",
    "string.empty": "Location address is required",
  }),

  facilities: Joi.string().trim().required().messages({
    "any.required": "Location facilities are required",
    "string.empty": "Location facilities are required",
  }),

  map: Joi.string().trim().required().messages({
    "any.required": "Location map is required",
    "string.empty": "Location map is required",
  }),

  // Artist details
  artistName: Joi.string().trim().min(2).required().messages({
    "any.required": "Artist name is required",
    "string.empty": "Artist name is required",
  }),

  artistDescription: Joi.string().trim().min(5).required().messages({
    "any.required": "Artist description is required",
    "string.empty": "Artist description is required",
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

  price: Joi.number().min(0).optional().messages({
    "number.base": "Event price must be a number",
    "number.min": "Event price cannot be negative",
  }),

  // Location details - flat form-data fields
  address: Joi.string().trim().min(2).optional().messages({
    "string.min": "Location address must be at least 2 characters",
  }),

  facilities: Joi.string().trim().optional(),

  map: Joi.string().trim().optional(),

  // Artist details - flat form-data fields
  artistName: Joi.string().trim().min(2).optional().messages({
    "string.min": "Artist name must be at least 2 characters",
  }),

  artistDescription: Joi.string().trim().min(5).optional().messages({
    "string.min": "Artist description must be at least 5 characters",
  }),

  status: Joi.string().valid("active", "inactive").optional().messages({
    "any.only": "Status must be either active or inactive",
  }),
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
