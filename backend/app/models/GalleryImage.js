const mongoose = require("mongoose");

// Homepage "Moments That Made Memories" photo strip.
const galleryImageSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },

    cloudinary_id: {
      type: String,
    },

    caption: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("GalleryImage", galleryImageSchema);
