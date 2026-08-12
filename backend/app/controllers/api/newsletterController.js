const crypto = require("crypto");

const Newsletter = require("../../models/Newsletter");
const User = require("../../models/User");

const EmailUtility = require("../../utils/SendEmail");
const HttpStatusCode = require("../../utils/httpStatusCode");

class NewsletterController {
  // Subscribe
  async subscribe(req, res) {
    try {
      const user = req.user;

      const existingSubscription = await Newsletter.findOne({
        userId: user._id,
      });

      if (existingSubscription) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "You are already subscribed to the newsletter.",
        });
      }

      await Newsletter.create({
        userId: user._id,
        email: user.email,
        unsubscribeToken: crypto.randomBytes(32).toString("hex"),
      });

      await EmailUtility.sendNewsletterSubscribedEmail(user);

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Newsletter subscription successful.",
      });
    } catch (error) {
      console.error("Newsletter subscribe error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to subscribe to the newsletter.",
      });
    }
  }

  // Unsubscribe (Logged-in User)
  async unsubscribe(req, res) {
    try {
      const subscription = await Newsletter.findOne({
        userId: req.user._id,
      });

      if (!subscription) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "You are not subscribed to the newsletter.",
        });
      }

      await EmailUtility.sendNewsletterUnsubscribedEmail(req.user);

      await subscription.deleteOne();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Newsletter unsubscribed successfully.",
      });
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to unsubscribe from the newsletter.",
      });
    }
  }

  // Unsubscribe From Email Link
  async unsubscribeByToken(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid unsubscribe link.",
        });
      }

      const subscription = await Newsletter.findOne({
        unsubscribeToken: token,
      });

      if (!subscription) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Invalid or expired unsubscribe link.",
        });
      }

      const user = await User.findById(subscription.userId);

      if (user) {
        await EmailUtility.sendNewsletterUnsubscribedEmail(user);
      }

      await subscription.deleteOne();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "You have successfully unsubscribed from the newsletter.",
      });
    } catch (error) {
      console.error("Newsletter unsubscribe link error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to unsubscribe from the newsletter.",
      });
    }
  }

  // Subscription Status
  async status(req, res) {
    try {
      const subscription = await Newsletter.findOne({
        userId: req.user._id,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          subscribed: Boolean(subscription),
        },
      });
    } catch (error) {
      console.error("Newsletter status error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to fetch newsletter subscription status.",
      });
    }
  }
}

module.exports = new NewsletterController();
