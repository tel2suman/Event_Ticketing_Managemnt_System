const express = require("express");
const TicketController = require("../../controllers/api/ticketController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {
  purchaseTicketValidation,
  checkInTicketValidation,
  transferTicketValidation,
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
// TRANSFER TICKET (owner only, paid + not checked in)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/transfer/{ticketId}:
 *   put:
 *     tags: [Ticket]
 *     summary: Transfer a paid, unused ticket to another registered user (owner only)
 *     parameters:
 *       - { name: ticketId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail]
 *             properties:
 *               recipientEmail: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Ticket transferred
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Ticket' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put(
  "/transfer/:ticketId",
  AuthMiddleware,
  validationMiddleware.validate(transferTicketValidation),
  TicketController.transferTicket,
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

// ==============================
// DOWNLOAD TICKET AS PDF (owner or admin)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/download/{ticketId}:
 *   get:
 *     tags: [Ticket]
 *     summary: Download a single ticket as a PDF (owner or admin)
 *     parameters:
 *       - { name: ticketId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/download/:ticketId",
  AuthMiddleware,
  TicketController.downloadTicket,
);

// ==============================
// GET ALL TICKETS — PLATFORM-WIDE (admin, paginated)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/admin/all:
 *   get:
 *     tags: [Ticket]
 *     summary: Get all tickets across the platform, paginated (admin only)
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *       - { name: eventId, in: query, schema: { type: string } }
 *       - { name: paymentStatus, in: query, schema: { type: string, enum: [pending, paid, failed] } }
 *     responses:
 *       200:
 *         description: Tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 pagination: { type: object }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Ticket' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/admin/all",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketController.getAllTickets,
);

// ==============================
// GET ORDERS (grouped by orderId) — admin table view
// ==============================
/**
 * @swagger
 * /api/v2/ticket/admin/orders:
 *   get:
 *     tags: [Ticket]
 *     summary: Get tickets grouped by order (one row per purchase), paginated (admin only)
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *       - { name: eventId, in: query, schema: { type: string } }
 *       - { name: search, in: query, schema: { type: string }, description: "Matches against event title" }
 *       - { name: status, in: query, schema: { type: string, enum: [Booked, Pending, Cancelled, Refunded, "Checked In", Failed] } }
 *       - { name: categoryId, in: query, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 pagination: { type: object }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/admin/orders",
  AuthMiddleware,
  RoleMiddleware("admin"),
  TicketController.getOrdersGrouped,
);

// ==============================
// MY NOTIFICATIONS (logged-in user — payment/refund/expiry/transfer)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/notifications/mine:
 *   get:
 *     tags: [Ticket]
 *     summary: Get the logged-in user's own notifications, paginated
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 pagination: { type: object }
 *                 unreadCount: { type: integer }
 *                 data: { type: array, items: { type: object } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get(
  "/notifications/mine",
  AuthMiddleware,
  TicketController.getMyNotifications,
);

// ==============================
// MARK NOTIFICATION READ (logged-in user)
// ==============================
/**
 * @swagger
 * /api/v2/ticket/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Ticket]
 *     summary: Mark one of the logged-in user's own notifications as read
 *     parameters:
 *       - { name: notificationId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Notification marked read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/notifications/:notificationId/read",
  AuthMiddleware,
  TicketController.markNotificationRead,
);

module.exports = router;
