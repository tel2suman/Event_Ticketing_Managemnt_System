const express = require("express");
const PartnerController = require("../../controllers/api/partnerController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createPartnerValidation,
  updatePartnerValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Partner
 *   description: Homepage "Our Proud Partners" logo grid — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/partner/active:
 *   get:
 *     tags: [Partner]
 *     summary: Active partners (public)
 *     responses:
 *       200:
 *         description: Partners
 */
router.get("/active", PartnerController.getActivePartners);

/**
 * @swagger
 * /api/v1/partner:
 *   get:
 *     tags: [Partner]
 *     summary: List every partner (admin only)
 *     responses:
 *       200:
 *         description: Partners
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Partner]
 *     summary: Add a partner (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, logo]
 *             properties:
 *               name: { type: string }
 *               websiteUrl: { type: string }
 *               order: { type: integer }
 *               isActive: { type: boolean }
 *               logo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Partner added
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  PartnerController.getAllPartners,
);

router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("logo"),
  validationMiddleware.validate(createPartnerValidation),
  PartnerController.createPartner,
);

/**
 * @swagger
 * /api/v1/partner/{partnerId}:
 *   put:
 *     tags: [Partner]
 *     summary: Update a partner (admin only)
 *     parameters:
 *       - { name: partnerId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Partner updated
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Partner]
 *     summary: Delete a partner (admin only)
 *     parameters:
 *       - { name: partnerId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Partner deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:partnerId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("logo"),
  validationMiddleware.validate(updatePartnerValidation),
  PartnerController.updatePartner,
);

router.delete(
  "/:partnerId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  PartnerController.deletePartner,
);

module.exports = router;
