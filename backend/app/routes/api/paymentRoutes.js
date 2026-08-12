const express = require("express");
const PaymentController = require("../../controllers/api/paymentController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  createPaymentOrderValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
} = require("../../validations/paymentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Razorpay order creation, payment verification, webhook, refunds.
 */

// ==============================
// CREATE RAZORPAY ORDER (logged-in user)
// ==============================
/**
 * @swagger
 * /api/v2/payment/create-order:
 *   post:
 *     tags: [Payment]
 *     summary: Create a Razorpay order for a reserved ticket order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       201:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     razorpayOrderId: { type: string }
 *                     amount: { type: number }
 *                     currency: { type: string }
 *                     razorpayKeyId: { type: string }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  "/create-order",
  AuthMiddleware,
  validationMiddleware.validate(createPaymentOrderValidation),
  PaymentController.createOrder,
);

// ==============================
// VERIFY PAYMENT (called by frontend right after Razorpay Checkout)
// ==============================
/**
 * @swagger
 * /api/v2/payment/verify:
 *   post:
 *     tags: [Payment]
 *     summary: Verify payment right after Razorpay Checkout completes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpayOrderId, razorpayPaymentId, razorpaySignature]
 *             properties:
 *               razorpayOrderId: { type: string }
 *               razorpayPaymentId: { type: string }
 *               razorpaySignature: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       400:
 *         description: Signature mismatch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/verify",
  AuthMiddleware,
  validationMiddleware.validate(verifyPaymentValidation),
  PaymentController.verifyPayment,
);

// ==============================
// RAZORPAY WEBHOOK (server-to-server — NOT a logged-in user request)
// Deliberately skips AuthMiddleware/Joi validation: Razorpay's servers
// call this directly, authenticated only via the webhook signature
// header, and the payload shape is Razorpay's own, not ours.
// ==============================
/**
 * @swagger
 * /api/v2/payment/webhook:
 *   post:
 *     tags: [Payment]
 *     summary: Razorpay server-to-server webhook (reference only)
 *     description: >
 *       Called directly by Razorpay's servers, authenticated via the 'x-razorpay-signature'
 *       header, not a bearer token. Not intended to be called from Swagger's Try-it-out.
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event: { type: string, example: "payment.captured" }
 *               payload: { type: object }
 *     responses:
 *       200:
 *         description: Webhook processed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/webhook", PaymentController.handleWebhook);

// ==============================
// GET PAYMENT STATUS FOR AN ORDER (owner or admin)
// ==============================
/**
 * @swagger
 * /api/v2/payment/order/{orderId}:
 *   get:
 *     tags: [Payment]
 *     summary: Get payment status for an order (owner or admin)
 *     parameters:
 *       - { name: orderId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/order/:orderId",
  AuthMiddleware,
  PaymentController.getPaymentByOrderId,
);

// ==============================
// REQUEST REFUND FOR ONE TICKET (self-service, owner only)
// ==============================
/**
 * @swagger
 * /api/v2/payment/refund-ticket/{ticketId}:
 *   post:
 *     tags: [Payment]
 *     summary: Self-service refund request for one ticket (owner only)
 *     parameters:
 *       - { name: ticketId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  "/refund-ticket/:ticketId",
  AuthMiddleware,
  PaymentController.requestTicketRefund,
);

// ==============================
// REFUND PAYMENT (admin)
// ==============================
/**
 * @swagger
 * /api/v2/payment/refund/{paymentId}:
 *   post:
 *     tags: [Payment]
 *     summary: Refund a payment (admin only)
 *     description: "'amount' is optional — omit for a full refund."
 *     parameters:
 *       - { name: paymentId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Refunded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  "/refund/:paymentId",
  AuthMiddleware,
  validationMiddleware.validate(refundPaymentValidation),
  RoleMiddleware("admin"),
  PaymentController.refundPayment,
);

module.exports = router;
