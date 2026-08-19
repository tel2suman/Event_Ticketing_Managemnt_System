const StaticPage = require("../../models/StaticPage");
const HttpStatusCode = require("../../utils/httpStatusCode");

const VALID_SLUGS = ["terms-and-conditions", "privacy-policy"];

class StaticPageController {
  // admin: create or replace the content of one static page (Terms &
  // Conditions / Privacy Policy) — one document per slug
  async upsertStaticPage(req, res) {
    try {
      const { slug } = req.params;

      if (!VALID_SLUGS.includes(slug)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Invalid slug. Must be one of: ${VALID_SLUGS.join(", ")}`,
        });
      }

      const { title, content } = req.body;

      const page = await StaticPage.findOneAndUpdate(
        { slug },
        { $set: { title, content, updatedBy: req.user._id } },
        { new: true, upsert: true, runValidators: true },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Page saved successfully",
        data: page,
      });
    } catch (error) {
      console.error("Upsert Static Page Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — fetch one page by slug (footer FAQ/Terms/Privacy links)
  async getStaticPageBySlug(req, res) {
    try {
      const { slug } = req.params;

      const page = await StaticPage.findOne({ slug });

      if (!page) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "This page hasn't been published yet",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: page,
      });
    } catch (error) {
      console.error("Get Static Page Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new StaticPageController();
