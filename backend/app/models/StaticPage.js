const mongoose = require("mongoose");

// Footer "Terms & Conditions" / "Privacy Policy" pages — one document per
// slug, upserted by admins. Not a general CMS; deliberately limited to a
// fixed set of slugs so the footer links have somewhere real to point.
const staticPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ["terms-and-conditions", "privacy-policy"],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("StaticPage", staticPageSchema);
