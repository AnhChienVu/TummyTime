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
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";

export default function Journal() {
  const { t } = useTranslation("common");
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [text, setText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [selectedInput, setSelectedInput] = useState(null);
  const [editSelectedInput, setEditSelectedInput] = useState(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    showFirefoxModal,
    setShowFirefoxModal,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  const startStopListening = (e, inputType) => {
    e.preventDefault();

    // Check if using Firefox only when button is clicked
    const isFirefox =
      typeof window !== "undefined" &&
      navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

    // Check for SpeechRecognition support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition && isFirefox) {
      setShowFirefoxModal(true);
      return;
    }

    if (isListening) {
      stopVoiceInput();
    } else {
      setSelectedInput(inputType);
      startListening();
    }
  };

  const stopVoiceInput = () => {
    if (selectedInput === "title") {
      const newTitleValue =
        titleText +
        (transcript.length ? (titleText.length ? " " : "") + transcript : "");
      setTitleText(newTitleValue);
      // Update react-hook-form. Otherwise, React Hook Form will not detect the change in the input value
      register("title").onChange({ target: { value: newTitleValue } });
    } else {
      const newTextValue =
        text + (transcript.length ? (text.length ? " " : "") + transcript : "");
      setText(newTextValue);
      // Update react-hook-form. Otherwise, React Hook Form will not detect the change in the input value
      register("text").onChange({ target: { value: newTextValue } });
    }
    stopListening();
    setSelectedInput(null);
  };

  const startStopListeningEdit = (e, inputType) => {
    e.preventDefault();

    // Check if using Firefox only when button is clicked
    const isFirefox =
      typeof window !== "undefined" &&
      navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

    // Check for SpeechRecognition support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition && isFirefox) {
      setShowFirefoxModal(true);
      return;
    }

    if (isListening) {
      stopVoiceInputEdit();
    } else {
      setEditSelectedInput(inputType);
      startListening();
    }
  };

  const stopVoiceInputEdit = () => {
    if (editSelectedInput === "title") {
      setEditedEntry({
        ...editedEntry,
        title:
          editedEntry.title +
          (transcript.length
            ? (editedEntry.title.length ? " " : "") + transcript
            : ""),
      });
    } else {
      setEditedEntry({
        ...editedEntry,
        text:
          editedEntry.text +
          (transcript.length
            ? (editedEntry.text.length ? " " : "") + transcript
            : ""),
      });
    }
    stopListening();
    setEditSelectedInput(null);
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

      // Use the current state values instead of form data
      const formData = new FormData();
      formData.append("title", titleText);
      formData.append("text", text);
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

        // Reset both form and state
        reset();
        setText("");
        setTitleText("");
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

    // Validate empty values
    if (!editedEntry.title?.trim() || !editedEntry.text?.trim()) {
      alert(t("Title and content cannot be empty"));
      return;
    }

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
            title: editedEntry.title.trim(),
            text: editedEntry.text.trim(),
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
    <>
      <Container className={styles.container} fluid>
        <div className={styles.formContainer}>
          <p className={styles.title}>{t("My Journal")}</p>
          <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
            <Row className="mb-3">
              <Col className="d-flex">
                <Form.Control
                  type="text"
                  placeholder={t("Title")}
                  required
                  {...register("title", { value: titleText })} // Add value to register
                  className="form-control"
                  disabled={isListening}
                  value={
                    isListening && selectedInput === "title"
                      ? titleText + (transcript || "")
                      : titleText
                  }
                  onChange={(e) => {
                    setTitleText(e.target.value);
                    register("title").onChange(e);
                  }}
                />
                <button
                  onClick={(e) => startStopListening(e, "title")}
                  className={`${styles.microphone} btn-sm ms-2`}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && selectedInput === "title"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    size="sm"
                  />
                </button>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={t("Write your thoughts here...")}
                  required
                  {...register("text", { value: text })}
                  className="form-control"
                  disabled={isListening}
                  value={
                    isListening && selectedInput === "text"
                      ? text + (transcript || "")
                      : text
                  }
                  onChange={(e) => {
                    setText(e.target.value);
                    register("text").onChange(e);
                  }}
                />
              </Col>
            </Row>
            <Row className={styles.postRow}>
              <Col className="d-flex justify-content-end gap-3">
                <Button
                  variant="primary"
                  type="submit"
                  className={`${styles.submitButton} btn-sm`}
                >
                  {t("Post")}
                </Button>
                <button
                  onClick={(e) => startStopListening(e, "text")}
                  className={`${styles.microphone} btn-sm`}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && selectedInput === "text"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    size="sm"
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
              <div className="d-flex w-100 align-items-center">
                <Form.Control
                  type="text"
                  value={
                    isListening && editSelectedInput === "title"
                      ? editedEntry?.title + (transcript || "")
                      : editedEntry?.title || ""
                  }
                  required
                  onChange={(e) =>
                    setEditedEntry({ ...editedEntry, title: e.target.value })
                  }
                  className={`border-0 h4 flex-grow-1 me-2 ${
                    editedEntry?.title?.trim() === "" ? "is-invalid" : ""
                  }`}
                  disabled={isListening}
                />
                <button
                  onClick={(e) => startStopListeningEdit(e, "title")}
                  className={`${styles.microphone} btn-sm`}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && editSelectedInput === "title"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    size="sm"
                  />
                </button>
              </div>
            ) : (
              <Modal.Title>{selectedEntry?.title}</Modal.Title>
            )}
          </Modal.Header>
          <Modal.Body>
            {isEditing ? (
              <div>
                <div className="d-flex">
                  <Form.Control
                    as="textarea"
                    rows={5}
                    required
                    value={
                      isListening && editSelectedInput === "text"
                        ? editedEntry?.text + (transcript || "")
                        : editedEntry?.text || ""
                    }
                    onChange={(e) =>
                      setEditedEntry({ ...editedEntry, text: e.target.value })
                    }
                    className={`border-0 ${
                      editedEntry?.text?.trim() === "" ? "is-invalid" : ""
                    }`}
                    disabled={isListening}
                  />
                  <button
                    onClick={(e) => startStopListeningEdit(e, "text")}
                    className={`${styles.microphone} btn-sm ms-2`}
                  >
                    <FontAwesomeIcon
                      icon={
                        isListening && editSelectedInput === "text"
                          ? faMicrophoneSlash
                          : faMicrophone
                      }
                      size="sm"
                    />
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.modalText}>{selectedEntry?.text}</p>
            )}
            {/* {selectedEntry?.image && (
              <Image
                src={selectedEntry.image}
                alt="journal entry"
                className={styles.modalImage}
                fluid
              />
            )} */}
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
                &nbsp;
                <Button
                  variant="primary"
                  onClick={handleUpdate}
                  className="me-2"
                >
                  {t("Save Changes")}
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
                    variant="light"
                    onClick={() => setShowModal(false)}
                    className="border border-secondary"
                  >
                    {t("Close")}
                  </Button>
                  &nbsp;
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditedEntry({ ...selectedEntry });
                      setIsEditing(true);
                    }}
                    className="me-2"
                  >
                    {t("Edit Entry")}
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

      <IncompatibleBrowserModal
        show={showFirefoxModal}
        onHide={() => setShowFirefoxModal(false)}
      />
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
