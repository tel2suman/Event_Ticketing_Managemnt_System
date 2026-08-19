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

/**
 * @swagger
 * tags:
 *   name: Ticket Tier
 *   description: Pricing tiers per event (e.g. VIP/General) — admin-managed, publicly readable.
 */

// ==============================
// CREATE TICKET TIER (admin)
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/create-tier:
 *   post:
 *     tags: [Ticket Tier]
 *     summary: Create a ticket tier (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, name, price]
 *             properties:
 *               eventId: { type: string }
 *               name: { type: string, example: "VIP" }
 *               price: { type: number, example: 2000 }
 *               description: { type: string, maxLength: 150, example: "A closer experience with premium viewing." }
 *               quantityAvailable: { type: integer, example: 100, description: "Required unless hasAssignedSeating is true" }
 *               hasAssignedSeating: { type: boolean, default: false }
 *               seatLabels: { type: array, items: { type: string }, description: "Required when hasAssignedSeating is true, e.g. ['A1','A2']" }
 *               saleStart: { type: string, format: date-time }
 *               saleEnd: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Tier created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/TicketTier' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
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
/**
 * @swagger
 * /api/v1/ticket-tier/update-tier/{tierId}:
 *   put:
 *     tags: [Ticket Tier]
 *     summary: Update a ticket tier (admin only, all fields optional)
 *     parameters:
 *       - { name: tierId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               description: { type: string, maxLength: 150 }
 *               saleStart: { type: string, format: date-time }
 *               saleEnd: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Tier updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/TicketTier' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/update-tier/:tierId",
  AuthMiddleware,
  validationMiddleware.validate(updateTicketTierValidation),
  RoleMiddleware("admin"),
  TicketTierController.updateTicketTier,
);

// ==============================
// GET ALL TIERS FOR AN EVENT (public)
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/tiers/event/{eventId}:
 *   get:
 *     tags: [Ticket Tier]
 *     summary: Get tiers for an event (public)
 *     security: []
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TicketTier' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/tiers/event/:eventId",
  TicketTierController.getTicketTiersByEvent,
);

// ==============================
// GET ALL TIERS FOR AN EVENT (admin)
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/admin/tiers/event/{eventId}:
 *   get:
 *     tags: [Ticket Tier]
 *     summary: Get tiers for an event (admin only)
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TicketTier' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/admin/tiers/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.getTicketTiersByEvent,
);

// ==============================
// ADMIN "Ticket Tier Details" LISTING — platform-wide, search + type
// filter + pagination
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/admin/all-tiers:
 *   get:
 *     tags: [Ticket Tier]
 *     summary: List ticket tiers across all events — search + type filter, paginated (admin only)
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *       - { name: search, in: query, schema: { type: string }, description: "Matches tier name or event title" }
 *       - { name: type, in: query, schema: { type: string }, description: "Exact tier name, e.g. Gold/Silver/Platinum/Diamond" }
 *     responses:
 *       200:
 *         description: Paginated list of ticket tiers with event info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords: { type: integer }
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     perPage: { type: integer }
 *                     hasNextPage: { type: boolean }
 *                     hasPreviousPage: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/admin/all-tiers",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.getAllTicketTiers,
);

// ==============================
// GET SINGLE TICKET TIER
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/single-tier/{tierId}:
 *   get:
 *     tags: [Ticket Tier]
 *     summary: Get a single ticket tier (public)
 *     security: []
 *     parameters:
 *       - { name: tierId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tier
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/TicketTier' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/single-tier/:tierId", TicketTierController.getSingleTicketTier);

// ==============================
// DELETE TICKET TIER (admin) — hard delete, no trash/restore. Blocked if
// the tier is fully sold out; otherwise any paid tickets under it are
// fully refunded and cancelled before the tier row is removed.
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/delete-tier/{tierId}:
 *   delete:
 *     tags: [Ticket Tier]
 *     summary: Delete a ticket tier (admin only). Blocked if fully sold out; otherwise refunds and cancels every paid ticket under it before deleting.
 *     parameters:
 *       - { name: tierId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tier deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.delete(
  "/delete-tier/:tierId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.deleteTicketTier,
);

// ==============================
// CAPACITY ROLLUP FOR ONE EVENT (admin) — sold/available across all tiers
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/capacity/event/{eventId}:
 *   get:
 *     tags: [Ticket Tier]
 *     summary: Capacity rollup for one event — sum of sold/available across all active tiers (admin only)
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Capacity summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId: { type: string }
 *                     totalAvailable: { type: integer }
 *                     totalSold: { type: integer }
 *                     totalRemaining: { type: integer }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/capacity/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.getCapacitySummaryForEvent,
);

// ==============================
// CAPACITY ROLLUP FOR MULTIPLE EVENTS (admin) — one call for a listing table
// ==============================
/**
 * @swagger
 * /api/v1/ticket-tier/capacity/bulk:
 *   post:
 *     tags: [Ticket Tier]
 *     summary: Capacity rollup for several events in one call (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventIds]
 *             properties:
 *               eventIds: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Capacity summary keyed by eventId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/capacity/bulk",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketTierController.getCapacitySummaryBulk,
);

module.exports = router;


