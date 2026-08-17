const Speaker = require("../../models/Speaker");

const HttpStatusCode = require("../../utils/httpStatusCode");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../../utils/ImageUplod");

//const mongoose = require("mongoose");

class SpeakerController {
  // ========================================
  // CREATE SPEAKER
  // ========================================

  async createSpeaker(req, res) {
    let imageResult = null;

    try {
      const {
        lectureDate,
        lectureTime,
        speakerName,
        speakerDesignation,
        speakerBio,
        linkedin,
        instagram,
        x,
        facebook,
      } = req.body;

      // ----------------------------------------
      // Required image
      // ----------------------------------------

      if (!req.file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Speaker image is required",
        });
      }

      // ----------------------------------------
      // Check duplicate speaker
      // ----------------------------------------

      const existingSpeaker = await Speaker.findOne({
        speakerName: speakerName.trim(),
        lectureDate,
        lectureTime: lectureTime.trim(),
      });

      if (existingSpeaker) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Speaker already exists for this lecture",
        });
      }

      // ----------------------------------------
      // Upload speaker image
      // ----------------------------------------

      imageResult = await uploadToCloudinary(
        req.file.buffer,
        "uploads/speakers",
      );

      // ----------------------------------------
      // Create speaker
      // ----------------------------------------

      const speaker = await Speaker.create({
        lectureDate,

        lectureTime: lectureTime.trim(),

        speakerName: speakerName.trim(),

        speakerImage: imageResult.secure_url,

        cloudinary_id: imageResult.public_id,

        speakerDesignation: speakerDesignation.trim(),

        speakerBio: speakerBio.trim(),

        socialLinks: {
          linkedin: linkedin?.trim() || "",
          instagram: instagram?.trim() || "",
          x: x?.trim() || "",
          facebook: facebook?.trim() || "",
        },

        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Speaker created successfully",
        data: speaker,
      });
    } catch (error) {
      console.error("Create Speaker Error:", error);

      // ----------------------------------------
      // Cloudinary cleanup
      // ----------------------------------------

      if (imageResult?.public_id) {
        try {
          await deleteFromCloudinary(imageResult.public_id);
        } catch (deleteError) {
          console.error("Speaker image cleanup error:", deleteError.message);
        }
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================
  // GET ALL SPEAKERS
  // ========================================

  async getAllSpeakers(req, res) {
    try {
      const { name, lectureDate, page = 1, limit = 10 } = req.query;

      const query = {};

      // ----------------------------------------
      // Search by speaker name
      // ----------------------------------------

      if (name) {
        query.speakerName = {
          $regex: name.trim(),
          $options: "i",
        };
      }

      // ----------------------------------------
      // Filter by lecture date
      // ----------------------------------------

      if (lectureDate) {
        const startDate = new Date(lectureDate);

        if (isNaN(startDate.getTime())) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid lecture date",
          });
        }

        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        query.lectureDate = {
          $gte: startDate,
          $lt: endDate,
        };
      }

      // ----------------------------------------
      // Pagination
      // ----------------------------------------

      const currentPage = Math.max(Number(page), 1);
      const perPage = Math.max(Number(limit), 1);

      const skip = (currentPage - 1) * perPage;

      // ----------------------------------------
      // Get total
      // ----------------------------------------

      const totalSpeakers = await Speaker.countDocuments(query);

      // ----------------------------------------
      // Get speakers
      // ----------------------------------------

      const speakers = await Speaker.find(query)
        .sort({
          lectureDate: 1,
          lectureTime: 1,
        })
        .skip(skip)
        .limit(perPage);

      const totalPages = Math.ceil(totalSpeakers / perPage);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Speakers fetched successfully",

        pagination: {
          currentPage,
          limit: perPage,
          totalSpeakers,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },

        data: speakers,
      });
    } catch (error) {
      console.error("Get Speakers Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================
  // GET SINGLE SPEAKER
  // ========================================

  async getSpeakerById(req, res) {

    try {
        
      const { speakerId } = req.params;

      const speaker = await Speaker.findById(speakerId).populate(
        "createdBy",
        "name email",
      );

      if (!speaker) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Speaker not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Speaker fetched successfully",
        data: speaker,
      });
    } catch (error) {
      console.error("Get Speaker Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================
  // UPDATE SPEAKER
  // ========================================

  async updateSpeaker(req, res) {
    let imageResult = null;

    let oldImageId = null;

    try {
      const { speakerId } = req.params;

      const speaker = await Speaker.findById(speakerId);

      if (!speaker) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Speaker not found",
        });
      }

      // ----------------------------------------
      // Update basic fields
      // ----------------------------------------

      if (req.body.lectureDate !== undefined) {
        speaker.lectureDate = req.body.lectureDate;
      }

      if (req.body.lectureTime !== undefined) {
        speaker.lectureTime = req.body.lectureTime.trim();
      }

      if (req.body.speakerName !== undefined) {
        speaker.speakerName = req.body.speakerName.trim();
      }

      if (req.body.speakerDesignation !== undefined) {
        speaker.speakerDesignation = req.body.speakerDesignation.trim();
      }

      if (req.body.speakerBio !== undefined) {
        speaker.speakerBio = req.body.speakerBio.trim();
      }

      // ----------------------------------------
      // Social links
      // ----------------------------------------

      if (!speaker.socialLinks) {
        speaker.socialLinks = {};
      }

      if (req.body.linkedin !== undefined) {
        speaker.socialLinks.linkedin = req.body.linkedin.trim();
      }

      if (req.body.instagram !== undefined) {
        speaker.socialLinks.instagram = req.body.instagram.trim();
      }

      if (req.body.x !== undefined) {
        speaker.socialLinks.x = req.body.x.trim();
      }

      if (req.body.facebook !== undefined) {
        speaker.socialLinks.facebook = req.body.facebook.trim();
      }

      // ----------------------------------------
      // Speaker image
      // ----------------------------------------

      if (req.file) {
        oldImageId = speaker.cloudinary_id;

        imageResult = await uploadToCloudinary(
          req.file.buffer,
          "uploads/speakers",
        );

        speaker.speakerImage = imageResult.secure_url;

        speaker.cloudinary_id = imageResult.public_id;
      }

      // ----------------------------------------
      // Save
      // ----------------------------------------

      await speaker.save();

      // ----------------------------------------
      // Delete old image after DB save
      // ----------------------------------------

      if (oldImageId && oldImageId !== speaker.cloudinary_id) {
        try {
          await deleteFromCloudinary(oldImageId);
        } catch (deleteError) {
          console.error(
            "Old speaker image deletion error:",
            deleteError.message,
          );
        }
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Speaker updated successfully",
        data: speaker,
      });
    } catch (error) {
      console.error("Update Speaker Error:", error);

      // ----------------------------------------
      // Cleanup newly uploaded image
      // ----------------------------------------

      if (imageResult?.public_id) {
        try {
          await deleteFromCloudinary(imageResult.public_id);
        } catch (deleteError) {
          console.error("Speaker image cleanup error:", deleteError.message);
        }
      }

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ========================================
  // DELETE SPEAKER
  // ========================================

  async deleteSpeaker(req, res) {
    try {
      const { speakerId } = req.params;

      const speaker = await Speaker.findById(speakerId);

      if (!speaker) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Speaker not found",
        });
      }

      // ----------------------------------------
      // Delete Cloudinary image
      // ----------------------------------------

      if (speaker.cloudinary_id) {
        try {
          await deleteFromCloudinary(speaker.cloudinary_id);
        } catch (deleteError) {
          console.error("Speaker image deletion error:", deleteError.message);
        }
      }

      // ----------------------------------------
      // Delete database record
      // ----------------------------------------

      await Speaker.findByIdAndDelete(speakerId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Speaker deleted successfully",
      });
    } catch (error) {
      console.error("Delete Speaker Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}





module.exports = new SpeakerController();