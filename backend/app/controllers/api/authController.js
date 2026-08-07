const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Token = require("../../models/Token");
const GenerateToken = require("../../utils/generateTokens");
const EmailUtility = require("../../utils/SendEmail");
const HttpStatusCode = require("../../utils/httpStatusCode");

class AuthController {
  // register
  // register
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email, isDeleted: false });

      if (existingUser) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      const adminExists = await User.exists({
        role: "admin",
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: adminExists ? "user" : "admin",
      });

      const verificationToken = crypto.randomBytes(32).toString("hex");

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

      let emailSent = true;

      try {
        await EmailUtility.sendVerificationEmail(user, verificationUrl);
      } catch (emailError) {
        emailSent = false;

        console.error("Verification email sending failed:", emailError.message);
      }

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: emailSent
          ? "Registration successful. A verification link has been sent to your email."
          : "Registration successful, but we couldn't send the verification email. Please use the 'Resend Verification Email' option later.",
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

      // If the user exists and is already verified
      if (user && user.isEmailVerified) {
        return res.status(HttpStatusCode.SUCCESS).json({
          success: true,
          message: "Email is already verified. Please sign in.",
        });
      }

      // User doesn't exist
      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
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
          message:
            "Verification link is invalid or has expired. Please request a new verification email.",
        });
      }

      const isVerificationTokenValid = await bcrypt.compare(
        token,
        storedToken.token,
      );

      if (!isVerificationTokenValid) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "Verification link is invalid or has expired. Please request a new verification email.",
        });
      }

      user.isEmailVerified = true;

      await user.save();

      // Remove the verification token after successful verification.
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

  // resendVerificationEmail
  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email, isDeleted: false });

      const responseMessage = "A verification link has been sent.";

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.isEmailVerified) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email address has already been verified.",
        });
      }

      // Remove any previously issued email verification tokens.
      await Token.deleteMany({
        userId: user._id,
        type: "email_verification",
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

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: responseMessage,
      });
    } catch (error) {
      console.error("Resend verification email error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to resend verification email.",
      });
    }
  }

  //login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, isDeleted: false }).select(
        "+password +refreshToken",
      );

      if (!user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      if (user.provider === "google" && !user.password) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "This account uses Google Sign-In. Please continue with Google.",
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
      user.refreshToken = await bcrypt.hash(refreshToken, 10);

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

  async googleLogin(req, res) {
    try {
      const user = req.user;

      const accessToken = GenerateToken.accessToken(user);

      const refreshToken = GenerateToken.refreshToken(user);

      user.refreshToken = await bcrypt.hash(refreshToken, 10);

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

      return res.redirect(process.env.FRONTEND_URL);
      // return res.redirect(`${process.env.FRONTEND_URL}/auth/google/success`);
    } catch (error) {
      console.error(error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Google login failed.",
      });
    }
  }

  // refreshToken
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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

      const user = await User.findOne({ email, isDeleted: false });

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User does not exist.",
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
        message: "A password reset link has been sent.",
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

      const user = await User.findOne({ _id: id, isDeleted: false }).select(
        "+password +refreshToken",
      );

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      const isSamePassword = await bcrypt.compare(password, user.password);

      if (isSamePassword) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "New password must be different from the current password.",
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

  // changePassword
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select(
        "+password +refreshToken",
      );

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password,
      );

      if (!isOldPasswordValid) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Current password is incorrect.",
        });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "New password must be different from the current password.",
        });
      }

      user.password = await bcrypt.hash(newPassword, 12);

      // Force the user to sign in again after changing the password.
      user.refreshToken = null;

      await user.save();

      res.clearCookie("accessToken");

      res.clearCookie("refreshToken");

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Password changed successfully. Please sign in again.",
      });
    } catch (error) {
      console.error("Change password error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to change password.",
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
