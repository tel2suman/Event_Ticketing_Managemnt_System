const express = require("express");

const router = express.Router();

const NewsletterController = require("../../controllers/api/newsletterController");
const AuthMiddleware = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: Newsletter subscription management.
 */

/**
 * @swagger
 * /api/v1/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Subscribe the logged-in user's email to the newsletter
 *     responses:
 *       201:
 *         description: Subscribed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post("/subscribe", AuthMiddleware, NewsletterController.subscribe);

/**
 * @swagger
 * /api/v1/newsletter/unsubscribe:
 *   delete:
 *     tags: [Newsletter]
 *     summary: Unsubscribe the logged-in user
 *     responses:
 *       200:
 *         description: Unsubscribed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/unsubscribe", AuthMiddleware, NewsletterController.unsubscribe);

/**
 * @swagger
 * /api/v1/newsletter/unsubscribe-link:
 *   get:
 *     tags: [Newsletter]
 *     summary: One-click unsubscribe via emailed token link
 *     security: []
 *     parameters:
 *       - { name: token, in: query, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Unsubscribed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.get("/unsubscribe-link", NewsletterController.unsubscribeByToken);

/**
 * @swagger
 * /api/v1/newsletter/status:
 *   get:
 *     tags: [Newsletter]
 *     summary: Get the logged-in user's subscription status
 *     responses:
 *       200:
 *         description: Status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscribed: { type: boolean }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/status", AuthMiddleware, NewsletterController.status);

module.exports = router;
