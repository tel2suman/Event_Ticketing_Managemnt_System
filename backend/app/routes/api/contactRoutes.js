const express = require("express");

const router = express.Router();

const ContactController = require("../../controllers/api/contactController");
const AuthMiddleware = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Public-facing contact form submission + message history.
 */

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     tags: [Contact]
 *     summary: Send a contact message
 *     description: "'phone' must be a 10-digit Indian mobile number (starts 6-9); 'message' must be 50-1000 characters."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string, example: "9876543210" }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/ContactMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// Send Contact Message
router.post("/", AuthMiddleware, ContactController.sendMessage);

/**
 * @swagger
 * /api/v1/contact/my-messages:
 *   get:
 *     tags: [Contact]
 *     summary: Get my previously sent contact messages
 *     responses:
 *       200:
 *         description: Messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ContactMessage' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// My Contact Messages
router.get("/my-messages", AuthMiddleware, ContactController.myMessages);

module.exports = router;
