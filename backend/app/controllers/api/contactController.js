const Contact = require("../../models/Contact");
const EmailUtility = require("../../utils/sendEmail");
const HttpStatusCode = require("../../utils/httpStatusCode");

class ContactController {
  // Send Contact Message
  async sendMessage(req, res) {
    try {
      const { name, email, phone, message } = req.body;

      // Required Fields
      if (!name || !email || !phone || !message) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "All fields are required.",
        });
      }

      // Name Validation
      if (name.trim().length < 3 || name.trim().length > 50) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Name must be between 3 and 50 characters.",
        });
      }

      // Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      // Phone Validation
      const phoneRegex = /^[6-9]\d{9}$/;

      if (!phoneRegex.test(phone)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number.",
        });
      }

      // Message Validation
      if (message.trim().length < 50 || message.trim().length > 1000) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Message must be between 50 and 1000 characters.",
        });
      }

      const contact = await Contact.create({
        userId: req.user._id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        message: message.trim(),
      });

      await EmailUtility.sendContactMessage(contact);

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message:
          "Your message has been sent successfully. We'll get back to you soon.",
      });
    } catch (error) {
      console.error("Contact Message Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to send your message.",
      });
    }
  }

  // My Messages
  async myMessages(req, res) {
    try {
      const messages = await Contact.find({
        userId: req.user._id,
      }).sort({
        createdAt: -1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error(error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: "Unable to fetch your messages.",
      });
    }
  }
}

module.exports = new ContactController();
