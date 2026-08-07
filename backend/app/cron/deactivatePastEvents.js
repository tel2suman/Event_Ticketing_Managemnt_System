const Event = require("../models/Event");

const deactivatePastEvents = async () => {
  try {
    const now = new Date();

    const result = await Event.updateMany(
      {
        status: "active",
        date: { $lt: now },
      },
      { $set: { status: "inactive" } },
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[cron] Auto-deactivated ${result.modifiedCount} event(s) whose date has passed`,
      );
    }
  } catch (error) {
    console.error("[cron] deactivatePastEvents failed:", error.message);
  }
};

module.exports = deactivatePastEvents;
