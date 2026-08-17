const express = require("express");

const SpeakerController = require("../../controllers/api/speakerController");

const AuthMiddleware = require("../../middlewares/authMiddleware");

const RoleMiddleware = require("../../middlewares/roleMiddleware");

const Upload = require("../../utils/CloudinaryImageUpload");

const validationMiddleware = require("../../middlewares/validationMiddleware");

const {createSpeakerValidation, updateSpeakerValidation} = require("../../validations/speakerValidation");

const router = express.Router();

// ========================================
// CREATE SPEAKER
// ========================================
/**
 * @swagger
 * /api/v1/speaker/create-speaker:
 *   post:
 *     summary: Create a new speaker
 *     description: Create a speaker with lecture details, speaker information, social media links, and speaker image.
 *     tags:
 *       - Speakers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - lectureDate
 *               - lectureTime
 *               - speakerName
 *               - speakerImage
 *               - speakerDesignation
 *               - speakerBio
 *             properties:
 *               lectureDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-25"
 *               lectureTime:
 *                 type: string
 *                 example: "18:30"
 *               speakerName:
 *                 type: string
 *                 example: "John Doe"
 *               speakerImage:
 *                 type: string
 *                 format: binary
 *               speakerDesignation:
 *                 type: string
 *                 example: "Senior Software Architect"
 *               speakerBio:
 *                 type: string
 *                 example: "Experienced software architect and technology speaker."
 *               linkedin:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.linkedin.com/in/johndoe"
 *               instagram:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.instagram.com/johndoe"
 *               x:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/johndoe"
 *               facebook:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.facebook.com/johndoe"
 *     responses:
 *       201:
 *         description: Speaker created successfully
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
 *                   example: Speaker created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Speaker'
 *       400:
 *         description: Validation error or speaker image missing
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Speaker already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/create-speaker",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("speakerImage"),
  validationMiddleware.validate(
    createSpeakerValidation,
    "body",
  ),
  SpeakerController.createSpeaker,
);

// ========================================
// GET ALL SPEAKERS
// ========================================
/**
 * @swagger
 * /api/v1/speaker/all-speakers:
 *   get:
 *     summary: Get all speakers
 *     description: Get speakers with optional name search, lecture date filtering, and pagination.
 *     tags:
 *       - Speakers
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search speaker by name. Case-insensitive partial search.
 *         example: "john"
 *
 *       - in: query
 *         name: lectureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter speakers by lecture date.
 *         example: "2026-09-25"
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of speakers per page.
 *         example: 10
 *
 *     responses:
 *       200:
 *         description: Speakers fetched successfully
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
 *                   example: Speakers fetched successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalSpeakers:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Speaker'
 *       500:
 *         description: Internal server error
 */
router.get(
  "/all-speakers",
  SpeakerController.getAllSpeakers,
);

/**
 * @swagger
 * /api/v1/speaker/{speakerId}:
 *   get:
 *     summary: Get speaker by ID
 *     description: Get complete details of a single speaker.
 *     tags:
 *       - Speakers
 *     parameters:
 *       - in: path
 *         name: speakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Speaker ID
 *         example: "68a123456789012345678901"
 *     responses:
 *       200:
 *         description: Speaker fetched successfully
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
 *                   example: Speaker fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Speaker'
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:speakerId",
  SpeakerController.getSpeakerById,
);

// ========================================
// UPDATE SPEAKER
// ========================================
/**
 * @swagger
 * /api/v1/speaker/{speakerId}/update-speaker:
 *   put:
 *     summary: Update speaker
 *     description: Update any single speaker field, multiple fields, or replace the speaker image.
 *     tags:
 *       - Speakers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: speakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Speaker ID
 *         example: "68a123456789012345678901"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               lectureDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-26"
 *               lectureTime:
 *                 type: string
 *                 example: "19:00"
 *               speakerName:
 *                 type: string
 *                 example: "John Smith"
 *               speakerImage:
 *                 type: string
 *                 format: binary
 *               speakerDesignation:
 *                 type: string
 *                 example: "Chief Technology Officer"
 *               speakerBio:
 *                 type: string
 *                 example: "Technology leader and keynote speaker."
 *               linkedin:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.linkedin.com/in/johnsmith"
 *               instagram:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.instagram.com/johnsmith"
 *               x:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/johnsmith"
 *               facebook:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.facebook.com/johnsmith"
 *     responses:
 *       200:
 *         description: Speaker updated successfully
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
 *                   example: Speaker updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Speaker'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 */

router.put(
  "/:speakerId/update-speaker",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("speakerImage"),
  validationMiddleware.validate(
    updateSpeakerValidation,
    "body",
  ),
  SpeakerController.updateSpeaker,
);

// ========================================
// DELETE SPEAKER
// ========================================
/**
 * @swagger
 * /api/v1/speaker/{speakerId}/delete-speaker:
 *   delete:
 *     summary: Delete speaker
 *     description: Delete a speaker and remove the associated speaker image from Cloudinary.
 *     tags:
 *       - Speakers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: speakerId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Speaker ID
 *         example: "68a123456789012345678901"
 *     responses:
 *       200:
 *         description: Speaker deleted successfully
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
 *                   example: Speaker deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Speaker not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:speakerId/delete-speaker",
  AuthMiddleware,
  RoleMiddleware("admin"),
  SpeakerController.deleteSpeaker,
);






module.exports = router;
