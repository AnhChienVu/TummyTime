// components/Forum/Post.js
import {
  Card,
  Button,
  Form,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import styles from "./Post.module.css";
import { useTranslation } from "next-i18next";
import { useState } from "react";

export function Post({
  post,
  isEditing,
  editTitle,
  editContent,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  setEditTitle,
  setEditContent,
}) {
  const { t } = useTranslation("common");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!post) {
    return (
      <Card className={styles.postDetailCard}>
        <Card.Body>
          <div className={styles.loading}>Loading...</div>
        </Card.Body>
      </Card>
    );
  }

  const handleEditChange = (e) => {
    setEditTitle && setEditTitle(e.target.value);
  };

  const handleContentChange = (e) => {
    setEditContent && setEditContent(e.target.value);
  };

  const handleEditClick = () => {
    // Set initial values before enabling edit mode
    setEditTitle(post.title);
    setEditContent(post.content);
    onEdit();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setShowDeleteModal(false);
      await onDelete();
      setShowSuccessToast(true);

      // Return a promise that resolves after 3 seconds (after the toast is shown)
      return new Promise((resolve) => {
        setTimeout(() => {
          setShowSuccessToast(false);
          resolve();
        }, 3000);
      });
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Card className={styles.postDetailCard}>
        <Card.Body>
          <div className={styles.postHeader}>
            {isEditing ? (
              <>
                <Form.Control
                  type="text"
                  value={editTitle || ""}
                  onChange={handleEditChange}
                  className={styles.editTitleInput}
                />
              </>
            ) : (
              <>
                <div className={styles.postTitleContainer}>
                  <Card.Title className={styles.postTitle}>
                    {post.title}
                  </Card.Title>
                </div>
                {post.is_owner && !isEditing && (
                  <div className={styles.postActions}>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleEditClick}
                      className={styles.editButton}
                    >
                      {t("Edit Post")}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteClick}
                      className={styles.deleteButton}
                    >
                      {t("Delete Post")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          {isEditing && (
            <>
              <Form.Control
                as="textarea"
                rows={5}
                value={editContent || ""}
                onChange={handleContentChange}
                className={styles.editContentInput}
              />
              <div className={styles.editButtons}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={onSave}
                  className={styles.editActionButton}
                >
                  {t("Save")}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={onCancel}
                  className={styles.editActionButton}
                >
                  {t("Cancel")}
                </Button>
              </div>
            </>
          )}
          {!isEditing && (
            <Card.Text className={styles.postContent}>{post.content}</Card.Text>
          )}
          <div className={styles.postMetadata}>
            <div className={styles.metadataContainer}>
              <small>
                {t("Posted by")}: {post.display_name} on{" "}
                {new Date(post.created_at).toLocaleDateString()} at{" "}
                {new Date(post.created_at).toLocaleTimeString()}
              </small>
              {post.updated_at && post.updated_at !== post.created_at && (
                <small>
                  <i className={styles.editedText}>
                    {t("Last edited")}:{" "}
                    {new Date(post.updated_at).toLocaleDateString()} at{" "}
                    {new Date(post.updated_at).toLocaleTimeString()}
                  </i>
                </small>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={handleDeleteCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Delete")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t(
            "Are you sure you want to delete this post? This action cannot be undone.",
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="bottom-end" className={styles.toastContainer}>
        <Toast
          show={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          // delay={3000}
          // autohide
          bg="success"
          className={styles.toast}
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{t("Success")}</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {t("Post successfully deleted")}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
