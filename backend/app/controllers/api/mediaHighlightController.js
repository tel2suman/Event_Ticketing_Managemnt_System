const MediaHighlight = require("../../models/MediaHighlight");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");

class MediaHighlightController {
  // admin: create a "Watch the Biggest Releases" card
  async createMediaHighlight(req, res) {
    try {
      if (!req.file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A thumbnail image is required",
        });
      }

      const { title, section, videoUrl, ctaLink, order, isActive } = req.body;

      const imageResult = await uploadToCloudinary(req.file.buffer);

      const highlight = await MediaHighlight.create({
        title,
        section,
        videoUrl,
        ctaLink,
        order,
        isActive,
        thumbnail: imageResult.secure_url,
        cloudinary_id: imageResult.public_id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Media highlight created successfully",
        data: highlight,
      });
    } catch (error) {
      console.error("Create Media Highlight Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update
  async updateMediaHighlight(req, res) {
    try {
      const { highlightId } = req.params;

      const highlight = await MediaHighlight.findById(highlightId);

      if (!highlight) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Media highlight not found",
        });
      }

      if (req.file) {
        const imageResult = await uploadToCloudinary(req.file.buffer);

        if (highlight.cloudinary_id) {
          await deleteFromCloudinary(highlight.cloudinary_id).catch(() => {});
        }

        highlight.thumbnail = imageResult.secure_url;
        highlight.cloudinary_id = imageResult.public_id;
      }

      Object.assign(highlight, req.body);
      await highlight.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Media highlight updated successfully",
        data: highlight,
      });
    } catch (error) {
      console.error("Update Media Highlight Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: delete
  async deleteMediaHighlight(req, res) {
    try {
      const { highlightId } = req.params;

      const highlight = await MediaHighlight.findById(highlightId);

      if (!highlight) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Media highlight not found",
        });
      }

      if (highlight.cloudinary_id) {
        await deleteFromCloudinary(highlight.cloudinary_id).catch(() => {});
      }

      await MediaHighlight.findByIdAndDelete(highlightId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Media highlight deleted successfully",
      });
    } catch (error) {
      console.error("Delete Media Highlight Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list every highlight (active or not)
  async getAllMediaHighlights(req, res) {
    try {
      const highlights = await MediaHighlight.find().sort({ order: 1, createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: highlights.length,
        data: highlights,
      });
    } catch (error) {
      console.error("Get All Media Highlights Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — one page's rail (e.g. Home's "Watch the Biggest Releases"
  // vs. Events' "Your Ticket to Unforgettable Nights"), selected via
  // ?section=
  async getActiveMediaHighlights(req, res) {
    try {
      const filter = { isActive: true };

      if (req.query.section) {
        filter.section = req.query.section;
      }

      const highlights = await MediaHighlight.find(filter).sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: highlights.length,
        data: highlights,
      });
    } catch (error) {
      console.error("Get Active Media Highlights Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MediaHighlightController();
