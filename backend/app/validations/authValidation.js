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

// resendVerificationEmail validation
const resendVerificationEmailValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please provide a valid email address.",
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

// changePassword validation
const changePasswordValidation = Joi.object({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
    "any.required": "Current password is required.",
  }),

  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.empty": "New password is required.",
    "string.pattern.base":
      "Password must contain at least 9 characters, one uppercase letter, one lowercase letter, and one special character.",
    "any.required": "New password is required.",
  }),
});

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

// createCategory validation
const createCategoryValidation = Joi.object({
  categoryName: Joi.string().trim().min(5).max(50).required().messages({
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 5 characters",
    "string.max": "Category name cannot exceed 50 characters",
    "any.required": "Category name is required",
  }),
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

  quantityAvailable: Joi.number().integer().min(1).required().messages({
    "number.base": "Available quantity must be a number",
    "number.min": "Available quantity must be at least 1",
    "any.required": "Available quantity is required",
  }),

  benefits: Joi.array().items(Joi.string().trim()).default([]).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean().default(true),
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

  quantityAvailable: Joi.number().integer().min(0).messages({
    "number.base": "Available quantity must be a number",
    "number.min": "Available quantity cannot be negative",
  }),

  benefits: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "Benefits must be a list of strings",
  }),

  isActive: Joi.boolean(),
});

// purchaseTicket validation
const purchaseTicketValidation = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
    "any.required": "Event ID is required",
  }),

  tierId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid ticket tier ID",
    "string.length": "Invalid ticket tier ID",
    "any.required": "Ticket tier ID is required",
  }),

  quantity: Joi.number().integer().min(1).max(10).default(1).messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "number.max": "You can purchase a maximum of 10 tickets at a time",
  }),
});

// checkInTicket validation (admin scanning at the gate)
const checkInTicketValidation = Joi.object({
  qrData: Joi.string().messages({
    "string.base": "QR data must be a string",
  }),

  ticketCode: Joi.string().trim().messages({
    "string.base": "Ticket code must be a string",
  }),
})
  .or("qrData", "ticketCode")
  .messages({
    "object.missing": "Either scanned QR data or a manual ticket code is required",
  });

// createPaymentOrder validation
const createPaymentOrderValidation = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "Order ID is required",
  }),
});

// verifyPayment validation
const verifyPaymentValidation = Joi.object({
  razorpayOrderId: Joi.string().required().messages({
    "any.required": "Razorpay order ID is required",
  }),

  razorpayPaymentId: Joi.string().required().messages({
    "any.required": "Razorpay payment ID is required",
  }),

  razorpaySignature: Joi.string().required().messages({
    "any.required": "Razorpay signature is required",
  }),
});

// refundPayment validation
const refundPaymentValidation = Joi.object({
  amount: Joi.number().min(1).messages({
    "number.base": "Refund amount must be a number",
    "number.min": "Refund amount must be greater than 0",
  }),
});

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  createEventValidation,
  createCategoryValidation,
  createTicketTierValidation,
  updateTicketTierValidation,
  purchaseTicketValidation,
  checkInTicketValidation,
  createPaymentOrderValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
  resendVerificationEmailValidation
};
