const mongoose = require("mongoose");
const Event = require("../../models/Event");
const User = require("../../models/User");
const Ticket = require("../../models/Ticket");
const TicketTier = require("../../models/TicketTier");
const Payment = require("../../models/Payment");
const Blog = require("../../models/blog");
const HttpStatusCode = require("../../utils/httpStatusCode");

// current-vs-previous-calendar-month % change, used for every "X% This
// Month" figure on the admin dashboard. previous === 0 is treated as
// +100% growth if there's any activity this month, 0% if there's none —
// avoids a divide-by-zero producing Infinity/NaN.
function getGrowthPercent(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

// Resolves the "This Week / This Month / This Year" dropdown on the admin
// dashboard widgets into a concrete calendar-aligned date range. Returns
// null for "all" (or an unrecognized value), meaning "no date filter".
function getPeriodRange(period) {
  const now = new Date();

  switch (period) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    case "week": {
      // Monday-start week containing `now`.
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    default:
      return null;
  }
}

class AnalyticsController {
  // platform-wide summary — admin dashboard landing numbers
  async getOverview(req, res) {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const [totalEvents, activeEvents, totalUsers] = await Promise.all([
        Event.countDocuments({ isDeleted: false }),
        Event.countDocuments({ status: "active", isDeleted: false }),
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

      const [pendingTicketsCount, cancelledTicketsCount, refundedTicketsCount] =
        await Promise.all([
          Ticket.countDocuments({ paymentStatus: "pending" }),
          Ticket.countDocuments({ cancelledAt: { $ne: null } }),
          Ticket.countDocuments({ refundedAmount: { $gt: 0 } }),
        ]);

      // "Available Tickets" — remaining inventory across every active
      // tier, platform-wide (capacity minus what's already sold).
      const [capacitySummary] = await TicketTier.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalAvailable: { $sum: "$quantityAvailable" },
            totalSold: { $sum: "$quantitySold" },
          },
        },
      ]);

      const totalAvailableTickets = capacitySummary
        ? capacitySummary.totalAvailable - capacitySummary.totalSold
        : 0;

      // This-month vs last-month counts, feeding the growth-% figures.
      const [
        eventsThisMonth,
        eventsLastMonth,
        usersThisMonth,
        usersLastMonth,
        ticketsThisMonth,
        ticketsLastMonth,
        revenueThisMonthResult,
        revenueLastMonthResult,
      ] = await Promise.all([
        Event.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfThisMonth },
        }),
        Event.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          createdAt: { $gte: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Ticket.countDocuments({
          paymentStatus: "paid",
          createdAt: { $gte: startOfThisMonth },
        }),
        Ticket.countDocuments({
          paymentStatus: "paid",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Payment.aggregate([
          { $match: { status: "paid", paidAt: { $gte: startOfThisMonth } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: "paid",
              paidAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

      const revenueThisMonth = revenueThisMonthResult[0]?.total || 0;
      const revenueLastMonth = revenueLastMonthResult[0]?.total || 0;

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
          totalAvailableTickets,
          cancelledTicketsCount,
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
          refundedTicketsCount,
          growth: {
            events: getGrowthPercent(eventsThisMonth, eventsLastMonth),
            users: getGrowthPercent(usersThisMonth, usersLastMonth),
            ticketsSold: getGrowthPercent(ticketsThisMonth, ticketsLastMonth),
            revenue: getGrowthPercent(revenueThisMonth, revenueLastMonth),
          },
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

  // stat tiles for the admin "Tickets Details" screen — Total/Booked/
  // Available/Cancelled, each with a current-vs-last-month growth %
  async getTicketStats(req, res) {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const [
        totalTickets,
        totalTicketsThisMonth,
        totalTicketsLastMonth,
        bookedTickets,
        bookedTicketsThisMonth,
        bookedTicketsLastMonth,
        cancelledTickets,
        cancelledTicketsThisMonth,
        cancelledTicketsLastMonth,
      ] = await Promise.all([
        Ticket.countDocuments({}),
        Ticket.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
        Ticket.countDocuments({
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Ticket.countDocuments({ paymentStatus: "paid", cancelledAt: null }),
        Ticket.countDocuments({
          paymentStatus: "paid",
          cancelledAt: null,
          createdAt: { $gte: startOfThisMonth },
        }),
        Ticket.countDocuments({
          paymentStatus: "paid",
          cancelledAt: null,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Ticket.countDocuments({ cancelledAt: { $ne: null } }),
        Ticket.countDocuments({
          cancelledAt: { $gte: startOfThisMonth },
        }),
        Ticket.countDocuments({
          cancelledAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
      ]);

      // "Available Tickets" is a live inventory gauge (capacity minus
      // sold), not something with a natural creation date to bucket by
      // month — so its growth is measured by how much fresh capacity
      // (new active tiers) was added this month vs last month instead.
      const [
        capacitySummary,
        capacityAddedThisMonth,
        capacityAddedLastMonth,
      ] = await Promise.all([
        TicketTier.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalAvailable: { $sum: "$quantityAvailable" },
              totalSold: { $sum: "$quantitySold" },
            },
          },
        ]),
        TicketTier.aggregate([
          {
            $match: {
              isActive: true,
              createdAt: { $gte: startOfThisMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$quantityAvailable" } } },
        ]),
        TicketTier.aggregate([
          {
            $match: {
              isActive: true,
              createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$quantityAvailable" } } },
        ]),
      ]);

      const availableTickets = capacitySummary[0]
        ? capacitySummary[0].totalAvailable - capacitySummary[0].totalSold
        : 0;

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          totalTickets,
          bookedTickets,
          availableTickets,
          cancelledTickets,
          growth: {
            totalTickets: getGrowthPercent(
              totalTicketsThisMonth,
              totalTicketsLastMonth,
            ),
            bookedTickets: getGrowthPercent(
              bookedTicketsThisMonth,
              bookedTicketsLastMonth,
            ),
            availableTickets: getGrowthPercent(
              capacityAddedThisMonth[0]?.total || 0,
              capacityAddedLastMonth[0]?.total || 0,
            ),
            cancelledTickets: getGrowthPercent(
              cancelledTicketsThisMonth,
              cancelledTicketsLastMonth,
            ),
          },
        },
      });
    } catch (error) {
      console.error("Get Ticket Stats Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // stat tiles for the admin "User Details" screen — Active/Inactive/
  // Total/New, each with a current-vs-last-month growth %
  async getUserStats(req, res) {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const [
        totalUsers,
        totalUsersThisMonth,
        totalUsersLastMonth,
        activeUsers,
        activeUsersThisMonth,
        activeUsersLastMonth,
        inactiveUsers,
        inactiveUsersThisMonth,
        inactiveUsersLastMonth,
      ] = await Promise.all([
        User.countDocuments({ role: "user", isDeleted: false }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          createdAt: { $gte: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        User.countDocuments({ role: "user", isDeleted: false, isActive: true }),
        // `isActive` has no dedicated "activated at" timestamp, so
        // `updatedAt` (bumped whenever the flag is toggled) stands in as
        // the period anchor — same convention used for ticket refunds.
        User.countDocuments({
          role: "user",
          isDeleted: false,
          isActive: true,
          updatedAt: { $gte: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          isActive: true,
          updatedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          isActive: false,
        }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          isActive: false,
          updatedAt: { $gte: startOfThisMonth },
        }),
        User.countDocuments({
          role: "user",
          isDeleted: false,
          isActive: false,
          updatedAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          newUsers: totalUsersThisMonth,
          growth: {
            totalUsers: getGrowthPercent(totalUsersThisMonth, totalUsersLastMonth),
            activeUsers: getGrowthPercent(activeUsersThisMonth, activeUsersLastMonth),
            inactiveUsers: getGrowthPercent(
              inactiveUsersThisMonth,
              inactiveUsersLastMonth,
            ),
            newUsers: getGrowthPercent(totalUsersThisMonth, totalUsersLastMonth),
          },
        },
      });
    } catch (error) {
      console.error("Get User Stats Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // stat tiles for the admin "Events Details" screen — Upcoming/Active/
  // Completed/Total, each with a current-vs-last-month growth %
  async getEventStats(req, res) {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );

      const [
        totalEvents,
        totalEventsThisMonth,
        totalEventsLastMonth,
        activeEvents,
        activeEventsThisMonth,
        activeEventsLastMonth,
        upcomingEvents,
        upcomingEventsThisMonth,
        upcomingEventsLastMonth,
        completedEvents,
        completedThisCalendarMonth,
        completedLastCalendarMonth,
      ] = await Promise.all([
        Event.countDocuments({ isDeleted: false }),
        Event.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfThisMonth },
        }),
        Event.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Event.countDocuments({ isDeleted: false, status: "active" }),
        Event.countDocuments({
          isDeleted: false,
          status: "active",
          createdAt: { $gte: startOfThisMonth },
        }),
        Event.countDocuments({
          isDeleted: false,
          status: "active",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Event.countDocuments({ isDeleted: false, date: { $gte: now } }),
        Event.countDocuments({
          isDeleted: false,
          date: { $gte: now },
          createdAt: { $gte: startOfThisMonth },
        }),
        Event.countDocuments({
          isDeleted: false,
          date: { $gte: now },
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Event.countDocuments({ isDeleted: false, date: { $lt: now } }),
        // "Completed" is inherently date-anchored (unlike the other three,
        // which grow by creation date) — its growth compares how many
        // events' dates fell within this calendar month vs last, i.e.
        // "wrapped up this month" vs "last month".
        Event.countDocuments({
          isDeleted: false,
          date: { $gte: startOfThisMonth, $lt: startOfNextMonth },
        }),
        Event.countDocuments({
          isDeleted: false,
          date: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          totalEvents,
          activeEvents,
          upcomingEvents,
          completedEvents,
          growth: {
            totalEvents: getGrowthPercent(totalEventsThisMonth, totalEventsLastMonth),
            activeEvents: getGrowthPercent(activeEventsThisMonth, activeEventsLastMonth),
            upcomingEvents: getGrowthPercent(
              upcomingEventsThisMonth,
              upcomingEventsLastMonth,
            ),
            completedEvents: getGrowthPercent(
              completedThisCalendarMonth,
              completedLastCalendarMonth,
            ),
          },
        },
      });
    } catch (error) {
      console.error("Get Event Stats Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // stat tiles for the admin "Blog Section" screen — Total/Published/
  // Drafted/Total Category, each with a current-vs-last-month growth %
  async getBlogStats(req, res) {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const [
        totalBlogs,
        totalBlogsThisMonth,
        totalBlogsLastMonth,
        publishedBlogs,
        publishedThisMonth,
        publishedLastMonth,
        draftedBlogs,
        draftedThisMonth,
        draftedLastMonth,
        categoriesAll,
        categoriesThisMonth,
        categoriesLastMonth,
      ] = await Promise.all([
        Blog.countDocuments({ isDeleted: false }),
        Blog.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfThisMonth },
        }),
        Blog.countDocuments({
          isDeleted: false,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Blog.countDocuments({ isDeleted: false, status: "Published" }),
        Blog.countDocuments({
          isDeleted: false,
          status: "Published",
          createdAt: { $gte: startOfThisMonth },
        }),
        Blog.countDocuments({
          isDeleted: false,
          status: "Published",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Blog.countDocuments({ isDeleted: false, status: "Draft" }),
        Blog.countDocuments({
          isDeleted: false,
          status: "Draft",
          createdAt: { $gte: startOfThisMonth },
        }),
        Blog.countDocuments({
          isDeleted: false,
          status: "Draft",
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
        Blog.distinct("category", { isDeleted: false }),
        // `category` is a free-text field, not a separate collection, so
        // "Total Blog Category" growth is measured by distinct category
        // *values used on blogs created* this month vs last — how many
        // categories got fresh content, not the size of the whole catalog.
        Blog.distinct("category", {
          isDeleted: false,
          createdAt: { $gte: startOfThisMonth },
        }),
        Blog.distinct("category", {
          isDeleted: false,
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          totalBlogs,
          publishedBlogs,
          draftedBlogs,
          totalCategories: categoriesAll.length,
          growth: {
            totalBlogs: getGrowthPercent(totalBlogsThisMonth, totalBlogsLastMonth),
            publishedBlogs: getGrowthPercent(publishedThisMonth, publishedLastMonth),
            draftedBlogs: getGrowthPercent(draftedThisMonth, draftedLastMonth),
            totalCategories: getGrowthPercent(
              categoriesThisMonth.length,
              categoriesLastMonth.length,
            ),
          },
        },
      });
    } catch (error) {
      console.error("Get Blog Stats Error:", error);

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

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

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
      // `period` (This Week/Month/Year, from the Sales Overview dropdown)
      // buckets by calendar boundaries; falling back to `days`, a rolling
      // N-day window bucketed daily, when no period is given.
      const range = getPeriodRange(req.query.period);
      const bucketFormat = req.query.period === "year" ? "%Y-%m" : "%Y-%m-%d";

      const days = Number(req.query.days) || 30;
      const since = range ? range.start : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const until = range ? range.end : null;

      const paidAtMatch = until
        ? { $gte: since, $lt: until }
        : { $gte: since };
      const refundedAtMatch = until
        ? { $gte: since, $lt: until }
        : { $gte: since };

      const [grossTrend, refundsByDay] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              status: "paid",
              paidAt: paidAtMatch,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: bucketFormat, date: "$paidAt" } },
              revenue: { $sum: "$amount" },
              ordersCount: { $sum: 1 },
            },
          },
        ]),
        // Refunds are dated by when the refund happened, not when the
        // original payment was made — a payment from last month can be
        // refunded today, and that refund should reduce *today's* net
        // figure, not last month's.
        Payment.aggregate([
          { $unwind: "$refunds" },
          { $match: { "refunds.refundedAt": refundedAtMatch } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: bucketFormat,
                  date: "$refunds.refundedAt",
                },
              },
              refunded: { $sum: "$refunds.amount" },
            },
          },
        ]),
      ]);

      const refundedByDate = refundsByDay.reduce((acc, entry) => {
        acc[entry._id] = entry.refunded;
        return acc;
      }, {});

      // Union of every date that had either gross revenue or a refund,
      // so a refund-only day still shows up in the trend.
      const allDates = new Set([
        ...grossTrend.map((entry) => entry._id),
        ...Object.keys(refundedByDate),
      ]);

      const grossByDate = grossTrend.reduce((acc, entry) => {
        acc[entry._id] = entry;
        return acc;
      }, {});

      const trend = [...allDates].sort().map((date) => {
        const gross = grossByDate[date];
        const refunded = refundedByDate[date] || 0;
        const revenue = gross?.revenue || 0;

        return {
          date,
          revenue,
          refunded,
          netRevenue: revenue - refunded,
          ordersCount: gross?.ordersCount || 0,
        };
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          period: req.query.period || null,
          days: range ? null : days,
          trend,
        },
      });
    } catch (error) {
      console.error("Get Revenue Trend Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // most recently created events + their tickets-sold/revenue, for the
  // admin dashboard's "Recent Events" table
  async getRecentEvents(req, res) {
    try {
      const limit = Number(req.query.limit) || 5;

      const events = await Event.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "tickets",
            let: { eventId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$eventId", "$$eventId"] },
                  paymentStatus: "paid",
                },
              },
              {
                $group: {
                  _id: null,
                  ticketsSold: { $sum: 1 },
                  revenue: { $sum: "$priceAtPurchase" },
                },
              },
            ],
            as: "ticketStats",
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            location: 1,
            date: 1,
            banner: 1,
            status: 1,
            ticketsSold: {
              $ifNull: [{ $arrayElemAt: ["$ticketStats.ticketsSold", 0] }, 0],
            },
            revenue: {
              $ifNull: [{ $arrayElemAt: ["$ticketStats.revenue", 0] }, 0],
            },
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Get Recent Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // events ranked by tickets sold, for the admin dashboard's "Top Events"
  // list
  async getTopEvents(req, res) {
    try {
      const limit = Number(req.query.limit) || 5;

      const events = await Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: "$eventId",
            ticketsSold: { $sum: 1 },
            revenue: { $sum: "$priceAtPurchase" },
          },
        },
        { $sort: { ticketsSold: -1 } },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $match: { "event.isDeleted": false } },
        { $limit: limit },
        {
          $project: {
            _id: "$event._id",
            title: "$event.title",
            location: "$event.location",
            date: "$event.date",
            banner: "$event.banner",
            ticketsSold: 1,
            revenue: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Get Top Events Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Sold/Pending/Cancelled/Refunded counts for the admin dashboard's
  // "Tickets Overview" donut, scoped to the period picked in its dropdown
  // (Today / This Week / This Month / This Year / All).
  async getTicketsOverview(req, res) {
    try {
      const range = getPeriodRange(req.query.period);
      const createdWindow = range
        ? { $gte: range.start, $lt: range.end }
        : undefined;

      const [sold, pending, cancelled, refunded] = await Promise.all([
        Ticket.countDocuments({
          paymentStatus: "paid",
          ...(createdWindow && { createdAt: createdWindow }),
        }),
        Ticket.countDocuments({
          paymentStatus: "pending",
          ...(createdWindow && { createdAt: createdWindow }),
        }),
        Ticket.countDocuments({
          cancelledAt: range
            ? { $gte: range.start, $lt: range.end }
            : { $ne: null },
        }),
        // Tickets don't carry their own refundedAt — `updatedAt` is bumped
        // when a refund is applied, so it's used as the period anchor here.
        Ticket.countDocuments({
          refundedAmount: { $gt: 0 },
          ...(range && { updatedAt: { $gte: range.start, $lt: range.end } }),
        }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          period: req.query.period || "all",
          sold,
          pending,
          cancelled,
          refunded,
          total: sold + pending + cancelled + refunded,
        },
      });
    } catch (error) {
      console.error("Get Tickets Overview Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // breakdown of paid revenue by how the user actually paid (UPI, card,
  // netbanking, wallet — whatever Razorpay reports back on capture)
  async getPaymentMethodBreakdown(req, res) {
    try {
      const breakdown = await Payment.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$method",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { totalAmount: -1 } },
        {
          $project: {
            _id: 0,
            method: { $ifNull: ["$_id", "unknown"] },
            count: 1,
            totalAmount: 1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      console.error("Get Payment Method Breakdown Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLIC — the homepage hero stats ("500+ Events", "50K+ Happy Users",
  // "100+ Secure Booking"). Deliberately unauthenticated, unlike every
  // other endpoint in this file; kept here anyway since it reuses the
  // same count-based approach as the admin stats above.
  async getPublicStats(req, res) {
    try {
      const [totalEvents, totalUsers, securePayments] = await Promise.all([
        Event.countDocuments({ isDeleted: false, status: "active" }),
        User.countDocuments({ role: "user" }),
        Payment.countDocuments({ status: "paid" }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: { totalEvents, totalUsers, securePayments },
      });
    } catch (error) {
      console.error("Get Public Stats Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AnalyticsController();
