import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Card, Button, Form } from "react-bootstrap";
import styles from "./post.module.css";

export default function PostDetail() {
  const router = useRouter();
  const { post_id } = router.query;
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");

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
        console.error("Error:", error);
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
        console.error("Error fetching replies:", error);
      }
    };

    fetchReplies();
  }, [post_id]);

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

        // Log for debugging
        console.log("New reply added:", newReply);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to post reply");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error posting reply");
    }
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
        <div>Loading...</div>
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
            <Card.Title className={styles.postTitle}>{post.title}</Card.Title>
            <Card.Text className={styles.postContent}>{post.content}</Card.Text>
            <div className={styles.postMetadata}>
              <small>
                Posted: {new Date(post.created_at).toLocaleDateString()} at{" "}
                {new Date(post.created_at).toLocaleTimeString()}
              </small>
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
    </Container>
  );
}
