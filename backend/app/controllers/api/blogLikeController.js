const mongoose = require("mongoose");

const Like = require("../../models/blogLike");
const blogModel = require("../../models/blog");
const HttpStatusCode = require("../../utils/httpStatusCode");

class LikeController {
  // LIKE / UNLIKE BLOG
  async toggleLike(req, res) {
    try {
      const { blogId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
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

      const existingLike = await Like.findOne({
        blog: blogId,
        user: req.user.id,
      });

      // Already liked → unlike
      if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        const likeCount = await Like.countDocuments({
          blog: blogId,
        });

        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          liked: false,
          likeCount,
          message: "Blog unliked successfully.",
        });
      }

      // Not liked → like
      await Like.create({
        blog: blogId,
        user: req.user.id,
      });

      const likeCount = await Like.countDocuments({
        blog: blogId,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        liked: true,
        likeCount,
        message: "Blog liked successfully.",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET LIKE COUNT + USER LIKE STATUS
  async getLikeDetails(req, res) {
    try {
      const { blogId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const likeCount = await Like.countDocuments({
        blog: blogId,
      });

      let liked = false;

      if (req.user) {
        const existingLike = await Like.findOne({
          blog: blogId,
          user: req.user.id,
        });

        liked = !!existingLike;
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        likeCount,
        liked,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new LikeController();
