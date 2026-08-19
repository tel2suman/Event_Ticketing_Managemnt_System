const express = require("express");
const CampaignController = require("../../controllers/api/campaignController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const {
  createCampaignValidation,
  updateCampaignValidation,
} = require("../../validations/siteContentValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Campaign
 *   description: Homepage countdown banner — admin-managed, publicly readable.
 */

/**
 * @swagger
 * /api/v1/campaign/active:
 *   get:
 *     tags: [Campaign]
 *     summary: The currently active countdown banner, if any (public)
 *     responses:
 *       200:
 *         description: Active campaign (data is null if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 */
router.get("/active", CampaignController.getActiveCampaign);

/**
 * @swagger
 * /api/v1/campaign:
 *   get:
 *     tags: [Campaign]
 *     summary: List every campaign (admin only)
 *     responses:
 *       200:
 *         description: Campaigns
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Campaign]
 *     summary: Create a campaign (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, deadline]
 *             properties:
 *               title: { type: string }
 *               tagline: { type: string }
 *               highlights: { type: string, description: "Comma-separated" }
 *               deadline: { type: string, format: date-time }
 *               ctaText: { type: string }
 *               ctaLink: { type: string }
 *               eventId: { type: string }
 *               isActive: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Campaign created
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CampaignController.getAllCampaigns,
);

router.post(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("image"),
  validationMiddleware.validate(createCampaignValidation),
  CampaignController.createCampaign,
);

/**
 * @swagger
 * /api/v1/campaign/{campaignId}:
 *   put:
 *     tags: [Campaign]
 *     summary: Update a campaign (admin only)
 *     parameters:
 *       - { name: campaignId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Campaign updated
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Campaign]
 *     summary: Delete a campaign (admin only)
 *     parameters:
 *       - { name: campaignId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Campaign deleted
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put(
  "/:campaignId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("image"),
  validationMiddleware.validate(updateCampaignValidation),
  CampaignController.updateCampaign,
);

router.delete(
  "/:campaignId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CampaignController.deleteCampaign,
);

module.exports = router;
