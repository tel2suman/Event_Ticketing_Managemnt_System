const allowedOrigins = [
  "http://localhost:6000",
  "http://localhost:6000",
  "https://your-production-domain.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // if you need to allow cookies
};

module.exports = corsOptions;
