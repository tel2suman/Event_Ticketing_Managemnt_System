const mongoose = require("mongoose");

// Homepage countdown banner ("EVENTARA 26", 02:09:52:40 Days/Hours/Min/Sec).
// Only one campaign is normally shown at a time — the frontend picks the
// active one with the soonest upcoming deadline (see
// campaignController.getActiveCampaign).
const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    tagline: {
      type: String,
      trim: true,
      default: "",
    },

    // Short bullet points shown next to the countdown (e.g. "Limited
    // Seats Available Hurry!!").
    highlights: {
      type: [String],
      default: [],
    },

    image: {
      type: String,
      default: "",
    },

    cloudinary_id: {
      type: String,
    },

    deadline: {
      type: Date,
      required: true,
    },

    ctaText: {
      type: String,
      trim: true,
      default: "Buy Now",
    },

    // Where the CTA button links to — a URL or route path, resolved by
    // the frontend. Not validated as an internal reference on purpose,
    // since it may point to an external page.
    ctaLink: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional — ties this campaign to one specific event.
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
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

module.exports = mongoose.model("Campaign", campaignSchema);
