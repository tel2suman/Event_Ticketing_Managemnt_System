const express = require("express");

const router = express.Router();

const CartController = require("../../controllers/api/cartController");

const AuthMiddleware = require("../../middlewares/authMiddleware");

const validationMiddleware = require("../../middlewares/validationMiddleware");

const {
  addToCartValidation, updateCartValidation, cartIdValidation,
} = require("../../validations/cartValidation");

// ==============================
// ADD TO CART
// ==============================

router.post( "/add-to-cart", AuthMiddleware,
  validationMiddleware.validate(addToCartValidation),
  CartController.addToCart
);

// ==============================
// GET USER CART
// ==============================
router.get(
  "/my-cart", AuthMiddleware,
  CartController.getCart
);

// ==============================
// UPDATE CART
// ==============================
router.put(
  "/update-cart/:cartId",
  AuthMiddleware,
  validationMiddleware.validate(cartIdValidation, "params"),
  validationMiddleware.validate(updateCartValidation),
  CartController.updateQuantity,
);

// ==============================
// REMOVE CART
// ==============================
router.delete(
  "/remove-cart/:cartId",
  AuthMiddleware,
  validationMiddleware.validate(cartIdValidation, "params"),
  CartController.removeFromCart,
);

// ==============================
// CLEAR CART
// ==============================
router.delete("/clear-cart", AuthMiddleware, CartController.clearCart);

module.exports = router;