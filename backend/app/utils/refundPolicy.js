// ASSUMPTION — sync this with your actual "Refund & Cancellation Policy"
// static page (the one your HTML team is building per the original scope).
// These tiers are a reasonable placeholder, not a business decision I'm
// allowed to make for you:
//
//   7+ days before the event   -> 100% refund
//   2–7 days before the event  -> 50% refund
//   < 2 days before the event  -> no refund
//
// Change REFUND_TIERS below to match whatever your policy page actually
// says, and both stay in sync automatically from then on.
const REFUND_TIERS = [
  { minHoursBeforeEvent: 7 * 24, percentage: 100 },
  { minHoursBeforeEvent: 2 * 24, percentage: 50 },
  { minHoursBeforeEvent: 0, percentage: 0 },
];

// Returns { eligible, percentage, hoursUntilEvent, reason }.
// `customTiers` — pass a tier's TicketTier.refundPolicyOverride here to
// use a per-tier policy instead of the platform-wide default (e.g. an
// organizer marking one VIP tier non-refundable while everything else
// follows the standard policy). Falls back to REFUND_TIERS when the
// override is missing/empty.
const getRefundEligibility = (event, customTiers) => {
  const tiers =
    Array.isArray(customTiers) && customTiers.length > 0
      ? customTiers
      : REFUND_TIERS;

  const eventDateTime = new Date(`${event.date}T${event.time || "00:00"}`);
  const hoursUntilEvent = (eventDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (Number.isNaN(eventDateTime.getTime())) {
    return {
      eligible: false,
      percentage: 0,
      hoursUntilEvent: null,
      reason: "Could not determine the event date/time",
    };
  }

  if (hoursUntilEvent <= 0) {
    return {
      eligible: false,
      percentage: 0,
      hoursUntilEvent,
      reason: "This event has already occurred",
    };
  }

  // Tiers are expected ordered from largest threshold to smallest, so
  // the first tier whose threshold we've already cleared is the right
  // one.
  for (const tier of tiers) {
    if (hoursUntilEvent >= tier.minHoursBeforeEvent) {
      return {
        eligible: tier.percentage > 0,
        percentage: tier.percentage,
        hoursUntilEvent,
        reason:
          tier.percentage > 0
            ? null
            : "Too close to the event date for a refund",
      };
    }
  }

  return {
    eligible: false,
    percentage: 0,
    hoursUntilEvent,
    reason: "Too close to the event date for a refund",
  };
};

module.exports = { getRefundEligibility, REFUND_TIERS };
