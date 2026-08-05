const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
    },

    isSubscribed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Newsletter", newsletterSchema);
