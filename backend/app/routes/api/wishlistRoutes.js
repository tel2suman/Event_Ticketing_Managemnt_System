const express = require("express");

const router = express.Router();

const WishListController = require("../../controllers/api/wishListController");

const AuthMiddleware = require("../../middlewares/authMiddleware");

const validationMiddleware = require("../../middlewares/validationMiddleware");

const {addToWishlistValidation, removeWishlistValidation} = require("../../validations/wishlistValidation");

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Saved/favorited events.
 */

// ==============================
// ADD TO WISHLIST
// ==============================
/**
 * @swagger
 * /api/v1/wishlist/add-to-wishlist:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add an event to the wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId: { type: string }
 *     responses:
 *       201:
 *         description: Added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/WishlistItem' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.post("/add-to-wishlist", AuthMiddleware,
  validationMiddleware.validate(addToWishlistValidation),
  WishListController.addToWishlist,
);

// ==============================
// GET WISHLIST
// ==============================
/**
 * @swagger
 * /api/v1/wishlist/my-wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get the logged-in user's wishlist
 *     responses:
 *       200:
 *         description: Wishlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/WishlistItem' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/my-wishlist", AuthMiddleware, WishListController.getWishlist);

// ==============================
// REMOVE FROM WISHLIST
// ==============================
/**
 * @swagger
 * /api/v1/wishlist/remove-from-wishlist/{wishlistId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove an event from the wishlist
 *     parameters:
 *       - { name: wishlistId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Removed from wishlist
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/remove-from-wishlist/:wishlistId",
  AuthMiddleware,
  validationMiddleware.validate(removeWishlistValidation, "params"),
  WishListController.removeFromWishlist,
);


module.exports = router;