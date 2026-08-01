const express = require("express");
const AnalyticsController = require("../../controllers/api/analyticsController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

// ==============================
// PLATFORM-WIDE OVERVIEW (admin dashboard landing numbers)
// ==============================
router.get(
  "/overview",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getOverview,
);

// ==============================
// PER-EVENT ANALYTICS (tier-wise sales + check-in breakdown)
// ==============================
router.get(
  "/event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getEventAnalytics,
);

// ==============================
// REVENUE TREND (daily, across all events — ?days=30 default)
// ==============================
router.get(
  "/revenue-trend",
  AuthMiddleware,
  RoleMiddleware("admin"),
  AnalyticsController.getRevenueTrend,
);

module.exports = router;
