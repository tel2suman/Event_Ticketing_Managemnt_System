const express = require("express");

const router = express.Router();

const CartController = require("../../controllers/api/cartController");

const AuthMiddleware = require("../../middlewares/authMiddleware");

const validationMiddleware = require("../../middlewares/validationMiddleware");

const {
  addToCartValidation, updateCartValidation, cartIdValidation,
} = require("../../validations/cartValidation");

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart for events.
 */

// ==============================
// ADD TO CART
// ==============================
/**
 * @swagger
 * /api/v1/cart/add-to-cart:
 *   post:
 *     tags: [Cart]
 *     summary: Add an event to the cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId: { type: string }
 *               quantity: { type: integer, default: 1 }
 *     responses:
 *       201:
 *         description: Added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/CartItem' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post( "/add-to-cart", AuthMiddleware,
  validationMiddleware.validate(addToCartValidation),
  CartController.addToCart
);

// ==============================
// GET USER CART
// ==============================
/**
 * @swagger
 * /api/v1/cart/my-cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get the logged-in user's cart
 *     responses:
 *       200:
 *         description: Cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CartItem' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get(
  "/my-cart", AuthMiddleware,
  CartController.getCart
);

// ==============================
// UPDATE CART
// ==============================
/**
 * @swagger
 * /api/v1/cart/update-cart/{cartId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     parameters:
 *       - { name: cartId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Cart updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/CartItem' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
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
/**
 * @swagger
 * /api/v1/cart/remove-cart/{cartId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     parameters:
 *       - { name: cartId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/remove-cart/:cartId",
  AuthMiddleware,
  validationMiddleware.validate(cartIdValidation, "params"),
  CartController.removeFromCart,
);

// ==============================
// CLEAR CART
// ==============================
/**
 * @swagger
 * /api/v1/cart/clear-cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the entire cart
 *     responses:
 *       200:
 *         description: Cart cleared
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete("/clear-cart", AuthMiddleware, CartController.clearCart);

module.exports = router;