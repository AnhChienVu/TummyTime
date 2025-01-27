import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import {
  parseISO,
  format,
  compareDesc,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { FaToilet, FaEdit, FaTrash } from "react-icons/fa"; // <-- Add FaTrash
import styles from "./stool.module.css";

function getLocalTodayString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  const localTime = new Date(now.getTime() - offsetMs);
  return localTime.toISOString().split("T")[0];
}

const mockApi = {
  fetchStoolData: () =>
    Promise.resolve([
      {
        date: getLocalTodayString(),
        changes: [
          {
            time: format(new Date(), "h:mm a"),
            color: "Brown",
            consistency: "A bit watery",
            notes: "Seems fine otherwise",
          },
        ],
      },
      {
        date: "2025-01-01",
        changes: [
          {
            time: "7:12 am",
            color: "Brown",
            consistency: "",
            notes: "Regular stool",
          },
          {
            time: "9:39 am",
            color: "Brown",
            consistency: "Soft",
            notes: "No issues",
          },
        ],
      },
    ]),
  updateStoolData: (updated) => Promise.resolve({ success: true, data: updated }),
};

function generateCSV(dayArray) {
  let csv = "Date,Time,Color,Consistency,Notes\n";
  dayArray.forEach((day) => {
    if (day.changes && day.changes.length) {
      day.changes.forEach((item) => {
        const row = [
          day.date,
          item.time || "",
          item.color || "",
          (item.consistency || "").replace(/[\r\n]+/g, " "),
          (item.notes || "").replace(/[\r\n]+/g, " "),
        ]
          .map((val) => `"${val.replace(/"/g, '""')}"`)
          .join(",");
        csv += row + "\n";
      });
    }
  });
  return csv;
}

