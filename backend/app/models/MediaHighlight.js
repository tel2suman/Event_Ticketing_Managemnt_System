const mongoose = require("mongoose");

// Homepage "Watch the Biggest Releases" cards — a title, poster image,
// optional video link, and a "View Details" CTA.
const mediaHighlightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Which page's rail this card belongs to — e.g. Home's "Watch the
    // Biggest Releases" vs. Events' "Your Ticket to Unforgettable
    // Nights". Without this, every highlight would show up identically
    // on every page pulling from this collection.
    section: {
      type: String,
      enum: ["home", "events"],
      default: "home",
    },

    thumbnail: {
      type: String,
      required: true,
    },

    cloudinary_id: {
      type: String,
    },

    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    ctaLink: {
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

module.exports = mongoose.model("MediaHighlight", mediaHighlightSchema);
