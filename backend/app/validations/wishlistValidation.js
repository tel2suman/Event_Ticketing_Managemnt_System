const Joi = require("joi");

const addToWishlistValidation = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "any.required": "Event ID is required",
    "string.hex": "Invalid Event ID",
    "string.length": "Invalid Event ID",
  }),
});

const removeWishlistValidation = Joi.object({
  wishlistId: Joi.string().hex().length(24).required().messages({
    "any.required": "Wishlist ID is required",
    "string.hex": "Invalid Wishlist ID",
    "string.length": "Invalid Wishlist ID",
  }),
});

module.exports = {
  addToWishlistValidation,
  removeWishlistValidation,
};
