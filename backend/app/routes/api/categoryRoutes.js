const express = require("express");
const CategoryController = require("../../controllers/api/categoryController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createCategoryValidation } = require("../../validations/authValidation");

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



module.exports = router;