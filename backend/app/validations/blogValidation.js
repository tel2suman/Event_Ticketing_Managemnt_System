const Joi = require("joi");

const createBlogValidation = Joi.object({
  title: Joi.string().trim().min(5).max(150).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 5 characters.",
    "string.max": "Title cannot exceed 150 characters.",
    "any.required": "Title is required.",
  }),

  excerpt: Joi.string().trim().min(20).max(250).required().messages({
    "string.empty": "Excerpt is required.",
    "string.min": "Excerpt must be at least 20 characters.",
    "string.max": "Excerpt cannot exceed 250 characters.",
    "any.required": "Excerpt is required.",
  }),

  content: Joi.string().trim().min(50).required().messages({
    "string.empty": "Content is required.",
    "string.min": "Content must be at least 50 characters.",
    "any.required": "Content is required.",
  }),

  category: Joi.string().trim().required().messages({
    "string.empty": "Category is required.",
    "any.required": "Category is required.",
  }),

  status: Joi.string()
    .valid("Draft", "Published", "Scheduled")
    .optional()
    .messages({
      "any.only": "Status must be Draft, Published or Scheduled.",
    }),
});

const updateBlogValidation = Joi.object({
  title: Joi.string().trim().min(5).max(150),

  excerpt: Joi.string().trim().min(20).max(250),

  content: Joi.string().trim().min(50),

  category: Joi.string().trim(),

  status: Joi.string().valid("Draft", "Published", "Scheduled").messages({
    "any.only": "Status must be Draft, Published or Scheduled.",
  }),

  publishDate: Joi.date(),
}).min(1);

module.exports = {
  createBlogValidation,
  updateBlogValidation,
};
