require("dotenv").config();

const mongoose = require("mongoose");

require("node:dns/promises").setServers(["1.1.1.1"]);

const DatabaseConnection = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("Database connected successfully.");

  } catch (error) {

    console.error("Database connection failed:", error.message);

    process.exit(1);
  }
};

module.exports = DatabaseConnection;
