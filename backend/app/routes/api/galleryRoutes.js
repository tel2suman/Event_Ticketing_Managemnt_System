const express = require("express");
const GalleryController = require("../../controllers/api/galleryController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createGalleryImageValidation,
  updateGalleryImageValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gallery
 *   description: Homepage "Moments That Made Memories" photo strip — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/gallery/active:
 *   get:
 *     tags: [Gallery]
 *     summary: Active gallery images (public)
 *     responses:
 *       200:
 *         description: Gallery images
 */
router.get("/active", GalleryController.getActiveGalleryImages);

/**
 * @swagger
 * /api/v1/gallery:
 *   get:
 *     tags: [Gallery]
 *     summary: List every gallery image (admin only)
 *     responses:
 *       200:
 *         description: Gallery images
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Gallery]
 *     summary: Add a gallery image (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               caption: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Gallery image added
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  GalleryController.getAllGalleryImages,
);

router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("image"),
  validationMiddleware.validate(createGalleryImageValidation),
  GalleryController.createGalleryImage,
);

/**
 * @swagger
 * /api/v1/gallery/{imageId}:
 *   put:
 *     tags: [Gallery]
 *     summary: Update a gallery image (admin only)
 *     parameters:
 *       - { name: imageId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Gallery image updated
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Gallery]
 *     summary: Delete a gallery image (admin only)
 *     parameters:
 *       - { name: imageId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Gallery image deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:imageId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("image"),
  validationMiddleware.validate(updateGalleryImageValidation),
  GalleryController.updateGalleryImage,
);

router.delete(
  "/:imageId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  GalleryController.deleteGalleryImage,
);

module.exports = router;
