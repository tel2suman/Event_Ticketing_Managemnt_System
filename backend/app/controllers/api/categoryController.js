
const Category = require("../../models/Category");
const HttpStatusCode = require("../../utils/httpStatusCode");

class CategoryController {
  // create category
  async createCategory(req, res) {
    try {
      const { categoryName } = req.body;

      if (!categoryName) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Category name is required",
        });
      }

      const existingCategory = await Category.findOne({ categoryName });

      if (existingCategory) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Category already exists",
        });
      }

      const category = await Category.create({
        categoryName,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      console.error("Create Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // update category
  async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const { categoryName } = req.body;

      const categoryExists = await Category.findById(categoryId);

      if (!categoryExists) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found",
        });
      }

      const existingCategory = await Category.findOne({
        categoryName,
        _id: { $ne: categoryId },
      });

      if (existingCategory) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Category name already exists",
        });
      }

      const category = await Category.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            categoryName,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      console.error("Update Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get all categories
  async getAllCategories(req, res) {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ createdAt: -1 })
        .select("categoryName createdAt updatedAt");

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Categories fetched successfully",
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      console.error("Get All Categories Error:", error);
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get Single category
  async getSingleCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId).select(
        "categoryName createdAt updatedAt",
      );

      if (!category) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      console.error("Get Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // delete category
  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Category ID is required",
        });
      }

      const category = await Category.findByIdAndDelete(categoryId);

      if (!category) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // deactivate category
  async deActivateCategory(req, res) {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Category ID is required",
        });
      }

      const category = await Category.findByIdAndUpdate(
        categoryId,
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        },
      );

      if (!category) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Category deactivated successfully",
        data: category,
      });
    } catch (error) {
      console.error("Deactivate Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}




module.exports = new CategoryController();