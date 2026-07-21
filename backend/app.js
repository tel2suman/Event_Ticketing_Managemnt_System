require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const DatabaseConnection = require("./app/config/db");
const corsOptions = require("./app/utils/corsOrigin");
const appRoutes = require("./app/routes/api/index");
const { globalLimiter } = require("./app/utils/limiter");
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
app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Parse cookies attached to incoming requests.
app.use(cookieParser());

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

const PORT = process.env.PORT || 3009;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
