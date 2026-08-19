const mongoose = require("mongoose");
const Ticket = require("../../models/Ticket");
const TicketTier = require("../../models/TicketTier");
const Event = require("../../models/Event");
const HttpStatusCode = require("../../utils/httpStatusCode");
const generateTicketCode = require("../../utils/generateTicketCode");
const generateOrderId = require("../../utils/generateOrderId");
const {
  generateQrDataUri,
  verifyQrPayload,
} = require("../../utils/qrCodeGenerator");
const { uploadToCloudinary } = require("../../utils/ImageUplod");
const { generateTicketPdf } = require("../../utils/ticketPdfGenerator");
const { releaseSeat } = require("../../utils/ticketStockHelper");
const { notify } = require("../../utils/notify");
const User = require("../../models/User");
const Notification = require("../../models/Notification");

const MAX_TICKET_CODE_RETRIES = 3;

// Same window the expirePendingTickets cron actually uses to release
// abandoned reservations — surfaced in purchaseTicket's response so the
// frontend's countdown timer is never guessing/hardcoding a number that
// can drift out of sync with what the server enforces.
const PENDING_EXPIRY_MINUTES = Number(process.env.PENDING_EXPIRY_MINUTES) || 15;

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
  seatLabel = null,
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
        seatLabel,
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

// Collapses the three raw fields (paymentStatus, cancelledAt,
// refundedAmount, checkedIn) into the single label the UI actually binds
// to ("Booked", "Cancelled", "Refunded", "Pending", "Failed", "Checked In").
// Standalone for the same `this`-binding reason as createSingleTicket above.
function getTicketDisplayStatus(ticket) {
  if (ticket.cancelledAt) {
    return ticket.refundedAmount > 0 ? "Refunded" : "Cancelled";
  }

  if (ticket.paymentStatus === "paid") {
    return ticket.checkedIn ? "Checked In" : "Booked";
  }

  if (ticket.paymentStatus === "pending") {
    return "Pending";
  }

  return "Failed";
}

