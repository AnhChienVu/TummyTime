// pages/journal/index.js
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Image,
  Modal,
} from "react-bootstrap";
import styles from "./journal.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useSpeechToText from "@/hooks/useSpeechToText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";

export default function Journal() {
  const { t } = useTranslation("common");
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [text, setText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({
      continuous: true,
      interimResults: true,
      lang: "en-US",
    });

  const startStopListening = (e) => {
    e.preventDefault();
    if (isListening) {
      stopVoiceInput();
    } else {
      startListening();
    }
  };

  const stopVoiceInput = () => {
    setText(
      (preVal) =>
        preVal +
        (transcript.length ? (preVal.length ? " " : "") + transcript : ""),
    );
    stopListening();
  };

  useEffect(() => {
    const fetchEntries = async () => {
      // Get all journal entries
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token) {
        logger.error("No token found");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/journal`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (response.ok) {
          const journalEntryArray = Object.keys(data)
            .filter((key) => key !== "status")
            .map((key) => data[key])
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // sort by newest date first
          setEntries(journalEntryArray);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      }
    };

    fetchEntries();
  }, []);

  // Submit journal entry
  const onSubmit = async (data) => {
    try {
      if (data.text.trim() === "") return;
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("text", data.text);
      //formData.append("image", data.image[0]);  // FOR IMAGE UPLOADS
      formData.append("date", new Date().toISOString());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/journal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (res.ok) {
        const newEntry = await res.json();
        setEntries([newEntry, ...entries]);
        reset();
        setText("");
        setFilePreview(null);
      }
    } catch (error) {
      console.error("Error submitting journal entry:", error);
    }
  };

  // Fetch selected journal entry details
  const fetchEntryDetails = async (entryId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${entryId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Round to seconds for comparison. Otherwise the timestamps may differ by milliseconds and appear as if the entry was edited when it wasn't.
        const updatedTime = Math.floor(
          new Date(data.updated_at).getTime() / 1000,
        );
        const createdTime = Math.floor(new Date(data.date).getTime() / 1000);

        setSelectedEntry({
          ...data,
          last_edited: updatedTime > createdTime ? data.updated_at : null,
        });
      } else {
        console.error("Error fetching entry details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Event handler for updating an entry
  const handleUpdate = async () => {
    if (!editedEntry || !selectedEntry) return;

    // Check if data was modified
    if (
      editedEntry.title === selectedEntry.title &&
      editedEntry.text === selectedEntry.text
    ) {
      setIsEditing(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const currentTime = new Date().toISOString();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${selectedEntry.entry_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editedEntry.title,
            text: editedEntry.text,
            updated_at: currentTime,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();

        // Update with the last_edited timestamp
        const updatedEntry = {
          ...selectedEntry,
          ...result.data,
          last_edited: result.data.updated_at,
        };

        setSelectedEntry(updatedEntry);
        // Update the entry in the entries list
        setEntries(
          entries.map((entry) =>
            entry.entry_id === updatedEntry.entry_id ? updatedEntry : entry,
          ),
        );
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  // Handle delete entry
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedEntry) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${selectedEntry.entry_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove the entry from the entries list
        setEntries(
          entries.filter((entry) => entry.entry_id !== selectedEntry.entry_id),
        );
        setShowDeleteModal(false);
        alert("Reply successfully deleted");
        setShowModal(false);
        setDeleteConfirmed(false);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  // For image preview (not implemented currently)
  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setFilePreview(URL.createObjectURL(file));
  //   } else {
  //     setFilePreview(null);
  //   }
  // };

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <p className={styles.title}>{t("My Journal")}</p>
        <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <Row className="mb-3">
            <Col>
              <Form.Control
                type="text"
                placeholder={t("Title")}
                required
                {...register("title")}
                className="form-control"
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={t("Write your thoughts here...")}
                required
                {...register("text")}
                className="form-control"
                disabled={isListening}
                value={
                  isListening
                    ? text + (transcript.length ? transcript : "")
                    : text
                }
                onChange={(e) => {
                  setText(e.target.value);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.postRow}>
            <Col md={6}>
              <Button
                variant="primary"
                type="submit"
                className={styles.submitButton}
              >
                {t("Post")}
              </Button>
            </Col>
            <Col md={6}>
              <button
                onClick={(e) => startStopListening(e)}
                className={styles.microphone}
              >
                <FontAwesomeIcon
                  icon={isListening ? faMicrophoneSlash : faMicrophone}
                />
              </button>
            </Col>
          </Row>
        </Form>

        <hr />

        {/* Display saved journal entries */}
        <p className={styles.title}>{t("Journal Entries")}</p>
        <div className={styles.entriesSection}>
          {entries.length === 0 ? (
            <p className="text-muted text-center">
              {t("No journal entries found.")}
            </p>
          ) : (
            entries.map((entry) => (
              <Card
                key={entry.entry_id}
                className={`${styles.entryCard} shadow-sm`}
                onClick={() => {
                  setShowModal(true);
                  fetchEntryDetails(entry.entry_id);
                }}
                style={{ cursor: "pointer" }}
              >
                <Card.Body>
                  <Card.Title className={styles.entryCardTitle}>
                    {entry.title}
                  </Card.Title>
                  <Card.Text
                    className={styles.entryCardText}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {entry.text}
                  </Card.Text>
                  {entry.image && (
                    <Image
                      src={entry.image}
                      alt="journal entry"
                      className={styles.tableImg}
                    />
                  )}
                  <Card.Footer className={styles.entryCardFooter}>
                    <div>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(entry.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                      {entry.updated_at &&
                        (() => {
                          // Round to seconds for comparison
                          const updatedTime = Math.floor(
                            new Date(entry.updated_at).getTime() / 1000,
                          );
                          const createdTime = Math.floor(
                            new Date(entry.date).getTime() / 1000,
                          );

                          return (
                            updatedTime > createdTime && (
                              <span className="ms-2">
                                <i style={{ color: "#666666" }}>
                                  &bull; &nbsp;{t("Last edited:")}{" "}
                                  {new Date(entry.updated_at).toLocaleString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "numeric",
                                      hour12: true,
                                    },
                                  )}
                                </i>
                              </span>
                            )
                          );
                        })()}
                    </div>
                  </Card.Footer>
                </Card.Body>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* "Entry details" and "edit entry" modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setIsEditing(false);
          setEditedEntry(null);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          {isEditing ? (
            <Form.Control
              type="text"
              value={editedEntry?.title || ""}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, title: e.target.value })
              }
              className="border-0 h4"
            />
          ) : (
            <Modal.Title>{selectedEntry?.title}</Modal.Title>
          )}
        </Modal.Header>
        <Modal.Body>
          {isEditing ? (
            <Form.Control
              as="textarea"
              rows={5}
              value={editedEntry?.text || ""}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, text: e.target.value })
              }
              className="border-0"
            />
          ) : (
            <p className={styles.modalText}>{selectedEntry?.text}</p>
          )}
          {selectedEntry?.image && (
            <Image
              src={selectedEntry.image}
              alt="journal entry"
              className={styles.modalImage}
              fluid
            />
          )}
          <div className={styles.modalFooter}>
            {selectedEntry && (
              <small className="text-muted">
                {new Date(selectedEntry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                {new Date(selectedEntry.date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
                {selectedEntry.last_edited &&
                  selectedEntry.last_edited !== selectedEntry.date && (
                    <span className="ms-2">
                      <i style={{ color: "#666666" }}>
                        &bull; &nbsp;{t("Last edited:")}{" "}
                        {new Date(selectedEntry.last_edited).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          },
                        )}
                      </i>
                    </span>
                  )}
              </small>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          {isEditing ? (
            <div className="w-100 d-flex justify-content-end">
              <Button variant="primary" onClick={handleUpdate} className="me-2">
                {t("Save Changes")}
              </Button>
              <Button
                variant="light"
                onClick={() => {
                  setIsEditing(false);
                  setEditedEntry(null);
                }}
                className="border border-secondary"
              >
                {t("Cancel")}
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeleteConfirmed(false);
                  }}
                >
                  {t("Delete")}
                </Button>
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditedEntry({ ...selectedEntry });
                    setIsEditing(true);
                  }}
                  className="me-2"
                >
                  {t("Edit")}
                </Button>
                <Button
                  variant="light"
                  onClick={() => setShowModal(false)}
                  className="border border-secondary"
                >
                  {t("Close")}
                </Button>
              </div>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* "Confirm delete" modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteConfirmed(false); // Reset checkbox when modal is closed
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Delete")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("Are you sure you want to delete this journal entry?")}</p>
          <Form.Check
            type="checkbox"
            id="delete-confirm-checkbox"
            label={t("I understand that this action cannot be undone")}
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="mt-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmed(false);
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!deleteConfirmed}
          >
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
