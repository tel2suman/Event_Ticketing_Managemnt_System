const express = require("express");
const MediaHighlightController = require("../../controllers/api/mediaHighlightController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createMediaHighlightValidation,
  updateMediaHighlightValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Media Highlight
 *   description: Homepage "Watch the Biggest Releases" cards — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/media-highlight/active:
 *   get:
 *     tags: [Media Highlight]
 *     summary: Active media highlights for one page's rail (public)
 *     parameters:
 *       - { name: section, in: query, schema: { type: string, enum: [home, events] }, description: "Which rail to fetch — omit for all sections" }
 *     responses:
 *       200:
 *         description: Media highlights
 */
router.get("/active", MediaHighlightController.getActiveMediaHighlights);

/**
 * @swagger
 * /api/v1/media-highlight:
 *   get:
 *     tags: [Media Highlight]
 *     summary: List every media highlight (admin only)
 *     responses:
 *       200:
 *         description: Media highlights
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Media Highlight]
 *     summary: Create a media highlight card (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, thumbnail]
 *             properties:
 *               title: { type: string }
 *               section: { type: string, enum: [home, events], description: "Which page's rail this card belongs to" }
 *               videoUrl: { type: string }
 *               ctaLink: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Media highlight created
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  MediaHighlightController.getAllMediaHighlights,
);

router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("thumbnail"),
  validationMiddleware.validate(createMediaHighlightValidation),
  MediaHighlightController.createMediaHighlight,
);

/**
 * @swagger
 * /api/v1/media-highlight/{highlightId}:
 *   put:
 *     tags: [Media Highlight]
 *     summary: Update a media highlight (admin only)
 *     parameters:
 *       - { name: highlightId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Media highlight updated
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Media Highlight]
 *     summary: Delete a media highlight (admin only)
 *     parameters:
 *       - { name: highlightId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Media highlight deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:highlightId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("thumbnail"),
  validationMiddleware.validate(updateMediaHighlightValidation),
  MediaHighlightController.updateMediaHighlight,
);

router.delete(
  "/:highlightId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  MediaHighlightController.deleteMediaHighlight,
);

module.exports = router;
