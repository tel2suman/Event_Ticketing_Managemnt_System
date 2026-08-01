const express = require("express");
const PaymentController = require("../../controllers/api/paymentController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  createPaymentOrderValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
} = require("../../validations/authValidation");

const router = express.Router();

// ==============================
// CREATE RAZORPAY ORDER (logged-in user)
// ==============================
router.post(
  "/create-order",
  AuthMiddleware,
  validationMiddleware.validate(createPaymentOrderValidation),
  PaymentController.createOrder,
);

// ==============================
// VERIFY PAYMENT (called by frontend right after Razorpay Checkout)
// ==============================
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
router.post("/webhook", PaymentController.handleWebhook);

// ==============================
// GET PAYMENT STATUS FOR AN ORDER (owner or admin)
// ==============================
router.get(
  "/order/:orderId",
  AuthMiddleware,
  PaymentController.getPaymentByOrderId,
);

// ==============================
// REQUEST REFUND FOR ONE TICKET (self-service, owner only)
// ==============================
router.post(
  "/refund-ticket/:ticketId",
  AuthMiddleware,
  PaymentController.requestTicketRefund,
);

// ==============================
// REFUND PAYMENT (admin)
// ==============================
router.post(
  "/refund/:paymentId",
  AuthMiddleware,
  validationMiddleware.validate(refundPaymentValidation),
  RoleMiddleware("admin"),
  PaymentController.refundPayment,
);

module.exports = router;
