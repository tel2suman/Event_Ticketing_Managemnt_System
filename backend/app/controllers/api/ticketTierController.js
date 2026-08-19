const mongoose = require("mongoose");
const TicketTier = require("../../models/TicketTier");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");
const {
  refundAllTicketsForTier,
} = require("../../utils/refundAllTicketsForTier");

class TicketTierController {
  // create ticket tier
  async createTicketTier(req, res) {
    try {
      const {
        eventId,
        name,
        price,
        description,
        quantityAvailable,
        // benefits, refundPolicyOverride — not in the current "Add Ticket
        // Tier" form, commented out until the UI adds them back.
        hasAssignedSeating,
        seatLabels,
        saleStart,
        saleEnd,
      } = req.body;

      // Check event exists
      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const existingTier = await TicketTier.findOne({
        eventId,
        name: name.trim(),
      });

      if (existingTier) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "A ticket tier with this name already exists for this event",
        });
      }

      // For an assigned-seating tier, quantityAvailable is derived from
      // the seat list itself rather than entered separately — one seat
      // label, one unit of capacity.
      const seats = hasAssignedSeating
        ? [...new Set(seatLabels)].map((label) => ({ label, status: "available" }))
        : [];

      if (hasAssignedSeating && seats.length !== seatLabels.length) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "seatLabels contains duplicate seat labels",
        });
      }

      const ticketTier = await TicketTier.create({
        eventId,
        name: name.trim(),
        price,
        description: description || "",
        quantityAvailable: hasAssignedSeating ? seats.length : quantityAvailable,
        // benefits and refundPolicyOverride left at their schema defaults
        // ([]) — not settable from the current "Add Ticket Tier" form.
        hasAssignedSeating: !!hasAssignedSeating,
        seats,
        saleStart: saleStart || null,
        saleEnd: saleEnd || null,
        createdBy: req.user._id,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Ticket tier created successfully",
        data: ticketTier,
      });
    } catch (error) {
      console.error("Create Ticket Tier Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // update ticket tier
  async updateTicketTier(req, res) {
    try {
      const { tierId } = req.params;

      const tierExists = await TicketTier.findById(tierId);

      if (!tierExists) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found",
        });
      }

      const {
        name,
        price,
        description,
        // quantityAvailable, benefits, refundPolicyOverride — not in the
        // current "Update Ticket Tier" form, commented out until the UI
        // adds them back.
        saleStart,
        saleEnd,
      } = req.body;

      // If renaming, make sure the new name isn't already used in this event
      if (name && name.trim() !== tierExists.name) {
        const duplicateTier = await TicketTier.findOne({
          eventId: tierExists.eventId,
          name: name.trim(),
          _id: { $ne: tierId },
        });

        if (duplicateTier) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message:
              "A ticket tier with this name already exists for this event",
          });
        }
      }

      const ticketTier = await TicketTier.findByIdAndUpdate(
        tierId,
        {
          $set: {
            ...(name && { name: name.trim() }),
            ...(price !== undefined && { price }),
            ...(description !== undefined && { description }),
            // quantityAvailable, benefits, refundPolicyOverride — not
            // settable from the current "Update Ticket Tier" form.
            ...(saleStart !== undefined && { saleStart }),
            ...(saleEnd !== undefined && { saleEnd }),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket tier updated successfully",
        data: ticketTier,
      });
    } catch (error) {
      console.error("Update Ticket Tier Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get all ticket tiers for an event
  async getTicketTiersByEvent(req, res) {
    try {
      const { eventId } = req.params;

      const event = await Event.findOne({ _id: eventId, isDeleted: false });

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      const ticketTiers = await TicketTier.find({ eventId }).sort({
        price: 1,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: ticketTiers.length,
        data: ticketTiers,
      });
    } catch (error) {
      console.error("Get Ticket Tiers Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin "Ticket Tier Details" listing — platform-wide (cross-event),
  // search + tier-type filter + pagination, none of which
  // getTicketTiersByEvent provides since it requires picking one event
  async getAllTicketTiers(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const skip = (page - 1) * limit;
      const { search, type } = req.query;

      const matchStage = {};

      if (type) {
        matchStage.name = { $regex: `^${type}$`, $options: "i" };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        { $match: { "event.isDeleted": { $ne: true } } },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "event.title": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        {
          $project: {
            name: 1,
            price: 1,
            quantityAvailable: 1,
            quantitySold: 1,
            saleStart: 1,
            saleEnd: 1,
            createdAt: 1,
            eventId: "$event._id",
            eventTitle: "$event.title",
            eventLocation: "$event.location",
            eventDate: "$event.date",
            eventBanner: "$event.banner",
          },
        },
        { $sort: { createdAt: -1 } },
      ];

      const [tiers, totalResult] = await Promise.all([
        TicketTier.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
        TicketTier.aggregate([...pipeline, { $count: "total" }]),
      ]);

      const total = totalResult.length ? totalResult[0].total : 0;

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        pagination: {
          totalRecords: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          perPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPreviousPage: page > 1,
        },
        data: tiers,
      });
    } catch (error) {
      console.error("Get All Ticket Tiers Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get single ticket tier
  async getSingleTicketTier(req, res) {
    try {
      const { tierId } = req.params;

      const ticketTier = await TicketTier.findById(tierId).populate(
        "eventId",
        "title date time location status",
      );

      if (!ticketTier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket tier fetched successfully",
        data: ticketTier,
      });
    } catch (error) {
      console.error("Get Ticket Tier Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // delete ticket tier (hard delete — no trash/restore for tiers). Blocked
  // outright once every ticket in the tier is sold, since there'd be no
  // seats left to ever resell; otherwise any already-paid tickets under
  // this tier are fully refunded and cancelled before the tier row itself
  // is removed.
  async deleteTicketTier(req, res) {
    try {
      const { tierId } = req.params;

      const ticketTier = await TicketTier.findById(tierId);

      if (!ticketTier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found",
        });
      }

      if (ticketTier.quantitySold >= ticketTier.quantityAvailable) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Cannot delete a ticket tier that is fully sold out",
        });
      }

      let refundSummary = null;

      try {
        refundSummary = await refundAllTicketsForTier(tierId, {
          reason: "the ticket tier was removed",
        });
      } catch (refundError) {
        console.error(
          "Auto-refund on ticket tier delete failed:",
          refundError.message,
        );
      }

      await TicketTier.findByIdAndDelete(tierId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket tier deleted successfully",
        ...(refundSummary && { refundSummary }),
      });
    } catch (error) {
      console.error("Delete Ticket Tier Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // capacity rollup for one event — sums quantityAvailable/quantitySold
  // across every tier, so a listing table can show a single "sold/capacity"
  // figure instead of the raw per-tier breakdown.
  async getCapacitySummaryForEvent(req, res) {
    try {
      const { eventId } = req.params;

      const [summary] = await TicketTier.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
          },
        },
        {
          $group: {
            _id: null,
            totalAvailable: { $sum: "$quantityAvailable" },
            totalSold: { $sum: "$quantitySold" },
          },
        },
      ]);

      const totals = summary || { totalAvailable: 0, totalSold: 0 };

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: {
          eventId,
          totalAvailable: totals.totalAvailable,
          totalSold: totals.totalSold,
          totalRemaining: totals.totalAvailable - totals.totalSold,
        },
      });
    } catch (error) {
      console.error("Get Capacity Summary Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // bulk version of the above — one aggregation covering every event on
  // a listing page (e.g. the admin Events Details table), instead of the
  // frontend making one capacity call per row.
  async getCapacitySummaryBulk(req, res) {
    try {
      const { eventIds } = req.body;

      if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "eventIds must be a non-empty array",
        });
      }

      const objectIds = eventIds.map((id) => new mongoose.Types.ObjectId(id));

      const summaries = await TicketTier.aggregate([
        { $match: { eventId: { $in: objectIds } } },
        {
          $group: {
            _id: "$eventId",
            totalAvailable: { $sum: "$quantityAvailable" },
            totalSold: { $sum: "$quantitySold" },
          },
        },
      ]);

      const data = summaries.reduce((acc, s) => {
        acc[s._id.toString()] = {
          totalAvailable: s.totalAvailable,
          totalSold: s.totalSold,
          totalRemaining: s.totalAvailable - s.totalSold,
        };
        return acc;
      }, {});

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Get Capacity Summary Bulk Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new TicketTierController();
