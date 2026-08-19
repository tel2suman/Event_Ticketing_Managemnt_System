const Faq = require("../../models/Faq");
const HttpStatusCode = require("../../utils/httpStatusCode");

class FaqController {
  // admin: add an FAQ entry
  async createFaq(req, res) {
    try {
      const { question, answer, order, isActive } = req.body;

      const faq = await Faq.create({
        question,
        answer,
        order,
        isActive,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "FAQ created successfully",
        data: faq,
      });
    } catch (error) {
      console.error("Create Faq Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update
  async updateFaq(req, res) {
    try {
      const { faqId } = req.params;

      const faq = await Faq.findByIdAndUpdate(
        faqId,
        { $set: req.body },
        { new: true, runValidators: true },
      );

      if (!faq) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "FAQ not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "FAQ updated successfully",
        data: faq,
      });
    } catch (error) {
      console.error("Update Faq Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: delete
  async deleteFaq(req, res) {
    try {
      const { faqId } = req.params;

      const faq = await Faq.findByIdAndDelete(faqId);

      if (!faq) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "FAQ not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "FAQ deleted successfully",
      });
    } catch (error) {
      console.error("Delete Faq Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list every FAQ (active or not)
  async getAllFaqs(req, res) {
    try {
      const faqs = await Faq.find().sort({ order: 1, createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: faqs.length,
        data: faqs,
      });
    } catch (error) {
      console.error("Get All Faqs Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — the footer/support "FAQs" list
  async getActiveFaqs(req, res) {
    try {
      const faqs = await Faq.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: faqs.length,
        data: faqs,
      });
    } catch (error) {
      console.error("Get Active Faqs Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new FaqController();
