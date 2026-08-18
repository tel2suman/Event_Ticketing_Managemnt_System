const mongoose = require("mongoose");
const TicketTier = require("../../models/TicketTier");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");

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
        benefits,
        isActive,
        hasAssignedSeating,
        seatLabels,
        refundPolicyOverride,
      } = req.body;

      // Check event exists
      const event = await Event.findById(eventId);

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
        benefits,
        isActive,
        hasAssignedSeating: !!hasAssignedSeating,
        seats,
        refundPolicyOverride: refundPolicyOverride || [],
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
        quantityAvailable,
        benefits,
        isActive,
        refundPolicyOverride,
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

      // Prevent lowering available quantity below what's already sold
      if (
        quantityAvailable !== undefined &&
        quantityAvailable < tierExists.quantitySold
      ) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Available quantity cannot be less than the ${tierExists.quantitySold} tickets already sold`,
        });
      }

      const ticketTier = await TicketTier.findByIdAndUpdate(
        tierId,
        {
          $set: {
            ...(name && { name: name.trim() }),
            ...(price !== undefined && { price }),
            ...(description !== undefined && { description }),
            ...(quantityAvailable !== undefined && { quantityAvailable }),
            ...(benefits && { benefits }),
            ...(isActive !== undefined && { isActive }),
            ...(refundPolicyOverride !== undefined && { refundPolicyOverride }),
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

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      // Admins see all tiers (including inactive); users only see active tiers
      const filter =
        req.user?.role === "admin"
          ? { eventId }
          : { eventId, isActive: true };

      const ticketTiers = await TicketTier.find(filter).sort({ price: 1 });

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

  // deactivate ticket tier
  async deactivateTicketTier(req, res) {
    try {
      const { tierId } = req.params;

      const ticketTier = await TicketTier.findByIdAndUpdate(
        tierId,
        {
          $set: {
            isActive: false,
          },
        },
        {
          new: true,
        },
      );

      if (!ticketTier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket tier deactivated successfully",
        data: ticketTier,
      });
    } catch (error) {
      console.error("Deactivate Ticket Tier Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // delete ticket tier
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

      // Don't allow deleting a tier that already has tickets sold against it
      if (ticketTier.quantitySold > 0) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "Cannot delete a ticket tier that already has tickets sold. Deactivate it instead.",
        });
      }

      await TicketTier.findByIdAndDelete(tierId);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket tier deleted successfully",
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
  // across every active tier, so a listing table can show a single
  // "sold/capacity" figure instead of the raw per-tier breakdown.
  async getCapacitySummaryForEvent(req, res) {
    try {
      const { eventId } = req.params;

      const [summary] = await TicketTier.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
            isActive: true,
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
        { $match: { eventId: { $in: objectIds }, isActive: true } },
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
