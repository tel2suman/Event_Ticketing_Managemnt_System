const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One user can rate an event only once
RatingSchema.index(
  {
    eventId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Rating", RatingSchema);
