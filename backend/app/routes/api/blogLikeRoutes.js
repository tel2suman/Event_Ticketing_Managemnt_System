const express = require("express");

const blogLikeRouter = express.Router();

const AuthMiddleware = require("../../middlewares/authMiddleware");
const blogLikeController = require("../../controllers/api/blogLikeController");

// Like / Unlike
blogLikeRouter.post("/:blogId", AuthMiddleware, blogLikeController.toggleLike);

// Get like count
blogLikeRouter.get("/:blogId", blogLikeController.getLikeDetails);

module.exports = blogLikeRouter;
