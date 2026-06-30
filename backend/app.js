require("dotenv").config();

const express = require("express");

const path = require("path");

const app = express();

const cors = require("cors");

const morgan = require("morgan");

const helmet = require("helmet");

const session = require("express-session");

const cookieParser = require("cookie-parser");

const rateLimit = require("./app/utils/limiter");

const corsOptions = require("./app/utils/corsOrigin");

//database connection
const DatabaseConnection = require("./app/config/dbconn");

DatabaseConnection();

app.use(cors(corsOptions));

app.use(morgan("dev"));

app.use(
  helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
  }),
);

//static files
app.use(express.static(path.join(__dirname, "public")));
app.use("uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/uploads", express.static("uploads"));

//define json
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// session & cookie storage
app.use(cookieParser());

// Apply the rate limiting middleware to all requests.
app.use(rateLimit);

app.use(
  session({
    secret: "keyboardcat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

//define routes
//app.use(require('./app/routes/index'));

const port = 6000;

app.listen(port, () => {
  console.log("server is running on port", port);
});