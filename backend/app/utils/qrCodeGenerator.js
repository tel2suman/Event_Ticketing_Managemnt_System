const crypto = require("crypto");
const QRCode = require("qrcode");

// Secret used to sign QR payloads so a ticketCode can't be forged/edited
// by a user before scanning. Falls back to ACCESS_TOKEN_SECRET if a
// dedicated QR_SECRET isn't set in .env.
const QR_SECRET = process.env.QR_SECRET || process.env.ACCESS_TOKEN_SECRET;

// Creates a short signature for a given ticketCode
const signTicketCode = (ticketCode) => {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(ticketCode)
    .digest("hex")
    .slice(0, 16);
};

// Builds the signed JSON payload that gets encoded into the QR image
const buildQrPayload = (ticketCode) => {
  const signature = signTicketCode(ticketCode);

  return JSON.stringify({
    code: ticketCode,
    sig: signature,
  });
};

// Verifies a scanned QR payload string. Returns { valid, ticketCode }
const verifyQrPayload = (rawPayload) => {
  try {
    const parsed = JSON.parse(rawPayload);

    if (!parsed.code || !parsed.sig) {
      return { valid: false, ticketCode: null };
    }

    const expectedSignature = signTicketCode(parsed.code);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(parsed.sig),
      Buffer.from(expectedSignature),
    );

    return { valid: isValid, ticketCode: isValid ? parsed.code : null };
  } catch (error) {
    // Not valid JSON / tampered payload
    return { valid: false, ticketCode: null };
  }
};

// Generates a QR code image (as a base64 data URI) for a given ticketCode
const generateQrDataUri = async (ticketCode) => {
  const payload = buildQrPayload(ticketCode);

  const dataUri = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
  });

  return dataUri;
};

module.exports = {
  signTicketCode,
  buildQrPayload,
  verifyQrPayload,
  generateQrDataUri,
};
