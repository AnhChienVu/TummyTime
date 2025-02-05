// client/pages/journal/index.js
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import { useRouter } from "next/router";
// import { localStorage } from "../login";

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
import RichTextEditor from "@/components/RichTextEditor/RichTextEditor";

export default function Journal() {
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]); // Stores journal entries
  const [filePreview, setFilePreview] = useState(null); // Stores image preview
  const [text, setText] = useState(""); // Stores rich text content

  // const router = useRouter();
  // const userId = router.query.id;
  // console.log("User ID:", router.query.id); // undefined

  const userId = 1; // Hardcoded user ID for now

  const onSubmit = async (data) => {
    try {
      console.log("text:", text);
      console.log("data:", data);
      if (data.text.trim() === "" && !data.image[0]) return; // Prevent empty entries

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

      // Handle response
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
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  // Checks if the user has entered text in the rich text editor
  // const handleTextChange = (newText) => {
  //   console.log("Updating text state:", newText);
  //   setText(newText);
  // };

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
              {/* <RichTextEditor
                value={text}
                onChange={handleTextChange}
                required
              /> */}
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
                  <Card.Title>{entry.title}</Card.Title>
                  <div dangerouslySetInnerHTML={{ __html: entry.text }} />
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
