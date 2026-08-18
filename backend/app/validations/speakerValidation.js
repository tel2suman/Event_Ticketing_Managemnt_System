const Joi = require("joi");

const createSpeakerValidation = Joi.object({
    
    lectureDate: Joi.date().required().messages({
        "any.required": "Lecture date is required",
        "date.base": "Invalid lecture date",
    }),

    lectureTime: Joi.string().trim().required().messages({
        "any.required": "Lecture time is required",
        "string.empty": "Lecture time is required",
    }),

    speakerName: Joi.string().trim().min(2).max(200).required().messages({
        "any.required": "Speaker name is required",
        "string.empty": "Speaker name is required",
        "string.min": "Speaker name must be at least 2 characters",
        "string.max": "Speaker name cannot exceed 200 characters",
    }),

    speakerDesignation: Joi.string().trim().min(2).max(200).required().messages({
        "any.required": "Speaker designation is required",
        "string.empty": "Speaker designation is required",
    }),

    speakerBio: Joi.string().trim().min(10).required().messages({
        "any.required": "Speaker bio is required",
        "string.empty": "Speaker bio is required",
        "string.min": "Speaker bio must be at least 10 characters",
    }),

    linkedin: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid LinkedIn URL",
    }),

    instagram: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid Instagram URL",
    }),

    x: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid X URL",
    }),

    facebook: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid Facebook URL",
    }),
});

const updateSpeakerValidation = Joi.object({

    lectureDate: Joi.date().optional().messages({
        "date.base": "Invalid lecture date",
    }),

    lectureTime: Joi.string().trim().optional(),

    speakerName: Joi.string().trim().min(2).max(200).optional(),

    speakerDesignation: Joi.string().trim().min(2).max(200).optional(),

    speakerBio: Joi.string().trim().min(10).optional(),

    linkedin: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid LinkedIn URL",
    }),

    instagram: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid Instagram URL",
    }),

    x: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid X URL",
    }),

    facebook: Joi.string().trim().uri().optional().allow("").messages({
        "string.uri": "Invalid Facebook URL",
    }),
});

module.exports = {
  createSpeakerValidation,
  updateSpeakerValidation,
};