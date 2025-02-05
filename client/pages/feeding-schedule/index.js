import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { parseISO, format, compareDesc, isAfter, isBefore } from "date-fns";
import { AiOutlineInfoCircle } from "react-icons/ai";
import styles from "./feeding-schedule.module.css";
import BabyCard from "@/components/BabyCard/BabyCard";
import { useRouter } from "next/router";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function getLocalTodayString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offsetMs);
  return localTime.toISOString().split("T")[0];
}

function getCurrentLocalTimeParts() {
  const now = new Date();
  const hh = now.getHours();
  const mm = now.getMinutes();
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 || 12;
  return {
    hour: String(hour12),
    minute: String(mm).padStart(2, "0"),
    amPm: ampm,
  };
}

function formatTime(h, m, ampm) {
  return `${h}:${m} ${ampm}`;
}

function generateCSV(dayArray) {
  let csv = "Date,Meal,Time,Type,Amount,Issue,Notes\n";
  dayArray.forEach((day) => {
    if (day.meals && day.meals.length > 0) {
      day.meals.forEach((m) => {
        const row = [
          day.date,
          m.meal,
          m.time,
          m.type,
          m.amount || 0,
          m.issues || "None",
          m.notes || "None",
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",");
        csv += row + "\n";
      });
    }
  });
  return csv;
}

