const express = require("express");
const TicketTierController = require("../../controllers/api/ticketTierController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  createTicketTierValidation,
  updateTicketTierValidation,
} = require("../../validations/ticketierValidation");

const router = express.Router();

// ==============================
// CREATE TICKET TIER (admin)
// ==============================
router.post(
  "/create-tier",
  AuthMiddleware,
  validationMiddleware.validate(createTicketTierValidation),
  RoleMiddleware("admin"),
  TicketTierController.createTicketTier,
);

// ==============================
// UPDATE TICKET TIER (admin)
// ==============================
router.put(
  "/update-tier/:tierId",
  AuthMiddleware,
  validationMiddleware.validate(updateTicketTierValidation),
  RoleMiddleware("admin"),
  TicketTierController.updateTicketTier,
);

// ==============================
// GET ALL TIERS FOR AN EVENT (public — active tiers only)
// ==============================
router.get(
  "/tiers/event/:eventId",
  TicketTierController.getTicketTiersByEvent,
);

// ==============================
// GET ALL TIERS FOR AN EVENT (admin — includes inactive tiers)
// ==============================
router.get(
  "/admin/tiers/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.getTicketTiersByEvent,
);

// ==============================
// GET SINGLE TICKET TIER
// ==============================
router.get("/single-tier/:tierId", TicketTierController.getSingleTicketTier);

// ==============================
// DEACTIVATE TICKET TIER (admin)
// ==============================
router.put(
  "/deactivate-tier/:tierId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.deactivateTicketTier,
);

// ==============================
// DELETE TICKET TIER (admin)
// ==============================
router.delete(
  "/delete-tier/:tierId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.deleteTicketTier,
);

module.exports = router;


