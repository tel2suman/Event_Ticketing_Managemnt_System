const crypto = require("crypto");

// Generates a ticket code like: EVT20260726-A1B2C3
const generateTicketCode = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const randomPart = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()
    .slice(0, 6);

  return `EVT${datePart}-${randomPart}`;
};

module.exports = generateTicketCode;
