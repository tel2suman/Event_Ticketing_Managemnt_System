const express = require("express");
const TicketController = require("../../controllers/api/ticketController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  purchaseTicketValidation,
  checkInTicketValidation,
} = require("../../validations/authValidation");

const router = express.Router();

// ==============================
// PURCHASE TICKET(S) (logged-in user)
// ==============================
router.post(
  "/purchase",
  AuthMiddleware,
  validationMiddleware.validate(purchaseTicketValidation),
  TicketController.purchaseTicket,
);

// ==============================
// GET LOGGED-IN USER'S TICKETS (dashboard)
// ==============================
router.get("/my-tickets", AuthMiddleware, TicketController.getMyTickets);

// ==============================
// GET SINGLE TICKET (owner or admin)
// ==============================
router.get(
  "/single-ticket/:ticketId",
  AuthMiddleware,
  TicketController.getSingleTicket,
);

// ==============================
// CANCEL TICKET (owner only, before check-in)
// ==============================
router.put(
  "/cancel/:ticketId",
  AuthMiddleware,
  TicketController.cancelTicket,
);

// ==============================
// CHECK-IN TICKET (admin — QR scan or manual code entry)
// ==============================
router.post(
  "/check-in",
  AuthMiddleware,
  validationMiddleware.validate(checkInTicketValidation),
  RoleMiddleware("admin"),
  TicketController.checkInTicket,
);

// ==============================
// GET ALL TICKETS FOR AN EVENT (admin — sales + check-in report)
// ==============================
router.get(
  "/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketController.getTicketsByEvent,
);

module.exports = router;
