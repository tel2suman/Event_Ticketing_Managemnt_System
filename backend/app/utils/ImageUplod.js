
const fs = require("fs");

const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
      width: 1200,
      height: 600,
      crop: "limit",
      quality: "auto",
    });

    // Delete local temporary file
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return result;
  } catch (error) {
    // Delete local file if Cloudinary upload fails
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    throw error;
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    return;
  }

  return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
