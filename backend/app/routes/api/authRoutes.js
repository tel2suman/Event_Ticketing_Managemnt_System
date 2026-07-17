const express = require("express");
const AuthController = require("../../controllers/api/authController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const ValidationMiddleware = require("../../middlewares/validationMiddleware");
const { authLimiter } = require("../../utils/limiter");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../../validations/authValidation");

const router = express.Router();

// Register a new user account.
router.post(
  "/register",
  authLimiter,
  ValidationMiddleware.validate(registerValidation),
  AuthController.register,
);

// Verify a registered user's email address.
router.get("/verify-email", AuthController.verifyEmail);

// Authenticate a verified user.
router.post(
  "/login",
  authLimiter,
  ValidationMiddleware.validate(loginValidation),
  AuthController.login,
);

// Rotate the current refresh token and issue new authentication tokens.
router.post("/refresh-token", authLimiter, AuthController.refreshToken);

// Request a password reset link.
router.post(
  "/forgot-password",
  authLimiter,
  ValidationMiddleware.validate(forgotPasswordValidation),
  AuthController.forgotPassword,
);

// Reset the account password using a valid password reset token.
router.patch(
  "/reset-password",
  authLimiter,
  ValidationMiddleware.validate(resetPasswordValidation),
  AuthController.resetPassword,
);

router.patch(
  "/change-password",
  AuthMiddleware,
  ValidationMiddleware.validate(changePasswordValidation),
  AuthController.changePassword,
);

// Invalidate the active refresh token and clear authentication cookies.
router.post("/logout", AuthMiddleware, AuthController.logout);

// Retrieve the authenticated user's profile.
router.get("/profile", AuthMiddleware, AuthController.getProfile);

module.exports = router;
