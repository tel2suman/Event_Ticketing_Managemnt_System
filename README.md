# Event Ticketing & Management System

A backend API for an Event Ticketing & Management System built with Node.js, Express.js, MongoDB, and Mongoose. The system allows users to browse events, search and filter events, add events to cart or wishlist, complete bookings, and manage tickets. Admin users can manage event categories, events, bookings, payments, and platform activity.

The project is designed as a REST API with modular routes, controllers, models, middleware, and Joi-based request validation.

## Features

### User Features

- User registration and login
- JWT-based authentication
- Browse all events with pagination
- Search events by title, location, and date
- Filter events by category name
- View event details
- Add events to cart
- View cart items with event details
- Update ticket quantity in cart
- Remove events from cart
- Clear cart
- Add events to wishlist
- View wishlist with event details
- Remove events from wishlist
- Checkout and booking flow
- Payment integration support
- QR-based ticket generation support
- View booking and ticket history

### Admin Features

- Admin authentication and authorization
- Create, update, delete, and view categories
- Create, update, delete, and view events
- Manage event status
- View users
- View bookings
- View payment records
- Track ticket purchases
- Dashboard-ready APIs for reporting and analytics

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT
- **Validation:** Joi
- **Password Hashing:** bcrypt
- **File Uploads:** Multer or cloud upload provider
- **Payments:** Stripe or Razorpay integration support
- **Ticketing:** QR code generation support
- **Environment Config:** dotenv
- **API Testing:** Postman

## Project Structure

```text
event-ticketing-management-system/
|-- app/
|   |-- controllers/
|   |   `-- api/
|   |       |-- authController.js
|   |       |-- userController.js
|   |       |-- eventController.js
|   |       |-- categoryController.js
|   |       |-- cartController.js
|   |       |-- wishlistController.js
|   |       |-- contactController.js
|   |       |-- newsletterController.js
|   |       |-- ticketTierController.js
|   |       |-- ticketController.js
|   |       |-- paymentController.js
|   |       `-- analyticsController.js
|   |-- middlewares/
|   |   |-- authMiddleware.js
|   |   |-- adminMiddleware.js
|   |   |-- validationMiddleware.js
|   |   `-- uploadMiddleware.js
|   |-- models/
|   |   |-- User.js
|   |   |-- Event.js
|   |   |-- Category.js
|   |   |-- Cart.js
|   |   |-- Wishlist.js
|   |   |-- Booking.js
|   |   |-- Payment.js
|   |   `-- Ticket.js
|   |-- routes/
|   |   `-- api/
|   |       |-- authRoutes.js
|   |       |-- userRoutes.js
|   |       |-- eventRoutes.js
|   |       |-- categoryRoutes.js
|   |       |-- cartRoutes.js
|   |       |-- wishlistRoutes.js
|   |       |-- contactRoutes.js
|   |       |-- newsletterRoutes.js
|   |       |-- ticketTierRoutes.js
|   |       |-- ticketRoutes.js
|   |       |-- paymentRoutes.js
|   |       `-- analyticsRoutes.js
|   |-- utils/
|   |   |-- httpStatusCode.js
|   |   |-- generateToken.js
|   |   `-- qrCode.js
|   `-- validations/
|       |-- authValidation.js
|       |-- eventValidation.js
|       |-- categoryValidation.js
|       |-- cartValidation.js
|       |-- wishlistValidation.js
|       |-- ticketTierValidation.js
|       `-- ticketValidation.js
|-- config/
|   `-- database.js
|-- uploads/
|-- .env
|-- .gitignore
|-- package.json
|-- server.js
`-- README.md
```

## API Modules

The application mounts the main API modules using these base routes:

```js
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/contact", contactRoutes);
router.use("/api/v1/newsletter", newsletterRoutes);
router.use("/api/v1/event", eventRoutes);
router.use("/api/v1/user", userRoutes);
router.use("/api/v1/category", categoryRoutes);
router.use("/api/v1/cart", cartRoutes);
router.use("/api/v1/wishlist", wishListRoutes);
router.use("/api/v1/ticket-tier", ticketTierRoutes);
router.use("/api/v2/ticket", ticketRoutes);
router.use("/api/v2/payment", paymentRoutes);
router.use("/api/v2/analytics", analyticsRoutes);
```

### Authentication Module

Handles account access and secure authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login user and return token |
| `GET` | `/api/v1/auth/profile` | Get authenticated user profile |

### Contact Module

Handles contact form messages and user inquiries.

| Base Route | Description |
| --- | --- |
| `/api/v1/contact` | Contact form and inquiry APIs |

### Newsletter Module

Handles newsletter subscriptions and subscriber management.

| Base Route | Description |
| --- | --- |
| `/api/v1/newsletter` | Newsletter subscription APIs |

### User Module

Handles user profile and user-related operations.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/user/profile` | Get logged-in user profile |
| `PUT` | `/api/v1/user/update-profile` | Update logged-in user profile |
| `GET` | `/api/v1/user/all-users` | Get all users for admin |

