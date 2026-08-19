const Event = require("../../models/Event");
const Category = require("../../models/Category")
const Ticket = require("../../models/Ticket");
const Rating = require("../../models/Rating");
const Like = require("../../models/Like");
const Notification = require("../../models/Notification");
const { refundAllTicketsForEvent } = require("../../utils/refundAllTicketsForEvent");
const {uploadToCloudinary, deleteFromCloudinary} = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");
const mongoose = require("mongoose");

// Enriches a list of plain event objects/documents with averageRating,
// totalRatings, and likesCount — standalone (not a class method) so it
// can be reused across every public listing endpoint (getAllEvents,
// searchEvents, filterEventsByCategoryName, getFeaturedEvents,
// getPopularEvents) without each one re-querying Rating/Like separately.
async function attachRatingsAndLikes(events) {
  const eventIds = events.map((event) => event._id);

  if (eventIds.length === 0) {
    return events;
  }

  const [ratings, likes] = await Promise.all([
    Rating.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id: "$eventId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
    Like.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$eventId", likesCount: { $sum: 1 } } },
    ]),
  ]);

  const ratingMap = new Map(
    ratings.map((entry) => [
      entry._id.toString(),
      {
        averageRating: Math.round(entry.averageRating * 10) / 10,
        totalRatings: entry.totalRatings,
      },
    ]),
  );
  const likeMap = new Map(likes.map((entry) => [entry._id.toString(), entry.likesCount]));

  return events.map((event) => {
    const plain = typeof event.toObject === "function" ? event.toObject() : event;
    const id = plain._id.toString();
    const ratingInfo = ratingMap.get(id) || { averageRating: 0, totalRatings: 0 };

    return {
      ...plain,
      averageRating: ratingInfo.averageRating,
      totalRatings: ratingInfo.totalRatings,
      likesCount: likeMap.get(id) || 0,
    };
  });
}

class EventController {
  // create event
  async createEvent(req, res) {
    let bannerResult = null;
    let locationImageResult = null;
    let artistImageResult = null;

    try {
      const {
        title,
        description,
        location,
        date,
        time,
        organizer,
        price,
        categoryId,
        address,
        facilities,
        map,
        artistName,
        artistDescription,
        youtube,
        instagram,
        facebook,
        x,
        status,
      } = req.body;

      if (
        !title ||
        !description ||
        !location ||
        !date ||
        !time ||
        !organizer ||
        !categoryId ||
        price === undefined ||
        !address ||
        !facilities ||
        !map ||
        !artistName ||
        !artistDescription
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

      // ----------------------------------------
      // Upload Banner image
      // ----------------------------------------

      if (!req.files?.banner?.[0]) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Event banner is required",
        });
      }

      bannerResult = await uploadToCloudinary(
        req.files.banner[0].buffer,
        "uploads",
      );

      // ----------------------------------------
      // Upload location image
      // ----------------------------------------

