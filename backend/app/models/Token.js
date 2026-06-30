const mongoose = require("mongoose");

// Defining Schema
const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  token: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // 1 hour
  },
});

// Model
const TokenModel = mongoose.model("Token", tokenSchema);

module.exports = TokenModel;
