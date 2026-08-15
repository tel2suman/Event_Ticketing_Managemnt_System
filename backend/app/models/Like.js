const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One user can like an event only once
LikeSchema.index(
  {
    eventId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Like", LikeSchema);
