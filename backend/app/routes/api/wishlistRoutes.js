const express = require("express");

const router = express.Router();

const WishListController = require("../../controllers/api/wishListController");

const AuthMiddleware = require("../../middlewares/authMiddleware");

const validationMiddleware = require("../../middlewares/validationMiddleware");

const {addToWishlistValidation, removeWishlistValidation} = require("../../validations/wishlistValidation");

// ==============================
// ADD TO WISHLIST
// ==============================
router.post("/add-to-wishlist", AuthMiddleware,
  validationMiddleware.validate(addToWishlistValidation),
  WishListController.addToWishlist,
);

// ==============================
// GET WISHLIST
// ==============================
router.get("/my-wishlist", AuthMiddleware, WishListController.getWishlist);

// ==============================
// REMOVE FROM WISHLIST
// ==============================
router.delete(
  "/remove-from-wishlist/:wishlistId",
  AuthMiddleware,
  validationMiddleware.validate(removeWishlistValidation, "params"),
  WishListController.removeFromWishlist,
);


module.exports = router;