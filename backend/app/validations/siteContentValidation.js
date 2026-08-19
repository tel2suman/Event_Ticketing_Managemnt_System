const Joi = require("joi");

// CAMPAIGN (homepage countdown banner)
const createCampaignValidation = Joi.object({
  title: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Campaign title is required",
    "string.empty": "Campaign title is required",
  }),

  tagline: Joi.string().trim().max(150).allow("").default(""),

  // Comma-separated over multipart form-data (matches how eventController
  // handles Event.locationDetails.facilities) — split into an array in
  // campaignController before saving.
  highlights: Joi.string().trim().allow("").default(""),

  deadline: Joi.date().required().messages({
    "any.required": "Campaign deadline is required",
    "date.base": "Invalid deadline date",
  }),

  ctaText: Joi.string().trim().max(30).default("Buy Now"),

  ctaLink: Joi.string().trim().allow("").default(""),

  eventId: Joi.string().hex().length(24).allow(null).messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
  }),

  isActive: Joi.boolean().default(true),
});

const updateCampaignValidation = Joi.object({
  title: Joi.string().trim().min(2).max(100),
  tagline: Joi.string().trim().max(150).allow(""),
  highlights: Joi.string().trim().allow(""),
  deadline: Joi.date(),
  ctaText: Joi.string().trim().max(30),
  ctaLink: Joi.string().trim().allow(""),
  eventId: Joi.string().hex().length(24).allow(null),
  isActive: Joi.boolean(),
});

// MEDIA HIGHLIGHT ("Watch the Biggest Releases")
const createMediaHighlightValidation = Joi.object({
  title: Joi.string().trim().min(2).max(150).required().messages({
    "any.required": "Title is required",
    "string.empty": "Title is required",
  }),

  section: Joi.string().valid("home", "events").default("home").messages({
    "any.only": "Section must be 'home' or 'events'",
  }),

  videoUrl: Joi.string().trim().uri().allow("").default(""),

  ctaLink: Joi.string().trim().allow("").default(""),

  order: Joi.number().integer().min(0).default(0),

  isActive: Joi.boolean().default(true),
});

const updateMediaHighlightValidation = Joi.object({
  title: Joi.string().trim().min(2).max(150),
  section: Joi.string().valid("home", "events").messages({
    "any.only": "Section must be 'home' or 'events'",
  }),
  videoUrl: Joi.string().trim().uri().allow(""),
  ctaLink: Joi.string().trim().allow(""),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

// GALLERY IMAGE ("Moments That Made Memories")
const createGalleryImageValidation = Joi.object({
  caption: Joi.string().trim().max(150).allow("").default(""),
  order: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const updateGalleryImageValidation = Joi.object({
  caption: Joi.string().trim().max(150).allow(""),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

// PARTNER ("Our Proud Partners")
const createPartnerValidation = Joi.object({
  name: Joi.string().trim().min(1).max(60).required().messages({
    "any.required": "Partner name is required",
    "string.empty": "Partner name is required",
  }),

  websiteUrl: Joi.string().trim().uri().allow("").default(""),

  order: Joi.number().integer().min(0).default(0),

  isActive: Joi.boolean().default(true),
});

const updatePartnerValidation = Joi.object({
  name: Joi.string().trim().min(1).max(60),
  websiteUrl: Joi.string().trim().uri().allow(""),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

// FAQ
const createFaqValidation = Joi.object({
  question: Joi.string().trim().min(3).max(300).required().messages({
    "any.required": "Question is required",
    "string.empty": "Question is required",
  }),

  answer: Joi.string().trim().min(3).required().messages({
    "any.required": "Answer is required",
    "string.empty": "Answer is required",
  }),

  order: Joi.number().integer().min(0).default(0),

  isActive: Joi.boolean().default(true),
});

const updateFaqValidation = Joi.object({
  question: Joi.string().trim().min(3).max(300),
  answer: Joi.string().trim().min(3),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

// STATIC PAGE (Terms & Conditions / Privacy Policy)
const upsertStaticPageValidation = Joi.object({
  title: Joi.string().trim().min(2).max(150).required().messages({
    "any.required": "Title is required",
    "string.empty": "Title is required",
  }),

  content: Joi.string().trim().min(1).required().messages({
    "any.required": "Content is required",
    "string.empty": "Content is required",
  }),
});

module.exports = {
  createCampaignValidation,
  updateCampaignValidation,
  createMediaHighlightValidation,
  updateMediaHighlightValidation,
  createGalleryImageValidation,
  updateGalleryImageValidation,
  createPartnerValidation,
  updatePartnerValidation,
  createFaqValidation,
  updateFaqValidation,
  upsertStaticPageValidation,
};
