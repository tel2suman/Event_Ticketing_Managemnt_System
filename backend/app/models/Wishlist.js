const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent duplicate wishlist items
wishlistSchema.index(
  {
    userId: 1,
    eventId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Wishlist", wishlistSchema);
