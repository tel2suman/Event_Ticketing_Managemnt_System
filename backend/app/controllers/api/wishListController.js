const User = require("../../models/User");

const Event = require("../../models/Event");

const Wishlist = require("../../models/Wishlist");

const HttpStatusCode = require("../../utils/httpStatusCode");

const mongoose = require("mongoose");

class WishListController {
  // added to Wishlist
  async addToWishlist(req, res) {
    try {
      const { eventId } = req.body;

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const existingWishlist = await Wishlist.findOne({
        userId: req.user._id,
        eventId,
      });

      if (existingWishlist) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Event already exists in wishlist",
        });
      }

      const wishlist = await Wishlist.create({
        userId: req.user._id,
        eventId,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Event added to wishlist successfully",
        data: wishlist,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get Wishlist
  async getWishlist(req, res) {
    try {
      const wishlist = await Wishlist.aggregate([
        {
          $match: {
            userId: req.user._id,
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $lookup: {
            from: "categories",
            localField: "event.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            event: {
              _id: "$event._id",
              title: "$event.title",
              banner: "$event.banner",
              location: "$event.location",
              date: "$event.date",
              time: "$event.time",
              organizer: "$event.organizer",
              status: "$event.status",
              categoryName: "$category.categoryName",
            },
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: wishlist.length,
        data: wishlist,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Remove From Wishlist
  async removeFromWishlist(req, res) {
    
    try {

      const { wishlistId } = req.params;

      const wishlist = await Wishlist.findOneAndDelete({
        _id: wishlistId,
        userId: req.user._id,
      });

      if (!wishlist) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Wishlist item not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event removed from wishlist successfully",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}



module.exports = new WishListController();
