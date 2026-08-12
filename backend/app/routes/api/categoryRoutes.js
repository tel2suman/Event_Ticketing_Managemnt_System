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
router.get(
  "/active-categories",
  AuthMiddleware, RoleMiddleware("user", "admin"), CategoryController.getActiveCategories,
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
router.get("/single-category/:categoryId",
  AuthMiddleware, RoleMiddleware("admin", "user"),
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
router.patch(
  "/toggle-category/:categoryId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CategoryController.toggleCategory,
);


module.exports = router;