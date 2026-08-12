const express = require("express");
const EventController = require("../../controllers/api/eventController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createEventValidation, updateEventValidation, searchEventValidation, getEventsByCategoryValidation, filterEventsByCategoryNameValidation, getAllEventsValidation } = require("../../validations/eventValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Event
 *   description: Event CRUD. Create/Update are multipart/form-data (banner upload) and admin-only; listing/detail are public or auth-only.
 */

// ==============================
// CREATE EVENT
// ==============================
/**
 * @swagger
 * /api/v1/event/create-event:
 *   post:
 *     tags: [Event]
 *     summary: Create an event (admin only, multipart/form-data)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, location, date, time, organizer, categoryId, banner]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string, example: "18:00" }
 *               organizer: { type: string }
 *               categoryId: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *               banner: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/create-event", AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.single("banner"),
  validationMiddleware.validate(createEventValidation),
  EventController.createEvent,
);
// ==============================
// GET SINGLE EVENT
// ==============================
/**
 * @swagger
 * /api/v1/event/single-event/{id}:
 *   get:
 *     tags: [Event]
 *     summary: Get a single event by id
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Event' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/single-event/:id", EventController.getSingleEventById);

// ==============================
// GET ALL EVENTS WITH PAGINATION
// ==============================
/**
 * @swagger
 * /api/v1/event/all-events:
 *   get:
 *     tags: [Event]
 *     summary: List events (paginated)
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Paginated list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords: { type: integer }
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     perPage: { type: integer }
 *                     hasNextPage: { type: boolean }
 *                     hasPreviousPage: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/all-events", validationMiddleware.validate(getAllEventsValidation,"query"), EventController.getAllEvents);

// ==============================
// GET EVENTS BY CATEGORY
// ==============================
/**
 * @swagger
 * /api/v1/event/events/category/{categoryId}:
 *   get:
 *     tags: [Event]
 *     summary: Get events by category
 *     parameters:
 *       - { name: categoryId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Events in category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Event' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/events/category/:categoryId",
  validationMiddleware.validate(getEventsByCategoryValidation),
  EventController.getEventsByCategory
);

// ==============================
// UPDATE EVENT
// ==============================
/**
 * @swagger
 * /api/v1/event/update-event/{id}:
 *   put:
 *     tags: [Event]
 *     summary: Update an event (admin only, multipart/form-data)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               date: { type: string, format: date }
 *               time: { type: string }
 *               organizer: { type: string }
 *               categoryId: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *               banner: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Event' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
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
/**
 * @swagger
 * /api/v1/event/delete-event/{id}:
 *   delete:
 *     tags: [Event]
 *     summary: Delete an event (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.delete("/delete-event/:id", AuthMiddleware,
  RoleMiddleware("admin"), EventController.deleteEvent,
);

// ==============================
// EVENT NOTIFICATION
// ==============================
/**
 * @swagger
 * /api/v1/event/notifications:
 *   get:
 *     tags: [Event]
 *     summary: Get event notifications for the logged-in user
 *     responses:
 *       200:
 *         description: Notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/notifications", AuthMiddleware,
   EventController.getNotifications,
);

// ==============================
// SEARCH EVENTS
// ==============================
/**
 * @swagger
 * /api/v1/event/search-events:
 *   get:
 *     tags: [Event]
 *     summary: Search events by title/location/date
 *     parameters:
 *       - { name: title, in: query, schema: { type: string } }
 *       - { name: location, in: query, schema: { type: string } }
 *       - { name: date, in: query, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Matching events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.get("/search-events",
  validationMiddleware.validate(searchEventValidation, "query"),
  EventController.searchEvents,
);

// ==============================
// FILTER EVENTS
// ==============================
/**
 * @swagger
 * /api/v1/event/filter-events:
 *   get:
 *     tags: [Event]
 *     summary: Filter events by category name
 *     parameters:
 *       - { name: categoryName, in: query, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Filtered events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
router.get("/filter-events",
  validationMiddleware.validate(filterEventsByCategoryNameValidation, "query"),
  EventController.filterEventsByCategoryName,
);



module.exports = router;