const cloudinary = require("cloudinary").v2;

require("dotenv").config();

//cloudinary configuration
cloudinary.config({
  cloud_name: process.env.ClOUDINARY_CLOUD_NAME,
  api_key: process.env.ClOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

module.exports = cloudinary;
