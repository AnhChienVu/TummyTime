import React from "react";
import { Modal, Button } from "react-bootstrap";
import styles from "./SendDocumentsModal.module.css";

const SendDocumentsModal = ({
  show,
  handleClose,
  documents,
  onSendNewDocument,
  purpose,
}) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className={styles.modalHeader}>
        {purpose === "getSentFilesFromParent" ? (
          <div>
            <Modal.Title>Sending Documents</Modal.Title>
            <p className={styles.modalNote}>
              Here you can view the documents already sent and send new ones.
            </p>
          </div>
        ) : (
          <div>
            <Modal.Title>Get Documents</Modal.Title>
            <p className={styles.modalNote}>
              Here you can view the documents already sent by doctor for your
              baby.
            </p>
          </div>
        )}
      </Modal.Header>

      <Modal.Body>
        {documents.length > 0 ? (
          <ul>
            {documents.map((doc) => (
              <li key={doc.document_id} className={styles.fileItem}>
                <p className={styles.fileName}>{doc.filename}</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.document_id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadLink}
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No documents available</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        {purpose === "getSentFilesFromParent" ? (
          <div>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button className={styles.sendButton} onClick={onSendNewDocument}>
              Send New Document
            </Button>
          </div>
        ) : (
          <div>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SendDocumentsModal;
