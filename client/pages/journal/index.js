// client/pages/journal/index.js
import { useForm } from "react-hook-form";
import React, { useState } from "react";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import useSpeechToText from "@/hooks/useSpeechToText";

export default function Journal() {
  const { register, handleSubmit, reset } = useForm();
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
      <div className={styles.formContainer}>
        <p className={styles.title}>My Journal</p>
        <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
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

          {/* Display image preview */}
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

        {/* Display posted journal entries */}
        <Row>
          {entries.map((entry) => (
            <Col key={entry.id} sm={12} md={6} lg={4} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Text>{entry.text}</Card.Text>
                  {entry.image && (
                    <Card.Img
                      variant="bottom"
                      src={entry.image}
                      alt="journal entry"
                    />
                  )}
                  <Card.Footer className="text-muted">{entry.date}</Card.Footer>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
}
