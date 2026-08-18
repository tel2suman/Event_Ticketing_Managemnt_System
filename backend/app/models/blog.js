const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Featured Image
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

    // Publishing Information
    status: {
      type: String,
      enum: ["Draft", "Published", "Scheduled"],
      default: "Draft",
    },

    publishDate: {
      type: Date,
    },

    // Author
    author: {
      type: String,
      required: true,
      trim: true,
    },

    // Blog URL
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // SEO Settings
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },

    // Soft Delete
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
