// Utility functions for handling reminders, time formatting, and date operations

/**
 * Formats time from 24h to 12h format with AM/PM
 * @param {string} timeStr - Time string in format "HH:MM"
 * @returns {string} Formatted time string in 12h format
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const [rawHour, rawMinute] = timeStr.split(":");
  let hour = parseInt(rawHour, 10);
  let minute = parseInt(rawMinute || "0", 10);

  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) {
    hour = 12; // midnight hour
  } else if (hour > 12) {
    hour -= 12;
  }
  const minuteStr = minute.toString().padStart(2, "0");
  return `${hour}:${minuteStr} ${ampm}`;
}

/**
 * Formats a date object into a readable day format
 * @param {Date|string} date - Date to format
 * @returns {Object} Formatted date information
 */
export function formatDay(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return { date: "N/A", dateText: "Invalid Date", isToday: false };
    }
    const month = d.toLocaleString("default", { month: "short" });
    const day = d.getDate();
    const dayName = d.toLocaleString("default", { weekday: "short" });
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    return { date: day, dateText: `${month}, ${dayName}`, isToday };
  } catch (err) {
    console.error("Error formatting date:", err, date);
    return { date: "N/A", dateText: "Invalid Date", isToday: false };
  }
}

/**
 * Identifies the next upcoming reminder from a list
 * @param {Array} remindersList - List of reminders to check
 * @returns {Object|null} Next reminder information or null if none found
 */
export function findNextDueReminder(remindersList) {
  if (!remindersList || remindersList.length === 0) {
    return null;
  }

  const now = new Date();
  const today = now.toDateString();
  const activeReminders = remindersList.filter((r) => r.isActive);

  if (activeReminders.length === 0) {
    return null;
  }

  const todaysReminders = activeReminders.filter(
    (reminder) => reminder.date && reminder.date.toDateString() === today,
  );

  const sortedReminders = todaysReminders.sort((a, b) => {
    if (!a.time || !b.time) return 0;
    let timeA = a.time.split(":");
    let timeB = b.time.split(":");
    if (!timeA || !timeA[0] || !timeB || !timeB[0]) return 0;
    const dateA = new Date();
    dateA.setHours(parseInt(timeA[0]), parseInt(timeA[1] || 0), 0);
    const dateB = new Date();
    dateB.setHours(parseInt(timeB[0]), parseInt(timeB[1] || 0), 0);
    return dateA - dateB;
  });

  const upcomingReminders = sortedReminders.filter((reminder) => {
    if (!reminder.time) return false;
    let timeParts = reminder.time.split(":");
    if (!timeParts || !timeParts[0]) return false;
    const reminderTime = new Date();
    reminderTime.setHours(
      parseInt(timeParts[0]),
      parseInt(timeParts[1] || 0),
      0,
    );
    return reminderTime > now;
  });

  if (upcomingReminders.length > 0) {
    const next = upcomingReminders[0];
    let timeParts = next.time.split(":");
    const reminderTime = new Date();
    reminderTime.setHours(
      parseInt(timeParts[0]),
      parseInt(timeParts[1] || 0),
      0,
    );

    const diffMs = reminderTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeText = "";
    if (diffHrs > 0) {
      timeText = `${diffHrs} hour${diffHrs > 1 ? "s" : ""}`;
      if (diffMins > 0) {
        timeText += ` and ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
      }
    } else {
      timeText = `${diffMins} minute${diffMins > 1 ? "s" : ""}`;
    }

    let hours = parseInt(timeParts[0]);
    let minutes = timeParts[1] || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours -= 12;
    }
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    return {
      reminder: next,
      timeLeft: timeText,
      formattedTime,
    };
  }

  return null;
}

/**
 * Groups reminders by date for display
 * @param {Array} reminders - List of reminders to group
 * @returns {Object} Reminders grouped by date
 */
export function groupRemindersByDate(reminders) {
  return reminders.reduce((acc, reminder) => {
    if (!reminder || !reminder.date) return acc;
    try {
      const dateStr = reminder.date.toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(reminder);
    } catch (err) {
      console.error("Error processing reminder for grouping:", err, reminder);
    }
    return acc;
  }, {});
}

/**
 * Constructs a formatted time string from hours, minutes, and period
 * @param {Object} timeObj - Object containing hours, minutes, and period
 * @returns {string} Formatted time string in 24h format
 */
export function constructTimeString(timeObj) {
  let hours = parseInt(timeObj.hours);
  if (timeObj.period === "PM" && hours < 12) {
    hours += 12;
  } else if (timeObj.period === "AM" && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${timeObj.minutes.padStart(
    2,
    "0",
  )}`;
}
