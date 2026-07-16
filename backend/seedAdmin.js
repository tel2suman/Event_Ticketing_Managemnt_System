require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const DatabaseConnection = require("./app/config/db");
const User = require("./app/models/User");
const SeedAdmin = async () => {
  try {
    await DatabaseConnection();

    if (
      !process.env.ADMIN_NAME ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error(
        "Admin seed credentials are missing from the environment configuration.",
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");

      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await User.create({
      name: process.env.ADMIN_NAME,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin seeding failed:", error.message);

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

SeedAdmin();
