const multer = require("multer");

const path = require("path");

const allowedTypes = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const filefilter = (req, file, cb) => {
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, and WEBP images are allowed"), false);
  }
};

const Upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  filefilter,
});

module.exports = Upload;
