// hooks/useReplies.js
// This file contains the logic for managing replies to a post in a forum application. It includes functions for fetching, adding, editing, and deleting replies, as well as managing the state of the reply input fields and modals.
import { useState, useEffect } from "react";

export function useReplies(post_id) {
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [deleteReplyConfirmed, setDeleteReplyConfirmed] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState(null);

  const handleStartReplyEdit = (reply) => {
    if (!reply) return;
    setEditingReplyId(reply.reply_id);
    setEditReplyContent(reply.content);
  };

  const handleStartReplyDelete = (reply) => {
    if (!reply) return;
    setReplyToDelete(reply);
    setShowDeleteReplyModal(true);
  };

  useEffect(() => {
    if (!post_id) return;
    fetchReplies();
  }, [post_id]);

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
          // created_at: new Date().toISOString(), // Add timestamp if not provided by API
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

  const handleReplyEdit = async (replyId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/replies/${replyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: editReplyContent,
          }),
        },
      );

      if (response.ok) {
        // Update the replies state with the edited reply
        setReplies(
          replies.map((reply) =>
            reply.reply_id === replyId
              ? {
                  ...reply,
                  content: editReplyContent,
                  updated_at: new Date().toISOString(),
                }
              : reply,
          ),
        );
        setEditingReplyId(null);
        setEditReplyContent("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update reply");
      }
    } catch (error) {
      setError("Error updating reply");
    }
  };

  const handleReplyDelete = async (replyId) => {
    if (!replyId) {
      setError("Invalid reply ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/replies/${replyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Update local state to remove the deleted reply
        setReplies((prevReplies) =>
          prevReplies.filter((reply) => reply.reply_id !== replyId),
        );

        // Reset modal state
        setShowDeleteReplyModal(false);
        setReplyToDelete(null);
        setDeleteReplyConfirmed(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete reply");
      }
    } catch (error) {
      setError(error.message || "Error deleting reply");
      // Reset modal state even if there's an error
      setShowDeleteReplyModal(false);
      setReplyToDelete(null);
      setDeleteReplyConfirmed(false);
    }
  };

  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditReplyContent("");
  };

  return {
    replies,
    error,
    replyContent,
    editingReplyId,
    editReplyContent,
    showDeleteReplyModal,
    deleteReplyConfirmed,
    replyToDelete,
    setReplyContent,
    setEditingReplyId,
    setEditReplyContent,
    setShowDeleteReplyModal,
    setDeleteReplyConfirmed,
    setReplyToDelete,
    handleReplySubmit,
    handleReplyEdit,
    handleReplyDelete,
    handleStartReplyEdit,
    handleStartReplyDelete,
    handleCancelReplyEdit,
  };
}
