const express = require("express");
const StaticPageController = require("../../controllers/api/staticPageController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  upsertStaticPageValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Static Page
 *   description: Footer "Terms & Conditions" / "Privacy Policy" pages — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/static-page/{slug}:
 *   get:
 *     tags: [Static Page]
 *     summary: Get a static page by slug (public)
 *     parameters:
 *       - { name: slug, in: path, required: true, schema: { type: string, enum: [terms-and-conditions, privacy-policy] } }
 *     responses:
 *       200:
 *         description: Page
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Static Page]
 *     summary: Create or replace a static page's content (admin only)
 *     parameters:
 *       - { name: slug, in: path, required: true, schema: { type: string, enum: [terms-and-conditions, privacy-policy] } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Page saved
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/:slug", StaticPageController.getStaticPageBySlug);

router.put(
  "/:slug",
  AuthMiddleware,
  RoleMiddleware("admin"),
  validationMiddleware.validate(upsertStaticPageValidation),
  StaticPageController.upsertStaticPage,
);

module.exports = router;
