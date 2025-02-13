import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./milestones.module.css";
import { FaBaby, FaEdit, FaTrash } from "react-icons/fa";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function MilestoneEachBaby() {
  const { t } = useTranslation("common");
  const [milestones, setMilestones] = useState([]);
  const [modalError, setModalError] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toasts, setToasts] = useState([]);

  const router = useRouter();
  const baby_id = router.query.id;
  console.log(baby_id);

  useEffect(() => {
    if (baby_id) {
      async function fetchMilestones() {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}/getMilestones`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          const data = await res.json();

          if (res.ok) {
            //  Convert the response to an array of milestones
            const milestonesArray = Object.keys(data)
              .filter((key) => key !== "status")
              .map((key) => data[key]);
            setMilestones(milestonesArray);
            console.log("Fetched milestone data:", milestonesArray);
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

  const handleSaveMilestone = async () => {
    setModalError("");
    const milestone_id = selectedMilestone
      ? selectedMilestone.milestone_id
      : null;

    try {
      // Update milestone in the database
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedMilestone.baby_id}/updateMilestone/${milestone_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title,
            details,
            date: new Date().toISOString().split("T")[0],
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
      console.log(error);
      showToast("Error saving milestone to server.", "danger");
    }
  };

  // DELETE meal
  const handleDeleteMilestone = async (milstone) => {
    const milestone_id = milstone.milestone_id;
    try {
      // Delete milestone in the database
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${milstone.baby_id}/deleteMilestone/${milestone_id}`,
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
        showToast("Milestone deleted!");
        router.reload();
      }
    } catch (error) {
      console.log(error);
      showToast("Error deleting milestone.", "danger");
    }
  };

  return (
    <div>
      {milestones.map((milestone, idx) => {
        return (
          <div key={idx} className={styles.container}>
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
                <tr key={idx}>
                  <td>{milestone.title}</td>
                  <td>{milestone.details}</td>
                  <td>{milestone.date}</td>
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
              </tbody>
            </table>
          </div>
        );
      })}

      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMilestone ? t("Edit Milestone") : t("Add Milestone")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group controlId="title">
              <Form.Label>{t("Title")}</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="detail">
              <Form.Label>{t("Details")}</Form.Label>
              <Form.Control
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              ></Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className={styles.btnCancel}
            onClick={() => setModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveMilestone}>
            {t("Save")}
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
