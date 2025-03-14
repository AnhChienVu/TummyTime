// client\pages\baby\[id]\reminders\index.js
import React, { useState, useEffect } from "react";
import { Container, Button, Form, Modal } from "react-bootstrap";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faTrash,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./reminders.module.css";

/**
 * Converts "HH:mm:ss" or "HH:mm" (24-hour format) to "h:mm AM/PM"
 */
function formatTime12h(timeStr) {
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

const RemindersPage = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id } = router.query;

  const [reminders, setReminders] = useState([]);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [nextReminder, setNextReminderData] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [time, setTime] = useState({ hours: "9", minutes: "00", period: "AM" });
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [nextReminderEnabled, setNextReminderEnabled] = useState(false);
  const [reminderIn, setReminderIn] = useState("1.5 hrs");

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v1`;

  // Show title required error message
  const showTitleRequired = () => {
    showToast(t("Title field is required"), "error");
  };

  // Fetch reminders on mount (and whenever baby ID changes)
  useEffect(() => {
    if (!id) return;
    fetchReminders();
  }, [id]);

  // Update the "next reminder" banner every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (reminders.length > 0) {
        findNextDueReminder(reminders);
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [reminders]);

  /**
   * Fetch reminders from the API
   */
  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      console.log(`Fetching reminders for baby ID: ${id}`);

      const response = await fetch(`${API_BASE_URL}/baby/${id}/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to load reminders");
        } catch (parseErr) {
          throw new Error(`Failed to load reminders: ${response.status}`);
        }
      }

      const responseText = await response.text();
      console.log(`Raw API response length: ${responseText.length} chars`);
      if (responseText.length < 500)
        console.log(`Full response: ${responseText}`);

      // Parse the JSON response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log(
          "Parsed response data structure:",
          Object.keys(responseData),
        );
      } catch (parseErr) {
        console.error("Failed to parse response as JSON:", parseErr);
        throw new Error("Invalid response format");
      }

      // Handle different response formats
      let remindersArray = [];

      if (responseData && typeof responseData === "object") {
        // Check if it has numeric keys (special format)
        const keys = Object.keys(responseData);
        const numericKeys = keys.filter((k) => !isNaN(parseInt(k)));

        if (numericKeys.length > 0) {
          console.log(`Found ${numericKeys.length} numeric keys in response`);

          // Extract reminders from numeric keys, filtering out non-reminder props like "status"
          remindersArray = numericKeys
            .map((key) => responseData[key])
            .filter(
              (item) => item && typeof item === "object" && item.reminder_id,
            );

          console.log(
            `Extracted ${remindersArray.length} reminders from object keys`,
          );
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // Standard { status, data } format
          remindersArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          // Direct array response
          remindersArray = responseData;
        }
      }

      if (remindersArray.length > 0) {
        console.log("First reminder sample:", remindersArray[0]);
      } else {
        console.log("No reminders found in response");
      }

      // Map the reminders to frontend format with consistent field naming
      const fetchedReminders = remindersArray
        .map((reminder) => {
          if (!reminder) return null;

          try {
            return {
              id: reminder.reminder_id,
              babyId: reminder.baby_id,
              title: reminder.title || "Untitled",
              time: reminder.time || "12:00",
              note: reminder.notes || "",
              date: reminder.date ? new Date(reminder.date) : new Date(),
              isActive:
                reminder.is_active !== undefined ? reminder.is_active : true,
              selected: false,
              nextReminder: reminder.next_reminder || false,
              reminderIn: reminder.reminder_in || "1.5 hrs",
              createdAt: reminder.created_at,
              updatedAt: reminder.updated_at,
            };
          } catch (err) {
            console.error(
              `Error mapping reminder ${reminder.reminder_id}:`,
              err,
            );
            return null;
          }
        })
        .filter(Boolean);

      console.log(
        `Processed ${fetchedReminders.length} valid reminders for display`,
      );

      setReminders(fetchedReminders);
      findNextDueReminder(fetchedReminders);
    } catch (err) {
      console.error("Error in fetchReminders:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  // Find the next upcoming reminder for "today"
  const findNextDueReminder = (remindersList) => {
    if (!remindersList || remindersList.length === 0) {
      setNextReminderData(null);
      return;
    }

    const now = new Date();
    const today = now.toDateString();
    const activeReminders = remindersList.filter((r) => r.isActive);

    if (activeReminders.length === 0) {
      setNextReminderData(null);
      return;
    }

    const todaysReminders = activeReminders.filter(
      (reminder) => reminder.date && reminder.date.toDateString() === today,
    );

    // Sort today's reminders by time
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

    // Find upcoming reminders (time > now)
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

    // If we have an upcoming reminder, set the next one
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

      // Format that time in 12-hour format
      let hours = parseInt(timeParts[0]);
      let minutes = timeParts[1] || "00";
      const ampm = hours >= 12 ? "PM" : "AM";
      if (hours === 0) {
        hours = 12;
      } else if (hours > 12) {
        hours -= 12;
      }
      const formattedTime = `${hours}:${minutes} ${ampm}`;

      setNextReminderData({
        reminder: next,
        timeLeft: timeText,
        formattedTime,
      });
    } else {
      setNextReminderData(null);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteMode(false);
    // Clear any selected reminders
    const updatedReminders = reminders.map((r) => ({ ...r, selected: false }));
    setReminders(updatedReminders);
  };

  const resetForm = () => {
    // Reset title and note
    setTitle("");
    setNote("");

    // Set current date
    const now = new Date();
    setReminderDate(now.toISOString().split("T")[0]);

    // Set current time (formatted for 12-hour display)
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";

    // Convert 24-hour format to 12-hour format
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    setTime({
      hours: hours.toString(),
      minutes: minutes,
      period: period,
    });

    // Reset reminder options
    setNextReminderEnabled(false);
    setReminderIn("1.5 hrs");
  };

  const handleShowAddModal = () => {
    resetForm(); // This will set current date and time
    setShowAddModal(true);
  };

  /**
   * Show edit modal with reminder data
   */
  const handleShowEditModal = (reminder) => {
    if (!reminder || !reminder.time) {
      console.error("Invalid reminder or missing time:", reminder);
      return;
    }

    // Save the original reminder object for reference
    setSelectedReminder(reminder);

    // Log for debugging
    console.log("Reminder being edited:", reminder);

    try {
      let timeParts = reminder.time.split(":");
      if (!timeParts || timeParts.length < 2) {
        throw new Error(`Invalid time format: ${reminder.time}`);
      }
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1] || "00";
      const period = hours >= 12 ? "PM" : "AM";
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      setTitle(reminder.title || "");
      setTime({ hours: hours.toString(), minutes, period });
      setNote(reminder.note || "");
      if (reminder.date) {
        try {
          const reminderDateString = new Date(reminder.date)
            .toISOString()
            .split("T")[0];
          setReminderDate(reminderDateString);
        } catch (dateErr) {
          console.error("Error parsing reminder date:", dateErr);
          setReminderDate(new Date().toISOString().split("T")[0]);
        }
      } else {
        setReminderDate(new Date().toISOString().split("T")[0]);
      }

      console.log("Setting nextReminderEnabled to:", reminder.nextReminder);
      console.log("Setting reminderIn to:", reminder.reminderIn);

      setNextReminderEnabled(reminder.nextReminder || false);
      setReminderIn(reminder.reminderIn || "1.5 hrs");
      setShowEditModal(true);
    } catch (err) {
      console.error("Error parsing reminder time:", err);
      showToast("Error editing reminder. Invalid time format.", "error");
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    if (deleteMode) {
      // Exiting delete mode, clear selections
      const updatedReminders = reminders.map((r) => ({
        ...r,
        selected: false,
      }));
      setReminders(updatedReminders);
    }
  };

  const handleShowDeleteModal = () => {
    const selectedReminders = reminders.filter((r) => r.selected);
    if (selectedReminders.length > 0) {
      setShowDeleteModal(true);
    } else {
      showToast("Please select at least one reminder to delete", "error");
    }
  };

  /**
   * Add a new reminder with snake_case field names to match the database
   */
  const handleAddReminder = async () => {
    try {
      if (!title.trim()) {
        showToast("Please enter a title", "error");
        return;
      }
      let hours = parseInt(time.hours);
      if (isNaN(hours) || hours < 1 || hours > 12) {
        showToast("Please enter a valid hour (1-12)", "error");
        return;
      }
      let minutes = parseInt(time.minutes);
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        showToast("Please enter valid minutes (0-59)", "error");
        return;
      }
      if (!reminderDate) {
        showToast("Please select a date", "error");
        return;
      }

      // Format the time in 24-hour format
      if (time.period === "PM" && hours < 12) {
        hours += 12;
      } else if (time.period === "AM" && hours === 12) {
        hours = 0;
      }
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${time.minutes.padStart(2, "0")}`;

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Match database field names (snake_case)
      const reminderData = {
        baby_id: parseInt(id), // Ensure it's a number
        title,
        time: formattedTime,
        date: reminderDate,
        notes: note,
        is_active: true,
        next_reminder: nextReminderEnabled,
        reminder_in: nextReminderEnabled ? reminderIn : null,
      };

      console.log("Adding reminder with data:", reminderData);

      const response = await fetch(`${API_BASE_URL}/baby/${id}/reminders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      });

      const responseText = await response.text();
      console.log(
        `Add reminder API response (${response.status}): ${responseText}`,
      );

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || "Failed to add reminder");
        } catch (parseErr) {
          throw new Error(`Failed to add reminder: ${response.status}`);
        }
      }

      await fetchReminders();
      handleCloseAddModal();
      showToast("Reminder added successfully", "success");
    } catch (err) {
      console.error("Error adding reminder:", err);
      showToast(err.message || "Failed to add reminder", "error");
    }
  };

  /**
   * Update a reminder using the proper PUT endpoint
   */
  const handleUpdateReminder = async () => {
    if (!selectedReminder) {
      console.error("No reminder selected for update");
      return;
    }

    try {
      if (!title.trim()) {
        showToast("Please enter a title", "error");
        return;
      }
      let hours = parseInt(time.hours);
      if (isNaN(hours) || hours < 1 || hours > 12) {
        showToast("Please enter a valid hour (1-12)", "error");
        return;
      }
      let minutes = parseInt(time.minutes);
      if (isNaN(minutes) || minutes < 0 || minutes > 59) {
        showToast("Please enter valid minutes (0-59)", "error");
        return;
      }
      if (!reminderDate) {
        showToast("Please select a date", "error");
        return;
      }

      // Format the time in 24-hour format
      if (time.period === "PM" && hours < 12) {
        hours += 12;
      } else if (time.period === "AM" && hours === 12) {
        hours = 0;
      }
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${time.minutes.padStart(2, "0")}`;

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Log the current reminder being updated
      console.log("Selected reminder for update:", selectedReminder);

      // Prepare data using snake_case field names to match the server-side model
      const reminderData = {
        title,
        time: formattedTime,
        date: reminderDate,
        notes: note,
        is_active: selectedReminder.isActive,
        next_reminder: nextReminderEnabled,
        reminder_in: nextReminderEnabled ? reminderIn : null,
      };

      console.log(
        `Updating reminder ID=${selectedReminder.id} with data:`,
        reminderData,
      );

      // Use the PUT endpoint for updates
      const updateResponse = await fetch(
        `${API_BASE_URL}/baby/${id}/reminders/${selectedReminder.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminderData),
        },
      );

      const updateResponseText = await updateResponse.text();
      console.log(
        `Update response (${updateResponse.status}): ${updateResponseText}`,
      );

      if (!updateResponse.ok) {
        try {
          const errorData = JSON.parse(updateResponseText);
          throw new Error(
            errorData.message ||
              `Failed to update reminder: ${updateResponse.status}`,
          );
        } catch (parseErr) {
          throw new Error(
            `Failed to update reminder: ${updateResponse.status}`,
          );
        }
      }

      await fetchReminders();
      handleCloseEditModal();
      showToast("Reminder updated successfully", "success");
    } catch (err) {
      console.error("Error updating reminder:", err);
      showToast(err.message || "Failed to update reminder", "error");
    }
  };

  /**
   * Delete selected reminders with improved handling to ensure UI updates correctly
   */
  const handleDeleteReminders = async () => {
    try {
      const selectedReminderIds = reminders
        .filter((r) => r.selected)
        .map((r) => r.id);

      if (selectedReminderIds.length === 0) return;

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Optimistic UI update - store current state in case we need to revert
      const previousReminders = [...reminders];
      const updatedReminders = reminders.filter((r) => !r.selected);
      setReminders(updatedReminders);

      console.log(`Deleting reminders: ${selectedReminderIds.join(", ")}`);

      // Close modal early for better user experience
      handleCloseDeleteModal();

      // Use bulk delete with the correct endpoint and body format
      const response = await fetch(`${API_BASE_URL}/baby/${id}/reminders`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reminderIds: selectedReminderIds }),
      });

      const responseText = await response.text();
      console.log(`Delete response: ${response.status} - ${responseText}`);

      if (!response.ok) {
        // Revert optimistic update on error
        setReminders(previousReminders);
        throw new Error(`Failed to delete reminders: ${response.status}`);
      }

      // Add a small delay to ensure server has processed the deletion
      // before fetching the updated reminders list
      setTimeout(async () => {
        try {
          await fetchReminders();
          showToast("Reminder(s) deleted successfully", "success");
        } catch (fetchErr) {
          console.error("Error refreshing reminders after deletion:", fetchErr);
          // We already have the optimistic UI update, so just show success toast
          showToast("Reminder(s) deleted successfully", "success");
        }
      }, 500); // 500ms delay gives the server time to process
    } catch (err) {
      console.error("Error in handleDeleteReminders:", err);
      showToast(err.message || "Failed to delete reminders", "error");
      await fetchReminders(); // Try to refresh data on error
    }
  };

  const toggleReminderSelection = (id) => {
    const updatedReminders = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, selected: !r.selected };
      }
      return r;
    });
    setReminders(updatedReminders);
  };

  /**
   * Toggle a reminder's active state using the PUT endpoint
   */
  const toggleReminderActive = async (id) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Update UI optimistically
      const updatedReminders = reminders.map((r) => {
        if (r.id === id) {
          return { ...r, isActive: !r.isActive };
        }
        return r;
      });
      setReminders(updatedReminders);

      console.log(
        `Toggling active state for reminder ID=${id} to:`,
        !reminder.isActive,
      );

      // Prepare data for the update using proper field naming
      const updateData = {
        title: reminder.title,
        time: reminder.time,
        date:
          reminder.date instanceof Date
            ? reminder.date.toISOString().split("T")[0]
            : reminder.date,
        notes: reminder.note,
        is_active: !reminder.isActive,
        next_reminder: reminder.nextReminder,
        reminder_in: reminder.reminderIn,
      };

      // Use the PUT endpoint to update the active state
      const updateResponse = await fetch(
        `${API_BASE_URL}/baby/${id}/reminders/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!updateResponse.ok) {
        const updateResponseText = await updateResponse.text();
        console.error(`Failed to toggle reminder: ${updateResponseText}`);
        throw new Error(`Failed to update reminder: ${updateResponse.status}`);
      }

      await fetchReminders();
      findNextDueReminder(updatedReminders);
    } catch (err) {
      showToast(err.message || "Failed to update reminder", "error");
      // Revert local state on error
      await fetchReminders();
    }
  };

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format the day and check if it's "today"
  const formatDay = (date) => {
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
  };

  // Group reminders by date
  const groupedReminders = reminders.reduce((acc, reminder) => {
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

  // Loading state
  if (loading) {
    return (
      <Container className={styles.container}>
        <div className={styles.noDataContainer}>
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className={styles.container}>
        <div className={styles.noDataContainer}>
          <p className={styles.errorText}>{error}</p>
          <Button
            variant="light"
            className={styles.btnSave}
            onClick={fetchReminders}
          >
            {t("Try Again")}
          </Button>
        </div>
      </Container>
    );
  }

  // No reminders
  if (reminders.length === 0) {
    return (
      <Container className={styles.container}>
        {toastMessage && (
          <div className={styles.toastContainer}>
            <div className={styles.toastMessage}>
              <div
                className={`${styles.toastIconCircle} ${
                  toastMessage.type === "error" ? styles.error : ""
                }`}
              >
                {toastMessage.type === "success" ? "✓" : "✗"}
              </div>
              {toastMessage.message}
              <button
                className={styles.toastClose}
                onClick={() => setToastMessage(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className={styles.headerRow}>
          <h1 className={styles.title}>{t("Reminders")}</h1>
        </div>

        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateContent}>
            <FontAwesomeIcon icon={faClock} className={styles.emptyStateIcon} />
            <h3>{t("No reminders yet")}</h3>
            <p>{t("Create your first reminder to get started")}</p>
            <Button
              variant="light"
              className={styles.btnSave}
              onClick={handleShowAddModal}
            >
              {t("Add Reminder")}
            </Button>
          </div>
        </div>

        {/* Add Reminder Modal */}
        <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t("Add a reminder")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>{t("Title")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t("Title")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("Date")}</Form.Label>
                <Form.Control
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("Time")}</Form.Label>
                <div className={styles.timeRow}>
                  <div className={styles.timeSegment}>
                    <input
                      type="number"
                      className={styles.timeBox}
                      value={time.hours}
                      onChange={(e) =>
                        setTime({ ...time, hours: e.target.value })
                      }
                      min="1"
                      max="12"
                    />
                    <span className={styles.colon}>:</span>
                    <input
                      type="number"
                      className={styles.timeBox}
                      value={time.minutes}
                      onChange={(e) => {
                        const newMinutes = e.target.value || "00";
                        setTime({
                          ...time,
                          minutes: newMinutes.padStart(2, "0"),
                        });
                      }}
                      min="0"
                      max="59"
                    />
                  </div>
                  <div className={styles.amPmSegment}>
                    <button
                      type="button"
                      className={
                        time.period === "AM"
                          ? styles.amPmBtnActive
                          : styles.amPmBtn
                      }
                      onClick={() => setTime({ ...time, period: "AM" })}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={
                        time.period === "PM"
                          ? styles.amPmBtnActive
                          : styles.amPmBtn
                      }
                      onClick={() => setTime({ ...time, period: "PM" })}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>{t("Note")}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={t("Leave a note")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Form.Group>

              <div className={styles.reminderRow}>
                <Form.Check
                  type="switch"
                  id="next-reminder-switch"
                  label={t("Next reminder")}
                  checked={nextReminderEnabled}
                  onChange={() => setNextReminderEnabled(!nextReminderEnabled)}
                />
                {nextReminderEnabled && (
                  <div className="mt-2">
                    <p className={styles.reminderInfo}>{t("Remind me in")}</p>
                    <Form.Select
                      value={reminderIn}
                      onChange={(e) => setReminderIn(e.target.value)}
                      style={{ width: "120px" }}
                    >
                      <option value="1 hr">1 hr</option>
                      <option value="1.5 hrs">1.5 hrs</option>
                      <option value="2 hrs">2 hrs</option>
                      <option value="3 hrs">3 hrs</option>
                      <option value="4 hrs">4 hrs</option>
                    </Form.Select>
                  </div>
                )}
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="light"
              className={styles.btnCancel}
              onClick={handleCloseAddModal}
            >
              {t("Cancel")}
            </Button>
            <Button
              className={title.trim() ? styles.btnSave : styles.btnDisabled}
              onClick={title.trim() ? handleAddReminder : showTitleRequired}
            >
              {t("Add")}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

  // Normal state: reminders exist
  return (
    <Container className={styles.container}>
      {/* Toast Messages */}
      {toastMessage && (
        <div className={styles.toastContainer}>
          <div className={styles.toastMessage}>
            <div
              className={`${styles.toastIconCircle} ${
                toastMessage.type === "error" ? styles.error : ""
              }`}
            >
              {toastMessage.type === "success" ? "✓" : "✗"}
            </div>
            {toastMessage.message}
            <button
              className={styles.toastClose}
              onClick={() => setToastMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{t("Reminders")}</h1>
        <div className={styles.headerActions}>
          <Button
            variant="light"
            className={styles.btnSave}
            onClick={handleShowAddModal}
          >
            {t("Add")}
          </Button>
          <Button
            variant="light"
            className={deleteMode ? styles.btnActive : styles.btnCancel}
            onClick={toggleDeleteMode}
          >
            {t("Delete")}
          </Button>
          {deleteMode && (
            <Button
              variant="light"
              className={styles.btnDelete}
              onClick={handleShowDeleteModal}
              disabled={!reminders.some((r) => r.selected)}
            >
              {t("Confirm Delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Next Reminder Banner */}
      {nextReminder && (
        <div className={styles.nextReminderBanner}>
          <div className={styles.reminderCircle}>
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className={styles.reminderContent}>
            <h3 className={styles.reminderTitle}>
              {nextReminder.reminder.title}
            </h3>
            <p className={styles.reminderSubtext}>
              {t("Next reminder due in")} {nextReminder.timeLeft} {t("at")}{" "}
              {nextReminder.formattedTime}
            </p>
          </div>
        </div>
      )}

      {/* Grouped Reminders by Date */}
      {Object.keys(groupedReminders).map((dateStr) => {
        const { date, dateText, isToday } = formatDay(dateStr);
        const dateReminders = groupedReminders[dateStr];

        return (
          <div key={dateStr} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayInfo}>
                {isToday ? (
                  <div className={styles.dateCircle}>{date}</div>
                ) : (
                  <div className={styles.dateNoCircle}>{date}</div>
                )}
                <div className={styles.dateText}>{dateText}</div>
              </div>
              {isToday && (
                <div className={styles.dayHeaderRight}>
                  <span className={styles.todayMeals}>{t("Today")}</span>
                </div>
              )}
            </div>

            <table className={styles.mealsTable}>
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>{t("Title")}</th>
                  <th style={{ width: "15%" }}>{t("Time")}</th>
                  <th style={{ width: "40%" }}>{t("Notes")}</th>
                  <th style={{ width: "15%" }}></th>
                </tr>
              </thead>
              <tbody>
                {dateReminders.map((reminder) => (
                  <tr key={reminder.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {deleteMode && (
                          <div
                            className={`${styles.reminderCheckbox} ${
                              reminder.selected ? styles.checked : ""
                            }`}
                            onClick={() => toggleReminderSelection(reminder.id)}
                          ></div>
                        )}
                        {reminder.title}
                      </div>
                    </td>
                    {/* Display time in 12-hour format */}
                    <td>{formatTime12h(reminder.time)}</td>
                    <td>{reminder.note}</td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleShowEditModal(reminder)}
                      >
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </button>
                      <Form.Check
                        type="switch"
                        id={`reminder-switch-${reminder.id}`}
                        checked={reminder.isActive}
                        onChange={() => toggleReminderActive(reminder.id)}
                        className={styles.reminderSwitch}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Add Reminder Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Add a reminder")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("Title")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t("Title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Date")}</Form.Label>
              <Form.Control
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Time")}</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.hours}
                    onChange={(e) =>
                      setTime({ ...time, hours: e.target.value })
                    }
                    min="1"
                    max="12"
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.minutes}
                    onChange={(e) => {
                      const newMinutes = e.target.value || "00";
                      setTime({
                        ...time,
                        minutes: newMinutes.padStart(2, "0"),
                      });
                    }}
                    min="0"
                    max="59"
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={
                      time.period === "AM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "AM" })}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={
                      time.period === "PM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "PM" })}
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Note")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={t("Leave a note")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Form.Group>

            <div className={styles.reminderRow}>
              <Form.Check
                type="switch"
                id="next-reminder-switch"
                label={t("Next reminder")}
                checked={nextReminderEnabled}
                onChange={() => setNextReminderEnabled(!nextReminderEnabled)}
              />
              {nextReminderEnabled && (
                <div className="mt-2">
                  <p className={styles.reminderInfo}>{t("Remind me in")}</p>
                  <Form.Select
                    value={reminderIn}
                    onChange={(e) => setReminderIn(e.target.value)}
                    style={{ width: "120px" }}
                  >
                    <option value="1 hr">1 hr</option>
                    <option value="1.5 hrs">1.5 hrs</option>
                    <option value="2 hrs">2 hrs</option>
                    <option value="3 hrs">3 hrs</option>
                    <option value="4 hrs">4 hrs</option>
                  </Form.Select>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className={styles.btnCancel}
            onClick={handleCloseAddModal}
          >
            {t("Cancel")}
          </Button>
          <Button
            className={title.trim() ? styles.btnSave : styles.btnDisabled}
            onClick={title.trim() ? handleAddReminder : showTitleRequired}
          >
            {t("Add")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Reminder")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("Title")}</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Date")}</Form.Label>
              <Form.Control
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Time")}</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.hours}
                    onChange={(e) =>
                      setTime({ ...time, hours: e.target.value })
                    }
                    min="1"
                    max="12"
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.minutes}
                    onChange={(e) => {
                      const newMinutes = e.target.value || "00";
                      setTime({
                        ...time,
                        minutes: newMinutes.padStart(2, "0"),
                      });
                    }}
                    min="0"
                    max="59"
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={
                      time.period === "AM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "AM" })}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={
                      time.period === "PM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "PM" })}
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Note")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Form.Group>

            <div className={styles.reminderRow}>
              <Form.Check
                type="switch"
                id="edit-next-reminder-switch"
                label={t("Next reminder")}
                checked={nextReminderEnabled}
                onChange={() => setNextReminderEnabled(!nextReminderEnabled)}
              />
              {nextReminderEnabled && (
                <div className="mt-2">
                  <p className={styles.reminderInfo}>{t("Remind me in")}</p>
                  <Form.Select
                    value={reminderIn}
                    onChange={(e) => setReminderIn(e.target.value)}
                    style={{ width: "120px" }}
                  >
                    <option value="1 hr">1 hr</option>
                    <option value="1.5 hrs">1.5 hrs</option>
                    <option value="2 hrs">2 hrs</option>
                    <option value="3 hrs">3 hrs</option>
                    <option value="4 hrs">4 hrs</option>
                  </Form.Select>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className={styles.btnCancel}
            onClick={handleCloseEditModal}
          >
            {t("Cancel")}
          </Button>
          <Button
            className={title.trim() ? styles.btnSave : styles.btnDisabled}
            onClick={title.trim() ? handleUpdateReminder : showTitleRequired}
          >
            {t("Update")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Delete Reminder")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("Are you sure? The selected reminder(s) will be deleted.")}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className={styles.btnCancel}
            onClick={handleCloseDeleteModal}
          >
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={handleDeleteReminders}>
            {t("Yes")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RemindersPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
