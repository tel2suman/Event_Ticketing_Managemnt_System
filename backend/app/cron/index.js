const cron = require("node-cron");
const expirePendingTickets = require("./expirePendingTickets");
const deactivatePastEvents = require("./deactivatePastEvents");

const startCronJobs = () => {
  // Every 5 minutes: release stock held by abandoned/unpaid reservations
  cron.schedule("*/5 * * * *", expirePendingTickets);

  // Every hour: flip any event whose date has passed to "inactive"
  cron.schedule("0 * * * *", deactivatePastEvents);

  console.log("[cron] Scheduled jobs started: expirePendingTickets (every 5 min), deactivatePastEvents (hourly)");

  // Also run both once immediately on startup, so anything that went
  // stale while the server was down gets cleaned up right away instead
  // of waiting for the next scheduled tick.
  expirePendingTickets();
  deactivatePastEvents();
};

module.exports = startCronJobs;
