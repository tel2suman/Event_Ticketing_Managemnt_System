
const Joi = require("joi");

const eventIdValidation = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "any.required": "Event ID is required",
    "string.empty": "Event ID is required",
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
  }),
});

module.exports = {
  eventIdValidation,
};