class TicketController {
  // purchase ticket(s)
  async purchaseTicket(req, res) {
    try {
      const { eventId, tierId, quantity = 1, seatLabels } = req.body;
      const userId = req.user._id;

      // 1. Validate event
      const event = await Event.findOne({ _id: eventId, isDeleted: false });

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

      const now = new Date();

      if (tier.saleStart && now < tier.saleStart) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `This ticket tier is not on sale yet. Sales open on ${tier.saleStart.toISOString()}`,
        });
      }

      if (tier.saleEnd && now > tier.saleEnd) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Ticket sales for this tier have closed",
        });
      }

      if (tier.hasAssignedSeating && (!seatLabels || seatLabels.length === 0)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "This tier uses assigned seating — select at least one seat via seatLabels",
        });
      }

      if (!tier.hasAssignedSeating && seatLabels && seatLabels.length > 0) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "This tier is general admission — it does not use seatLabels",
        });
      }

      const effectiveQuantity = tier.hasAssignedSeating
        ? seatLabels.length
        : quantity;

      // 3. Atomically reserve stock/seats — each check-and-increment is a
      // single query, so two simultaneous purchases can never oversell
      // the same tier or double-book the same seat (no race condition).
      const reservedSeatLabels = [];

      if (tier.hasAssignedSeating) {
        for (const label of seatLabels) {
          const seatUpdate = await TicketTier.findOneAndUpdate(
            {
              _id: tierId,
              "seats.label": label,
              "seats.status": "available",
            },
            { $set: { "seats.$.status": "held" }, $inc: { quantitySold: 1 } },
            { new: true },
          );

          if (!seatUpdate) {
            // Roll back whatever this same request already held before
            // hitting the seat that's no longer available.
            for (const heldLabel of reservedSeatLabels) {
              await TicketTier.updateOne(
                { _id: tierId, "seats.label": heldLabel },
                {
                  $set: { "seats.$.status": "available" },
                  $inc: { quantitySold: -1 },
                },
              );
            }

            return res.status(HttpStatusCode.CONFLICT).json({
              success: false,
              message: `Seat ${label} is no longer available`,
            });
          }

          reservedSeatLabels.push(label);
        }
      } else {
        const updatedTier = await TicketTier.findOneAndUpdate(
          {
            _id: tierId,
            $expr: {
              $lte: [
                { $add: ["$quantitySold", effectiveQuantity] },
                "$quantityAvailable",
              ],
            },
          },
          { $inc: { quantitySold: effectiveQuantity } },
          { new: true },
        );

        if (!updatedTier) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message:
              "Not enough tickets available in this tier for the requested quantity",
          });
        }
      }

      // 4. Create one Ticket document per unit purchased, each with its
      // own unique ticketCode + QR code, grouped under one human-readable
      // orderId (e.g. EVT-824781) — short enough to show on a
      // confirmation screen or read out to support, unlike a raw
      // ObjectId. Collisions are astronomically unlikely at 6 digits but
      // still checked/retried, same pattern as ticketCode below.
      let orderId;
      let orderIdAttempts = 0;

      do {
        orderId = generateOrderId();
        orderIdAttempts += 1;
      } while (
        (await Ticket.exists({ orderId })) &&
        orderIdAttempts < MAX_TICKET_CODE_RETRIES
      );

      const createdTickets = [];

      try {
        for (let i = 0; i < effectiveQuantity; i += 1) {
          const ticket = await createSingleTicket({
            userId,
            eventId,
            tierId,
            orderId,
            priceAtPurchase: tier.price,
            seatLabel: tier.hasAssignedSeating ? reservedSeatLabels[i] : null,
          });

          createdTickets.push(ticket);
        }
      } catch (creationError) {
        // Roll back the stock/seat reservation if ticket/QR creation
        // failed partway through, so the tier isn't left permanently
        // oversold (or a seat stuck "held" forever).
        if (tier.hasAssignedSeating) {
          for (const label of reservedSeatLabels) {
            await TicketTier.updateOne(
              { _id: tierId, "seats.label": label },
              {
                $set: { "seats.$.status": "available" },
                $inc: { quantitySold: -1 },
              },
            );
          }
        } else {
          await TicketTier.findByIdAndUpdate(tierId, {
            $inc: { quantitySold: -effectiveQuantity },
          });
        }

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
          // How long this reservation holds stock before the cron
          // releases it — use this to drive the checkout countdown timer.
          pendingExpiryMinutes: PENDING_EXPIRY_MINUTES,
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

  // get logged-in user's tickets, split the way "My Tickets" actually
  // needs them: Upcoming / Previously Attended / Cancelled — a cancelled
  // ticket is cancelled regardless of the event's date, so that check
  // takes priority over the date split.
  async getMyTickets(req, res) {
    try {
      const userId = req.user._id;

      const tickets = await Ticket.find({ userId })
        .populate("eventId", "title date time location banner status")
        .populate("tierId", "name price benefits")
        .sort({ createdAt: -1 });

      const now = new Date();

      const upcoming = [];
      const attended = [];
      const cancelled = [];

      tickets.forEach((ticket) => {
        if (ticket.cancelledAt) {
          cancelled.push(ticket);
          return;
        }

        const eventDate = ticket.eventId?.date
          ? new Date(ticket.eventId.date)
          : null;

        if (eventDate && eventDate < now) {
          attended.push(ticket);
        } else {
          upcoming.push(ticket);
        }
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        counts: {
          upcoming: upcoming.length,
          attended: attended.length,
          cancelled: cancelled.length,
        },
        data: { upcoming, attended, cancelled },
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

  // get every ticket in one order (owner or admin) — the "Booking
  // Confirmed" screen's exact data need: event/tier/QR for just this
  // purchase, not the user's entire ticket history like getMyTickets
  async getTicketsByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      const tickets = await Ticket.find({ orderId })
        .populate("eventId", "title date time location banner status")
        .populate("tierId", "name price benefits");

      if (tickets.length === 0) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "No tickets found for this order",
        });
      }

      const isOwner = tickets[0].userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to view this order",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: tickets.length,
        data: tickets,
      });
    } catch (error) {
      console.error("Get Tickets By Order Id Error:", error);

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

      await releaseSeat(ticket);

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

  // owner: transfer a paid, not-yet-used ticket to another registered
  // user by email. The ticketCode/QR stay exactly the same — only
  // ownership (userId) changes, logged in transferHistory for an audit
  // trail. Real platforms (Ticketmaster, Eventbrite) require the
  // recipient to already have an account, which this mirrors.
  async transferTicket(req, res) {
    try {
      const { ticketId } = req.params;
      const { recipientEmail } = req.body;

      const ticket = await Ticket.findById(ticketId).populate(
        "eventId",
        "title",
      );

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to transfer this ticket",
        });
      }

      if (ticket.checkedIn) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A ticket that has already been checked in cannot be transferred",
        });
      }

      if (ticket.cancelledAt) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A cancelled ticket cannot be transferred",
        });
      }

      if (ticket.paymentStatus !== "paid") {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Only a fully paid ticket can be transferred",
        });
      }

      const recipient = await User.findOne({
        email: recipientEmail.toLowerCase().trim(),
        isDeleted: false,
      });

      if (!recipient) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "No registered user found with that email",
        });
      }

      if (recipient._id.toString() === req.user._id.toString()) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "You already own this ticket",
        });
      }

      const previousOwnerId = ticket.userId;

      ticket.userId = recipient._id;
      ticket.transferHistory.push({
        fromUserId: previousOwnerId,
        toUserId: recipient._id,
        transferredAt: new Date(),
      });
      await ticket.save();

      const eventTitle = ticket.eventId?.title || "your event";

      notify({
        userId: recipient._id,
        eventId: ticket.eventId?._id,
        type: "ticket_transferred",
        title: "A ticket was transferred to you",
        message: `${req.user.name} transferred a ticket for ${eventTitle} (${ticket.ticketCode}) to you.`,
      });

      notify({
        userId: previousOwnerId,
        eventId: ticket.eventId?._id,
        type: "ticket_transferred",
        title: "Ticket transferred",
        message: `Your ticket ${ticket.ticketCode} for ${eventTitle} was transferred to ${recipient.email}.`,
      });

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: `Ticket transferred to ${recipient.email} successfully`,
        data: ticket,
      });
    } catch (error) {
      console.error("Transfer Ticket Error:", error);

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

  // admin: platform-wide ticket listing (not scoped to one event) —
  // powers an admin "all tickets" table. Paginated; optionally filtered
  // by paymentStatus or eventId.
  async getAllTickets(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = {};

      if (req.query.eventId) {
        filter.eventId = req.query.eventId;
      }

      if (req.query.paymentStatus) {
        filter.paymentStatus = req.query.paymentStatus;
      }

      const [tickets, total] = await Promise.all([
        Ticket.find(filter)
          .populate("eventId", "title date time location")
          .populate("tierId", "name price")
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Ticket.countDocuments(filter),
      ]);

      const data = tickets.map((ticket) => ({
        ...ticket.toObject(),
        status: getTicketDisplayStatus(ticket),
      }));

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data,
      });
    } catch (error) {
      console.error("Get All Tickets Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // admin: one row per order (grouped by orderId) instead of one row per
  // individual ticket — this is what the admin "Ticket Details" table
  // actually needs (Tickets ID / Event / Tier / User / Quantity / Total
  // Amount / Status), since a single purchase call can reserve several
  // tickets that all share one orderId, one tier, and one event.
  //
  // Supports the admin dashboard's search box (by event name), the
  // "All Status" dropdown (Booked/Pending/Cancelled/Refunded/Checked In/
  // Failed — same values getTicketDisplayStatus produces per-ticket), and
  // the "All Category" dropdown (event's category).
  async getOrdersGrouped(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;
      const now = new Date();

      const matchStage = {};

      if (req.query.eventId) {
        matchStage.eventId = new mongoose.Types.ObjectId(req.query.eventId);
      }

      // Steps shared by both the paginated data query and the count query:
      // group into one row per order, compute its display status, then
      // apply the status/search/category filters — all of which depend on
      // fields only available after grouping (status) or after joining to
      // the event (title, categoryId).
      const basePipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: "$orderId",
            eventId: { $first: "$eventId" },
            tierId: { $first: "$tierId" },
            userId: { $first: "$userId" },
            quantity: { $sum: 1 },
            totalAmount: { $sum: "$priceAtPurchase" },
            unitPrice: { $first: "$priceAtPurchase" },
            totalRefunded: { $sum: "$refundedAmount" },
            checkedInCount: { $sum: { $cond: ["$checkedIn", 1, 0] } },
            paymentStatus: { $first: "$paymentStatus" },
            cancelledAt: { $first: "$cancelledAt" },
            purchasedAt: { $min: "$createdAt" },
          },
        },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [
                        { $ne: ["$cancelledAt", null] },
                        { $gt: ["$totalRefunded", 0] },
                      ],
                    },
                    then: "Refunded",
                  },
                  {
                    case: { $ne: ["$cancelledAt", null] },
                    then: "Cancelled",
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ["$paymentStatus", "paid"] },
                        { $gt: ["$quantity", 0] },
                        { $eq: ["$checkedInCount", "$quantity"] },
                      ],
                    },
                    then: "Checked In",
                  },
                  {
                    case: { $eq: ["$paymentStatus", "paid"] },
                    then: "Booked",
                  },
                  {
                    case: { $eq: ["$paymentStatus", "pending"] },
                    then: "Pending",
                  },
                ],
                default: "Failed",
              },
            },
          },
        },
        ...(req.query.status ? [{ $match: { status: req.query.status } }] : []),
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
        // Once an event's date has passed, its bookings drop off this
        // admin table entirely — same rule for every status (Booked,
        // Cancelled, Refunded alike), not just active ones.
        { $match: { "event.date": { $gte: now } } },
        ...(req.query.search
          ? [
              {
                $match: {
                  "event.title": { $regex: req.query.search, $options: "i" },
                },
              },
            ]
          : []),
        ...(req.query.categoryId
          ? [
              {
                $match: {
                  "event.categoryId": new mongoose.Types.ObjectId(
                    req.query.categoryId,
                  ),
                },
              },
            ]
          : []),
      ];

      const dataPipeline = [
        ...basePipeline,
        { $sort: { purchasedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "tickettiers",
            localField: "tierId",
            foreignField: "_id",
            as: "tier",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            _id: 0,
            orderId: "$_id",
            quantity: 1,
            unitPrice: 1,
            totalAmount: 1,
            totalRefunded: 1,
            checkedInCount: 1,
            purchasedAt: 1,
            paymentStatus: 1,
            cancelledAt: 1,
            status: 1,
            eventTitle: "$event.title",
            eventLocation: "$event.location",
            eventDate: "$event.date",
            tierName: { $arrayElemAt: ["$tier.name", 0] },
            userName: { $arrayElemAt: ["$user.name", 0] },
            userEmail: { $arrayElemAt: ["$user.email", 0] },
          },
        },
      ];

      const [data, totalCountResult] = await Promise.all([
        Ticket.aggregate(dataPipeline),
        Ticket.aggregate([...basePipeline, { $count: "total" }]),
      ]);

      const total = totalCountResult[0]?.total || 0;

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data,
      });
    } catch (error) {
      console.error("Get Orders Grouped Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // download a single ticket as a PDF (owner or admin)
  async downloadTicket(req, res) {
    try {
      const { ticketId } = req.params;

      const ticket = await Ticket.findById(ticketId)
        .populate("eventId", "title date time location")
        .populate("tierId", "name");

      if (!ticket) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Ticket not found",
        });
      }

      const isOwner = ticket.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "You are not allowed to download this ticket",
        });
      }

      const pdfBuffer = await generateTicketPdf(ticket);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ticket-${ticket.ticketCode}.pdf"`,
      );

      return res.status(HttpStatusCode.SUCCESS).send(pdfBuffer);
    } catch (error) {
      console.error("Download Ticket Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // logged-in user's own notifications (payment/refund/expiry/transfer)
  // — the personal counterpart to the admin-broadcast event notifications
  // in eventController. Paginated, newest first.
  async getMyNotifications(req, res) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ userId: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments({ userId: req.user._id }),
        Notification.countDocuments({ userId: req.user._id, isRead: false }),
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        unreadCount,
        data: notifications,
      });
    } catch (error) {
      console.error("Get My Notifications Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // mark one of the logged-in user's own notifications as read
  async markNotificationRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: req.user._id },
        { $set: { isRead: true } },
        { new: true },
      );

      if (!notification) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Mark Notification Read Error:", error);

      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new TicketController();
