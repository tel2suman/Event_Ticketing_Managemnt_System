const fs = require("fs");
const Event = require("../../models/Event");
const Notification = require("../../models/Notification");
const cloudinary = require("../../config/cloudinary");
const HttpStatusCode = require("../../utils/httpStatusCode");

class EventController {

  // create event
  async createEvent(req, res) {
    try {
      const { title, description, location, date, time, organizer, status } =
        req.body;

      if (!title || !description || !location || !date || !time || !organizer) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "All fields are required",
        });
      }

      const existingEvent = await Event.findOne({
        title: title.trim(),
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
      const imageResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "uploads",
        width: 1200,
        height: 600,
        crop: "limit",
        quality: "auto",
      });

      // Remove temporary file
      await fs.promises.unlink(req.file.path);

      const event = await Event.create({
        title: title.trim(),
        description,
        location,
        date,
        time,
        organizer,
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
        await cloudinary.uploader.destroy(imageResult.public_id);
      }

      // Cleanup local file if upload fails before unlink
      if (req.file?.path && fs.existsSync(req.file.path)) {
        await fs.promises.unlink(req.file.path);
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

  // get all events
  async getAllEvents(req, res) {
    try {
      const events = await Event.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "All Events Details Fetched Successfully!",
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

  //update event
  async updateEvent(req, res) {
    try {
      const { id } = req.params;

      const event = await Event.findById(id);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      if (req.file) {
        // Delete old Cloudinary image
        if (event.cloudinary_id) {
          await cloudinary.uploader.destroy(event.cloudinary_id);
        }

        // Upload new image
        const imageResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "uploads",
          width: 500,
          height: 500,
          crop: "limit",
          quality: "auto",
        });

        event.banner = imageResult.secure_url;
        event.cloudinary_id = imageResult.public_id;

        await fs.promises.unlink(req.file.path);
      }

      event.title = req.body.title || event.title;
      event.description = req.body.description || event.description;
      event.location = req.body.location || event.location;
      event.date = req.body.date || event.date;
      event.time = req.body.time || event.time;
      event.organizer = req.body.organizer || event.organizer;
      event.status = req.body.status || event.status;

      await event.save();

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
        await cloudinary.uploader.destroy(event.cloudinary_id);
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
      const notifications = await Notification.find()
        .populate("createdBy", "name email")
        .populate("eventId", "title")
        .sort({ createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: notifications.length,
        data: notifications,
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