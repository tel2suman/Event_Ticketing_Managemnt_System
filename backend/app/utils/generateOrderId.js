const crypto = require("crypto");

// Generates a human-readable booking/order reference like: EVT-824781
// Mirrors generateTicketCode's approach but shorter — this is shown
// directly to users (confirmation screen, "My Tickets", support
// conversations), so it deliberately avoids the raw Mongo ObjectId.
const generateOrderId = () => {
  const randomPart = crypto
    .randomInt(100000, 999999)
    .toString();

  return `EVT-${randomPart}`;
};

module.exports = generateOrderId;
