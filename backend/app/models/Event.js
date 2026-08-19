const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
    },

    organizer: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Location details
    locationDetails: {
      image: {
        type: String,
        trim: true,
        required: true,
      },

      cloudinary_id: {
        type: String,
      },

      address: {
        type: String,
        trim: true,
        required: true,
      },

      facilities: {
        type: [String],
        default: [],
        required: true,
      },

      map: {
        type: String,
        trim: true,
        required: true,
      },
    },

    // Artist details
    artist: {
      artistName: {
        type: String,
        trim: true,
        required: true,
      },

      profileImage: {
        type: String,
        trim: true,
        required: true,
      },

      cloudinary_id: {
        type: String,
      },

      artistDescription: {
        type: String,
        trim: true,
        required: true,
      },
      
      socialLinks: {
        youtube: {
          type: String,
          trim: true,
        },

        instagram: {
          type: String,
          trim: true,
        },

        facebook: {
          type: String,
          trim: true,
        },

        x: {
          type: String,
          trim: true,
        },
      },
    },

    // Event banner
    banner: {
      type: String,
      required: true,
    },

    cloudinary_id: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Admin-curated pick for the homepage "Featured Events" rail —
    // distinct from "Popular Events", which is ranked by tickets sold
    // instead (see eventController.getPopularEvents).
    isFeatured: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Event", EventSchema);
