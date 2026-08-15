const express = require("express");
const LikeController = require("../../controllers/api/likeController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const { eventIdValidation } = require("../../validations/eventIdValidation");

const router = express.Router();

// ==============================
// TOGGLE LIKES
// ==============================
/**
 * @swagger
 * /api/v1/like/{eventId}/toggle-like:
 *   post:
 *     summary: Toggle event like
 *     description: >
 *       Allows an authenticated user to like or unlike an event.
 *       If the user has not liked the event, a like is created.
 *       If the user has already liked the event, the like is removed.
 *     tags:
 *       - Like
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: Event MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *           example: "68def123456789123456789"
 *
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event liked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       example: "68def123456789123456789"
 *                     liked:
 *                       type: boolean
 *                       example: true
 *                     totalLikes:
 *                       type: integer
 *                       example: 25
 *
 *       400:
 *         description: Invalid event ID
 *
 *       401:
 *         description: Authentication token required
 *
 *       404:
 *         description: Event not found
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:eventId/toggle-like",
  AuthMiddleware,
  validationMiddleware.validate(eventIdValidation, "params"),
  LikeController.toggleLike,
);

// ==============================
// GET TOTAL LIKES
// ==============================
/**
 * @swagger
 * /api/v1/like/{eventId}/get-likes:
 *   get:
 *     summary: Get event likes
 *     description: Returns the total number of likes for an event.
 *     tags:
 *       - Like
 *
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: Event MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *           example: "68def123456789123456789"
 *
 *     responses:
 *       200:
 *         description: Event likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event likes retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       example: "68def123456789123456789"
 *                     totalLikes:
 *                       type: integer
 *                       example: 25
 *
 *       400:
 *         description: Invalid event ID
 *
 *       404:
 *         description: Event not found
 *
 *       500:
 *         description: Internal server error
 */

router.get(
  "/:eventId/get-likes",
  validationMiddleware.validate(eventIdValidation, "params"),
  LikeController.getEventLikes,
);


module.exports = router;