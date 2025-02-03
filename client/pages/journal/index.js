// client/pages/journal/index.js
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { localStorage } from "../login";

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

export default function Journal() {
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]); // Stores journal entries
  const [filePreview, setFilePreview] = useState(null); // Stores image preview
  const router = useRouter();
  const userID = router.query.id;

  console.log("***********************localStorage", localStorage);

  // Handles form submission
  const onSubmit = (data) => {
    if (data.text.trim() === "" && !data.image[0]) return; // Prevent empty entries

    const newEntry = {
      user_id: userID,
      title: data.title,
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
            <Col md={4}>
              <Form.Control
                type="file"
                accept="image/*"
                {...register("image")}
                onChange={handleFileChange}
              />
            </Col>
            <Col md={4}></Col>
            <Col md={4}>
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
