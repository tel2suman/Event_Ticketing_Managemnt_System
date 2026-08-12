const express = require("express");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const blogController = require("../../controllers/api/blogController");
const Upload = require("../../utils/CloudinaryImageUpload");
const blogRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog CRUD + editorial workflow (draft/publish/schedule/trash/restore).
 */

/**
 * @swagger
 * /api/v1/blog/create:
 *   post:
 *     tags: [Blog]
 *     summary: Create a blog post (multipart/form-data)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, excerpt, content, category]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *               status: { type: string, enum: [Draft, Published, Scheduled] }
 *               featuredImage: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Blog created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Blog' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// Create Blog
blogRouter.post(
  "/create",
  AuthMiddleware,
  Upload.single("featuredImage"),
  blogController.createBlog,
);

/**
 * @swagger
 * /api/v1/blog:
 *   get:
 *     tags: [Blog]
 *     summary: Get all blogs (admin only)
 *     responses:
 *       200:
 *         description: Blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Blog' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Get All Blogs
blogRouter.get(
  "/",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.getBlogs,
);

/**
 * @swagger
 * /api/v1/blog/published:
 *   get:
 *     tags: [Blog]
 *     summary: Get published blogs
 *     responses:
 *       200:
 *         description: Published blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Blog' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Get Published Blogs (User)
blogRouter.get("/published",AuthMiddleware, blogController.getPublishedBlogs);

/**
 * @swagger
 * /api/v1/blog/trash:
 *   get:
 *     tags: [Blog]
 *     summary: Get trashed (soft-deleted) blogs (admin only)
 *     responses:
 *       200:
 *         description: Trashed blogs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Blog' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Trash Blogs
// Must be declared before the "/:id" route below — otherwise Express
// matches "/trash" as the ":id" param and this route is never reached.
blogRouter.get(
  "/trash",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.trashBlogs,
);

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   get:
 *     tags: [Blog]
 *     summary: Get a single blog
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Blog' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
// Get Single Blog
blogRouter.get("/:id", AuthMiddleware, blogController.getBlogById);

/**
 * @swagger
 * /api/v1/blog/update/{id}:
 *   put:
 *     tags: [Blog]
 *     summary: Update a blog (admin only, multipart/form-data, all fields optional)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *               status: { type: string, enum: [Draft, Published, Scheduled] }
 *               publishDate: { type: string, format: date-time }
 *               featuredImage: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Blog updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Blog' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Update Blog
blogRouter.put(
  "/update/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("featuredImage"),
  blogController.updateBlog,
);

/**
 * @swagger
 * /api/v1/blog/draft/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Set a blog's status back to Draft (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Set to Draft
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Save As Draft
blogRouter.patch(
  "/draft/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.saveAsDraft,
);

/**
 * @swagger
 * /api/v1/blog/publish/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Publish a blog now (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Published
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Publish Blog
blogRouter.patch(
  "/publish/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.publishBlog,
);

/**
 * @swagger
 * /api/v1/blog/schedule/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Schedule a blog for a future publishDate (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publishDate]
 *             properties:
 *               publishDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Scheduled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
// Schedule Blog
blogRouter.patch(
  "/schedule/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.scheduleBlog,
);


/**
 * @swagger
 * /api/v1/blog/delete/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Soft-delete a blog / move to trash (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Soft Delete
blogRouter.delete(
  "/delete/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.deleteBlog,
);

/**
 * @swagger
 * /api/v1/blog/restore/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Restore a trashed blog (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Restored
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Restore Blog
blogRouter.patch(
  "/restore/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.restoreBlog,
);

/**
 * @swagger
 * /api/v1/blog/permanent-delete/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Permanently delete a blog (admin only, irreversible)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Permanently deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
// Permanent Delete
blogRouter.delete(
  "/permanent-delete/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  blogController.permanentDelete,
);

module.exports = blogRouter;
