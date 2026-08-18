const express = require("express");

const router = express.Router();

// defining routes
const authRoutes = require("./authRoutes");

const contactRoutes = require("./contactRoutes");

const newsletterRoutes = require("./newsletterRoutes");

const eventRoutes = require("./eventRoutes");

const ratingRoutes = require("./ratingRoutes");

const likeRoutes = require("./likeRoutes");

const userRoutes = require("./userRoutes");

const blogRouter = require("./blogRoutes");

const categoryRoutes = require("./categoryRoutes");

const cartRoutes = require("./cartRoutes");

const wishListRoutes = require("./wishlistRoutes");

const ticketTierRoutes = require("./ticketTierRoutes");

const ticketRoutes = require("./ticketRoutes");

const paymentRoutes = require("./paymentRoutes");

const analyticsRoutes = require("./analyticsRoutes");

const couponRoutes = require("./couponRoutes");

router.use("/api/v1/auth", authRoutes);

router.use("/api/v1/blog", blogRouter);

router.use("/api/v1/contact", contactRoutes);

router.use("/api/v1/newsletter", newsletterRoutes);

router.use("/api/v1/event", eventRoutes);

router.use("/api/v1/rating", ratingRoutes);

router.use("/api/v1/like", likeRoutes);

router.use("/api/v1/user", userRoutes);

router.use("/api/v1/category", categoryRoutes);

router.use("/api/v1/cart", cartRoutes);

router.use("/api/v1/wishlist", wishListRoutes);

router.use("/api/v1/ticket-tier", ticketTierRoutes);

router.use("/api/v2/ticket", ticketRoutes);

router.use("/api/v2/payment", paymentRoutes);

router.use("/api/v2/analytics", analyticsRoutes);

router.use("/api/v2/coupon", couponRoutes);

module.exports = router;