      if (!req.files?.locationImage?.[0]) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Location image is required",
        });
      }

      locationImageResult = await uploadToCloudinary(
        req.files.locationImage[0].buffer,
        "uploads/locations",
      );

      // ----------------------------------------
      // Upload artist profile image
      // ----------------------------------------

      if (!req.files?.artistProfileImage?.[0]) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Artist profile image is required",
        });
      }

      artistImageResult = await uploadToCloudinary(
        req.files.artistProfileImage[0].buffer,
        "uploads/artists",
      );

      // ----------------------------------------
      // Create event
      // ----------------------------------------

      const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        date,
        time,
        organizer: organizer.trim(),
        categoryId,
        price,
        banner: bannerResult.secure_url,
        cloudinary_id: bannerResult.public_id,

        locationDetails: {
          image: locationImageResult.secure_url,
          cloudinary_id: locationImageResult.public_id,
          address: address.trim(),
          facilities: facilities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          map: map.trim(),
        },

        artist: {
          artistName: artistName.trim(),
          profileImage: artistImageResult.secure_url,
          cloudinary_id: artistImageResult.public_id,
          artistDescription: artistDescription.trim(),
          socialLinks: {
            youtube: youtube?.trim() || "",
            instagram: instagram?.trim() || "",
            facebook: facebook?.trim() || "",
            x: x?.trim() || "",
          },
        },

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

      // ----------------------------------------
      // Cloudinary cleanup
      // ----------------------------------------

      if (bannerResult?.public_id) {
        try {
          await deleteFromCloudinary(bannerResult.public_id);
        } catch (deleteError) {
          console.error("Banner cleanup error:", deleteError.message);
        }
      }

      if (locationImageResult?.public_id) {
        try {
          await deleteFromCloudinary(locationImageResult.public_id);
        } catch (deleteError) {
          console.error("Location image cleanup error:", deleteError.message);
        }
      }

      if (artistImageResult?.public_id) {
        try {
          await deleteFromCloudinary(artistImageResult.public_id);
        } catch (deleteError) {
          console.error("Artist image cleanup error:", deleteError.message);
        }
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

      const event = await Event.findOne({ _id: id, isDeleted: false }).populate(
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
            isDeleted: false,
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
            price: 1,
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
          $match: { isDeleted: false },
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
            price: 1,
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
      const enrichedEvents = await attachRatingsAndLikes(events);

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
        data: enrichedEvents,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin "Events Details" listing — the combined search + status
  // filter + category filter + pagination + per-event tickets sold/
  // capacity that getAllEvents (public, active-only)/searchEvents/
  // filterEventsByCategoryName don't provide together
  async getAdminEvents(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const skip = (page - 1) * limit;
      const { search, status, categoryId } = req.query;

      const matchStage = { isDeleted: false };

      if (status && status !== "all") {
        matchStage.status = status;
      }

      if (categoryId) {
        matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
      }

      if (search) {
        matchStage.$or = [
          { title: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "tickettiers",
            let: { eventId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$eventId", "$$eventId"] },
                  isActive: true,
                },
              },
              {
                $group: {
                  _id: null,
                  capacity: { $sum: "$quantityAvailable" },
                  sold: { $sum: "$quantitySold" },
                },
              },
            ],
            as: "ticketStats",
          },
        },
        {
          $project: {
            title: 1,
            banner: 1,
            date: 1,
            time: 1,
            location: 1,
            status: 1,
            createdAt: 1,
            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
            ticketsSold: {
              $ifNull: [{ $arrayElemAt: ["$ticketStats.sold", 0] }, 0],
            },
            ticketsCapacity: {
              $ifNull: [{ $arrayElemAt: ["$ticketStats.capacity", 0] }, 0],
            },
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const [events, totalResult] = await Promise.all([
        Event.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        Event.aggregate([...pipeline, { $count: "total" }]),
      ]);

      const total = totalResult.length ? totalResult[0].total : 0;

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
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
      console.error("Get Admin Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  //update event
  async updateEvent(req, res) {
    
    let bannerResult = null;
    let locationImageResult = null;
    let artistImageResult = null;

    let oldBannerId = null;
    let oldLocationImageId = null;
    let oldArtistImageId = null;

    try {
      const { eventId } = req.params;

      // ----------------------------------------
      // Find event
      // ----------------------------------------

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // ----------------------------------------
      // Check current category
      // ----------------------------------------

      const currentCategory = await Category.findById(event.categoryId);

      if (!currentCategory || !currentCategory.isActive) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Cannot update event because its category is inactive",
        });
      }

      // ----------------------------------------
      // Category update
      // ----------------------------------------

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

      // ----------------------------------------
      // Basic Event Details
      // ----------------------------------------

      if (req.body.title !== undefined) {
        event.title = req.body.title.trim();
      }

      if (req.body.description !== undefined) {
        event.description = req.body.description.trim();
      }

      if (req.body.location !== undefined) {
        event.location = req.body.location.trim();
      }

      if (req.body.date !== undefined) {
        event.date = req.body.date;
      }

      if (req.body.time !== undefined) {
        event.time = req.body.time.trim();
      }

      if (req.body.organizer !== undefined) {
        event.organizer = req.body.organizer.trim();
      }

      if (req.body.price !== undefined) {
        event.price = Number(req.body.price);
      }

      if (req.body.status !== undefined) {
        event.status = req.body.status;
      }

      // ----------------------------------------
      // Location Details
      // ----------------------------------------

      if (!event.locationDetails) {
        event.locationDetails = {};
      }

      if (req.body.address !== undefined) {
        event.locationDetails.address = req.body.address.trim();
      }

      if (req.body.facilities !== undefined) {
        event.locationDetails.facilities = req.body.facilities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (req.body.map !== undefined) {
        event.locationDetails.map = req.body.map.trim();
      }

      // ----------------------------------------
      // Artist Details
      // ----------------------------------------

      if (!event.artist) {
        event.artist = {};
      }

      if (req.body.artistName !== undefined) {
        event.artist.artistName = req.body.artistName.trim();
      }

      if (req.body.artistDescription !== undefined) {
        event.artist.artistDescription = req.body.artistDescription.trim();
      }

      // ----------------------------------------
      // Artist Social Links
      // ----------------------------------------

      if (!event.artist.socialLinks) {
        event.artist.socialLinks = {};
      }

      if (req.body.youtube !== undefined) {
        event.artist.socialLinks.youtube = req.body.youtube.trim();
      }

      if (req.body.instagram !== undefined) {
        event.artist.socialLinks.instagram = req.body.instagram.trim();
      }

      if (req.body.facebook !== undefined) {
        event.artist.socialLinks.facebook = req.body.facebook.trim();
      }

      if (req.body.x !== undefined) {
        event.artist.socialLinks.x = req.body.x.trim();
      }

      // ----------------------------------------
      // Event Banner
      // ----------------------------------------

      if (req.files?.banner?.[0]) {
        // Store old image ID
        oldBannerId = event.cloudinary_id;

        // Upload new image
        bannerResult = await uploadToCloudinary(
          req.files.banner[0].buffer,
          "uploads",
        );

        event.banner = bannerResult.secure_url;
        event.cloudinary_id = bannerResult.public_id;
      }

      // ----------------------------------------
      // Location Image
      // ----------------------------------------

      if (req.files?.locationImage?.[0]) {
        // Store old image ID
        oldLocationImageId = event.locationDetails?.cloudinary_id;

        // Upload new image
        locationImageResult = await uploadToCloudinary(
          req.files.locationImage[0].buffer,
          "uploads/locations",
        );

        event.locationDetails.image = locationImageResult.secure_url;

        event.locationDetails.cloudinary_id = locationImageResult.public_id;
      }

      // ----------------------------------------
      // Artist Profile Image
      // ----------------------------------------

      if (req.files?.artistProfileImage?.[0]) {
        // Store old image ID
        oldArtistImageId = event.artist?.cloudinary_id;

        // Upload new image
        artistImageResult = await uploadToCloudinary(
          req.files.artistProfileImage[0].buffer,
          "uploads/artists",
        );

        event.artist.profileImage = artistImageResult.secure_url;

        event.artist.cloudinary_id = artistImageResult.public_id;
      }

      // ----------------------------------------
      // Save Event
      // ----------------------------------------

      await event.save();

      // ----------------------------------------
      // Delete old banner AFTER DB save
      // ----------------------------------------

      if (oldBannerId && oldBannerId !== event.cloudinary_id) {
        try {
          await deleteFromCloudinary(oldBannerId);
        } catch (deleteError) {
          console.error("Old banner deletion error:", deleteError.message);
        }
      }

      // ----------------------------------------
      // Delete old location image AFTER DB save
      // ----------------------------------------

      if (
        oldLocationImageId &&
        oldLocationImageId !== event.locationDetails?.cloudinary_id
      ) {
        try {
          await deleteFromCloudinary(oldLocationImageId);
        } catch (deleteError) {
          console.error(
            "Old location image deletion error:",
            deleteError.message,
          );
        }
      }

      // ----------------------------------------
      // Delete old artist image AFTER DB save
      // ----------------------------------------

      if (
        oldArtistImageId &&
        oldArtistImageId !== event.artist?.cloudinary_id
      ) {
        try {
          await deleteFromCloudinary(oldArtistImageId);
        } catch (deleteError) {
          console.error(
            "Old artist image deletion error:",
            deleteError.message,
          );
        }
      }

      // ----------------------------------------
      // Notification
      // ----------------------------------------

      await Notification.create({
        title: "Event Updated",
        message: `${event.title} has been updated successfully.`,
        type: "event_updated",
        eventId: event._id,
        createdBy: req.user._id,
      });

      // ----------------------------------------
      // Response
      // ----------------------------------------

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event updated successfully",
        data: event,
      });
    } catch (error) {
      console.error("Update Event Error:", error);

      // ----------------------------------------
      // Cleanup newly uploaded banner
      // ----------------------------------------

      if (bannerResult?.public_id) {
        try {
          await deleteFromCloudinary(bannerResult.public_id);
        } catch (deleteError) {
          console.error("Banner cleanup error:", deleteError.message);
        }
      }

      // ----------------------------------------
      // Cleanup newly uploaded location image
      // ----------------------------------------

      if (locationImageResult?.public_id) {
        try {
          await deleteFromCloudinary(locationImageResult.public_id);
        } catch (deleteError) {
          console.error("Location image cleanup error:", deleteError.message);
        }
      }

      // ----------------------------------------
      // Cleanup newly uploaded artist image
      // ----------------------------------------

      if (artistImageResult?.public_id) {
        try {
          await deleteFromCloudinary(artistImageResult.public_id);
        } catch (deleteError) {
          console.error("Artist image cleanup error:", deleteError.message);
        }
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // delete event (soft delete — moves the event to Trash)
  async deleteEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      event.isDeleted = true;
      await event.save();

      // Only cascade refunds for an event that hasn't happened yet — a
      // past event's tickets were already used/expired, so there's
      // nothing to refund. A refund failure here (e.g. Razorpay hiccup)
      // is logged but never blocks the delete itself.
      let refundSummary = null;

      if (event.date > new Date()) {
        try {
          refundSummary = await refundAllTicketsForEvent(eventId, {
            reason: "the event was cancelled",
          });
        } catch (refundError) {
          console.error(
            "Auto-refund on event delete failed:",
            refundError.message,
          );
        }
      }

      await Notification.create({
        title: "Event Deleted",
        message: `${event.title} has been moved to trash.`,
        type: "event_deleted",
        eventId: event._id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event moved to trash successfully",
        ...(refundSummary && { refundSummary }),
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // list trashed (soft-deleted) events
  async trashEvents(req, res) {
    try {
      const events = await Event.find({ isDeleted: true })
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      console.error("Trash Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // restore a trashed event
  async restoreEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findOne({ _id: eventId, isDeleted: true });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found in trash",
        });
      }

      event.isDeleted = false;
      await event.save();

      await Notification.create({
        title: "Event Restored",
        message: `${event.title} has been restored from trash.`,
        type: "event_updated",
        eventId: event._id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event restored successfully",
        data: event,
      });
    } catch (error) {
      console.error("Restore Event Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // permanently delete a trashed event (irreversible — also cleans up Cloudinary assets)
  async permanentDeleteEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findOne({ _id: eventId, isDeleted: true });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found in trash",
        });
      }

      const cloudinaryIds = [
        event.cloudinary_id,
        event.locationDetails?.cloudinary_id,
        event.artist?.cloudinary_id,
      ].filter(Boolean);

      await Promise.all(
        cloudinaryIds.map((publicId) =>
          deleteFromCloudinary(publicId).catch((deleteError) =>
            console.error("Cloudinary cleanup error:", deleteError.message),
          ),
        ),
      );

      await Event.findByIdAndDelete(eventId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Event permanently deleted",
      });
    } catch (error) {
      console.error("Permanent Delete Event Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get All Notifications — admin-broadcast, event-lifecycle notifications
  // only (userId: null). Personal notifications (payment/refund/transfer)
  // belong to TicketController.getMyNotifications instead.
  async getNotifications(req, res) {
    try {
      const [notifications, unreadCount] = await Promise.all([
        Notification.aggregate([
          // Broadcast notifications only — excludes personal
          // payment/refund/transfer notifications, which carry a userId
          { $match: { userId: null } },

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
              isRead: 1,
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
        ]),
        Notification.countDocuments({ userId: null, isRead: false }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: notifications.length,
        unreadCount,
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

  // mark one admin-broadcast notification (event lifecycle) as read —
  // the counterpart to TicketController.markNotificationRead, which
  // handles the logged-in user's personal notifications instead
  async markNotificationRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: null },
        { $set: { isRead: true } },
        { new: true },
      );

      if (!notification) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Mark Notification Read Error:", error);

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

      const matchStage = { isDeleted: false };

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
            price: 1,
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

      const enrichedEvents = await attachRatingsAndLikes(events);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: enrichedEvents.length,
        data: enrichedEvents,
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
            isDeleted: false,
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
            price: 1,
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

      const enrichedEvents = await attachRatingsAndLikes(events);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Events fetched successfully",
        count: enrichedEvents.length,
        data: enrichedEvents,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get Movie Events
  async getAllMovieEvents(req, res) {
    try {
      const events = await Event.aggregate([
        // Join events with categories
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },

        // Convert category array into object
        {
          $unwind: "$category",
        },

        // Filter by category name
        {
          $match: {
            "category.categoryName": "Movies",
          },
        },

        // Optional: only active categories
        {
          $match: {
            "category.isActive": true,
          },
        },

        // Optional: only active events
        {
          $match: {
            status: "active",
            isDeleted: false,
          },
        },

        // Select fields
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            location: 1,
            date: 1,
            time: 1,
            organizer: 1,
            price: 1,
            banner: 1,
            status: 1,
            categoryId: "$category._id",
            categoryName: "$category.categoryName",
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },

        // Latest events first
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: events.length,
        message: "Movie events fetched successfully",
        data: events,
      });
    } catch (error) {
      console.error("Get Movie Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // toggle Events
  async toggleEvent(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Toggle event status
      event.status = event.status === "active" ? "inactive" : "active";

      await event.save();

      // Create notification
      await Notification.create({
        title: "Event Status Updated",
        message: `${event.title} has been ${
          event.status === "active" ? "activated" : "deactivated"
        } successfully.`,
        type:
          event.status === "active" ? "event_activated" : "event_deactivated",
        eventId: event._id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message:
          event.status === "active"
            ? "Event activated successfully"
            : "Event deactivated successfully",
        data: event,
      });
    } catch (error) {
      console.error("Toggle Event Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: toggle whether an event shows up in the homepage "Featured
  // Events" rail
  async toggleFeatured(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      event.isFeatured = !event.isFeatured;
      await event.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: event.isFeatured
          ? "Event marked as featured"
          : "Event removed from featured",
        data: event,
      });
    } catch (error) {
      console.error("Toggle Featured Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — homepage "Featured Events" rail, admin-curated
  async getFeaturedEvents(req, res) {
    try {
      const limit = Number(req.query.limit) || 8;

      const events = await Event.find({
        isDeleted: false,
        status: "active",
        isFeatured: true,
      })
        .sort({ date: 1 })
        .limit(limit)
        .select("title location date time banner price categoryId");

      const enrichedEvents = await attachRatingsAndLikes(events);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: enrichedEvents.length,
        data: enrichedEvents,
      });
    } catch (error) {
      console.error("Get Featured Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — homepage "Popular Events" rail, ranked by tickets sold
  // (unlike Featured, this isn't admin-curated — it's earned). Same
  // ranking approach as analyticsController.getTopEvents, just without
  // the admin gate.
  async getPopularEvents(req, res) {
    try {
      const limit = Number(req.query.limit) || 8;

      const events = await Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$eventId",
            ticketsSold: { $sum: 1 },
          },
        },
        { $sort: { ticketsSold: -1 } },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $match: {
            "event.isDeleted": false,
            "event.status": "active",
          },
        },
        { $limit: limit },
        {
          $project: {
            _id: "$event._id",
            title: "$event.title",
            location: "$event.location",
            date: "$event.date",
            time: "$event.time",
            banner: "$event.banner",
            price: "$event.price",
            categoryId: "$event.categoryId",
            ticketsSold: 1,
          },
        },
      ]);

      const enrichedEvents = await attachRatingsAndLikes(events);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: enrichedEvents.length,
        data: enrichedEvents,
      });
    } catch (error) {
      console.error("Get Popular Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new EventController();