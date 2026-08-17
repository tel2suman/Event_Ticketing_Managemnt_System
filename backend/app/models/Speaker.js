const mongoose = require("mongoose");

const SpeakerSchema = new mongoose.Schema(
  {
    lectureDate: {
      type: Date,
      required: true,
    },

    lectureTime: {
      type: String,
      required: true,
      trim: true,
    },

    speakerName: {
      type: String,
      required: true,
      trim: true,
    },

    speakerImage: {
      type: String,
      required: true,
      trim: true,
    },

    cloudinary_id: {
      type: String,
    },

    speakerDesignation: {
      type: String,
      required: true,
      trim: true,
    },

    speakerBio: {
      type: String,
      required: true,
      trim: true,
    },

    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },

      x: {
        type: String,
        trim: true,
        default: "",
      },

      facebook: {
        type: String,
        trim: true,
        default: "",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Speaker", SpeakerSchema);
