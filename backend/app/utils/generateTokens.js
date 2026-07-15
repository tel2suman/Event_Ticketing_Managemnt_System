const crypto = require("crypto");

const jwt = require("jsonwebtoken");

const GenerateToken = {
  accessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
      },
    );
  },

  refreshToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        tokenId: crypto.randomUUID(),
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
      },
    );
  },
};

module.exports = GenerateToken;
