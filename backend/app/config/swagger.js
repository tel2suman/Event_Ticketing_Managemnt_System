const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

// The spec is generated from the @swagger JSDoc comments living above each
// route in app/routes/api/*.js — keep those in lockstep with the Postman
// collection at the repo root; both should describe the same set of routes.
const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Event Ticketing & Management System - Backend API",
    version: "1.0.0",
    description:
      "REST API for the Event Ticketing & Management System (Node.js/Express + MongoDB): auth (incl. Google OAuth), events, categories, cart, wishlist, ticket tiers, tickets, payments/Razorpay, blog, newsletter, contact, analytics.\n\nThis document is kept in lockstep with the Postman collection `Event Ticketing & Management System - Backend API.postman_collection.json` in the repo root — both should always describe the same set of routes.\n\nMost routes require a Bearer access token obtained from **Auth > Login**. Admin-only routes are noted in their descriptions.",
    contact: {
      name: "Event Ticketing & Management System",
    },
  },
  servers: [
    {
      url: "http://localhost:5050",
      description: "Local development",
    },
    {
      url: "https://event-ticketing-managemnt-system.onrender.com",
      description: "OnRender development",
    },
  ],
  tags: [
    {
      name: "Auth",
      description:
        "Registration, login, email verification, password reset/change, token refresh, profile, Google OAuth.",
    },
    {
      name: "Category",
      description: "Event category management — mostly admin-only.",
    },
    {
      name: "Event",
      description:
        "Event CRUD. Create/Update are multipart/form-data (banner upload) and admin-only; listing/detail are public or auth-only.",
    },
    {
      name: "User",
      description: "Self-service profile management + admin user management.",
    },
    { name: "Cart", description: "Shopping cart for events." },
    { name: "Wishlist", description: "Saved/favorited events." },
    {
      name: "Ticket Tier",
      description:
        "Pricing tiers per event (e.g. VIP/General) — admin-managed, publicly readable.",
    },
    {
      name: "Ticket",
      description:
        "Ticket purchase (reservation), user dashboard, cancellation, admin QR/manual check-in, event sales report.",
    },
    {
      name: "Payment",
      description:
        "Razorpay order creation, payment verification, webhook, refunds.",
    },
    {
      name: "Blog",
      description:
        "Blog CRUD + editorial workflow (draft/publish/schedule/trash/restore).",
    },
    { name: "Newsletter", description: "Newsletter subscription management." },
    {
      name: "Contact",
      description: "Public-facing contact form submission + message history.",
    },
    {
      name: "Analytics",
      description:
        "Admin dashboard analytics: overview, per-event, revenue trend.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      SuccessMessage: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6a5a5b9a37cbad0267036474" },
          name: { type: "string", example: "Geeta Roy" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] },
          provider: { type: "string", enum: ["local", "google"] },
          avatar: { type: "string" },
          isEmailVerified: { type: "boolean" },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          categoryName: { type: "string", example: "Standup Comedy" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Event: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          categoryId: { type: "string" },
          categoryName: { type: "string" },
          location: { type: "string" },
          date: { type: "string", format: "date" },
          time: { type: "string", example: "18:00" },
          organizer: { type: "string" },
          banner: { type: "string", format: "uri" },
          status: { type: "string", enum: ["active", "inactive"] },
          createdBy: { $ref: "#/components/schemas/User" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TicketTier: {
        type: "object",
        properties: {
          _id: { type: "string" },
          eventId: { type: "string" },
          name: { type: "string", example: "VIP" },
          price: { type: "number", example: 2000 },
          quantityAvailable: { type: "integer", example: 100 },
          quantitySold: { type: "integer", example: 0 },
          benefits: { type: "array", items: { type: "string" } },
          isActive: { type: "boolean" },
          createdBy: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          eventId: { type: "string" },
          tierId: { type: "string" },
          orderId: { type: "string" },
          ticketCode: { type: "string" },
          qrCodeUrl: { type: "string", format: "uri" },
          priceAtPurchase: { type: "number" },
          paymentStatus: {
            type: "string",
            enum: ["pending", "paid", "failed"],
          },
          checkedIn: { type: "boolean" },
          checkedInAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          refundedAmount: { type: "number" },
          purchasedAt: { type: "string", format: "date-time" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          orderId: { type: "string" },
          userId: { type: "string" },
          eventId: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", example: "INR" },
          method: { type: "string", nullable: true },
          razorpayOrderId: { type: "string" },
          razorpayPaymentId: { type: "string", nullable: true },
          razorpaySignature: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["created", "paid", "failed", "refunded"],
          },
          paidAt: { type: "string", format: "date-time", nullable: true },
          failureReason: { type: "string", nullable: true },
          refundId: { type: "string", nullable: true },
          refundedAt: { type: "string", format: "date-time", nullable: true },
          refunds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ticketId: { type: "string" },
                razorpayRefundId: { type: "string" },
                amount: { type: "number" },
                refundedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          eventId: { type: "string" },
          quantity: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WishlistItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          eventId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Blog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          featuredImage: {
            type: "object",
            properties: {
              url: { type: "string", format: "uri" },
              public_id: { type: "string" },
            },
          },
          category: { type: "string" },
          status: { type: "string", enum: ["Draft", "Published", "Scheduled"] },
          publishDate: { type: "string", format: "date-time", nullable: true },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ContactMessage: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          message: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "MongoDB ObjectId (24-char hex)",
      },
    },
    responses: {
      BadRequest: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Missing/invalid/expired access token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Forbidden: {
        description:
          "Authenticated but not allowed to perform this action (e.g. non-admin, not the owner)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Conflict: {
        description:
          "Conflict with current state (e.g. duplicate, already exists)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      ServerError: {
        description: "Unexpected server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerDocument = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [path.join(__dirname, "../routes/api/*.js").split(path.sep).join("/")],
});

module.exports = swaggerDocument;
