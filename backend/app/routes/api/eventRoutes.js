const express = require("express");
const EventController = require("../../controllers/api/eventController");
const Upload = require("../../utils/CloudinaryImageUpload");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const RoleMiddleware = require("../../middlewares/roleMiddleware");
const {createEventValidation, updateEventValidation, searchEventValidation, getEventsByCategoryValidation, filterEventsByCategoryNameValidation, getAllEventsValidation, getAdminEventsValidation } = require("../../validations/eventValidation");

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
 *     summary: Create a new event
 *     description: Create an event under an active category with banner, location image, artist profile image, artist social links, and location details.
 *     tags:
 *       - Event
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *               - date
 *               - time
 *               - organizer
 *               - price
 *               - categoryId
 *               - address
 *               - facilities
 *               - map
 *               - artistName
 *               - artistDescription
 *               - banner
 *               - locationImage
 *               - artistProfileImage
 *             properties:
 *
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Live Music Night"
 *
 *               description:
 *                 type: string
 *                 minLength: 5
 *                 example: "An amazing live music experience."
 *
 *               location:
 *                 type: string
 *                 example: "Netaji Indoor Stadium"
 *
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-20"
 *
 *               time:
 *                 type: string
 *                 example: "18:00"
 *
 *               organizer:
 *                 type: string
 *                 example: "Music Events India"
 *
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 999
 *
 *               categoryId:
 *                 type: string
 *                 description: Active category MongoDB ObjectId
 *                 example: "68cat123456789123456789"
 *
 *               address:
 *                 type: string
 *                 example: "Netaji Indoor Stadium, Kolkata"
 *
 *               facilities:
 *                 type: string
 *                 description: Comma-separated list of facilities
 *                 example: "Parking, Food Court, Restrooms"
 *
 *               map:
 *                 type: string
 *                 format: uri
 *                 example: "https://maps.google.com/?q=Netaji+Indoor+Stadium"
 *
 *               artistName:
 *                 type: string
 *                 example: "Arijit Singh"
 *
 *               artistDescription:
 *                 type: string
 *                 example: "Indian playback singer and live performer."
 *
 *               youtube:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.youtube.com/@artist"
 *
 *               instagram:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.instagram.com/artist"
 *
 *               facebook:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.facebook.com/artist"
 *
 *               x:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/artist"
 *
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 default: active
 *                 example: active
 *
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: Event banner image
 *
 *               locationImage:
 *                 type: string
 *                 format: binary
 *                 description: Location image
 *
 *               artistProfileImage:
 *                 type: string
 *                 format: binary
 *                 description: Artist profile image
 *
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Event"
 *
 *       400:
 *         description: Validation error, missing fields, or inactive category
 *
 *       401:
 *         description: Authentication token required
 *
 *       404:
 *         description: Category not found or inactive
 *
 *       409:
 *         description: Event already exists
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/create-event",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.fields([
    {
      name: "banner",
      maxCount: 1,
    },
    {
      name: "locationImage",
      maxCount: 1,
    },
    {
      name: "artistProfileImage",
      maxCount: 1,
    },
  ]),
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
// ADMIN EVENTS LISTING (search + status filter + category filter +
// pagination + per-event tickets sold/capacity — admin "Events Details")
// ==============================
/**
 * @swagger
 * /api/v1/event/admin-events:
 *   get:
 *     tags: [Event]
 *     summary: List events for the admin dashboard — search + status + category filter, paginated (admin only)
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, default: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, default: 10 } }
 *       - { name: search, in: query, schema: { type: string }, description: "Matches title or location" }
 *       - { name: status, in: query, schema: { type: string, enum: [active, inactive, all] } }
 *       - { name: categoryId, in: query, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Paginated list of events with tickets sold/capacity
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
 *                   items: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/admin-events",
  AuthMiddleware,
  RoleMiddleware("admin"),
  validationMiddleware.validate(getAdminEventsValidation, "query"),
  EventController.getAdminEvents,
);


// ==============================
// MOVIE EVENTS
// ==============================
/**
 * @swagger
 * /api/v1/event/movie-events:
 *   get:
 *     summary: Get all movie events
 *     description: >
 *       Returns all active events that belong to the active "Movie" category.
 *       Events are filtered using a MongoDB aggregation pipeline.
 *     tags:
 *       - Event
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Movie events fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 message:
 *                   type: string
 *                   example: Movie events fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 68abc1234567891234567890
 *                       title:
 *                         type: string
 *                         example: "Avengers: Secret Wars"
 *                       description:
 *                         type: string
 *                         example: An upcoming movie screening event.
 *                       location:
 *                         type: string
 *                         example: Kolkata
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2026-09-20
 *                       time:
 *                         type: string
 *                         example: "18:30"
 *                       organizer:
 *                         type: string
 *                         example: Movie Events India
 *                       banner:
 *                         type: string
 *                         example: https://res.cloudinary.com/demo/image/upload/events/movie.jpg
 *                       status:
 *                         type: string
 *                         enum:
 *                           - active
 *                           - inactive
 *                         example: active
 *                       categoryId:
 *                         type: string
 *                         example: 68abc1234567891234567891
 *                       categoryName:
 *                         type: string
 *                         example: Movie
 *                       createdBy:
 *                         type: string
 *                         example: 68abc1234567891234567892
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authorization token required
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/movie-events", EventController.getAllMovieEvents);

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
 * /api/v1/event/update-event/{eventId}:
 *   put:
 *     summary: Update an event
 *     description: Update any single event field or multiple event fields. Supports updating event details, category, location details, artist details, social media links, and images.
 *     tags:
 *       - Event
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: Event MongoDB ObjectId
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *           example: "68abc123456789123456789"
 *
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Updated Live Music Night"
 *
 *               description:
 *                 type: string
 *                 minLength: 5
 *                 example: "Updated event description."
 *
 *               location:
 *                 type: string
 *                 example: "Eden Gardens"
 *
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-15"
 *
 *               time:
 *                 type: string
 *                 example: "19:00"
 *
 *               organizer:
 *                 type: string
 *                 example: "Music Events India"
 *
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 1299
 *
 *               categoryId:
 *                 type: string
 *                 description: New active category MongoDB ObjectId
 *                 example: "68cat123456789123456789"
 *
 *               address:
 *                 type: string
 *                 example: "Eden Gardens, Kolkata"
 *
 *               facilities:
 *                 type: string
 *                 description: Comma-separated list of facilities
 *                 example: "Parking, VIP Lounge, Food Court"
 *
 *               map:
 *                 type: string
 *                 format: uri
 *                 example: "https://maps.google.com/?q=Eden+Gardens"
 *
 *               artistName:
 *                 type: string
 *                 example: "Arijit Singh"
 *
 *               artistDescription:
 *                 type: string
 *                 example: "Updated artist description."
 *
 *               youtube:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.youtube.com/@artist"
 *
 *               instagram:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.instagram.com/artist"
 *
 *               facebook:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.facebook.com/artist"
 *
 *               x:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/artist"
 *
 *               status:
 *                 type: string
 *                 enum:
 *                   - active
 *                   - inactive
 *                 example: active
 *
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: New event banner image
 *
 *               locationImage:
 *                 type: string
 *                 format: binary
 *                 description: New location image
 *
 *               artistProfileImage:
 *                 type: string
 *                 format: binary
 *                 description: New artist profile image
 *
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event updated successfully"
 *                 data:
 *                   $ref: "#/components/schemas/Event"
 *
 *       400:
 *         description: Invalid data, inactive current category, or selected category is inactive
 *
 *       401:
 *         description: Authentication token required
 *
 *       404:
 *         description: Event not found
 *
 *       500:
 *         description: Internal server error
 */
