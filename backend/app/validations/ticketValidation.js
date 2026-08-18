const Joi = require("joi");

// purchaseTicket validation
const purchaseTicketValidation = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid event ID",
    "string.length": "Invalid event ID",
    "any.required": "Event ID is required",
  }),

  tierId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid ticket tier ID",
    "string.length": "Invalid ticket tier ID",
    "any.required": "Ticket tier ID is required",
  }),

  quantity: Joi.number().integer().min(1).max(10).default(1).messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "number.max": "You can purchase a maximum of 10 tickets at a time",
  }),

  // Required only when buying from an assigned-seating tier — the
  // controller cross-checks this against the tier's own
  // hasAssignedSeating flag. When provided, its length is what actually
  // determines the ticket count (overrides `quantity`).
  seatLabels: Joi.array().items(Joi.string().trim()).min(1).max(10).messages({
    "array.base": "seatLabels must be a list of seat labels",
    "array.min": "Select at least one seat",
    "array.max": "You can select a maximum of 10 seats at a time",
  }),
});

// transferTicket validation
const transferTicketValidation = Joi.object({
  recipientEmail: Joi.string().trim().email().required().messages({
    "string.email": "A valid recipient email is required",
    "any.required": "Recipient email is required",
  }),
});

// checkInTicket validation (admin scanning at the gate)
const checkInTicketValidation = Joi.object({
  qrData: Joi.string().messages({
    "string.base": "QR data must be a string",
  }),

  ticketCode: Joi.string().trim().messages({
    "string.base": "Ticket code must be a string",
  }),
})
  .or("qrData", "ticketCode")
  .messages({
    "object.missing":
      "Either scanned QR data or a manual ticket code is required",
});

module.exports = {
  purchaseTicketValidation,
  checkInTicketValidation,
  transferTicketValidation,
};
