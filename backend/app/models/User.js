const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [3, "Name must contain at least 3 characters."],
      maxlength: [32, "Name cannot exceed 32 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },

    googleId: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    avatar: {
      type: String,
      default: "",
    },

    // Admin-controlled account status (activate/deactivate), distinct
    // from `isDeleted` (soft-delete/trash) — feeds the Active/Inactive
    // split on the admin "User Details" dashboard.
    isActive: {
      type: Boolean,
      default: true,
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("User", userSchema);
