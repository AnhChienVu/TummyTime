// components/Forum/ForumToast.js
// This is a component for displaying toast notifications in the forum
// It shows success or error messages based on the type of notification
import styles from "./ForumToast.module.css";

const ForumToast = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastMessage}>
        <div
          className={`${styles.toastIconCircle} ${
            type === "error" ? styles.error : ""
          }`}
        >
          {type === "success" ? "✓" : "✗"}
        </div>
        {message}
        <button className={styles.toastClose} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ForumToast;
