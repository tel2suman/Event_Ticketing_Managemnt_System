const express = require("express");
const EventController = require("../../controllers/api/eventController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createEventValidation } = require("../../validations/authValidation");

const router = express.Router();

router.post("/create-event", AuthMiddleware, 
  RoleMiddleware("admin"),
  Upload.single("banner"),
  validationMiddleware.validate(createEventValidation),
  EventController.createEvent,
);

router.get("/single-event/:id", EventController.getSingleEventById);

router.get("/all-events", EventController.getAllEvents);

router.get("/events/category/:categoryId", EventController.getEventsByCategory);

router.put(
  "/update-event/:id", AuthMiddleware, 
  RoleMiddleware("admin"),
  Upload.single("banner"),
  validationMiddleware.validate(createEventValidation),
  EventController.updateEvent,
);

router.delete("/delete-event/:id", AuthMiddleware,
  RoleMiddleware("admin"), EventController.deleteEvent,
);

router.get("/notifications", AuthMiddleware,
  RoleMiddleware("admin", "user"), EventController.getNotifications,
);

module.exports = router;