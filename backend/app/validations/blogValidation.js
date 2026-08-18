const Joi = require("joi");

const createBlogValidation = Joi.object({
  // Blog Title
  title: Joi.string().trim().min(5).max(150).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 5 characters.",
    "string.max": "Title cannot exceed 150 characters.",
    "any.required": "Title is required.",
  }),

  // Short Description
  excerpt: Joi.string().trim().min(20).max(200).required().messages({
    "string.empty": "Excerpt is required.",
    "string.min": "Excerpt must be at least 20 characters.",
    "string.max": "Excerpt cannot exceed 200 characters.",
    "any.required": "Excerpt is required.",
  }),

  // Blog Content
  content: Joi.string().trim().min(50).max(5000).required().messages({
    "string.empty": "Content is required.",
    "string.min": "Content must be at least 50 characters.",
    "string.max": "Content cannot exceed 5000 characters.",
    "any.required": "Content is required.",
  }),

  // Category
  category: Joi.string().hex().length(24).required().messages({
    "string.empty": "Category is required.",
    "string.hex": "Category must be a valid ID.",
    "string.length": "Category must be a valid ID.",
    "any.required": "Category is required.",
  }),

  // Tags
  tags: Joi.array()
    .items(
      Joi.string().trim().min(1).max(30).messages({
        "string.empty": "Tag cannot be empty.",
        "string.min": "Tag must contain at least 1 character.",
        "string.max": "Tag cannot exceed 30 characters.",
      }),
    )
    .optional()
    .messages({
      "array.base": "Tags must be an array.",
    }),

  // Author
  author: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Author is required.",
    "string.min": "Author must be at least 2 characters.",
    "string.max": "Author cannot exceed 100 characters.",
    "any.required": "Author is required.",
  }),

  // Status
  status: Joi.string()
    .valid("Draft", "Published", "Scheduled")
    .default("Draft")
    .messages({
      "any.only": "Status must be Draft, Published or Scheduled.",
    }),

  // Publish Date
  publishDate: Joi.date().optional().messages({
    "date.base": "Publish date must be a valid date.",
  }),

  // Slug
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      "string.empty": "Slug is required.",
      "string.pattern.base":
        "Slug can only contain lowercase letters, numbers and hyphens.",
      "any.required": "Slug is required.",
    }),

  // SEO Meta Title
  metaTitle: Joi.string().trim().max(60).optional().messages({
    "string.max": "Meta title cannot exceed 60 characters.",
  }),

  // SEO Meta Description
  metaDescription: Joi.string().trim().max(160).optional().messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),
});

const updateBlogValidation = Joi.object({
  // Blog Title
  title: Joi.string().trim().min(5).max(150).messages({
    "string.empty": "Title cannot be empty.",
    "string.min": "Title must be at least 5 characters.",
    "string.max": "Title cannot exceed 150 characters.",
  }),

  // Short Description
  excerpt: Joi.string().trim().min(20).max(200).messages({
    "string.empty": "Excerpt cannot be empty.",
    "string.min": "Excerpt must be at least 20 characters.",
    "string.max": "Excerpt cannot exceed 200 characters.",
  }),

  // Blog Content
  content: Joi.string().trim().min(50).max(5000).messages({
    "string.empty": "Content cannot be empty.",
    "string.min": "Content must be at least 50 characters.",
    "string.max": "Content cannot exceed 5000 characters.",
  }),

  // Category
  category: Joi.string().hex().length(24).messages({
    "string.hex": "Category must be a valid ID.",
    "string.length": "Category must be a valid ID.",
  }),

  // Tags
  tags: Joi.array()
    .items(
      Joi.string().trim().min(1).max(30).messages({
        "string.empty": "Tag cannot be empty.",
        "string.min": "Tag must contain at least 1 character.",
        "string.max": "Tag cannot exceed 30 characters.",
      }),
    )
    .messages({
      "array.base": "Tags must be an array.",
    }),

  // Author
  author: Joi.string().trim().min(2).max(100).messages({
    "string.empty": "Author cannot be empty.",
    "string.min": "Author must be at least 2 characters.",
    "string.max": "Author cannot exceed 100 characters.",
  }),

  // Status
  status: Joi.string().valid("Draft", "Published", "Scheduled").messages({
    "any.only": "Status must be Draft, Published or Scheduled.",
  }),

  // Publish Date
  publishDate: Joi.date().messages({
    "date.base": "Publish date must be a valid date.",
  }),

  // Slug
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .messages({
      "string.empty": "Slug cannot be empty.",
      "string.pattern.base":
        "Slug can only contain lowercase letters, numbers and hyphens.",
    }),

  // SEO Meta Title
  metaTitle: Joi.string().trim().max(60).messages({
    "string.max": "Meta title cannot exceed 60 characters.",
  }),

  // SEO Meta Description
  metaDescription: Joi.string().trim().max(160).messages({
    "string.max": "Meta description cannot exceed 160 characters.",
  }),
}).min(1);

module.exports = {
  createBlogValidation,
  updateBlogValidation,
};
