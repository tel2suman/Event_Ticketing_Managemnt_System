const express = require("express");

const router = express.Router();

//defining routes
const authRoutes = require("./authRoutes");

const eventRoutes = require("./eventRoutes");

const userRoutes = require("./userRoutes");

const categoryRoutes = require("./categoryRoutes");

router.use("/api/v1/auth", authRoutes);

router.use("/api/v2/event", eventRoutes);

router.use("/api/v1/user", userRoutes);

router.use("/api/v2/category", categoryRoutes);

module.exports = router;
