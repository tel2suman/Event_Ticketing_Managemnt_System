const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Token = require("../../models/Token");
const GenerateToken = require("../../utils/generateTokens");
const EmailUtility = require("../../utils/sendEmail");
const HttpStatusCode = require("../../utils/httpStatusCode");

class AuthController {
  // register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      // Hash the account password before persisting the user record.
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
      });

      // Generate a cryptographically secure email verification token.
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Hash the verification token before storing it in the database.
      const hashedVerificationToken = await bcrypt.hash(verificationToken, 10);

      await Token.create({
        userId: user._id,
        token: hashedVerificationToken,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const verificationUrl =
        `${process.env.APP_BASE_URL}/api/v1/auth/verify-email` +
        `?token=${verificationToken}&id=${user._id}`;

      await EmailUtility.sendVerificationEmail(user, verificationUrl);

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message:
          "Registration successful. Please verify your email before signing in.",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to complete user registration.",
      });
    }
  }

  // email-verification
  async verifyEmail(req, res) {
    try {
      const { token, id } = req.query;

      if (!token || !id) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Verification token and user ID are required.",
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      if (user.isEmailVerified) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email address has already been verified.",
        });
      }

      const storedToken = await Token.findOne({
        userId: user._id,
        type: "email_verification",
        expiresAt: {
          $gt: new Date(),
        },
      });

      if (!storedToken) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Verification link is invalid or has expired.",
        });
      }

      const isVerificationTokenValid = await bcrypt.compare(
        token,
        storedToken.token,
      );

      if (!isVerificationTokenValid) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Verification link is invalid or has expired.",
        });
      }

      user.isEmailVerified = true;

      await user.save();

      // Remove the token after successful verification to prevent reuse.
      await Token.deleteMany({
        userId: user._id,
        type: "email_verification",
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Email verified successfully. You can now sign in.",
      });
    } catch (error) {
      console.error("Email verification error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to verify email address.",
      });
    }
  }

  //login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select(
        "+password +refreshToken",
      );

      if (!user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      if (!user.isEmailVerified) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Please verify your email before signing in.",
        });
      }

      const accessToken = GenerateToken.accessToken(user);

      const refreshToken = GenerateToken.refreshToken(user);

      // Store only the hashed refresh token in the database.
      user.refreshToken = await bcrypt.hash(refreshToken, 12);

      await user.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Login successful.",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to complete login.",
      });
    }
  }

  // refreshToken
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Refresh token is required.",
        });
      }

      const decodedToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const user = await User.findById(decodedToken.userId).select(
        "+refreshToken",
      );

      if (!user || !user.refreshToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid refresh token.",
        });
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid refresh token.",
        });
      }

      const newAccessToken = GenerateToken.accessToken(user);

      const newRefreshToken = GenerateToken.refreshToken(user);

      // Replace the previous refresh token hash during token rotation.
      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);

      await user.save();

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Authentication tokens refreshed successfully.",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }
  }

  // forgotPassword
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      const responseMessage =
        "If an account exists for this email, a password reset link has been sent.";

      if (!user) {
        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: responseMessage,
        });
      }

      // Remove any previously issued password reset tokens.
      await Token.deleteMany({
        userId: user._id,
        type: "password_reset",
      });

      // Generate a cryptographically secure password reset token.
      const passwordResetToken = crypto.randomBytes(32).toString("hex");

      // Hash the password reset token before database storage.
      const hashedPasswordResetToken = await bcrypt.hash(
        passwordResetToken,
        12,
      );

      await Token.create({
        userId: user._id,
        token: hashedPasswordResetToken,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const resetUrl =
        `${process.env.APP_BASE_URL}/api/v1/auth/reset-password` +
        `?token=${passwordResetToken}&id=${user._id}`;

      await EmailUtility.sendPasswordResetEmail(user, resetUrl);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: responseMessage,
      });
    } catch (error) {
      console.error("Forgot password error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to process password reset request.",
      });
    }
  }

  // resetPassword
  async resetPassword(req, res) {
    try {
      const { token, id } = req.query;

      const { password } = req.body;

      if (!token || !id) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Reset token and user ID are required.",
        });
      }

      const storedToken = await Token.findOne({
        userId: id,
        type: "password_reset",
        expiresAt: {
          $gt: new Date(),
        },
      });

      if (!storedToken) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Password reset link is invalid or has expired.",
        });
      }

      const isPasswordResetTokenValid = await bcrypt.compare(
        token,
        storedToken.token,
      );

      if (!isPasswordResetTokenValid) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Password reset link is invalid or has expired.",
        });
      }

      const user = await User.findById(id).select("+password +refreshToken");

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      user.password = await bcrypt.hash(password, 12);

      // Invalidate the current refresh token after a password change.
      user.refreshToken = null;

      await user.save();

      // Remove the reset token after successful use to prevent reuse.
      await Token.deleteMany({
        userId: user._id,
        type: "password_reset",
      });

      res.clearCookie("accessToken");

      res.clearCookie("refreshToken");

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message:
          "Password reset successfully. Please sign in with your new password.",
      });
    } catch (error) {
      console.error("Password reset error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to reset password.",
      });
    }
  }

  // logout
  async logout(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        try {
          const decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
          );

          const user = await User.findById(decodedToken.userId).select(
            "+refreshToken",
          );

          if (user && user.refreshToken) {
            const isRefreshTokenValid = await bcrypt.compare(
              refreshToken,
              user.refreshToken,
            );

            if (isRefreshTokenValid) {
              user.refreshToken = null;

              await user.save();
            }
          }
        } catch (error) {
          console.error(
            "Refresh token validation during logout:",
            error.message,
          );
        }
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to complete logout.",
      });
    }
  }

  //   getProfile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Profile fetched successfully.",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Profile fetch error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to fetch user profile.",
      });
    }
  }
}

module.exports = new AuthController();
