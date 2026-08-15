const Rating = require("../../models/Rating");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");
const mongoose = require("mongoose");

class RatingController {

    // add rating
  async giveRating(req, res) {
    try {
      const { eventId } = req.params;

      const { rating } = req.body;

      if (!eventId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Event ID is required",
        });
      }

      // Check event exists
      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check whether user already rated this event
      const existingRating = await Rating.findOne({
        eventId,
        userId: req.user._id,
      });

      if (existingRating) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "You have already rated this event",
        });
      }

      const newRating = await Rating.create({
        eventId,
        userId: req.user._id,
        rating,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Event rated successfully",
        data: newRating,
      });
    } catch (error) {
      console.error("Give Rating Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get rating
  async getEventRating(req, res) {

    try {

      const { eventId } = req.params;

      if (!eventId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const ratings = await Rating.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
          },
        },

        {
          $group: {
            _id: "$eventId",
            averageRating: {
              $avg: "$rating",
            },
            totalRatings: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            eventId: "$_id",
            averageRating: {
              $round: ["$averageRating", 1],
            },
            totalRatings: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: ratings[0] || {
          eventId,
          averageRating: 0,
          totalRatings: 0,
        },
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new RatingController();
