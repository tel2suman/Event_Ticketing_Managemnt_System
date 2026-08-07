const mongoose = require("mongoose");
const Ticket = require("../../models/Ticket");
const TicketTier = require("../../models/TicketTier");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");
const generateTicketCode = require("../../utils/generateTicketCode");
const {
  generateQrDataUri,
  verifyQrPayload,
} = require("../../utils/qrCodeGenerator");
const { uploadToCloudinary } = require("../../utils/ImageUplod");

const MAX_TICKET_CODE_RETRIES = 3;

// Standalone helper (NOT a class method) — creates one Ticket doc with a
// guaranteed-unique ticketCode + QR. Kept outside the class deliberately:
// Express calls route handlers as plain functions (e.g.
// `router.post(path, TicketController.purchaseTicket)`), which strips the
// object binding, so `this` inside a class method would be undefined.
// A standalone function avoids relying on `this` entirely.
async function createSingleTicket({
  userId,
  eventId,
  tierId,
  orderId,
  priceAtPurchase,
}) {
  let attempt = 0;

  while (attempt < MAX_TICKET_CODE_RETRIES) {
    attempt += 1;

    const ticketCode = generateTicketCode();

    try {
      const qrDataUri = await generateQrDataUri(ticketCode);

      const cloudinaryResult = await uploadToCloudinary(qrDataUri);

      const ticket = await Ticket.create({
        userId,
        eventId,
        tierId,
        orderId,
        ticketCode,
        qrCodeUrl: cloudinaryResult.secure_url,
        qrCodePublicId: cloudinaryResult.public_id,
        priceAtPurchase,
      });

      return ticket;
    } catch (error) {
      // ticketCode collided with an existing one (extremely rare) — retry
      if (error.code === 11000 && attempt < MAX_TICKET_CODE_RETRIES) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "Failed to generate a unique ticket code. Please try again.",
  );
}

class TicketController {
  // purchase ticket(s)
  async purchaseTicket(req, res) {
    try {
      const { eventId, tierId, quantity = 1 } = req.body;
      const userId = req.user._id;

      // 1. Validate event
      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Event not found",
        });
      }

      if (event.status !== "active") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This event is not currently active for ticket sales",
        });
      }

      // 2. Validate tier belongs to this event
      const tier = await TicketTier.findOne({ _id: tierId, eventId });

      if (!tier) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket tier not found for this event",
        });
      }

      if (!tier.isActive) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This ticket tier is no longer available",
        });
      }

      // 3. Atomically reserve stock — this single query both checks
      // availability AND increments quantitySold, so two simultaneous
      // purchases can never oversell the same tier (no race condition).
      const updatedTier = await TicketTier.findOneAndUpdate(
        {
          _id: tierId,
          isActive: true,
          $expr: {
            $lte: [
              { $add: ["$quantitySold", quantity] },
              "$quantityAvailable",
            ],
          },
        },
        { $inc: { quantitySold: quantity } },
        { new: true },
      );

      if (!updatedTier) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message:
            "Not enough tickets available in this tier for the requested quantity",
        });
      }

      // 4. Create one Ticket document per unit purchased, each with its
      // own unique ticketCode + QR code, grouped under one orderId.
      const orderId = new mongoose.Types.ObjectId().toString();
      const createdTickets = [];

      try {
        for (let i = 0; i < quantity; i += 1) {
          const ticket = await createSingleTicket({
            userId,
            eventId,
            tierId,
            orderId,
            priceAtPurchase: tier.price,
          });

          createdTickets.push(ticket);
        }
      } catch (creationError) {
        // Roll back the stock reservation if ticket/QR creation failed
        // partway through, so the tier isn't left permanently oversold.
        await TicketTier.findByIdAndUpdate(tierId, {
          $inc: { quantitySold: -quantity },
        });

        // Also remove any tickets that were created before the failure
        if (createdTickets.length > 0) {
          await Ticket.deleteMany({
            _id: { $in: createdTickets.map((t) => t._id) },
          });
        }

        throw creationError;
      }

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message:
          "Ticket(s) reserved successfully. Complete payment to confirm.",
        data: {
          orderId,
          tickets: createdTickets,
        },
      });
    } catch (error) {
      console.error("Purchase Ticket Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get logged-in user's tickets (upcoming / past)
  async getMyTickets(req, res) {
    try {
      const userId = req.user._id;

      const tickets = await Ticket.find({ userId })
        .populate("eventId", "title date time location banner status")
        .populate("tierId", "name price benefits")
        .sort({ createdAt: -1 });

      const now = new Date();

      const upcoming = [];
      const past = [];

      tickets.forEach((ticket) => {
        const eventDate = ticket.eventId?.date
          ? new Date(ticket.eventId.date)
          : null;

        if (eventDate && eventDate < now) {
          past.push(ticket);
        } else {
          upcoming.push(ticket);
        }
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: { upcoming, past },
      });
    } catch (error) {
      console.error("Get My Tickets Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // get single ticket (owner or admin)
  async getSingleTicket(req, res) {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findById(ticketId)
        .populate("eventId", "title date time location banner status")
        .populate("tierId", "name price benefits")
        .populate("userId", "name email");

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      const isOwner = ticket.userId._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to view this ticket",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error("Get Single Ticket Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // cancel ticket (owner only, before check-in)
  async cancelTicket(req, res) {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to cancel this ticket",
        });
      }

      if (ticket.checkedIn) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A ticket that has already been checked in cannot be cancelled",
        });
      }

      if (ticket.cancelledAt) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This ticket has already been cancelled",
        });
      }

      // A ticket that's already been paid for involves real money — it
      // must go through the refund flow (POST /payment/refund-ticket/:id),
      // which checks the refund policy and actually returns the money via
      // Razorpay. This endpoint only cancels a reservation that was never
      // paid for, so there's nothing to refund.
      if (ticket.paymentStatus === "paid") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "This ticket has already been paid for. Use the refund endpoint instead of cancel.",
        });
      }

      ticket.cancelledAt = new Date();
      ticket.paymentStatus = "failed";
      await ticket.save();

      // Release the reserved stock back to the tier
      await TicketTier.findByIdAndUpdate(ticket.tierId, {
        $inc: { quantitySold: -1 },
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Ticket cancelled successfully",
        data: ticket,
      });
    } catch (error) {
      console.error("Cancel Ticket Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: check-in a ticket by scanning its QR (or manual ticketCode entry)
  async checkInTicket(req, res) {
    try {
      const { qrData, ticketCode: manualCode } = req.body;

      let resolvedCode = manualCode;

      if (qrData) {
        const { valid, ticketCode } = verifyQrPayload(qrData);

        if (!valid) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid or tampered QR code",
          });
        }

        resolvedCode = ticketCode;
      }

      const ticket = await Ticket.findOne({ ticketCode: resolvedCode }).populate(
        "eventId",
        "title date status",
      );

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      if (ticket.cancelledAt) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This ticket has been cancelled",
        });
      }

      if (ticket.paymentStatus !== "paid") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This ticket has not been paid for yet",
        });
      }

      if (ticket.checkedIn) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: `Ticket already checked in at ${ticket.checkedInAt.toISOString()}`,
        });
      }

      ticket.checkedIn = true;
      ticket.checkedInAt = new Date();
      await ticket.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Check-in successful",
        data: ticket,
      });
    } catch (error) {
      console.error("Check-In Ticket Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: list all tickets for an event (sales + check-in report)
  async getTicketsByEvent(req, res) {
    try {
      const { eventId } = req.params;

      const tickets = await Ticket.find({ eventId })
        .populate("tierId", "name price")
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      const summary = {
        totalTickets: tickets.length,
        paid: tickets.filter((t) => t.paymentStatus === "paid").length,
        pending: tickets.filter((t) => t.paymentStatus === "pending").length,
        cancelled: tickets.filter((t) => t.cancelledAt).length,
        checkedIn: tickets.filter((t) => t.checkedIn).length,
        revenue: tickets
          .filter((t) => t.paymentStatus === "paid")
          .reduce((sum, t) => sum + t.priceAtPurchase, 0),
      };

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        summary,
        data: tickets,
      });
    } catch (error) {
      console.error("Get Tickets By Event Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new TicketController();
