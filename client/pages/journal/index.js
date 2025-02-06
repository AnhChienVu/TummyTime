import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Image,
} from "react-bootstrap";
import styles from "./journal.module.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import useSpeechToText from "@/hooks/useSpeechToText";

export default function Journal() {
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [text, setText] = useState("");

  const userId = 1;

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/v1/user/${userId}/getJournalEntries`,
        );
        const data = await response.json();
        if (response.ok) {
          const journalEntryArray = Object.keys(data)
            .filter((key) => key !== "status")
            .map((key) => data[key]);
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

  const onSubmit = async (data) => {
    try {
      if (data.text.trim() === "" && !data.image[0]) return;

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", data.title);
      formData.append("text", data.text);
      formData.append("image", data.image[0]);
      formData.append("date", new Date().toLocaleString());

      const res = await fetch(
        `http://localhost:8080/v1/user/${userId}/addJournalEntry`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (res.ok) {
        const newEntry = await res.json();
        setEntries([...entries, newEntry]);
        reset();
        setText("");
        setFilePreview(null);
      }
    } catch (error) {
      console.error("Error submitting journal entry:", error);
    }
  const [entries, setEntries] = useState([]); // Stores journal entries
  const [filePreview, setFilePreview] = useState(null); // Stores image preview
  const [text, setText] = useState("");
  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({
      continuous: true,
      interimResults: true,
      lang: "en-US",
    });

  const startStopListening = () => {
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

  // Handles form submission
  const onSubmit = (data) => {
    if (data.text.trim() === "" && !data.image[0]) return; // Prevent empty entries

    const newEntry = {
      id: Date.now(),
      text: data.text,
      image: data.image[0] ? URL.createObjectURL(data.image[0]) : null,
      date: new Date().toLocaleString(),
    };

    setEntries([newEntry, ...entries]);
    setFilePreview(null);
    reset();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  return (
    <Container className={styles.container} fluid>
      <Sidebar />
      <div className={styles.formContainer}>
        <p className={styles.title}>My Journal</p>
        <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <Row className="mb-3">
            <Col>
              <Form.Control
                type="text"
                placeholder="Title"
                required
                {...register("title")}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Write your thoughts here..."
                required
                {...register("text")}
                disabled={isListening}
                value={
                  isListening
                    ? text + (transcript.length ? transcript : "")
                    : text
                }
                onChange={(e) => setText(e.target.value)}
              />
            </Col>
          </Row>
          {filePreview && (
            <Row className="mb-3">
              <Col>
                <Image
                  src={filePreview}
                  alt="Preview"
                  style={{ maxWidth: "50%" }}
                />
              </Col>
            </Row>
          )}
          <Row className="mb-3">
            <Col md={4} className="d-flex align-items-center">
              <Form.Control
                type="file"
                accept="image/*"
                {...register("image")}
                onChange={handleFileChange}
              />
            </Col>
            <Col md={4} className="d-flex align-items-center">
              <Button
                className={styles.microphone}
                onClick={startStopListening}
              >
                {isListening ? (
                  <FontAwesomeIcon icon={faMicrophoneSlash} />
                ) : (
                  <FontAwesomeIcon icon={faMicrophone} />
                )}
              </Button>
            </Col>
            <Col md={4} className="d-flex align-items-center">
              <Button
                variant="primary"
                type="submit"
                className={styles.submitButton}
              >
                Post
              </Button>
            </Col>
          </Row>
        </Form>

        <hr />

        {/* Display saved journal entries */}
        <p className={styles.title}>Journal Entries</p>
        <div className={styles.entriesSection}>
          {entries.map((entry) => (
            <Card key={entry.id} className={styles.entryCard}>
              <Card.Body>
                <Card.Title className={styles.entryCardTitle}>
                  {entry.title}
                </Card.Title>
                <Card.Text
                  className={styles.entryCardText}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
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
                </Card.Footer>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}
