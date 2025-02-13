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
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchPosts = async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      logger.error("No token found");
      return;
    }

    try {
      const postsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (postsResponse.ok) {
        const response = await postsResponse.json();
        if (response.status === "ok" && Array.isArray(response.data)) {
          setPosts(response.data);
        } else {
          setError("Invalid posts data format:", response);
        }
      }
    } catch (error) {
      setError("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (data.content.trim() === "") return;

      const postData = {
        ...data,
        date: new Date().toISOString(),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(postData),
        },
      );

      if (res.ok) {
        const result = await res.json();
        // Clear the form
        reset();
        // Fetch updated posts
        await fetchPosts();
      } else {
        setError("Failed to add post: ", res);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // // For image preview
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
        <p className={styles.title}>Latest Posts</p>
        <div className={styles.postsSection}>
          {Array.isArray(posts) && posts.length > 0 ? (
            [...posts]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((post) => (
                <div
                  key={post.post_id}
                  onClick={() => router.push(`/forum/post/${post.post_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <Card className={styles.postCard}>
                    <Card.Body>
                      <Card.Title className={styles.postCardTitle}>
                        {post.title}
                      </Card.Title>
                      <Card.Text
                        className={`${styles.postCardText} ${styles.truncateText}`}
                      >
                        {post.content}
                      </Card.Text>
                      <div className={styles.postMetadata}>
                        <small>
                          Posted:{" "}
                          {new Date(post.created_at).toLocaleDateString()} at{" "}
                          {new Date(post.created_at).toLocaleTimeString()}
                        </small>
                        <small>Replies: {post.reply_count}</small>
                      </div>
                      {post.replies && post.replies.length > 0 && (
                        <div className={styles.replies}>
                          <h6>Replies:</h6>
                          {post.replies.map((reply) => (
                            <div key={reply.reply_id} className={styles.reply}>
                              <p>{reply.content}</p>
                              <small>
                                {new Date(
                                  reply.created_at,
                                ).toLocaleDateString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              ))
          ) : (
            <p>No posts found</p>
          )}
        </div>
      </div>
    </Container>
  );
}
