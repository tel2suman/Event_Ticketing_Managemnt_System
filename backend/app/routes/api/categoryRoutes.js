const express = require("express");
const CategoryController = require("../../controllers/api/categoryController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createCategoryValidation } = require("../../validations/categoryValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Event category management — mostly admin-only.
 */

// ==============================
// CREATE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/create-category:
 *   post:
 *     tags: [Category]
 *     summary: Create a category (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryName]
 *             properties:
 *               categoryName: { type: string, example: "Standup Comedy" }
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/create-category",
  AuthMiddleware, validationMiddleware.validate(createCategoryValidation),
  RoleMiddleware("admin"), CategoryController.createCategory
);

// ==============================
// UPDATE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/update-category/{categoryId}:
 *   put:
 *     tags: [Category]
 *     summary: Update a category (admin only)
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryName]
 *             properties:
 *               categoryName: { type: string }
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/update-category/:categoryId",
  AuthMiddleware, validationMiddleware.validate(createCategoryValidation),
  RoleMiddleware("admin"), CategoryController.updateCategory,
);

// ==============================
// GET ALL CATEGORIES
// ==============================
/**
 * @swagger
 * /api/v1/category/all-categories:
 *   get:
 *     tags: [Category]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Category' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/all-categories",
  AuthMiddleware, RoleMiddleware("admin", "user"), CategoryController.getAllCategories
);

// ==============================
// GET ACTIVE CATEGORIES
// ==============================
/**
 * @swagger
 * /api/v1/category/active-categories:
 *   get:
 *     summary: Get all active categories
 *     description: Returns all categories where isActive is true.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 message:
 *                   type: string
 *                   example: Active categories fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 68abc1234567891234567890
 *                       categoryName:
 *                         type: string
 *                         example: Live Music
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/active-categories", CategoryController.getActiveCategories,
);

// ==============================
// GET SINGLE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/single-category/{categoryId}:
 *   get:
 *     tags: [Category]
 *     summary: Get a single category
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Category' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/single-category/:categoryId", RoleMiddleware("admin", "user"),
  CategoryController.getSingleCategory,
);

// ==============================
// DELETE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/delete-category/{categoryId}:
 *   delete:
 *     tags: [Category]
 *     summary: Delete a category (admin only)
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.delete("/delete-category/:categoryId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CategoryController.deleteCategory,
);

// ==============================
// DEACTIVATE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/deactivate-category/{categoryId}:
 *   put:
 *     tags: [Category]
 *     summary: Deactivate a category (admin only)
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Category deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/deactivate-category/:categoryId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CategoryController.deActivateCategory,
);

// ==============================
// TOGGLE CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/category/toggle-category/{categoryId}:
 *   patch:
 *     summary: Toggle category status
 *     description: Activates a deactivated category or deactivates an active category.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         description: MongoDB ObjectId of the category
 *         schema:
 *           type: string
 *         example: 68abc1234567891234567890
 *     responses:
 *       200:
 *         description: Category status toggled successfully
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
 *                   example: Category activated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 68abc1234567891234567890
 *                     categoryName:
 *                       type: string
 *                       example: Live Music
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Category ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/toggle-category/:categoryId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CategoryController.toggleCategory,
);


module.exports = router;