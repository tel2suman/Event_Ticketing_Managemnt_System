const express = require("express");

const commentRouter = express.Router();

const commentController = require("../../controllers/api/commentController");
const AuthMiddleware = require("../../middlewares/authMiddleware");

// CREATE COMMENT
commentRouter.post("/:blogId", AuthMiddleware, commentController.createComment);

// GET COMMENTS
commentRouter.get("/:blogId", commentController.getComments);

// UPDATE COMMENT
commentRouter.put("/:id", AuthMiddleware, commentController.updateComment);

// DELETE COMMENT
commentRouter.delete("/:id", AuthMiddleware, commentController.deleteComment);

module.exports = commentRouter;