### Category Module

Handles event category management.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/category/create-category` | Create category |
| `GET` | `/api/v1/category/all-categories` | Get all categories |
| `GET` | `/api/v1/category/:categoryId` | Get category by ID |
| `PUT` | `/api/v1/category/update-category/:categoryId` | Update category |
| `DELETE` | `/api/v1/category/delete-category/:categoryId` | Delete category |

### Event Module

Handles event listing, searching, filtering, and management.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/event/create-event` | Create a new event |
| `GET` | `/api/v1/event/all-events?page=1&limit=10` | Get all events with pagination |
| `GET` | `/api/v1/event/:eventId` | Get event details |
| `PUT` | `/api/v1/event/update-event/:eventId` | Update event |
| `DELETE` | `/api/v1/event/delete-event/:eventId` | Delete event |
| `GET` | `/api/v1/event/search-events?title=&location=&date=` | Search events |
| `GET` | `/api/v1/event/filter-events?categoryName=Live%20Music` | Filter events by category name |

### Cart Module

Handles temporary ticket selections before checkout.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/cart/add-to-cart` | Add event to cart |
| `GET` | `/api/v1/cart/my-cart` | Get authenticated user's cart |
| `PUT` | `/api/v1/cart/update-cart/:cartId` | Update ticket quantity |
| `DELETE` | `/api/v1/cart/remove-cart/:cartId` | Remove event from cart |
| `DELETE` | `/api/v1/cart/clear-cart` | Clear cart |

### Wishlist Module

Handles saved events for later.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/wishlist/add-to-wishlist` | Add event to wishlist |
| `GET` | `/api/v1/wishlist/my-wishlist` | Get authenticated user's wishlist |
| `DELETE` | `/api/v1/wishlist/remove-from-wishlist/:wishlistId` | Remove event from wishlist |

### Ticket Tier Module

Handles event ticket pricing tiers, ticket quantity rules, and ticket category options.

| Base Route | Description |
| --- | --- |
| `/api/v1/ticket-tier` | Ticket tier management APIs |

### Ticket Module

Handles issued tickets, ticket booking records, and QR verification.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v2/ticket/my-tickets` | Get authenticated user's tickets |
| `GET` | `/api/v2/ticket/:ticketId` | Get ticket details |
| `POST` | `/api/v2/ticket/verify-qr` | Verify ticket QR code |

### Payment Module

Handles payment initialization, verification, and records.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v2/payment/create-payment` | Create Razorpay order or payment request |
| `POST` | `/api/v2/payment/verify-payment` | Verify payment status |
| `GET` | `/api/v2/payment/my-payments` | Get authenticated user's payments |
| `GET` | `/api/v2/payment/all-payments` | Get all payments for admin |

### Analytics Module

Handles dashboard metrics, reporting, and admin analytics.

| Base Route | Description |
| --- | --- |
| `/api/v2/analytics` | Analytics and reporting APIs |

## MongoDB Collections

### users

Stores registered user and admin accounts.

```js
{
  name: String,
  email: String,
  password: String,
  phone: String,
  role: "user" | "admin",
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date
}
```

### categories

Stores event category data.

```js
{
  categoryName: String,
  description: String,
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date
}
```

### events

Stores event information.

