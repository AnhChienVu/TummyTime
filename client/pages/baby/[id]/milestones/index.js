import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./milestones.module.css";
import { FaBaby, FaEdit, FaTrash } from "react-icons/fa";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function MilestoneEachBaby() {
  const { t } = useTranslation("common");
  const [milestones, setMilestones] = useState([]);
  const [modalError, setModalError] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toasts, setToasts] = useState([]);
  const [date, setDate] = useState("");

  const router = useRouter();
  const baby_id = router.query.id;

  const handleBackClick = () => {
    router.push("/milestones");
  };

  useEffect(() => {
    if (baby_id) {
      async function fetchMilestones() {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}/milestones`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          const data = await res.json();

          if (res.ok && data.status === "ok") {
            // Sort milestones by date (most recent first) before setting state
            const sortedMilestones = data.data.sort(
              (a, b) => new Date(b.date) - new Date(a.date),
            );
            setMilestones(sortedMilestones);
          } else {
            console.error("Failed to fetch milestones:", data);
          }
        } catch (error) {
          console.error("Error fetching milestones:", error);
        }
      }
      fetchMilestones();
    }
  }, [baby_id]);

  const handleOpenModal = (milestone) => {
    setModalError("");
    setSelectedMilestone(milestone);
    setTitle(milestone.title);
    setDetails(milestone.details);
    // Format the date for the input field (YYYY-MM-DD)
    setDate(new Date(milestone.date).toISOString().split("T")[0]);
    setModalShow(true);
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
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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

  const validateForm = () => {
    if (!title.trim()) {
      setModalError(t("Title is required"));
      return false;
    }
    if (!details.trim()) {
      setModalError(t("Details are required"));
      return false;
    }
    if (!date) {
      setModalError(t("Date is required"));
      return false;
    }

    // Validate date format and range
    const selectedDate = new Date(date);
    const today = new Date();
    if (isNaN(selectedDate.getTime())) {
      setModalError(t("Invalid date format"));
      return false;
    }
    if (selectedDate > today) {
      setModalError(t("Date cannot be in the future"));
      return false;
    }

    return true;
  };

  const handleSaveMilestone = async () => {
    setModalError("");

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    const milestone_id = selectedMilestone
      ? selectedMilestone.milestone_id
      : null;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedMilestone.baby_id}/milestones/${milestone_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title,
            details,
            date: date,
          }),
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setModalShow(false);
        showToast("Milestone updated!");
        router.reload();
      }
    } catch (error) {
      showToast("Error saving milestone to server.", "danger");
    }
  };

  // DELETE milestone
  const handleDeleteMilestone = async (milstone) => {
    const milestone_id = milstone.milestone_id;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${milstone.baby_id}/milestones/${milestone_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setModalShow(false);
        // Update the milestones state directly instead of reloading the page
        setMilestones(
          milestones.filter((m) => m.milestone_id !== milestone_id),
        );
        showToast("Milestone deleted!");
      }
    } catch (error) {
      showToast("Error deleting milestone.", "danger");
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className={styles.backButtonContainer}>
        <div className={styles.backButton} onClick={handleBackClick}>
          <span>← {t("Back to Overview")}</span>
        </div>
      </div>

      <table className={styles.mealsTable}>
        <thead>
          <tr>
            <th>{t("Title")}</th>
            <th>{t("Details")}</th>
            <th>{t("Date")}</th>
            <th style={{ width: "60px" }}></th>
          </tr>
        </thead>
        <tbody>
          {milestones && milestones.length > 0 ? (
            milestones.map((milestone) => (
              <tr key={milestone.milestone_id}>
                <td>{milestone.title}</td>
                <td>{milestone.details}</td>
                <td>{formatDate(milestone.date)}</td>
                <td className={styles.actionCell}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal(milestone)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteMilestone(milestone)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No milestones found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal for editing milestone */}
      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Milestone")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="mb-3">
              {modalError}
            </Alert>
          )}
          <Form noValidate>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Title")} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setModalError("");
                }}
                isInvalid={modalError && !title.trim()}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Details")} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={details}
                onChange={(e) => {
                  setDetails(e.target.value);
                  setModalError("");
                }}
                isInvalid={modalError && !details.trim()}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Date")} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setModalError("");
                }}
                isInvalid={modalError && !date}
                max={new Date().toISOString().split("T")[0]}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalShow(false)}>
            {t("Close")}
          </Button>
          <Button variant="primary" onClick={handleSaveMilestone}>
            {t("Save Changes")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MilestoneEachBaby;

export async function getStaticPaths() {
  // Fetch the token from localStorage on the client side
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        paths: [],
        fallback: false,
      };
    }

    // Fetch the list of baby IDs from your custom API route
    const res = await fetch(`/api/getBabyProfiles?token=${token}`);
    const data = await res.json();

    if (data.status !== "ok") {
      return {
        paths: [],
        fallback: false,
      };
    }

    // Generate the paths for each baby ID
    const paths = data.babies.map((baby) => ({
      params: { id: baby.baby_id.toString() },
    }));

    return {
      paths,
      fallback: false, // See the "fallback" section below
    };
  }

  return {
    paths: [],
    fallback: false,
  };
}

export async function getStaticProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      babyId: params.id,
    },
  };
}
