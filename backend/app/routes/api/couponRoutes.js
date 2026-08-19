const express = require("express");
const CouponController = require("../../controllers/api/couponController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createCouponValidation,
  updateCouponValidation,
  validateCouponValidation,
  createGiftCardValidation,
} = require("../../validations/couponValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coupon
 *   description: Promo-code coupons and gift cards for checkout discounts.
 */

// ==============================
// CREATE COUPON (admin)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/create:
 *   post:
 *     tags: [Coupon]
 *     summary: Create a coupon (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue, validUntil]
 *             properties:
 *               code: { type: string, example: "FEST10" }
 *               discountType: { type: string, enum: [percentage, flat] }
 *               discountValue: { type: number }
 *               maxDiscountAmount: { type: number, nullable: true }
 *               minOrderAmount: { type: number }
 *               eventId: { type: string, nullable: true, description: "Null = valid platform-wide" }
 *               validFrom: { type: string, format: date-time }
 *               validUntil: { type: string, format: date-time }
 *               usageLimit: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Coupon created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  "/create",
  AuthMiddleware,
  validationMiddleware.validate(createCouponValidation),
  RoleMiddleware("admin"),
  CouponController.createCoupon,
);

// ==============================
// GET ALL COUPONS (admin)
// ==============================
/**
 * @swagger
 * /api/v2/coupon:
 *   get:
 *     tags: [Coupon]
 *     summary: Get all coupons (admin only)
 *     responses:
 *       200:
 *         description: Coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", AuthMiddleware, RoleMiddleware("admin"), CouponController.getAllCoupons);

// ==============================
// UPDATE COUPON (admin)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/update/{couponId}:
 *   put:
 *     tags: [Coupon]
 *     summary: Update a coupon (admin only)
 *     parameters:
 *       - { name: couponId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Coupon updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/update/:couponId",
  AuthMiddleware,
  validationMiddleware.validate(updateCouponValidation),
  RoleMiddleware("admin"),
  CouponController.updateCoupon,
);

// ==============================
// VALIDATE COUPON (logged-in user — preview only, doesn't consume it)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/validate:
 *   post:
 *     tags: [Coupon]
 *     summary: Preview a coupon's discount for an order (doesn't redeem it)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, orderAmount]
 *             properties:
 *               code: { type: string }
 *               orderAmount: { type: number }
 *               eventId: { type: string }
 *     responses:
 *       200:
 *         description: Discount preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  "/validate",
  AuthMiddleware,
  validationMiddleware.validate(validateCouponValidation),
  CouponController.validateCoupon,
);

// ==============================
// BROWSE ACTIVE OFFERS (logged-in user — "View all event/payment offers")
// ==============================
/**
 * @swagger
 * /api/v2/coupon/offers:
 *   get:
 *     tags: [Coupon]
 *     summary: Browse currently-redeemable offers, without needing a code up front
 *     parameters:
 *       - { name: eventId, in: query, schema: { type: string }, description: "Include platform-wide offers plus ones scoped to this event" }
 *       - { name: offerType, in: query, schema: { type: string, enum: [event, payment] } }
 *     responses:
 *       200:
 *         description: Active offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data: { type: array, items: { type: object } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get(
  "/offers",
  AuthMiddleware,
  CouponController.getActiveOffers,
);

// ==============================
// ISSUE GIFT CARD (admin)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/gift-card/create:
 *   post:
 *     tags: [Coupon]
 *     summary: Issue a new gift card (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [initialBalance]
 *             properties:
 *               initialBalance: { type: number }
 *               expiresAt: { type: string, format: date-time }
 *               issuedTo: { type: string, description: "User ID, optional" }
 *     responses:
 *       201:
 *         description: Gift card issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/gift-card/create",
  AuthMiddleware,
  validationMiddleware.validate(createGiftCardValidation),
  RoleMiddleware("admin"),
  CouponController.createGiftCard,
);

// ==============================
// LIST GIFT CARDS (admin)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/gift-card:
 *   get:
 *     tags: [Coupon]
 *     summary: Get all gift cards (admin only)
 *     responses:
 *       200:
 *         description: Gift cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/gift-card",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CouponController.getAllGiftCards,
);

// ==============================
// CHECK GIFT CARD BALANCE (logged-in user)
// ==============================
/**
 * @swagger
 * /api/v2/coupon/gift-card/{code}:
 *   get:
 *     tags: [Coupon]
 *     summary: Check a gift card's remaining balance
 *     parameters:
 *       - { name: code, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/gift-card/:code",
  AuthMiddleware,
  CouponController.checkGiftCardBalance,
);

module.exports = router;
