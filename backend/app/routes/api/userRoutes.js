const express = require("express");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const userController = require("../../controllers/api/userController");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Self-service profile management + admin user management.
 */

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get my profile
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [User]
 *     summary: Update my profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [User]
 *     summary: Delete (soft) my own account
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
userRouter.get("/profile", AuthMiddleware, userController.getProfile);
userRouter.put("/profile", AuthMiddleware, userController.updateProfile);
userRouter.delete("/profile", AuthMiddleware, userController.deleteProfile);

/**
 * @swagger
 * /api/v1/user/get:
 *   get:
 *     tags: [User]
 *     summary: Get all users (admin only)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
userRouter.get(
  "/get",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.getAllUsers,
);

/**
 * @swagger
 * /api/v1/user/get/{id}:
 *   get:
 *     tags: [User]
 *     summary: Get a user by id (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
userRouter.get(
  "/get/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.getUserById,
);

/**
 * @swagger
 * /api/v1/user/update/{id}:
 *   put:
 *     tags: [User]
 *     summary: Update a user (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
userRouter.put(
  "/update/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.updateUser,
);

/**
 * @swagger
 * /api/v1/user/delete/{id}:
 *   delete:
 *     tags: [User]
 *     summary: Soft-delete a user (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
userRouter.delete(
  "/delete/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.deleteUser,
);

/**
 * @swagger
 * /api/v1/user/restore/{id}:
 *   patch:
 *     tags: [User]
 *     summary: Restore a soft-deleted user (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: User restored
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
userRouter.patch(
  "/restore/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.restoreUser,
);

module.exports = userRouter;
