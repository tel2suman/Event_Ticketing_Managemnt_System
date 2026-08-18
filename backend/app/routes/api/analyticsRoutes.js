const express = require("express");
const AnalyticsController = require("../../controllers/api/analyticsController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: "Admin dashboard analytics: overview, per-event, revenue trend."
 */

// ==============================
// PLATFORM-WIDE OVERVIEW (admin dashboard landing numbers)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Platform-wide dashboard overview (admin only)
 *     responses:
 *       200:
 *         description: Overview numbers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/overview",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getOverview,
);

// ==============================
// TICKET STATS (admin "Tickets Details" screen stat tiles)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/ticket-stats:
 *   get:
 *     tags: [Analytics]
 *     summary: Total/Booked/Available/Cancelled ticket counts + growth % (admin only)
 *     responses:
 *       200:
 *         description: Ticket stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/ticket-stats",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getTicketStats,
);

// ==============================
// PER-EVENT ANALYTICS (tier-wise sales + check-in breakdown)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/event/{eventId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Per-event tier-wise sales + check-in breakdown (admin only)
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Event analytics
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
router.get(
  "/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getEventAnalytics,
);

// ==============================
// REVENUE TREND (daily, across all events — ?days=30 default)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/revenue-trend:
 *   get:
 *     tags: [Analytics]
 *     summary: Daily revenue trend across all events (admin only)
 *     parameters:
 *       - { name: days, in: query, schema: { type: integer, default: 30 } }
 *     responses:
 *       200:
 *         description: Revenue trend
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: string, format: date }
 *                       revenue: { type: number }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/revenue-trend",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getRevenueTrend,
);

// ==============================
// RECENT EVENTS (admin dashboard "Recent Events" table)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/recent-events:
 *   get:
 *     tags: [Analytics]
 *     summary: Most recently created events with tickets-sold/revenue (admin only)
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 5 } }
 *     responses:
 *       200:
 *         description: Recent events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/recent-events",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getRecentEvents,
);

// ==============================
// TOP EVENTS (admin dashboard "Top Events" list, ranked by tickets sold)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/top-events:
 *   get:
 *     tags: [Analytics]
 *     summary: Events ranked by tickets sold (admin only)
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 5 } }
 *     responses:
 *       200:
 *         description: Top events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/top-events",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getTopEvents,
);

// ==============================
// PAYMENT METHOD BREAKDOWN (admin)
// ==============================
/**
 * @swagger
 * /api/v2/analytics/payment-methods:
 *   get:
 *     tags: [Analytics]
 *     summary: Paid revenue broken down by payment method (admin only)
 *     responses:
 *       200:
 *         description: Breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       method: { type: string }
 *                       count: { type: integer }
 *                       totalAmount: { type: number }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/payment-methods",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getPaymentMethodBreakdown,
);

module.exports = router;
