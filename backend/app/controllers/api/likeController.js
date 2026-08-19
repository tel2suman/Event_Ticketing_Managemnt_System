const Like = require("../../models/Like");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");
const mongoose = require("mongoose");

class LikeController {
  // toggle like
  async toggleLike(req, res) {
    try {
      const { eventId } = req.params;

      const userId = req.user._id;

      // Check event exists
      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check whether user already liked the event
      const existingLike = await Like.findOne({
        eventId,
        userId,
      });

      let liked;
      let message;

      if (existingLike) {
        // ----------------------------------------
        // Remove like
        // ----------------------------------------

        await Like.deleteOne({
          _id: existingLike._id,
        });

        liked = false;
        message = "Event unliked successfully";
      } else {
        // ----------------------------------------
        // Add like
        // ----------------------------------------

        await Like.create({
          eventId,
          userId,
        });

        liked = true;
        message = "Event liked successfully";
      }

      // Get updated like count
      const totalLikes = await Like.countDocuments({
        eventId,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message,
        data: {
          eventId,
          liked,
          totalLikes,
        },
      });
    } catch (error) {
      console.error("Toggle Like Error:", error);

      // Handle duplicate like race condition
      if (error.code === 11000) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Event already liked",
        });
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get Event Likes
  async getEventLikes(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const totalLikes = await Like.countDocuments({
        eventId,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event likes retrieved successfully",
        data: {
          eventId,
          totalLikes,
        },
      });
    } catch (error) {
      console.error("Get Event Likes Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new LikeController();