function downloadCSV(csvString, fileName = "stool-changes.csv") {
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

function Stool() {
  const [stoolData, setStoolData] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fields for editing in the modal
  const [time, setTime] = useState("");
  const [color, setColor] = useState("");
  const [consistency, setConsistency] = useState("");
  const [notes, setNotes] = useState("");

  // “Add Entry” modal (top-right)
  const [addModalShow, setAddModalShow] = useState(false);
  const [newHour, setNewHour] = useState("9");
  const [newMinute, setNewMinute] = useState("41");
  const [newAmPm, setNewAmPm] = useState("AM");
  const [newColor, setNewColor] = useState("Brown");
  const [newConsistency, setNewConsistency] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Export modal
  const [exportModalShow, setExportModalShow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    mockApi.fetchStoolData().then((data) => setStoolData(data));
  }, []);

  const sortedData = [...stoolData].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date)),
  );

  function formatDate(dateString) {
    const parsed = parseISO(dateString);
    return {
      dayNumber: format(parsed, "d"),
      restOfDate: format(parsed, "MMM, EEE yyyy"),
    };
  }

  function handleOpenExportModal() {
    setStartDate("");
    setEndDate("");
    setExportError("");
    setExportModalShow(true);
  }

  function handleExport() {
    if (!startDate || !endDate) {
      setExportError("Please select a valid start and end date.");
      return;
    }
    let sDate = parseISO(startDate);
    let eDate = parseISO(endDate);
    if (isAfter(sDate, eDate)) {
      [sDate, eDate] = [eDate, sDate];
    }
    const filtered = stoolData.filter((day) => {
      const dayDate = parseISO(day.date);
      return !isBefore(dayDate, sDate) && !isAfter(dayDate, eDate);
    });
    const hasData = filtered.some((d) => d.changes && d.changes.length > 0);
    if (!hasData) {
      setExportError("No data found for the selected date range.");
      return;
    }
    const csvString = generateCSV(filtered);
    downloadCSV(csvString);
    setExportModalShow(false);
  }

  // Open the edit/add modal for a specific day
  function handleOpenModal(changeItem = null, date = null) {
    setSelectedChange(changeItem);
    setSelectedDate(date);

    if (changeItem) {
      setTime(changeItem.time || "");
      setColor(changeItem.color || "");
      setConsistency(changeItem.consistency || "");
      setNotes(changeItem.notes || "");
    } else {
      // Default fields
      setTime("7:00 am");
      setColor("Brown");
      setConsistency("");
      setNotes("");
    }
    setModalShow(true);
  }

  async function handleSaveChange() {
    const updated = stoolData.map((day) => {
      if (day.date === selectedDate) {
        let newChanges;
        if (selectedChange) {
          // Edit existing
          newChanges = day.changes.map((c) =>
            c === selectedChange
              ? { time, color, consistency, notes }
              : c,
          );
        } else {
          // Add new
          newChanges = [
            ...day.changes,
            { time, color, consistency, notes },
          ];
        }
        return { ...day, changes: newChanges };
      }
      return day;
    });

    const resp = await mockApi.updateStoolData(updated);
    if (resp.success) {
      setStoolData(resp.data);
      setModalShow(false);
    }
  }

  async function handleDeleteChange(changeItem, date) {
    // Optional: prompt user "Are you sure?" e.g. window.confirm()
    const updated = stoolData.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          changes: day.changes.filter((c) => c !== changeItem),
        };
      }
      return day;
    });
    const resp = await mockApi.updateStoolData(updated);
    if (resp.success) {
      setStoolData(resp.data);
    }
  }

  function handleOpenAddModal() {
    setNewHour("9");
    setNewMinute("41");
    setNewAmPm("AM");
    setNewColor("Brown");
    setNewConsistency("");
    setNewNotes("");
    setAddModalShow(true);
  }

  function handleSaveNewStool() {
    const timeString = `${newHour}:${newMinute} ${newAmPm}`;
    const newStool = {
      time: timeString,
      color: newColor,
      consistency: newConsistency,
      notes: newNotes,
    };

    const todayString = getLocalTodayString();
    let foundToday = false;
    const updated = stoolData.map((day) => {
      if (day.date === todayString) {
        foundToday = true;
        return { ...day, changes: [...day.changes, newStool] };
      }
      return day;
    });
    if (!foundToday) {
      updated.push({ date: todayString, changes: [newStool] });
    }

    mockApi.updateStoolData(updated).then((resp) => {
      if (resp.success) {
        setStoolData(resp.data);
        setAddModalShow(false);
      }
    });
  }

  return (
    <div className={styles.container}>
      {/* Top info box */}
      <div className={styles.feedDueBox}>
        <div className={styles.feedDueIcon}>
          <FaToilet size={20} color="#674ea7" />
        </div>
        <div>
          <p className={styles.feedDueMain}>Next diaper check in 2 hours</p>
          <p className={styles.feedDueSub}>
            Last change at 9:41 AM • Brown stool
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Stool Tracking</h1>
        <div className={styles.headerActions}>
          <Button className={styles.exportBtn} onClick={handleOpenExportModal}>
            Export
          </Button>
          <Button className={styles.addFeedBtn} onClick={handleOpenAddModal}>
            + Add Entry
          </Button>
        </div>
      </div>

      {/* Day cards */}
      {sortedData.map((day, idx) => {
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
                <span className={styles.todayMeals}>Today’s Changes</span>
              </div>
            </div>
            <table className={styles.mealsTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Color</th>
                  <th>Consistency</th>
                  <th>Notes</th>
                  <th style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {day.changes.map((changeItem, changeIdx) => (
                  <tr key={changeIdx}>
                    <td>
                      <div className={styles.mealTitle}>{changeItem.time}</div>
                    </td>
                    <td>{changeItem.color || "—"}</td>
                    <td>{changeItem.consistency || "—"}</td>
                    <td>{changeItem.notes || "—"}</td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleOpenModal(changeItem, day.date)}
                      >
                        <FaEdit />
                      </button>
                      {/* Delete button right next to Edit */}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteChange(changeItem, day.date)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5}>
                    <button
                      className={styles.addBtn}
                      onClick={() => handleOpenModal(null, day.date)}
                    >
                      + Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Edit/Add Single Day Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedChange ? "Edit Entry" : "Add Entry"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="stoolTime">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 7:12 am"
              />
            </Form.Group>
            <Form.Group controlId="stoolColor" className="mt-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Brown"
              />
            </Form.Group>
            <Form.Group controlId="stoolConsistency" className="mt-3">
              <Form.Label>Consistency</Form.Label>
              <Form.Control
                type="text"
                value={consistency}
                onChange={(e) => setConsistency(e.target.value)}
                placeholder="e.g. Watery"
              />
            </Form.Group>
            <Form.Group controlId="stoolNotes" className="mt-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChange}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={exportModalShow} onHide={() => setExportModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={styles.exportModalSubtext}>
            Select a date or date range to export stool data as CSV.
          </p>
          <Form>
            <Form.Group controlId="exportDate" className="mb-3">
              <Form.Label className={styles.exportModalLabel}>
                Date range
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
          {exportError && <p className={styles.exportError}>{exportError}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setExportModalShow(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!startDate || !endDate}
          >
            Export
          </Button>
        </Modal.Footer>
      </Modal>

      {/* “Add Entry” Modal for the top-right button */}
      <Modal show={addModalShow} onHide={() => setAddModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add a Stool Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="newStoolTime">
              <Form.Label>Time</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    className={styles.timeBox}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newMinute}
                    onChange={(e) => setNewMinute(e.target.value)}
                    className={styles.timeBox}
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    onClick={() => setNewAmPm("AM")}
                    className={
                      newAmPm === "AM" ? styles.amPmBtnActive : styles.amPmBtn
                    }
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAmPm("PM")}
                    className={
                      newAmPm === "PM" ? styles.amPmBtnActive : styles.amPmBtn
                    }
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>

            <Form.Group controlId="newColor" className="mt-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="newConsistency" className="mt-3">
              <Form.Label>Consistency</Form.Label>
              <Form.Control
                type="text"
                value={newConsistency}
                onChange={(e) => setNewConsistency(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="newNotes" className="mt-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNewStool}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Stool;
