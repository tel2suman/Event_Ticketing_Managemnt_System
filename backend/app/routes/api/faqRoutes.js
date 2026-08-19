const express = require("express");
const FaqController = require("../../controllers/api/faqController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createFaqValidation,
  updateFaqValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FAQ
 *   description: Footer/support FAQ list — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/faq/active:
 *   get:
 *     tags: [FAQ]
 *     summary: Active FAQs (public)
 *     responses:
 *       200:
 *         description: FAQs
 */
router.get("/active", FaqController.getActiveFaqs);

/**
 * @swagger
 * /api/v1/faq:
 *   get:
 *     tags: [FAQ]
 *     summary: List every FAQ (admin only)
 *     responses:
 *       200:
 *         description: FAQs
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [FAQ]
 *     summary: Create an FAQ entry (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: FAQ created
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  FaqController.getAllFaqs,
);

router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  validationMiddleware.validate(createFaqValidation),
  FaqController.createFaq,
);

/**
 * @swagger
 * /api/v1/faq/{faqId}:
 *   put:
 *     tags: [FAQ]
 *     summary: Update an FAQ entry (admin only)
 *     parameters:
 *       - { name: faqId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: FAQ updated
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [FAQ]
 *     summary: Delete an FAQ entry (admin only)
 *     parameters:
 *       - { name: faqId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: FAQ deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:faqId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  validationMiddleware.validate(updateFaqValidation),
  FaqController.updateFaq,
);

router.delete(
  "/:faqId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  FaqController.deleteFaq,
);

module.exports = router;
