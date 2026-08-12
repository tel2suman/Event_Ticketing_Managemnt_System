const express = require("express");
const TicketController = require("../../controllers/api/ticketController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  purchaseTicketValidation,
  checkInTicketValidation,
} = require("../../validations/ticketValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ticket
 *   description: Ticket purchase (reservation), user dashboard, cancellation, admin QR/manual check-in, event sales report.
 */

// ==============================
// PURCHASE TICKET(S) (logged-in user)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/purchase:
 *   post:
 *     tags: [Ticket]
 *     summary: Purchase (reserve) tickets for an event tier
 *     description: Reserves 1-10 tickets. Payment is a separate step — see the Payment tag.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, tierId]
 *             properties:
 *               eventId: { type: string }
 *               tierId: { type: string }
 *               quantity: { type: integer, minimum: 1, maximum: 10, default: 1 }
 *     responses:
 *       201:
 *         description: Tickets reserved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId: { type: string }
 *                     tickets:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Ticket' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.post(
  "/purchase",
  AuthMiddleware,
  validationMiddleware.validate(purchaseTicketValidation),
  TicketController.purchaseTicket,
);

// ==============================
// GET LOGGED-IN USER'S TICKETS (dashboard)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/my-tickets:
 *   get:
 *     tags: [Ticket]
 *     summary: Get the logged-in user's tickets
 *     responses:
 *       200:
 *         description: Tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Ticket' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/my-tickets", AuthMiddleware, TicketController.getMyTickets);

// ==============================
// GET SINGLE TICKET (owner or admin)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/single-ticket/{ticketId}:
 *   get:
 *     tags: [Ticket]
 *     summary: Get a single ticket (owner or admin)
 *     parameters:
 *       - { name: ticketId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Ticket' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/single-ticket/:ticketId",
  AuthMiddleware,
  TicketController.getSingleTicket,
);

// ==============================
// CANCEL TICKET (owner only, before check-in)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/cancel/{ticketId}:
 *   put:
 *     tags: [Ticket]
 *     summary: Cancel a ticket (owner only, before check-in)
 *     parameters:
 *       - { name: ticketId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Ticket cancelled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/cancel/:ticketId",
  AuthMiddleware,
  TicketController.cancelTicket,
);

// ==============================
// CHECK-IN TICKET (admin — QR scan or manual code entry)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/check-in:
 *   post:
 *     tags: [Ticket]
 *     summary: Check in a ticket at the gate (admin only)
 *     description: Pass either 'qrData' (raw scanned QR payload) or 'ticketCode' (manual entry).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData: { type: string }
 *               ticketCode: { type: string }
 *     responses:
 *       200:
 *         description: Checked in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Ticket' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
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
/**
 * @swagger
 * /api/v2/ticket/event/{eventId}:
 *   get:
 *     tags: [Ticket]
 *     summary: Get all tickets for an event — sales + check-in report (admin only)
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Tickets for event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Ticket' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketController.getTicketsByEvent,
);

module.exports = router;
