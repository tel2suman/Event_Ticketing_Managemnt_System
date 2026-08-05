const express = require("express");

const router = express.Router();

const ContactController = require("../../controllers/api/contactController");
const AuthMiddleware = require("../../middlewares/authMiddleware");

// Send Contact Message
router.post("/", AuthMiddleware, ContactController.sendMessage);

// My Contact Messages
router.get("/my-messages", AuthMiddleware, ContactController.myMessages);

module.exports = router;
