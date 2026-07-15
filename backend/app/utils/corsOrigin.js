const allowedOrigins = [
  "http://localhost:6000",
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, including Postman and curl.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Request blocked by CORS policy."));
  },

  credentials: true,
};

module.exports = corsOptions;
