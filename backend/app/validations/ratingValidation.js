const Joi = require("joi");

const createRatingValidation = Joi.object({
    
    eventId: Joi.string().hex().length(24).required().messages({
        "any.required": "Event ID is required",
        "string.empty": "Event ID is required",
        "string.hex": "Invalid event ID",
        "string.length": "Invalid event ID",
    }),

    rating: Joi.number().integer().min(1).max(5).required().messages({
        "any.required": "Rating is required",
        "number.base": "Rating must be a number",
        "number.integer": "Rating must be an integer",
        "number.min": "Rating must be at least 1",
        "number.max": "Rating cannot be greater than 5",
    }),
});

module.exports = {
  createRatingValidation,
};
