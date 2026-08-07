const mongoose = require("mongoose");
const Event = require("../../models/Event");
const User = require("../../models/User");
const Ticket = require("../../models/Ticket");
const TicketTier = require("../../models/TicketTier");
const Payment = require("../../models/Payment");
const HttpStatusCode = require("../../utils/httpStatusCode");

class AnalyticsController {
  // platform-wide summary — admin dashboard landing numbers
  async getOverview(req, res) {
    try {
      const [totalEvents, activeEvents, totalUsers] = await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ status: "active" }),
        User.countDocuments({ role: "user" }),
      ]);

      const [ticketStats] = await Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            totalTicketsSold: { $sum: 1 },
            totalRevenue: { $sum: "$priceAtPurchase" },
            totalCheckedIn: {
              $sum: { $cond: ["$checkedIn", 1, 0] },
            },
            totalRefunded: { $sum: "$refundedAmount" },
          },
        },
      ]);

      const pendingTicketsCount = await Ticket.countDocuments({
        paymentStatus: "pending",
      });

      const summary = ticketStats || {
        totalTicketsSold: 0,
        totalRevenue: 0,
        totalCheckedIn: 0,
        totalRefunded: 0,
      };

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          totalEvents,
          activeEvents,
          inactiveEvents: totalEvents - activeEvents,
          totalUsers,
          totalTicketsSold: summary.totalTicketsSold,
          totalRevenue: summary.totalRevenue,
          totalRefunded: summary.totalRefunded,
          netRevenue: summary.totalRevenue - summary.totalRefunded,
          totalCheckedIn: summary.totalCheckedIn,
          checkInRate:
            summary.totalTicketsSold > 0
              ? Number(
                  (
                    (summary.totalCheckedIn / summary.totalTicketsSold) *
                    100
                  ).toFixed(1),
                )
              : 0,
          pendingTicketsCount,
        },
      });
    } catch (error) {
      console.error("Get Overview Analytics Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // detailed breakdown for a single event — tier-wise sales + check-in stats
  async getEventAnalytics(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const tierBreakdown = await Ticket.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: "$tierId",
            ticketsSold: { $sum: 1 },
            revenue: { $sum: "$priceAtPurchase" },
            checkedIn: { $sum: { $cond: ["$checkedIn", 1, 0] } },
            refunded: { $sum: "$refundedAmount" },
          },
        },
        {
          $lookup: {
            from: "tickettiers",
            localField: "_id",
            foreignField: "_id",
            as: "tier",
          },
        },
        { $unwind: "$tier" },
        {
          $project: {
            _id: 0,
            tierId: "$tier._id",
            tierName: "$tier.name",
            price: "$tier.price",
            quantityAvailable: "$tier.quantityAvailable",
            quantitySold: "$tier.quantitySold",
            ticketsSold: 1,
            revenue: 1,
            checkedIn: 1,
            refunded: 1,
          },
        },
        { $sort: { tierName: 1 } },
      ]);

      const [statusCounts] = await Ticket.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: null,
            paid: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
              },
            },
            cancelled: {
              $sum: { $cond: [{ $ifNull: ["$cancelledAt", false] }, 1, 0] },
            },
            checkedIn: { $sum: { $cond: ["$checkedIn", 1, 0] } },
          },
        },
      ]);

      const totals = tierBreakdown.reduce(
        (acc, tier) => ({
          ticketsSold: acc.ticketsSold + tier.ticketsSold,
          revenue: acc.revenue + tier.revenue,
          checkedIn: acc.checkedIn + tier.checkedIn,
          refunded: acc.refunded + tier.refunded,
        }),
        { ticketsSold: 0, revenue: 0, checkedIn: 0, refunded: 0 },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          event: {
            _id: event._id,
            title: event.title,
            date: event.date,
            status: event.status,
          },
          totals: {
            ...totals,
            netRevenue: totals.revenue - totals.refunded,
            checkInRate:
              totals.ticketsSold > 0
                ? Number(
                    ((totals.checkedIn / totals.ticketsSold) * 100).toFixed(1),
                  )
                : 0,
          },
          statusCounts: statusCounts || {
            paid: 0,
            pending: 0,
            cancelled: 0,
            checkedIn: 0,
          },
          tierBreakdown,
        },
      });
    } catch (error) {
      console.error("Get Event Analytics Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // daily revenue trend across all events, based on when payments were
  // actually confirmed (Payment.paidAt), not when tickets were reserved
  async getRevenueTrend(req, res) {
    try {
      const days = Number(req.query.days) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const trend = await Payment.aggregate([
        {
          $match: {
            status: "paid",
            paidAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
            revenue: { $sum: "$amount" },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1,
            ordersCount: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: { days, trend },
      });
    } catch (error) {
      console.error("Get Revenue Trend Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AnalyticsController();
