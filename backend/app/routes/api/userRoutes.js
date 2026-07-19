const express = require("express");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const userController = require("../../controllers/api/userController");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const userRouter = express.Router();

userRouter.get("/profile", AuthMiddleware, userController.getProfile);
userRouter.put("/profile", AuthMiddleware, userController.updateProfile);
userRouter.delete("/profile", AuthMiddleware, userController.deleteProfile);
userRouter.get(
  "/get",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.getAllUsers,
);
userRouter.get(
  "/get/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.getUserById,
);
userRouter.put(
  "/update/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.updateUser,
);
userRouter.delete(
  "/delete/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.deleteUser,
);
userRouter.patch(
  "/restore/:id",
  AuthMiddleware,
  RoleMiddleware("admin"),
  userController.restoreUser,
);

module.exports = userRouter;
