const express = require("express");
const CategoryController = require("../../controllers/api/categoryController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createCategoryValidation } = require("../../validations/categoryValidation");

const router = express.Router();

// ==============================
// CREATE CATEGORY
// ==============================
router.post("/create-category",
  AuthMiddleware, validationMiddleware.validate(createCategoryValidation),
  RoleMiddleware("admin"), CategoryController.createCategory
);

// ==============================
// UPDATE CATEGORY
// ==============================
router.put("/update-category/:categoryId",
  AuthMiddleware, validationMiddleware.validate(createCategoryValidation),
  RoleMiddleware("admin"), CategoryController.updateCategory,
);

// ==============================
// GET ALL CATEGORIES
// ==============================
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
  "/active-categories",
  AuthMiddleware, RoleMiddleware("user", "admin"), CategoryController.getActiveCategories,
);

// ==============================
// GET SINGLE CATEGORY
// ==============================
router.get("/single-category/:categoryId",
  AuthMiddleware, RoleMiddleware("admin", "user"),
  CategoryController.getSingleCategory,
);

// ==============================
// DELETE CATEGORY
// ==============================
router.delete("/delete-category/:categoryId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  CategoryController.deleteCategory,
);

// ==============================
// DEACTIVATE CATEGORY
// ==============================
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