const express = require("express");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const blogController = require("../../controllers/api/blogController");
const Upload = require("../../utils/CloudinaryImageUpload");
const blogRouter = express.Router();

// Create Blog
blogRouter.post(
  "/create",
  AuthMiddleware,
  Upload.single("featuredImage"),
  blogController.createBlog,
);

// Get All Blogs
blogRouter.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.getBlogs,
);
// Get Published Blogs (User)
blogRouter.get("/published",AuthMiddleware, blogController.getPublishedBlogs);
// Get Single Blog
blogRouter.get("/:id", AuthMiddleware, blogController.getBlogById);

// Update Blog
blogRouter.put(
  "/update/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("featuredImage"),
  blogController.updateBlog,
);

// Save As Draft
blogRouter.patch(
  "/draft/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.saveAsDraft,
);

// Publish Blog
blogRouter.patch(
  "/publish/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.publishBlog,
);

// Schedule Blog
blogRouter.patch(
  "/schedule/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.scheduleBlog,
);


// Soft Delete
blogRouter.delete(
  "/delete/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.deleteBlog,
);

// Trash Blogs
blogRouter.get(
  "/trash",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.trashBlogs,
);

// Restore Blog
blogRouter.patch(
  "/restore/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.restoreBlog,
);

// Permanent Delete
blogRouter.delete(
  "/permanent-delete/:id",
  RoleMiddleware("admin"),
  AuthMiddleware,
  blogController.permanentDelete,
);

module.exports = blogRouter;