function downloadCSV(csvString, fileName = "feeding-schedule.csv") {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ToastMessage = ({ message, variant = "success", onClose }) => (
  <div className={styles.toastMessage}>
    <div
      className={
        variant === "error"
          ? `${styles.toastIconCircle} ${styles.error}`
          : variant === "warning"
          ? `${styles.toastIconCircle} ${styles.warning}`
          : styles.toastIconCircle
      }
    >
      <AiOutlineInfoCircle />
    </div>
    <span>{message}</span>
    <button className={styles.toastClose} onClick={onClose}>
      ×
    </button>
  </div>
);

const ToastContainer = ({ toasts, removeToast }) => (
  <div className={styles.toastContainer}>
    {toasts.map((toast) => (
      <ToastMessage
        key={toast.id}
        message={toast.message}
        variant={toast.variant}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </div>
);

let toastIdCounter = 1;
const createToastId = () => {
  return toastIdCounter++;
};

const FeedingSchedule = () => {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const [scheduleData, setScheduleData] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [meal, setMeal] = useState("");
  const [hour, setHour] = useState("1");
  const [minute, setMinute] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [type, setType] = useState("Baby formula");
  const [amount, setAmount] = useState("");
  const [issues, setIssues] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState("");
  const [exportModalShow, setExportModalShow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportError, setExportError] = useState("");
  const [addFeedModalShow, setAddFeedModalShow] = useState(false);
  const [newMeal, setNewMeal] = useState("Breakfast");
  const [newHour, setNewHour] = useState("9");
  const [newMinute, setNewMinute] = useState("41");
  const [newAmPm, setNewAmPm] = useState("AM");
  const [newType, setNewType] = useState("Baby formula");
  const [newAmount, setNewAmount] = useState("");
  const [newIssues, setNewIssues] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newModalError, setNewModalError] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [remindMinutes, setRemindMinutes] = useState("30");
  const [toasts, setToasts] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);

  // TODO Replace with actual API calls (edit and delete operations)
  const mockApi = {
    updateSchedule: (updatedSchedule) =>
      Promise.resolve({ success: true, data: updatedSchedule }),
  };

  useEffect(() => {
    // async function fetchFeedingSchedules() {
    //   try {
    //     const res = await fetch("http://localhost:8080/v1/getFeedingSchedules");
    //     const data = await res.json();
    //     console.debug("Fetched data:", data);
    //     if (res.ok) {
    //       // Convert the response to an array of feeding schedules
    //       const feedingScheduleArray = Object.keys(data)
    //         .filter((key) => key !== "status")
    //         .map((key) => data[key]);
    //       setScheduleData(feedingScheduleArray);
    //     } else {
    //       console.error("Failed to fetch feeding schedule data:", data);
    //     }
    //   } catch (error) {
    //     console.error("Error fetching feeding schedules:", error);
    //   }
    // }

    async function updateSchedule(updatedSchedule) {
      const res = await fetch("http://localhost:8080/v1/updateFeedingSchedule");
      const data = await res.json();
    }

    // fetchFeedingSchedules();
  }, []);

  const formatDate = (dateString) => {
    const parsed = parseISO(dateString);
    return {
      dayNumber: format(parsed, "d"),
      restOfDate: format(parsed, "MMM, EEE yyyy"),
    };
  };

  console.log("LINE 180: scheduleData", scheduleData);
  let sortedData = [...scheduleData].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date)),
  );

  // console.debug("sortedData", sortedData);

  let hasAnyMeals = sortedData.some((d) => d.meal && d.meal.length > 0);
  // console.debug("hasAnyMeals", hasAnyMeals);

  const showToast = (message, variant = "success") => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // const handleOpenExportModal = () => {
  //   if (!hasAnyMeals) {
  //     showToast("No feed data found. Add data before exporting.", "warning");
  //     return;
  //   }
  //   setStartDate("");
  //   setEndDate("");
  //   setExportError("");
  //   setExportModalShow(true);
  // };

  // EXPORT data
  const handleExport = () => {
    if (!startDate || !endDate) {
      setExportError("Please select a valid start and end date.");
      return;
    }
    let sDate = parseISO(startDate);
    let eDate = parseISO(endDate);
    if (isAfter(sDate, eDate)) {
      [sDate, eDate] = [eDate, sDate];
    }
    const filtered = scheduleData.filter((day) => {
      const dayDate = parseISO(day.date);
      return !isBefore(dayDate, sDate) && !isAfter(dayDate, eDate);
    });
    const foundMeals = filtered.some((d) => d.meals && d.meals.length > 0);
    if (!foundMeals) {
      setExportModalShow(false);
      showToast("No feed data found in that range.", "warning");
      return;
    }
    const csvString = generateCSV(filtered);
    downloadCSV(csvString);
    setExportModalShow(false);
    showToast("Exported successfully!");
  };

  const handleOpenModal = (mealItem, date) => {
    setModalError("");
    setSelectedMeal(mealItem);
    setSelectedDate(date);
    if (mealItem) {
      setMeal(mealItem.meal);
      const parts = /(\d+):(\d+)\s?(AM|PM)/i.exec(mealItem.time || "");
      if (parts) {
        setHour(parts[1]);
        setMinute(parts[2]);
        setAmPm(parts[3].toUpperCase());
      } else {
        const { hour, minute, amPm } = getCurrentLocalTimeParts();
        setHour(hour);
        setMinute(minute);
        setAmPm(amPm);
      }
      setType(mealItem.type || "Baby formula");
      setAmount(String(mealItem.amount || ""));
      setIssues(mealItem.issues || "");
      setNotes(mealItem.notes || "");
    } else {
      setMeal("Breakfast");
      const { hour, minute, amPm } = getCurrentLocalTimeParts();
      setHour(hour);
      setMinute(minute);
      setAmPm(amPm);
      setType("Baby formula");
      setAmount("");
      setIssues("");
      setNotes("");
    }
    setModalShow(true);
  };

  // SAVE meal
  const handleSaveMeal = async () => {
    setModalError("");
    const parsedHour = parseInt(hour, 10);
    const parsedMinute = parseInt(minute, 10);
    if (
      parsedHour < 1 ||
      parsedHour > 12 ||
      parsedMinute < 0 ||
      parsedMinute > 59
    ) {
      setModalError(
        "Please enter a valid time (1-12 for hour, 0-59 for minute).",
      );
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      setModalError("Amount must be greater than 0.");
      return;
    }
    const timeStr = formatTime(
      parsedHour,
      String(parsedMinute).padStart(2, "0"),
      amPm,
    );
    const updated = scheduleData.map((day) => {
      if (day.date === selectedDate) {
        const updatedMeals = selectedMeal
          ? day.meals.map((m) =>
              m === selectedMeal
                ? {
                    meal,
                    time: timeStr,
                    type,
                    amount: parsedAmount,
                    issues,
                    notes,
                  }
                : m,
            )
          : [
              ...day.meals,
              {
                meal,
                time: timeStr,
                type,
                amount: parsedAmount,
                issues,
                notes,
              },
            ];
        return { ...day, meals: updatedMeals };
      }
      return day;
    });
    try {
      const res = await mockApi.updateSchedule(updated);
      if (res.success) {
        setScheduleData(res.data);
        setModalShow(false);
        showToast("Feed saved! The next feed is due in 2 hours.");
      }

      // Make API call to add schedule
      const response = await fetch("http://localhost:8080/v1/addSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          time: timeStr,
          meal: meal,
          amount: parsedAmount,
          type,
          issues,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Feed saved to server!");
      } else {
        showToast("Failed to save feed to server.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error saving feed to server.", "danger");
    }
  };

  // DELETE meal
  const handleDeleteMeal = (mealItem, date) => {
    const updated = scheduleData.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          meals: day.meals.filter((m) => m !== mealItem),
        };
      }
      return day;
    });
    mockApi.updateSchedule(updated).then((res) => {
      if (res.success) {
        setScheduleData(res.data);
        showToast("Feed deleted.", "warning");
      }
    });
  };

  const handleOpenAddFeedModal = (baby_id) => {
    setNewModalError("");
    setNewMeal("Breakfast");
    const { hour, minute, amPm } = getCurrentLocalTimeParts();
    setNewHour(hour);
    setNewMinute(minute);
    setNewAmPm(amPm);
    setNewType("Baby formula");
    setNewAmount("");
    setNewIssues("");
    setNewNote("");
    setReminderEnabled(false);
    setRemindMinutes("30");
    setAddFeedModalShow(true);
    setSelectedBaby(baby_id);
  };

  const handleSaveNewFeed = async () => {
    setNewModalError("");
    const parsedHour = parseInt(newHour, 10);
    const parsedMinute = parseInt(newMinute, 10);
    if (
      parsedHour < 1 ||
      parsedHour > 12 ||
      parsedMinute < 0 ||
      parsedMinute > 59
    ) {
      setNewModalError(
        "Please enter a valid time (1-12 for hour, 0-59 for minute).",
      );
      return;
    }
    const parsedAmount = parseFloat(newAmount) || 0;
    if (parsedAmount <= 0) {
      setNewModalError("Amount must be greater than 0.");
      return;
    }
    const timeStr = formatTime(
      parsedHour,
      String(parsedMinute).padStart(2, "0"),
      newAmPm,
    );
    const newFeed = {
      meal: newMeal,
      time: timeStr,
      type: newType,
      amount: parsedAmount,
      issues: newIssues || "",
      notes: newNote || "",
      reminderOn: reminderEnabled,
      remindIn: remindMinutes,
    };
    const todayString = getLocalTodayString();
    let foundToday = false;

    try {
      // Add new feed to database
      const res = await fetch(
        `http://localhost:8080/v1/baby/${selectedBaby}/addFeedingSchedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            meal: newMeal,
            time: timeStr,
            type: newType,
            amount: parsedAmount,
            issues: newIssues,
            notes: newNote,
            date: todayString,
          }),
        },
      );

      const data = await res.json();

      if (data.status === "ok") {
        setModalShow(false);
        showToast("Feed added to server!");
        router.reload();
      } else {
        showToast("Failed to add feed to server.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error adding feed to server.", "danger");
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      {/* <ToastContainer toasts={toasts} removeToast={removeToast} /> */}

      <div className={styles.container}>
        <Row>
          <Col>
            {/* {hasAnyMeals && (
              <div className={styles.feedDueBox}>
                <div className={styles.feedDueIcon}>
                  <FaBaby size={20} color="#674ea7" />
                </div>
                <div>
                  <p className={styles.feedDueMain}>Feed is due in 2 hours</p>
                  <p className={styles.feedDueSub}>
                    Last feed at 9:41 AM • 7 oz
                  </p>
                </div>
              </div>
            )} */}

            <div className={styles.headerRow}>
              <h1 className={styles.title}>{t("Feeding Schedule")}</h1>
              <div className={styles.headerActions}>
                {/* {hasAnyMeals && (
                  <Button
                    className={styles.exportBtn}
                    onClick={handleOpenExportModal}
                  >
                    Export
                  </Button>
                )} */}
                {/* <Button
                  className={styles.addFeedBtn}
                  onClick={handleOpenAddFeedModal}
                >
                  + Add Entry
                </Button> */}
              </div>
            </div>

            {/* {!hasAnyMeals && (
              <div className={styles.noDataContainer}>
                <p>No feed data found.</p>
                <p>
                  Click &quot;+ Add Entry&quot; to create your first feed entry!
                </p>
              </div>
            )} */}

            <BabyCard addMealBtn={handleOpenAddFeedModal} />

            {/* {sortedData.map((day, idx) => {
              if (!day.meals || day.meals.length === 0) return null;
              const { dayNumber, restOfDate } = formatDate(day.date);
              const today = isSameDay(new Date(), parseISO(day.date));
              return (
                <div key={idx} className={styles.dayCard}>
                  <div className={styles.dayHeader}>
                    <div className={styles.dayInfo}>
                      {today ? (
                        <div className={styles.dateCircle}>{dayNumber}</div>
                      ) : (
                        <div className={styles.dateNumber}>{dayNumber}</div>
                      )}
                      <span className={styles.dateText}>{restOfDate}</span>
                    </div>
                    <div className={styles.dayHeaderRight}>
                      <span className={styles.todayMeals}>Today’s Meals</span>
                    </div>
                  </div>
                  <table className={styles.mealsTable}>
                    <thead>
                      <tr>
                        <th>Meal</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Amount (oz)</th>
                        <th>Issue</th>
                        <th>Notes</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.meals.map((mealItem, mealIdx) => (
                        <tr key={mealIdx}>
                          <td>{mealItem.meal}</td>
                          <td>{mealItem.time}</td>
                          <td>{mealItem.type}</td>
                          <td>
                            {mealItem.amount > 0
                              ? mealItem.amount + " oz"
                              : "0 oz"}
                          </td>
                          <td>{mealItem.issues || "None"}</td>
                          <td>{mealItem.notes || "None"}</td>
                          <td className={styles.actionCell}>
                            <button
                              className={styles.editBtn}
                              onClick={() =>
                                handleOpenModal(mealItem, day.date)
                              }
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() =>
                                handleDeleteMeal(mealItem, day.date)
                              }
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })} */}

            <Modal show={modalShow} onHide={() => setModalShow(false)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {selectedMeal ? "Edit Meal" : "Add Meal"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {modalError && <Alert variant="danger">{modalError}</Alert>}
                <Form>
                  <Form.Group controlId="meal">
                    <Form.Label>Meal</Form.Label>
                    <Form.Select
                      value={meal}
                      onChange={(e) => setMeal(e.target.value)}
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="time" className="mt-3">
                    <Form.Label>Time</Form.Label>
                    <div className={styles.timeRow}>
                      <div className={styles.timeSegment}>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className={styles.timeBox}
                          value={hour}
                          placeholder="Hrs" /* NEW placeholder */
                          onChange={(e) => setHour(e.target.value)}
                        />
                        <span className={styles.colon}>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className={styles.timeBox}
                          value={minute}
                          placeholder="Min" /* NEW placeholder */
                          onChange={(e) => setMinute(e.target.value)}
                        />
                      </div>
                      <div className={styles.amPmSegment}>
                        <button
                          type="button"
                          className={
                            amPm === "AM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setAmPm("AM")}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={
                            amPm === "PM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setAmPm("PM")}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </Form.Group>
                  <Form.Group controlId="type" className="mt-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option>Baby formula</option>
                      <option>Breastmilk</option>
                      <option>Solid food</option>
                      <option>Snack</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="amount" className="mt-3">
                    <Form.Label>Amount (oz)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      placeholder="E.g. 7" /* NEW placeholder */
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="issues" className="mt-3">
                    <Form.Label>Issue</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Describe any feeding issues"
                      value={issues}
                      onChange={(e) => setIssues(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="notes" className="mt-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Any additional notes?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setModalShow(false)}
                >
                  Cancel
                </Button>
                <Button className={styles.btnSave} onClick={handleSaveMeal}>
                  Save
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal
              show={addFeedModalShow}
              onHide={() => setAddFeedModalShow(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Add a feed</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {newModalError && (
                  <Alert variant="danger">{newModalError}</Alert>
                )}
                <Form>
                  <Form.Group controlId="newMeal">
                    <Form.Label>Meal</Form.Label>
                    <Form.Select
                      value={newMeal}
                      onChange={(e) => setNewMeal(e.target.value)}
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="time" className="mt-3">
                    <Form.Label>Time</Form.Label>
                    <div className={styles.timeRow}>
                      <div className={styles.timeSegment}>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className={styles.timeBox}
                          value={newHour}
                          placeholder="Hrs" /* NEW placeholder */
                          onChange={(e) => setNewHour(e.target.value)}
                        />
                        <span className={styles.colon}>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className={styles.timeBox}
                          value={newMinute}
                          placeholder="Min" /* NEW placeholder */
                          onChange={(e) => setNewMinute(e.target.value)}
                        />
                      </div>
                      <div className={styles.amPmSegment}>
                        <button
                          type="button"
                          className={
                            newAmPm === "AM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setNewAmPm("AM")}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={
                            newAmPm === "PM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setNewAmPm("PM")}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </Form.Group>
                  <Form.Group controlId="newType" className="mt-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    >
                      <option>Baby formula</option>
                      <option>Breastmilk</option>
                      <option>Solid food</option>
                      <option>Snack</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="newAmount" className="mt-3">
                    <Form.Label>Amount (oz)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      placeholder="E.g. 7"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="newIssues" className="mt-3">
                    <Form.Label>Issue</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Describe any feeding issues"
                      value={newIssues}
                      onChange={(e) => setNewIssues(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="newNote" className="mt-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Any additional notes?"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </Form.Group>
                  <div className={`${styles.reminderRow} form-switch`}>
                    <Form.Check
                      type="switch"
                      id="reminderSwitch"
                      checked={reminderEnabled}
                      onChange={() => setReminderEnabled(!reminderEnabled)}
                      label="Next feed reminder"
                    />
                    {reminderEnabled && (
                      <>
                        <p className={styles.reminderInfo}>
                          You should be feeding your baby every 1–2 hours. Set a
                          reminder before your next feed.
                        </p>
                        <Form.Label>Remind me in</Form.Label>
                        <Form.Control
                          type="number"
                          placeholder="minutes"
                          value={remindMinutes}
                          onChange={(e) => setRemindMinutes(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setAddFeedModalShow(false)}
                >
                  Cancel
                </Button>
                <Button className={styles.btnSave} onClick={handleSaveNewFeed}>
                  Save
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal
              show={exportModalShow}
              onHide={() => setExportModalShow(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Export</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className={styles.exportModalSubtext}>
                  Select a date or date range to export feed data. It will be
                  exported to your desktop.
                </p>
                <Form>
                  <Form.Group controlId="exportDate" className="mb-3">
                    <Form.Label className={styles.exportModalLabel}>
                      Date
                    </Form.Label>
                    <div className={styles.exportDateRow}>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={styles.dateInput}
                      />
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                  </Form.Group>
                </Form>
                {exportError && (
                  <p className={styles.exportError}>{exportError}</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setExportModalShow(false)}
                >
                  Cancel
                </Button>
                <Button className={styles.btnSave} onClick={handleExport}>
                  Export
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default FeedingSchedule;
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
