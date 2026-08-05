const express = require("express");

const router = express.Router();

const NewsletterController = require("../../controllers/api/newsletterController");
const AuthMiddleware = require("../../middlewares/authMiddleware");

router.post("/subscribe", AuthMiddleware, NewsletterController.subscribe);

router.delete("/unsubscribe", AuthMiddleware, NewsletterController.unsubscribe);

router.get("/unsubscribe-link", NewsletterController.unsubscribeByToken);

router.get("/status", AuthMiddleware, NewsletterController.status);

module.exports = router;