router.put(
  "/update-event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  Upload.fields([
    {
      name: "banner",
      maxCount: 1,
    },
    {
      name: "locationImage",
      maxCount: 1,
    },
    {
      name: "artistProfileImage",
      maxCount: 1,
    },
  ]),
  validationMiddleware.validate(updateEventValidation),
  EventController.updateEvent,
);

// ==============================
// DELETE EVENT
// ==============================
/**
 * @swagger
 * /api/v1/event/delete-event/{eventId}:
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
router.delete(
  "/delete-event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.deleteEvent,
);

// ==============================
// TRASH — LIST SOFT-DELETED EVENTS
// ==============================
/**
 * @swagger
 * /api/v1/event/trash-events:
 *   get:
 *     tags: [Event]
 *     summary: List trashed (soft-deleted) events (admin only)
 *     responses:
 *       200:
 *         description: Trashed events
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
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/trash-events",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.trashEvents,
);

// ==============================
// RESTORE EVENT FROM TRASH
// ==============================
/**
 * @swagger
 * /api/v1/event/restore-event/{eventId}:
 *   patch:
 *     tags: [Event]
 *     summary: Restore a trashed event (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Event restored
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
router.patch(
  "/restore-event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.restoreEvent,
);

// ==============================
// PERMANENTLY DELETE A TRASHED EVENT
// ==============================
/**
 * @swagger
 * /api/v1/event/permanent-delete-event/{eventId}:
 *   delete:
 *     tags: [Event]
 *     summary: Permanently delete a trashed event, including its Cloudinary assets (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Event permanently deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.delete(
  "/permanent-delete-event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.permanentDeleteEvent,
);

// ==============================
// EVENT NOTIFICATION
// ==============================
/**
 * @swagger
 * /api/v1/event/notifications:
 *   get:
 *     tags: [Event]
 *     summary: Get admin-broadcast event-lifecycle notifications (admin only)
 *     responses:
 *       200:
 *         description: Notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 unreadCount: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/notifications",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.getNotifications,
);

/**
 * @swagger
 * /api/v1/event/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Event]
 *     summary: Mark one admin-broadcast event notification as read (admin only)
 *     parameters:
 *       - { name: notificationId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Notification marked read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.patch(
  "/notifications/:notificationId/read",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.markNotificationRead,
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

// ==============================
// TOGGLE EVENTS
// ==============================
/**
 * @swagger
 * /api/v1/event/toggle-event/{eventId}:
 *   patch:
 *     summary: Toggle event status
 *     description: >
 *       Activates an inactive event or deactivates an active event.
 *       A notification is created whenever the event status changes.
 *     tags:
 *       - Event
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: MongoDB ObjectId of the event
 *         schema:
 *           type: string
 *           example: "68abc1234567891234567890"
 *
 *     responses:
 *       200:
 *         description: Event status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event activated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "68abc1234567891234567890"
 *                     title:
 *                       type: string
 *                       example: "Avengers: Secret Wars"
 *                     description:
 *                       type: string
 *                       example: "An upcoming movie screening event."
 *                     location:
 *                       type: string
 *                       example: "Kolkata"
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-09-20"
 *                     time:
 *                       type: string
 *                       example: "18:30"
 *                     organizer:
 *                       type: string
 *                       example: "Movie Events India"
 *                     price:
 *                       type: number
 *                       format: double
 *                       minimum: 0
 *                       example: 499
 *                     categoryId:
 *                       type: string
 *                       example: "68abc1234567891234567891"
 *                     banner:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/events/movie.jpg"
 *                     status:
 *                       type: string
 *                       enum:
 *                         - active
 *                         - inactive
 *                       example: active
 *                     createdBy:
 *                       type: string
 *                       example: "68abc1234567891234567892"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-14T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-14T10:30:00.000Z"
 *
 *       400:
 *         description: Event ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Event ID is required"
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authorization token required"
 *
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Event not found"
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.patch(
  "/toggle-event/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.toggleEvent
);

// ==============================
// TOGGLE FEATURED (admin only)
// ==============================
/**
 * @swagger
 * /api/v1/event/toggle-featured/{eventId}:
 *   patch:
 *     tags: [Event]
 *     summary: Toggle whether an event is featured on the homepage (admin only)
 *     parameters:
 *       - { name: eventId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Featured flag toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.patch(
  "/toggle-featured/:eventId",
  AuthMiddleware,
  RoleMiddleware("admin"),
  EventController.toggleFeatured,
);

// ==============================
// FEATURED EVENTS (public — homepage "Featured Events" rail)
// ==============================
/**
 * @swagger
 * /api/v1/event/featured:
 *   get:
 *     tags: [Event]
 *     summary: Admin-curated featured events (public)
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 8 } }
 *     responses:
 *       200:
 *         description: Featured events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data: { type: array, items: { type: object } }
 */
router.get("/featured", EventController.getFeaturedEvents);

// ==============================
// POPULAR EVENTS (public — homepage "Popular Events" rail, ranked by
// tickets sold)
// ==============================
/**
 * @swagger
 * /api/v1/event/popular:
 *   get:
 *     tags: [Event]
 *     summary: Events ranked by tickets sold (public)
 *     parameters:
 *       - { name: limit, in: query, schema: { type: integer, default: 8 } }
 *     responses:
 *       200:
 *         description: Popular events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data: { type: array, items: { type: object } }
 */
router.get("/popular", EventController.getPopularEvents);

module.exports = router;