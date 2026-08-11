const express = require("express");
const EventController = require("../../controllers/api/eventController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createEventValidation, updateEventValidation, searchEventValidation, getEventsByCategoryValidation, filterEventsByCategoryNameValidation, getAllEventsValidation } = require("../../validations/eventValidation");

const router = express.Router();

// ==============================
// CREATE EVENT
// ==============================
router.post("/create-event", AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("banner"),
  validationMiddleware.validate(createEventValidation),
  EventController.createEvent,
);
// ==============================
// GET SINGLE EVENT
// ==============================
router.get("/single-event/:id", EventController.getSingleEventById);

// ==============================
// GET ALL EVENTS WITH PAGINATION
// ==============================
router.get("/all-events", AuthMiddleware, validationMiddleware.validate(getAllEventsValidation,"query"), EventController.getAllEvents);

// ==============================
// GET EVENTS BY CATEGORY
// ==============================
router.get("/events/category/:categoryId", AuthMiddleware,
  validationMiddleware.validate(getEventsByCategoryValidation),
  EventController.getEventsByCategory
);

// ==============================
// UPDATE EVENT
// ==============================
router.put(
  "/update-event/:id", AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("banner"),
  validationMiddleware.validate(updateEventValidation),
  EventController.updateEvent,
);

// ==============================
// DELETE EVENT
// ==============================
router.delete("/delete-event/:id", AuthMiddleware,
  RoleMiddleware("admin"), EventController.deleteEvent,
);

// ==============================
// EVENT NOTIFICATION
// ==============================
router.get("/notifications", AuthMiddleware,
  RoleMiddleware("admin", "user"), EventController.getNotifications,
);

// ==============================
// SEARCH EVENTS
// ==============================
router.get("/search-events", AuthMiddleware,
  validationMiddleware.validate(searchEventValidation, "query"),
  EventController.searchEvents,
);

// ==============================
// FILTER EVENTS
// ==============================
router.get("/filter-events", AuthMiddleware,
  validationMiddleware.validate(filterEventsByCategoryNameValidation, "query"),
  EventController.filterEventsByCategoryName,
);



module.exports = router;