```js
{
  title: String,
  description: String,
  categoryId: ObjectId,
  location: String,
  date: Date,
  time: String,
  organizer: String,
  banner: String,
  price: Number,
  totalTickets: Number,
  availableTickets: Number,
  status: "active" | "inactive" | "cancelled",
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### carts

Stores events selected by users before checkout.

```js
{
  userId: ObjectId,
  eventId: ObjectId,
  quantity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### wishlists

Stores events saved by users.

```js
{
  userId: ObjectId,
  eventId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Recommended unique index:

```js
{ userId: 1, eventId: 1 }
```

### bookings

Stores confirmed booking records.

```js
{
  userId: ObjectId,
  eventId: ObjectId,
  paymentId: ObjectId,
  quantity: Number,
  totalAmount: Number,
  bookingStatus: "pending" | "confirmed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

### payments

Stores payment records.

```js
{
  userId: ObjectId,
  bookingId: ObjectId,
  amount: Number,
  currency: String,
  paymentGateway: String,
  transactionId: String,
  paymentStatus: "pending" | "success" | "failed" | "refunded",
  createdAt: Date,
  updatedAt: Date
}
```

### tickets

Stores generated ticket and QR data.

```js
{
  userId: ObjectId,
  eventId: ObjectId,
  bookingId: ObjectId,
  ticketNumber: String,
  qrCode: String,
  isUsed: Boolean,
  usedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Event Workflow

```text
Admin creates category
        |
Admin creates event
        |
User browses/searches/filters events
        |
User adds event to cart or wishlist
        |
User checks out from cart
        |
Payment is created and verified
        |
Booking is confirmed
        |
Ticket and QR code are generated
```

## QR Ticketing Workflow

```text
Booking confirmed
        |
Generate unique ticket number
        |
Generate QR code with ticket data
        |
Store ticket record
        |
User presents QR at event
        |
Admin verifies QR
        |
Ticket marked as used
```

## Payment Workflow

```text
User checks out
        |
Create payment order or payment intent
        |
User completes payment
        |
Verify payment response
        |
Create payment record
        |
Confirm booking
        |
Generate ticket
```

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd event-ticketing-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the project root and add the required environment variables.

```bash
cp .env.example .env
```

### 4. Start MongoDB

Use a local MongoDB server or a MongoDB Atlas connection string.

### 5. Run the project

```bash
npm run dev
```

## Environment Variables

```env
PORT=
NODE_ENV=

MONGODB_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

ADMIN_EMAIL=admin-eventara@yopmail.com

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=

# JWT
# Generate secure secret keys using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=

ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Application
APP_BASE_URL=
```

Fill these values according to your local, staging, or production environment. Keep token secrets, email passwords, Cloudinary keys, Google OAuth credentials, and Razorpay keys private.

## Scripts

Common `package.json` scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

## Request Validation

The project uses Joi to validate request data from:

- `req.body`
- `req.params`
- `req.query`

Example middleware usage:

```js
validationMiddleware.validate(schema, "body");
validationMiddleware.validate(schema, "params");
validationMiddleware.validate(schema, "query");
```

For newer Express versions, avoid directly replacing `req.query` because it may be read-only. Merge validated query values instead:

```js
Object.assign(req.query, value);
```

## Pagination Response Example

```json
{
  "success": true,
  "message": "Events fetched successfully",
  "pagination": {
    "totalRecords": 45,
    "currentPage": 1,
    "totalPages": 5,
    "perPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "data": []
}
```

## Authentication & Authorization

Protected routes require a valid JWT token.

```http
Authorization: Bearer <token>
```

Admin-only routes should use both authentication and role authorization middleware.

```js
router.post(
  "/create-event",
  AuthMiddleware,
  AdminMiddleware,
  EventController.createEvent
);
```

## Future Enhancements

- Seat selection for events with venue layouts
- Coupon and discount code support
- Refund management
- Event reviews and ratings
- Email and SMS ticket delivery
- Calendar integration for booked events
- Real-time ticket availability updates
- Admin analytics dashboard
- Event check-in dashboard
- QR scanner interface for event staff
- Multi-vendor organizer support
- Notification system for event updates
- Recurring events
- Waitlist management for sold-out events
- Social sharing for event pages

## License

This project is intended for learning and development purposes. Add a license file before using it in production or distributing it publicly.
