require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const passport = require("./app/config/passport");
const DatabaseConnection = require("./app/config/db");
const corsOptions = require("./app/utils/corsOrigin");
const appRoutes = require("./app/routes/api/index");
const { globalLimiter } = require("./app/utils/limiter");
const startCronJobs = require("./app/cron");
const HttpStatusCode = require("./app/utils/httpStatusCode");
const app = express();

// Establish the MongoDB database connection.
DatabaseConnection();

// Apply HTTP security headers.
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Configure cross-origin resource sharing.
app.use(cors(corsOptions));

// Apply global request rate limiting.
app.use(globalLimiter);

// Log HTTP requests in the development environment.
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Parse JSON and URL-encoded request bodies.
// The `verify` callback stashes the raw, unparsed body onto req.rawBody —
// needed because Razorpay's webhook signature is computed over the exact
// raw bytes it sent, not over our re-serialized JSON object.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Parse cookies attached to incoming requests.
app.use(cookieParser());

app.use(passport.initialize());

// Serve application static assets.
app.use(express.static(path.join(__dirname, "public")));

// Serve locally uploaded files.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Event booking API Running Successfully",
  });
});

// Register backend authentication routes.
app.use(appRoutes);

// Handle requests made to undefined application routes.
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Handle errors thrown by middleware (e.g. multer file upload failures)
// so they return the app's standard JSON error format instead of an
// Express default HTML error page. Must have 4 parameters to be
// recognized by Express as error-handling middleware.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "File is too large. Maximum allowed size is 5MB.",
      });
    }

    return res.status(HttpStatusCode.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  // The custom fileFilter in CloudinaryImageUpload.js rejects
  // disallowed file types by calling callback(new Error(...)),
  // which surfaces here as a plain Error, not a MulterError.
  if (err.message && err.message.includes("Only JPG, JPEG, PNG, and WEBP")) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Unhandled application error:", err);

  return res.status(HttpStatusCode.SERVER_ERROR).json({
    success: false,
    message: "Something went wrong.",
  });
});

const PORT = process.env.PORT || 3009;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startCronJobs();
});
