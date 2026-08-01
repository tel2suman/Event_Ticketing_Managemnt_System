const multer = require("multer");

const allowedImageTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  return callback(
    new Error("Only JPG, JPEG, PNG, and WEBP images are allowed."),
    false,
  );
};

const Upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});


module.exports = Upload;