const jwt = require("jsonwebtoken");

const User = require("../models/User");

const HttpStatusCode = require("../utils/httpStatusCode");

const AuthMiddleware = async (req, res, next) => {
  try {
    let accessToken;

    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      accessToken = authorizationHeader.split(" ")[1];
    }

    if (!accessToken && req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
    }

    if (!accessToken) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Authenticated user account no longer exists.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        success: false,
        message: "Email verification is required.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired access token.",
    });
  }
};

module.exports = AuthMiddleware;
