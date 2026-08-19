const GalleryImage = require("../../models/GalleryImage");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/ImageUplod");
const HttpStatusCode = require("../../utils/httpStatusCode");

class GalleryController {
  // admin: add a "Moments That Made Memories" photo
  async createGalleryImage(req, res) {
    try {
      if (!req.file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "An image is required",
        });
      }

      const { caption, order, isActive } = req.body;

      const imageResult = await uploadToCloudinary(req.file.buffer);

      const image = await GalleryImage.create({
        caption,
        order,
        isActive,
        image: imageResult.secure_url,
        cloudinary_id: imageResult.public_id,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Gallery image added successfully",
        data: image,
      });
    } catch (error) {
      console.error("Create Gallery Image Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: update
  async updateGalleryImage(req, res) {
    try {
      const { imageId } = req.params;

      const image = await GalleryImage.findById(imageId);

      if (!image) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Gallery image not found",
        });
      }

      if (req.file) {
        const imageResult = await uploadToCloudinary(req.file.buffer);

        if (image.cloudinary_id) {
          await deleteFromCloudinary(image.cloudinary_id).catch(() => {});
        }

        image.image = imageResult.secure_url;
        image.cloudinary_id = imageResult.public_id;
      }

      Object.assign(image, req.body);
      await image.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Gallery image updated successfully",
        data: image,
      });
    } catch (error) {
      console.error("Update Gallery Image Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: delete
  async deleteGalleryImage(req, res) {
    try {
      const { imageId } = req.params;

      const image = await GalleryImage.findById(imageId);

      if (!image) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Gallery image not found",
        });
      }

      if (image.cloudinary_id) {
        await deleteFromCloudinary(image.cloudinary_id).catch(() => {});
      }

      await GalleryImage.findByIdAndDelete(imageId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Gallery image deleted successfully",
      });
    } catch (error) {
      console.error("Delete Gallery Image Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list every image (active or not)
  async getAllGalleryImages(req, res) {
    try {
      const images = await GalleryImage.find().sort({ order: 1, createdAt: -1 });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: images.length,
        data: images,
      });
    } catch (error) {
      console.error("Get All Gallery Images Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — the "Moments That Made Memories" strip
  async getActiveGalleryImages(req, res) {
    try {
      const images = await GalleryImage.find({ isActive: true }).sort({
        order: 1,
        createdAt: -1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: images.length,
        data: images,
      });
    } catch (error) {
      console.error("Get Active Gallery Images Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new GalleryController();
