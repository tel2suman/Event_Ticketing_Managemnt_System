const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    excerpt: {
      type: String,
      required: true,
      maxlength: 250,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    featuredImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dnwjxnsv0/image/upload/v1786090953/6fe15cb324280f299e56c2aeaf7d9a15064534e8_bozcdj.jpg",
      },
      public_id: {
        type: String,
        default: "6fe15cb324280f299e56c2aeaf7d9a15064534e8_bozcdj",
      },
    },

    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Scheduled"],
      default: "Draft",
    },

    publishDate: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
const blogModel = mongoose.model("Blog", blogSchema);
module.exports = blogModel;
