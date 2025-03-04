// pages/milestones/index.js
import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { format, set } from "date-fns";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import styles from "./milestones.module.css";
import BabyCardMilestone from "@/components/BabyCardMilestone/BabyCardMilestone";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

function Milestones() {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [addMilestoneModalShow, setAddMilestoneModalShow] = useState(false);
  const [newModalError, setNewModalError] = useState("");
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [titleError, setTitleError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [dateError, setDateError] = useState("");
  const [milestones, setMilestones] = useState([]);

  const locales = {
    "en-US": require("date-fns/locale/en-US"),
  };

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  const router = useRouter();

  const handleOpenAddMilestoneModal = (baby_id) => {
    setNewModalError("");
    setTitle("");
    setDetails("");
    setSelectedBaby(baby_id);
    setAddMilestoneModalShow(true);
  };

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

  const validateInputs = () => {
    let isValid = true;

    // Reset error states
    setTitleError("");
    setDetailsError("");
    setDateError("");

    // Check for empty title
    if (!title.trim()) {
      setTitleError(t("Title is required"));
      isValid = false;
    }

    // Check for empty details
    if (!details.trim()) {
      setDetailsError(t("Details are required"));
      isValid = false;
    }

    // Validate title length (max 255 characters)
    if (title.length > 255) {
      setTitleError(t("Title must be less than 255 characters."));
      isValid = false;
    }

    // Validate details length (max 255 characters)
    if (details.length > 255) {
      setDetailsError(t("Details must be less than 255 characters."));
      isValid = false;
    }

    // Validate date
    if (!selectedDate) {
      setDateError(t("Please select a date."));
      isValid = false;
    } else {
      const selectedDateTime = new Date(selectedDate);
      if (isNaN(selectedDateTime.getTime())) {
        setDateError(t("Invalid date format."));
        isValid = false;
      }
    }

    return isValid;
  };

  // Add a new milestone
  const handleSaveNewMilestone = async () => {
    setNewModalError("");

    // Check validation before proceeding
    if (!validateInputs()) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBaby}/milestones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title,
            details,
            date: format(selectedDate, "yyyy-MM-dd"),
          }),
        },
      );

      const data = await res.json();

      if (data.status === "ok") {
        setAddMilestoneModalShow(false);
        showToast("Milestone added successfully!");
        fetchMilestones(); // Refresh the calendar instead of reloading the page
        setTitle("");
        setDetails("");
        setSelectedDate(null);
      } else {
        showToast("Failed to add milestone", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error adding milestone", "error");
    }
  };

  // Get all milestones for all babies
  const fetchMilestones = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/milestones`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      if (data.status === "ok") {
        // Convert the milestones data to the format expected by react-big-calendar
        const formattedMilestones = data.data.map((milestone) => ({
          title: `${milestone.first_name} ${milestone.last_name}: ${milestone.title}`,
          start: new Date(milestone.date),
          end: new Date(milestone.date),
          details: milestone.details,
        }));
        setMilestones(formattedMilestones);
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
      showToast("Error fetching milestones", "error");
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleEventClick = (event) => {
    showToast(`${event.title} - ${event.details}`, "info");
  };

  return (
    <Container className={styles.container} fluid>
      <Row>
        <Col>
          <h1>{t("Milestones")}</h1>
          <br />
          <BabyCardMilestone addMilestoneBtn={handleOpenAddMilestoneModal} />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <div className={styles.calendarWrapper}>
            <Calendar
              localizer={localizer}
              events={milestones}
              startAccessor="start"
              endAccessor="end"
              views={["month", "week", "day"]}
              tooltipAccessor="details"
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.isSpecial ? "#28a745" : "#007bff",
                },
              })}
              dayPropGetter={(date) => ({
                style: {
                  backgroundColor:
                    date.getDay() === 0 || date.getDay() === 6
                      ? "#f8f9fa"
                      : "white",
                },
              })}
              onSelectEvent={handleEventClick}
            />
          </div>
        </Col>
      </Row>

      <Modal
        show={addMilestoneModalShow}
        onHide={() => setAddMilestoneModalShow(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Add a milestone")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newModalError && <Alert variant="danger">{newModalError}</Alert>}
          <Form>
            <Form.Group className="mb-3" controlId="title">
              <Form.Label>{t("Title")}</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("Enter milestone title")}
                isInvalid={!!titleError}
              />
              <Form.Control.Feedback type="invalid">
                {titleError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {`${title.length}/255 ${t("characters")}`}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="date">
              <Form.Label>{t("Date")}&nbsp;&nbsp;</Form.Label>
              <div>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                  }}
                  className={`form-control ${dateError ? "is-invalid" : ""}`}
                  dateFormat="yyyy-MM-dd"
                  placeholderText={t("Select date")}
                />
                {dateError && (
                  <div
                    className="invalid-feedback"
                    style={{ display: "block" }}
                  >
                    {dateError}
                  </div>
                )}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="details">
              <Form.Label>{t("Details")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("Enter milestone details")}
                isInvalid={!!detailsError}
              />
              <Form.Control.Feedback type="invalid">
                {detailsError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {`${details.length}/255 ${t("characters")}`}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className={styles.btnCancel}
            onClick={() => setAddMilestoneModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveNewMilestone}>
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Milestones;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
