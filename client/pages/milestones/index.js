import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  ListGroup,
  Container,
  Row,
  Col,
  Card,
  Tab,
  Nav,
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

function Milestones() {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [addMilestoneModalShow, setAddMilestoneModalShow] = useState(false);
  const [newModalError, setNewModalError] = useState("");
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const handleSaveNewMilestone = async () => {
    setNewModalError("");

    try {
      // Add milestone
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
        setModalShow(false);
        showToast("Milstone added to server!");
        router.reload();
      } else {
        showToast("Failed to add milestone to server.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error adding milestone to server.", "danger");
    }
  };

  return (
    <Container className={styles.container} fluid>
      <Row>
        <Col>
          <h1>{t("Milestones")}</h1>
          <BabyCardMilestone addMilestoneBtn={handleOpenAddMilestoneModal} />
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
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="date">
              <Form.Label>{t("Date")}&nbsp;&nbsp;</Form.Label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
                placeholderText={t("Select date")}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="details">
              <Form.Label>{t("Details")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("Enter milestone details")}
              />
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
