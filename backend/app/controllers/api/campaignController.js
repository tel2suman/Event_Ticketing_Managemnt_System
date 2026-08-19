const Campaign = require("../../models/Campaign");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");

class CampaignController {
  // admin: create the countdown banner
  async createCampaign(req, res) {
    let imageResult = null;

    try {
      const { title, tagline, highlights, deadline, ctaText, ctaLink, eventId, isActive } =
        req.body;

      if (req.file) {
        imageResult = await uploadToCloudinary(req.file.buffer);
      }

      const highlightsList = highlights
        ? highlights.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      const campaign = await Campaign.create({
        title,
        tagline,
        highlights: highlightsList,
        deadline,
        ctaText,
        ctaLink,
        eventId: eventId || null,
        isActive,
        image: imageResult?.secure_url || "",
        cloudinary_id: imageResult?.public_id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Campaign created successfully",
        data: campaign,
      });
    } catch (error) {
      if (imageResult?.public_id) {
        await deleteFromCloudinary(imageResult.public_id).catch(() => {});
      }

      console.error("Create Campaign Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update
  async updateCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (req.file) {
        const imageResult = await uploadToCloudinary(req.file.buffer);

        if (campaign.cloudinary_id) {
          await deleteFromCloudinary(campaign.cloudinary_id).catch(() => {});
        }

        campaign.image = imageResult.secure_url;
        campaign.cloudinary_id = imageResult.public_id;
      }

      const { highlights, ...rest } = req.body;

      Object.assign(campaign, rest);

      if (highlights !== undefined) {
        campaign.highlights = highlights
          ? highlights.split(",").map((item) => item.trim()).filter(Boolean)
          : [];
      }

      await campaign.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Campaign updated successfully",
        data: campaign,
      });
    } catch (error) {
      console.error("Update Campaign Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: delete
  async deleteCampaign(req, res) {
    try {
      const { campaignId } = req.params;

      const campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (campaign.cloudinary_id) {
        await deleteFromCloudinary(campaign.cloudinary_id).catch(() => {});
      }

      await Campaign.findByIdAndDelete(campaignId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error("Delete Campaign Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list every campaign (active or not)
  async getAllCampaigns(req, res) {
    try {
      const campaigns = await Campaign.find().sort({ createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: campaigns.length,
        data: campaigns,
      });
    } catch (error) {
      console.error("Get All Campaigns Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — the one campaign the homepage banner should show: active,
  // deadline still in the future, soonest deadline first.
  async getActiveCampaign(req, res) {
    try {
      const campaign = await Campaign.findOne({
        isActive: true,
        deadline: { $gte: new Date() },
      }).sort({ deadline: 1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error("Get Active Campaign Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new CampaignController();
