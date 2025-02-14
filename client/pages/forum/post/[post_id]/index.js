// pages/forum/post/[post_id]/index.js
// Displays a post and its replies
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Card, Button, Form, Modal } from "react-bootstrap";
import styles from "./post.module.css";

export default function PostDetail() {
  const router = useRouter();
  const { post_id } = router.query;
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      if (!post_id) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setPost(data.data);
        } else {
          setError("Failed to fetch post");
        }
      } catch (error) {
        setError("Error loading post");
      }
    };

    fetchPost();
  }, [post_id]);

  // Fetch replies
  useEffect(() => {
    const fetchReplies = async () => {
      if (!post_id) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}/replies`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setReplies(data.data);
        }
      } catch (error) {
        setError("Failed to fetch posts");
      }
    };

    fetchReplies();
  }, [post_id]);

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        // Create a new reply object with all required fields
        const newReply = {
          ...result.data,
          created_at: new Date().toISOString(), // Add timestamp if not provided by API
        };

        // Update replies state with the new reply
        setReplies((prevReplies) => [...prevReplies, newReply]);

        // Clear the reply input
        setReplyContent("");

        // Update post reply count if needed
        if (post) {
          setPost((prevPost) => ({
            ...prevPost,
            reply_count: (prevPost.reply_count || 0) + 1,
          }));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to post reply");
      }
    } catch (error) {
      setError("Error posting reply");
    }
  };

  // Handle post edit submission
  const handleEditSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle,
            content: editContent,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Update the post state with the new data while preserving other fields
        setPost((prevPost) => ({
          ...prevPost,
          title: editTitle,
          content: editContent,
          updated_at: new Date().toISOString(),
        }));
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update post");
      }
    } catch (error) {
      setError("Error updating post");
    }
  };

  const startEditing = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
  };

  /* Event handler for the "Delete Post" button */
  // First, display a confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setShowDeleteModal(false);
        alert("Post successfully deleted");
        router.push("/forum");
      } else {
        setError(data.message || "Failed to delete post");
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError("Error deleting post");
      setShowDeleteModal(false);
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setDeleteConfirmed(false);
  };

  if (error) {
    return (
      <Container className={styles.container}>
        <div className={styles.error}>{error}</div>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className={styles.container}>
        <div>This post does not exist</div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Button
        variant="link"
        onClick={() => router.push("/forum")}
        className={styles.backButton}
      >
        ← Back to Forum
      </Button>

      {post && (
        <Card className={styles.postDetailCard}>
          <Card.Body>
            <div className={styles.postHeader}>
              {isEditing ? (
                <Form.Control
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={styles.editTitleInput}
                />
              ) : (
                <Card.Title className={styles.postTitle}>
                  {post.title}
                </Card.Title>
              )}
              <div>
                {isEditing ? (
                  <div className={styles.editButtons}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEditSubmit}
                      className={styles.editActionButton}
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className={styles.editActionButton}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className={styles.postActions}>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={startEditing}
                      className={styles.editButton}
                    >
                      Edit Post
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteClick}
                      className={styles.deleteButton}
                    >
                      Delete Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {isEditing ? (
              <Form.Control
                as="textarea"
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={styles.editContentInput}
              />
            ) : (
              <Card.Text className={styles.postContent}>
                {post.content}
              </Card.Text>
            )}
            <div className={styles.postMetadata}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <small>
                  Posted: {new Date(post.created_at).toLocaleDateString()} at{" "}
                  {new Date(post.created_at).toLocaleTimeString()}
                </small>
                {post.updated_at && post.updated_at !== post.created_at && (
                  <small>
                    <i style={{ color: "#666666" }}>
                      Last edited:{" "}
                      {new Date(post.updated_at).toLocaleDateString()} at{" "}
                      {new Date(post.updated_at).toLocaleTimeString()}
                    </i>
                  </small>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <div className={styles.repliesSection}>
        <h5>Replies ({replies.length})</h5>
        {replies.length > 0 ? (
          replies.map((reply) => (
            <Card key={reply.reply_id} className={styles.replyCard}>
              <Card.Body>
                <Card.Text>{reply.content}</Card.Text>
                <small className={styles.replyMetadata}>
                  {new Date(reply.created_at).toLocaleDateString()} at{" "}
                  {new Date(reply.created_at).toLocaleTimeString()}
                </small>
              </Card.Body>
            </Card>
          ))
        ) : (
          <p>No replies yet</p>
        )}
      </div>

      <Form onSubmit={handleReplySubmit} className={styles.replyForm}>
        <Form.Group>
          <Form.Label>Add a reply</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply here..."
          />
        </Form.Group>
        <Button
          type="submit"
          className={styles.replyButton}
          disabled={!replyContent.trim()}
        >
          Post Reply
        </Button>
      </Form>

      <Modal show={showDeleteModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this post?</p>
          <Form.Check
            type="checkbox"
            id="delete-confirm"
            label="I understand that this action cannot be undone and all replies will be permanently deleted"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="mb-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={!deleteConfirmed}
          >
            Delete Post
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
