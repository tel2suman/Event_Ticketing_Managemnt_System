const Joi = require("joi");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

const registerValidation = Joi.object({
  // name validation
  name: Joi.string().trim().min(3).max(32).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must contain at least 3 characters.",
    "string.max": "Name cannot exceed 32 characters.",
  }),

  // email validation
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
  }),

  // password validation
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.empty": "Password is required.",
    "string.pattern.base":
      "Password must contain at least 9 characters, one uppercase letter, one lowercase letter, and one special character.",
  }),
});

// login validation
const loginValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
  }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required.",
  }),
});

// forgotPassword validation
const forgotPasswordValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
  }),
});

// resetPassword validation
const resetPasswordValidation = Joi.object({
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.empty": "Password is required.",
    "string.pattern.base":
      "Password must contain at least 9 characters, one uppercase letter, one lowercase letter, and one special character.",
  }),
});

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
