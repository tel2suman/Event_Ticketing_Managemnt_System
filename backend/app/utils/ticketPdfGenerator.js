const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { buildQrPayload } = require("./qrCodeGenerator");

// Renders a single ticket as a PDF buffer for the "download ticket"
// endpoint. Regenerates the QR from the ticket's own signed payload
// instead of re-fetching the Cloudinary image, so this never depends on
// an external network call succeeding.
const generateTicketPdf = async (ticket) => {
  const qrBuffer = await QRCode.toBuffer(buildQrPayload(ticket.ticketCode), {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const event = ticket.eventId;
    const tier = ticket.tierId;

    doc.fontSize(20).fillColor("#000000").text(event?.title || "Event Ticket");
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor("#666666");
    if (event?.date) {
      const dateLine = new Date(event.date).toDateString();
      doc.text(`Date: ${dateLine}${event.time ? ` - ${event.time}` : ""}`);
    }
    if (event?.location) {
      doc.text(`Venue: ${event.location}`);
    }
    doc.moveDown(1);

    doc.fillColor("#000000").fontSize(12);
    doc.text(`Ticket Code: ${ticket.ticketCode}`);
    doc.text(`Booking ID: ${ticket.orderId}`);
    if (tier?.name) {
      doc.text(`Tier: ${tier.name}`);
    }
    doc.text(`Price Paid: Rs. ${ticket.priceAtPurchase}`);
    doc.text(`Status: ${ticket.paymentStatus}${ticket.checkedIn ? " - Checked In" : ""}`);
    doc.moveDown(1);

    doc.image(qrBuffer, { fit: [180, 180] });
    doc.moveDown(1);

    doc.fontSize(8).fillColor("#999999").text(
      "Present this QR code at the venue entrance for check-in. This ticket is non-transferable.",
    );

    doc.end();
  });
};

module.exports = { generateTicketPdf };
