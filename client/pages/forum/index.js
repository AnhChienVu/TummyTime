// pages/forum/index.js
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
import styles from "./forum.module.css";

export default function Forum() {
  const { register, handleSubmit, reset } = useForm();
  const [posts, setPosts] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/forum/posts`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await response.json();
        if (response.ok) {
          const forumPostArray = Object.keys(data)
            .filter((key) => key !== "status")
            .map((key) => data[key]);
          setPosts(forumPostArray);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching forum posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const onSubmit = async (data) => {
    try {
      //if (data.text.trim() === "" && !data.image[0]) return;
      if (data.content.trim() === "") return;

      // const formData = new FormData();
      // formData.append("user_id", userId);
      // formData.append("title", data.title);
      // formData.append("text", data.text);
      // //formData.append("image", data.image[0]);
      // formData.append("date", new Date().toLocaleString());

      console.log("data", data);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forum/posts/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (res.ok) {
        const result = await res.json();
        console.log("Post added:", result);
        router.push("/forum");
      } else {
        setError("Failed to add post: ", res);
      }
    } catch (error) {
      console.error("Error creating post:", error);
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
        <p className={styles.title}>Community Forum</p>
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
                required
                {...register("content")}
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
            {/* <Col md={4}>
              <Form.Control
                type="file"
                accept="image/*"
                {...register("image")}
                onChange={handleFileChange}
              />
            </Col>
            <Col md={4}></Col> */}
            <Col md={6}>
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

        {/* Display saved journal posts */}
        <p className={styles.title}>Posts</p>
        <div className={styles.postsSection}>
          {posts.map((post) => (
            <Card key={post.id} className={styles.postCard}>
              <Card.Body>
                <Card.Title className={styles.postCardTitle}>
                  {post.title}
                </Card.Title>
                <Card.Text
                  className={styles.postCardText}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {post.content}
                </Card.Text>
                {post.image && (
                  <Image
                    src={post.image}
                    alt="forum post"
                    className={styles.tableImg}
                  />
                )}
                <Card.Footer className={styles.postCardFooter}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {new Date(post.date).toLocaleTimeString("en-US", {
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
