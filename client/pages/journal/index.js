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
} from "react-bootstrap";
import styles from "./journal.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Journal() {
  const { t } = useTranslation("common");
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setUserId(userId);
    const fetchEntries = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${userId}/getJournalEntries`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
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
      formData.append("date", new Date().toISOString());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${userId}/addJournalEntry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
        <p className={styles.title}>{t("My Journal")}</p>
        <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <Row className="mb-3">
            <Col>
              <Form.Control
                type="text"
                placeholder={t("Title")}
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
                placeholder={t("Write your thoughts here...")}
                required
                {...register("text")}
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
                {t("Post")}
              </Button>
            </Col>
          </Row>
        </Form>

        <hr />

        {/* Display saved journal entries */}
        <p className={styles.title}>{t("Journal Entries")}</p>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
