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
 *   description: Blog CRUD and publishing management
 */

/**
 * @swagger
 * /api/v1/blog:
 *   post:
 *     tags: [Blog]
 *     summary: Create a new blog
 *     description: Admin can create a blog with category, author, tags, featured image and publishing status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - excerpt
 *               - content
 *               - category
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 150
 *                 example: "Top Music Events in 2026"
 *
 *               excerpt:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 250
 *                 example: "Discover the biggest music events happening in 2026."
 *
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 example: "Music events are one of the most exciting experiences..."
 *
 *               category:
 *                 type: string
 *                 format: objectId
 *                 example: "68a123456789abcdef123456"
 *                 description: MongoDB Category ObjectId
 *
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Music", "Events", "Entertainment"]
 *
 *               author:
 *                 type: string
 *                 example: "Raktim Bhattacharya"
 *
 *               status:
 *                 type: string
 *                 enum:
 *                   - Draft
 *                   - Published
 *                   - Scheduled
 *                 default: Draft
 *
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-25T10:00:00.000Z"
 *
 *               slug:
 *                 type: string
 *                 example: "top-music-events-in-2026"
 *
 *               metaTitle:
 *                 type: string
 *                 example: "Top Music Events in 2026"
 *
 *               metaDescription:
 *                 type: string
 *                 example: "A complete guide to the top music events happening in 2026."
 *
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       201:
 *         description: Blog created successfully
 *
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       409:
 *         description: Blog title or slug already exists
 */
blogRouter.post(
  "/",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  Upload.single("featuredImage"),
  blogController.createBlog,
);

/**
 * @swagger
 * /api/v1/blog:
 *   get:
 *     tags: [Blog]
 *     summary: Get all blogs
 *     description: Admin can retrieve all non-deleted blogs.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blogs fetched successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
blogRouter.get(
  "/",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.getBlogs,
);

/**
 * @swagger
 * /api/v1/blog/published:
 *   get:
 *     tags: [Blog]
 *     summary: Get all published blogs
 *     description: Retrieves all blogs with Published status.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Published blogs fetched successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
blogRouter.get("/published", AuthMiddleware, blogController.getPublishedBlogs);

/**
 * @swagger
 * /api/v1/blog/slug/{slug}:
 *   get:
 *     tags: [Blog]
 *     summary: Get blog by slug
 *     description: Retrieves a published blog using its SEO-friendly slug.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Blog slug
 *         schema:
 *           type: string
 *         example: "top-music-events-in-2026"
 *     responses:
 *       200:
 *         description: Blog fetched successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.get("/slug/:slug", AuthMiddleware, blogController.getBlogBySlug);

/**
 * @swagger
 * /api/v1/blog/trash:
 *   get:
 *     tags: [Blog]
 *     summary: Get trashed blogs
 *     description: Admin can retrieve all soft-deleted blogs.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trashed blogs fetched successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
blogRouter.get(
  "/trash",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.trashBlogs,
);

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   get:
 *     tags: [Blog]
 *     summary: Get blog by ID
 *     description: Retrieves a single non-deleted blog by its MongoDB ObjectId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog fetched successfully
 *
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.get("/:id", AuthMiddleware, blogController.getBlogById);

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   put:
 *     tags: [Blog]
 *     summary: Update a blog
 *     description: Admin can update blog details and optionally replace the featured image.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 150
 *                 example: "Updated Music Events in 2026"
 *
 *               excerpt:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 250
 *                 example: "Updated description of music events."
 *
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 example: "Updated blog content..."
 *
 *               category:
 *                 type: string
 *                 format: objectId
 *                 example: "68a123456789abcdef123456"
 *
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Music", "Concert", "Events"]
 *
 *               author:
 *                 type: string
 *                 example: "Raktim Bhattacharya"
 *
 *               status:
 *                 type: string
 *                 enum:
 *                   - Draft
 *                   - Published
 *                   - Scheduled
 *
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-25T10:00:00.000Z"
 *
 *               slug:
 *                 type: string
 *                 example: "updated-music-events-2026"
 *
 *               metaTitle:
 *                 type: string
 *                 example: "Updated Music Events 2026"
 *
 *               metaDescription:
 *                 type: string
 *                 example: "Updated information about music events."
 *
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.put(
  "/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  Upload.single("featuredImage"),
  blogController.updateBlog,
);

/**
 * @swagger
 * /api/v1/blog/draft/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Save blog as draft
 *     description: Changes the blog status to Draft.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog saved as draft successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.patch(
  "/draft/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.saveAsDraft,
);

/**
 * @swagger
 * /api/v1/blog/publish/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Publish blog immediately
 *     description: Changes the blog status to Published and sets the current publish date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog published successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.patch(
  "/publish/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.publishBlog,
);

/**
 * @swagger
 * /api/v1/blog/schedule/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Schedule a blog
 *     description: Schedule a blog for a future publish date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publishDate
 *             properties:
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-25T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Blog scheduled successfully
 *
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.patch(
  "/schedule/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.scheduleBlog,
);

/**
 * @swagger
 * /api/v1/blog/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Move blog to trash
 *     description: Soft deletes a blog by setting isDeleted to true.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog moved to trash successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.delete(
  "/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.deleteBlog,
);

/**
 * @swagger
 * /api/v1/blog/restore/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Restore blog
 *     description: Restores a soft-deleted blog from trash.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog restored successfully
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.patch(
  "/restore/:id",
  //AuthMiddleware,
  //RoleMiddleware("admin"),
  blogController.restoreBlog,
);

/**
 * @swagger
 * /api/v1/blog/permanent-delete/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Permanently delete blog
 *     description: Permanently deletes a blog and its featured image from Cloudinary. This action cannot be undone.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Blog permanently deleted
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRouter.delete(
  "/permanent-delete/:id",
  //RoleMiddleware("admin"),
  //AuthMiddleware,
  blogController.permanentDelete,
);

module.exports = blogRouter;
