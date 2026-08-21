const mongoose = require("mongoose");

const Comment = require("../../models/Comment");
const blogModel = require("../../models/blog");
const HttpStatusCode = require("../../utils/httpStatusCode");

class CommentController {
  // CREATE COMMENT
  async createComment(req, res) {
    try {
      const { blogId } = req.params;
      const { text } = req.body;

      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      if (!text || !text.trim()) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Comment text is required.",
        });
      }

      const blog = await blogModel.findOne({
        _id: blogId,
        status: "Published",
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      const comment = await Comment.create({
        blog: blogId,
        user: req.user.id,
        text: text.trim(),
      });

      const populatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name email",
      );

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Comment added successfully.",
        data: populatedComment,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
  // UPDATE COMMENT
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid comment ID.",
        });
      }

      if (!text || !text.trim()) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Comment text is required.",
        });
      }

      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Comment not found.",
        });
      }

      // Admin can update any comment
      if (req.user.role === "admin") {
        comment.text = text.trim();

        await comment.save();

        const updatedComment = await Comment.findById(comment._id).populate(
          "user",
          "name email",
        );

        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: "Comment updated successfully.",
          data: updatedComment,
        });
      }

      // User can update only their own comment
      if (comment.user.toString() !== req.user.id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You can update only your own comment.",
        });
      }

      comment.text = text.trim();

      await comment.save();

      const updatedComment = await Comment.findById(comment._id).populate(
        "user",
        "name email",
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Comment updated successfully.",
        data: updatedComment,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
  // GET COMMENTS
  async getComments(req, res) {
    try {
      const { blogId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const comments = await Comment.aggregate([
        {
          $match: {
            blog: new mongoose.Types.ObjectId(blogId),
          },
        },

        // Join Comment with Blog
        {
          $lookup: {
            from: "blogs",
            localField: "blog",
            foreignField: "_id",
            as: "blog",
          },
        },

        {
          $unwind: {
            path: "$blog",
            preserveNullAndEmptyArrays: false,
          },
        },

        // Join Comment with User
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },

        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $project: {
            _id: 1,
            text: 1,
            createdAt: 1,
            updatedAt: 1,

            blog: {
              _id: "$blog._id",
              title: "$blog.title",
              slug: "$blog.slug",
            },

            user: {
              _id: "$user._id",
              name: "$user.name",
            },
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: comments.length,
        data: comments,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE COMMENT
  async deleteComment(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid comment ID.",
        });
      }

      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Comment not found.",
        });
      }

      // Admin can delete any comment
      if (req.user.role === "admin") {
        await Comment.findByIdAndDelete(id);

        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: "Comment deleted successfully.",
        });
      }

      // Normal user can delete only their own comment
      if (comment.user.toString() !== req.user.id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You can delete only your own comment.",
        });
      }

      await Comment.findByIdAndDelete(id);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Comment deleted successfully.",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CommentController();
