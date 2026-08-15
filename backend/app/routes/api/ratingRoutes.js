const express = require("express");
const RatingController = require("../../controllers/api/ratingController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {createRatingValidation } = require("../../validations/ratingValidation");
const { eventIdValidation } = require("../../validations/eventIdValidation");

const router = express.Router();

// ==============================
// ADD EVENTS RATING
// ==============================
/**
 * @swagger
 * /api/v1/rating/{eventId}/give-rating:
 *   post:
 *     summary: Give a rating to an event
 *     description: >
 *       Allows an authenticated user to give a rating from 1 to 5
 *       to an event. A user can rate the same event only once.
 *     tags:
 *       - Rating
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *
 *     responses:
 *       201:
 *         description: Rating added successfully
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
 *                   example: "Rating added successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Rating"
 *
 *       400:
 *         description: Invalid event ID or rating
 *
 *       401:
 *         description: Authentication token required
 *
 *       404:
 *         description: Event not found
 *
 *       409:
 *         description: User has already rated this event
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:eventId/give-rating",
  AuthMiddleware,
  validationMiddleware.validate(createRatingValidation),
  RatingController.giveRating,
);

// ==============================
// GET SINGLE EVENT RATING
// ==============================
/**
 * @swagger
 * /api/v1/rating/{eventId}/get-rating:
 *   get:
 *     summary: Get ratings for an event
 *     description: Returns all ratings given to the specified event.
 *     tags:
 *       - Rating
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
 *         description: Event ratings retrieved successfully
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
 *                   example: "Event ratings retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Rating"
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
router.get("/:eventId/get-rating", validationMiddleware.validate(eventIdValidation), RatingController.getEventRating);


module.exports = router;