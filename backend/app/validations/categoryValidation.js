const Joi = require("joi");

// createCategory validation
const createCategoryValidation = Joi.object({
  categoryName: Joi.string().trim().min(5).max(50).required().messages({
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 5 characters",
    "string.max": "Category name cannot exceed 50 characters",
    "any.required": "Category name is required",
  }),
});

module.exports = {
  createCategoryValidation,
};