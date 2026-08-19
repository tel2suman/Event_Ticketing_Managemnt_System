const Partner = require("../../models/Partner");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");

class PartnerController {
  // admin: add a partner/sponsor logo
  async createPartner(req, res) {
    try {
      if (!req.file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A logo image is required",
        });
      }

      const { name, websiteUrl, order, isActive } = req.body;

      const imageResult = await uploadToCloudinary(req.file.buffer);

      const partner = await Partner.create({
        name,
        websiteUrl,
        order,
        isActive,
        logo: imageResult.secure_url,
        cloudinary_id: imageResult.public_id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Partner added successfully",
        data: partner,
      });
    } catch (error) {
      console.error("Create Partner Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update
  async updatePartner(req, res) {
    try {
      const { partnerId } = req.params;

      const partner = await Partner.findById(partnerId);

      if (!partner) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Partner not found",
        });
      }

      if (req.file) {
        const imageResult = await uploadToCloudinary(req.file.buffer);

        if (partner.cloudinary_id) {
          await deleteFromCloudinary(partner.cloudinary_id).catch(() => {});
        }

        partner.logo = imageResult.secure_url;
        partner.cloudinary_id = imageResult.public_id;
      }

      Object.assign(partner, req.body);
      await partner.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Partner updated successfully",
        data: partner,
      });
    } catch (error) {
      console.error("Update Partner Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: delete
  async deletePartner(req, res) {
    try {
      const { partnerId } = req.params;

      const partner = await Partner.findById(partnerId);

      if (!partner) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Partner not found",
        });
      }

      if (partner.cloudinary_id) {
        await deleteFromCloudinary(partner.cloudinary_id).catch(() => {});
      }

      await Partner.findByIdAndDelete(partnerId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Partner deleted successfully",
      });
    } catch (error) {
      console.error("Delete Partner Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list every partner (active or not)
  async getAllPartners(req, res) {
    try {
      const partners = await Partner.find().sort({ order: 1, createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: partners.length,
        data: partners,
      });
    } catch (error) {
      console.error("Get All Partners Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — the "Our Proud Partners" grid
  async getActivePartners(req, res) {
    try {
      const partners = await Partner.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: partners.length,
        data: partners,
      });
    } catch (error) {
      console.error("Get Active Partners Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PartnerController();
