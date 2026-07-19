const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/User");
const HttpStatusCode = require("../../utils/httpStatusCode");
const EmailUtility = require("../../utils/sendEmail");
const Token = require("../../models/Token");

class UserController {
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

  //   updateProfile
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;

      const existingUser = await User.findById(req.user._id);

      if (!existingUser) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      const updateData = {};

      if (name) {
        updateData.name = name;
      }

      if (email && email !== existingUser.email) {
        const emailExists = await User.findOne({ email });

        if (emailExists) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message: "Email is already in use.",
          });
        }

        updateData.email = email;
        updateData.isEmailVerified = false;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      });

      // Send verification email only if email was changed
      if (updateData.email) {
        await Token.deleteMany({
          userId: user._id,
          type: "email_verification",
        });

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const hashedVerificationToken = await bcrypt.hash(
          verificationToken,
          10,
        );

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
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: updateData.email
          ? "Profile updated. Please verify your new email."
          : "Profile updated successfully.",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to update user profile.",
      });
    }
  }

  // deleteProfile
  async deleteProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User account not found.",
        });
      }

      await User.findByIdAndUpdate(
        req.user._id,
        {
          isDeleted: true,
        },
        { new: true },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User account deleted successfully.",
      });
    } catch (error) {
      console.error("Profile deletion error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to delete user account.",
      });
    }
  }

  // getAllUsers
  async getAllUsers(req, res) {
    try {
      const users = await User.find({ isDeleted: false });
      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Users fetched successfully.",
        data: {
          users,
        },
      });
    } catch (error) {
      console.error("Get users error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to fetch users.",
      });
    }
  }

  // getUsersById

  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User fetched successfully.",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to fetch user.",
      });
    }
  }
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const existingUser = await User.findById(id);

      if (!existingUser) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found.",
        });
      }

      if (email && email !== existingUser.email) {
        const emailExists = await User.findOne({ email });

        if (emailExists) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message: "Email already exists.",
          });
        }
      }

      const updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken");

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User updated successfully.",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Update user error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to update user.",
      });
    }
  }
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      );

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User deleted successfully.",
      });
    } catch (error) {
      console.error("Delete user error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to delete user.",
      });
    }
  }
  async restoreUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findOneAndUpdate(
        {
          _id: id,
          isDeleted: true,
        },
        {
          isDeleted: false,
        },
        {
          new: true,
          runValidators: true,
        },
      ).select("-password -refreshToken");

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Deleted user not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "User restored successfully.",
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Restore user error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to restore user.",
      });
    }
  }
}

module.exports = new UserController();
