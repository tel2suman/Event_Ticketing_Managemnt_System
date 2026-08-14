const Event = require("../../models/Event");
const Category = require("../../models/Category")
const Notification = require("../../models/Notification");
const {uploadToCloudinary, deleteFromCloudinary} = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");
const mongoose = require("mongoose");
class EventController {
  // create event
  async createEvent(req, res) {
    let imageResult = null;

    try {
      const {
        title,
        description,
        location,
        date,
        time,
        organizer,
        categoryId,
        status,
      } = req.body;

      if (
        !title ||
        !description ||
        !location ||
        !date ||
        !time ||
        !organizer ||
        !categoryId
      ) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Check category exists and is active
      const category = await Category.findOne({
        _id: categoryId,
        isActive: true,
      });

      if (!category) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Selected category is inactive or does not exist",
        });
      }

      const existingEvent = await Event.findOne({
        title: title.trim(),
        categoryId,
      });

      if (existingEvent) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Event already exists",
        });
      }

      if (!req.file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Banner image is required",
        });
      }

      // Upload image to Cloudinary
      imageResult = await uploadToCloudinary(req.file.buffer);

      const event = await Event.create({
        title: title.trim(),
        description,
        location,
        date,
        time,
        organizer,
        categoryId,
        banner: imageResult.secure_url,
        cloudinary_id: imageResult.public_id,
        status: status || "active",
        createdBy: req.user._id,
      });

      // create notification
      await Notification.create({
        title: "Event Created",
        message: `${event.title} has been created successfully.`,
        type: "event_created",
        eventId: event._id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Event created successfully",
        data: event,
      });
    } catch (error) {
      console.error(error);

      // Cleanup Cloudinary image if DB insertion fails
      if (imageResult?.public_id) {
        await deleteFromCloudinary(imageResult.public_id);
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get single event
  async getSingleEventById(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id).populate(
        "createdBy",
        "name email",
      );

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event Details Fetched Successfully!",
        data: event,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get events by category
  async getEventsByCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate ObjectId
      if (!categoryId) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category Id not found",
        });
      }

      const events = await Event.aggregate([
        // Filter events by category
        {
          $match: {
            categoryId: new mongoose.Types.ObjectId(categoryId),
            status: "active",
          },
        },

        // Join Category
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        // Convert category array to object
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join User
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },

        // Convert createdBy array to object
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Select fields
        {
          $project: {
            title: 1,
            description: 1,
            location: 1,
            date: 1,
            time: 1,
            organizer: 1,
            banner: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            categoryId: 1,

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },

            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              email: "$createdBy.email",
            },
          },
        },

        // Upcoming events first
        {
          $sort: {
            date: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error("Get Events By Category Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get all events
  async getAllEvents(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
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

        // Only events whose category is active
        {
          $match: {
            "category.isActive": true,
          },
        },

        // Optional: only active events
        {
          $match: {
            status: "active",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            location: 1,
            date: 1,
            time: 1,
            organizer: 1,
            banner: 1,
            status: 1,
            createdAt: 1,
            categoryId: "$category._id",
            categoryName: "$category.categoryName",
            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              email: "$createdBy.email",
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      const [events, totalResult] = await Promise.all([
        Event.aggregate([
          ...pipeline,
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]),
        Event.aggregate([
          ...pipeline,
          {
            $count: "total",
          },
        ]),
      ]);

      const total = totalResult.length ? totalResult[0].total : 0;

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Events fetched successfully",
        pagination: {
          totalRecords: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          perPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
        data: events,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  //update event
  async updateEvent(req, res) {

    let imageResult = null;

    try {

      const { id } = req.params;

      const event = await Event.findById(id);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check the event's current category
      const currentCategory = await Category.findById(event.categoryId);

      if (!currentCategory || !currentCategory.isActive) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Cannot update event because its category is inactive",
        });
      }

      // If category is being changed, new category must be active
      if (
        req.body.categoryId !== undefined &&
        req.body.categoryId !== event.categoryId.toString()
      ) {
        const newCategory = await Category.findOne({
          _id: req.body.categoryId,
          isActive: true,
        });

        if (!newCategory) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Selected category is inactive or does not exist",
          });
        }

        event.categoryId = newCategory._id;
      }

      // Update only the fields provided in the request
      if (req.body.title !== undefined) {
        event.title = req.body.title.trim();
      }

      if (req.body.description !== undefined) {
        event.description = req.body.description;
      }

      if (req.body.location !== undefined) {
        event.location = req.body.location;
      }

      if (req.body.date !== undefined) {
        event.date = req.body.date;
      }

      if (req.body.time !== undefined) {
        event.time = req.body.time;
      }

      if (req.body.organizer !== undefined) {
        event.organizer = req.body.organizer;
      }

      if (req.body.status !== undefined) {
        event.status = req.body.status;
      }

      // Update banner if a new image is provided
      if (req.file) {
        // Upload new image first
        imageResult = await uploadToCloudinary(req.file.buffer);

        // Delete old image only after new upload succeeds
        if (event.cloudinary_id) {
          await deleteFromCloudinary(event.cloudinary_id);
        }

        event.banner = imageResult.secure_url;
        event.cloudinary_id = imageResult.public_id;
      }

      await event.save();

      // Notification
      await Notification.create({
        title: "Event Updated",
        message: `${event.title} has been updated successfully.`,
        type: "event_updated",
        eventId: event._id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event updated successfully",
        data: event,
      });
    } catch (error) {
      console.error("Update Event Error:", error);

      // Remove newly uploaded image if database update fails
      if (imageResult?.public_id) {
        try {
          await deleteFromCloudinary(imageResult.public_id);
        } catch (deleteError) {
          console.error("Cloudinary cleanup error:", deleteError.message);
        }
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // delete event
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Delete Cloudinary image
      if (event.cloudinary_id) {
        await deleteFromCloudinary(event.cloudinary_id);
      }

      await Notification.create({
        title: "Event Deleted",
        message: `${event.title} has been deleted successfully.`,
        type: "event_deleted",
        eventId: event._id,
        createdBy: req.user._id,
      });

      await Event.findByIdAndDelete(id);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get All Notifications
  async getNotifications(req, res) {
    try {
      const notifications = await Notification.aggregate([
        // Join User collection
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },

        // Convert createdBy array to object
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join Event collection
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },

        // Convert event array to object
        {
          $unwind: {
            path: "$event",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Select required fields
        {
          $project: {
            _id: 1,
            title: 1,
            message: 1,
            type: 1,
            createdAt: 1,
            updatedAt: 1,

            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              email: "$createdBy.email",
            },

            event: {
              _id: "$event._id",
              title: "$event.title",
              banner: "$event.banner",
            },
          },
        },

        // Latest notification first
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      console.error("Get Notifications Error:", error);
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Search Events
  async searchEvents(req, res) {
    try {
      const { title, location, date } = req.query;

      const matchStage = {};

      if (title) {
        matchStage.title = {
          $regex: title,
          $options: "i",
        };
      }

      if (location) {
        matchStage.location = {
          $regex: location,
          $options: "i",
        };
      }

      if (date) {
        matchStage.date = new Date(date);
      }

      const events = await Event.aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
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
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $unwind: {
            path: "$createdBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            location: 1,
            date: 1,
            time: 1,
            organizer: 1,
            banner: 1,
            status: 1,
            createdAt: 1,
            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              email: "$createdBy.email",
            },
          },
        },
        {
          $sort: {
            date: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error(error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // filter events by category
  async filterEventsByCategoryName(req, res) {
    try {
      const { categoryName } = req.query;

      const events = await Event.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $match: {
            "category.categoryName": {
              $regex: `^${categoryName}$`,
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        {
          $unwind: "$createdBy",
        },
        {
          $project: {
            title: 1,
            description: 1,
            location: 1,
            date: 1,
            time: 1,
            organizer: 1,
            banner: 1,
            status: 1,
            createdAt: 1,
            categoryName: "$category.categoryName",
            createdBy: {
              _id: "$createdBy._id",
              name: "$createdBy.name",
              email: "$createdBy.email",
            },
          },
        },
        {
          $sort: {
            date: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Events fetched successfully",
        count: events.length,
        data: events,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new EventController();