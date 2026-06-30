const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter valid email"],
    },

    password: {
      type: String,
      trim: true,
      required: true,
    },

    role: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },

    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
