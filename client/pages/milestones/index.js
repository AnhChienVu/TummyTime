import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  ListGroup,
  Container,
  Row,
  Col,
  Card,
  Tab,
  Nav,
  Alert,
} from "react-bootstrap";
import { format, set } from "date-fns";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import styles from "./milestones.module.css";
import BabyCardMilestone from "@/components/BabyCardMilestone/BabyCardMilestone";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useRouter } from "next/router";

const mockApi = {
  fetchMilestones: () => Promise.resolve([]),
  addMilestone: (newMilestone) =>
    Promise.resolve({ success: true, data: newMilestone }),
  deleteMilestone: (index) => Promise.resolve({ success: true }),
  updateMilestone: (updatedMilestone, index) =>
    Promise.resolve({ success: true, data: updatedMilestone }),
};

// const Milestones = () => {
//   const [milestones, setMilestones] = useState([]);
//   const [modalShow, setModalShow] = useState(false);
//   const [newTitle, setNewTitle] = useState("");
//   const [newDetails, setNewDetails] = useState("");
//   const [newDate, setNewDate] = useState(
//     new Date().toISOString().split("T")[0],
//   );
//   const [isEditing, setIsEditing] = useState(false);
//   const [currentEditIndex, setCurrentEditIndex] = useState(null);

//   useEffect(() => {
//     mockApi.fetchMilestones().then((data) => setMilestones(data));
//   }, []);

//   const handleSaveMilestone = async () => {
//     const newMilestone = {
//       title: newTitle,
//       date: newDate,
//       details: newDetails,
//       meals: [{ time: format(new Date(), "h:mm a") }],
//     };

//     if (isEditing && currentEditIndex !== null) {
//       const response = await mockApi.updateMilestone(
//         newMilestone,
//         currentEditIndex,
//       );
//       if (response.success) {
//         const updated = [...milestones];
//         updated[currentEditIndex] = newMilestone;
//         setMilestones(updated);
//       }
//     } else {
//       const response = await mockApi.addMilestone(newMilestone);
//       if (response.success) {
//         setMilestones([...milestones, newMilestone]);
//       }
//     }

//     setModalShow(false);
//     setNewTitle("");
//     setNewDetails("");
//     setNewDate(new Date().toISOString().split("T")[0]);
//     setIsEditing(false);
//     setCurrentEditIndex(null);
//   };

//   const handleDeleteMilestone = async (index) => {
//     const response = await mockApi.deleteMilestone(index);
//     if (response.success) {
//       setMilestones(milestones.filter((_, i) => i !== index));
//     }
//   };

//   const handleEditMilestone = (index) => {
//     const mile = milestones[index];
//     setNewTitle(mile.title);
//     setNewDetails(mile.details);
//     setNewDate(mile.date);
//     setIsEditing(true);
//     setCurrentEditIndex(index);
//     setModalShow(true);
//   };

//   return (
//     <div className={styles.container}>
//       {/* Header Row (Title & Add button) */}
//       <div className={styles.headerRow}>
//         <h1>Milestones</h1>
//         <Button
//           className={styles.addButton}
//           onClick={() => {
//             setModalShow(true);
//             setIsEditing(false);
//             setNewTitle("");
//             setNewDetails("");
//             setNewDate(new Date().toISOString().split("T")[0]);
//           }}
//         >
//           Add
//         </Button>
//       </div>

//       {/* Main content: List of milestones or "no milestones" message */}
//       {milestones.length === 0 ? (
//         <div
//           style={{
//             textAlign: "center",
//             marginTop: 32,
//             color: "#888",
//             fontSize: 16,
//           }}
//         >
//           <p>No milestones found.</p>
//           <p>Click "Add" to create your first milestone!</p>
//         </div>
//       ) : (
//         <ListGroup>
//           {milestones.map((milestone, idx) => (
//             <ListGroup.Item className={styles.listItem} key={idx}>
//               <div className={styles.milestoneContainer}>
//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <h5 style={{ fontWeight: "bold", margin: 0 }}>
//                       {milestone.title}
//                     </h5>
//                     <span style={{ color: "gray", fontSize: 12 }}>
//                       {format(
//                         new Date(milestone.date + "T00:00:00"),
//                         "MMM d, yyyy",
//                       )}
//                     </span>
//                   </div>
//                   <p style={{ marginTop: 8 }}>{milestone.details}</p>
//                 </div>
//                 <div className={styles.iconContainer}>
//                   <Button
//                     variant="link"
//                     className={styles.iconButton}
//                     onClick={() => handleEditMilestone(idx)}
//                   >
//                     <FaEdit />
//                   </Button>
//                   <Button
//                     variant="link"
//                     className={styles.iconButton}
//                     onClick={() => handleDeleteMilestone(idx)}
//                   >
//                     <FaTrashAlt />
//                   </Button>
//                 </div>
//               </div>
//             </ListGroup.Item>
//           ))}
//         </ListGroup>
//       )}

//       {/* Modal */}
//       <Modal show={modalShow} onHide={() => setModalShow(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             {isEditing ? "Edit Milestone" : "Add a Milestone"}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group controlId="title">
//               <Form.Label>Title</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={newTitle}
//                 onChange={(e) => setNewTitle(e.target.value)}
//                 placeholder="Enter milestone title"
//               />
//             </Form.Group>
//             <Form.Group controlId="details" className="mt-3">
//               <Form.Label>Details</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 value={newDetails}
//                 onChange={(e) => setNewDetails(e.target.value)}
//                 placeholder="Enter milestone details"
//               />
//             </Form.Group>
//             <Form.Group controlId="date" className="mt-3">
//               <Form.Label>Date</Form.Label>
//               <Form.Control
//                 type="date"
//                 value={newDate}
//                 onChange={(e) => setNewDate(e.target.value)}
//               />
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             onClick={() => setModalShow(false)}
//             style={{
//               backgroundColor: "transparent",
//               border: "1px solid #ccc",
//               color: "#6a0dad",
//               borderRadius: 8,
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSaveMilestone}
//             disabled={!newTitle.trim() || !newDetails.trim() || !newDate.trim()}
//             style={{
//               backgroundColor:
//                 !newTitle.trim() || !newDetails.trim() || !newDate.trim()
//                   ? "#e0e0e0"
//                   : "#65558f",
//               border: "none",
//               color:
//                 !newTitle.trim() || !newDetails.trim() || !newDate.trim()
//                   ? "#a0a0a0"
//                   : "#fff",
//               borderRadius: 8,
//             }}
//           >
//             {isEditing ? "Save" : "Add"}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

function Milestones() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [addMilestoneModalShow, setAddMilestoneModalShow] = useState(false);
  const [newModalError, setNewModalError] = useState("");
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const router = useRouter();

  const handleOpenAddMilestoneModal = (baby_id) => {
    setNewModalError("");
    setTitle("");
    setDetails("");
    setSelectedBaby(baby_id);
    setAddMilestoneModalShow(true);
  };

  const ToastMessage = ({ message, variant = "success", onClose }) => (
    <div className={styles.toastMessage}>
      <div
        className={
          variant === "error"
            ? `${styles.toastIconCircle} ${styles.error}`
            : variant === "warning"
            ? `${styles.toastIconCircle} ${styles.warning}`
            : styles.toastIconCircle
        }
      >
        <AiOutlineInfoCircle />
      </div>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        ×
      </button>
    </div>
  );

  const ToastContainer = ({ toasts, removeToast }) => (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  let toastIdCounter = 1;
  const createToastId = () => {
    return toastIdCounter++;
  };

  const showToast = (message, variant = "success") => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveNewMilestone = async () => {
    setNewModalError("");

    try {
      // Add new feed to database
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}v1/baby/${selectedBaby}/addMilestone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            title,
            details,
            date: new Date().toISOString().split("T")[0],
          }),
        },
      );

      const data = await res.json();

      if (data.status === "ok") {
        setModalShow(false);
        showToast("Milstone added to server!");
        router.reload();
      } else {
        showToast("Failed to add milestone to server.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error adding milestone to server.", "danger");
    }
  };

  return (
    <Container className={styles.container} fluid>
      <Row>
        <Col>
          <h1>Milestones</h1>
          <BabyCardMilestone addMilestoneBtn={handleOpenAddMilestoneModal} />
        </Col>
      </Row>

      <Modal
        show={addMilestoneModalShow}
        onHide={() => setAddMilestoneModalShow(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add a milestone</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newModalError && <Alert variant="danger">{newModalError}</Alert>}
          <Form>
            <Form.Group controlId="title">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="details">
              <Form.Label>Details</Form.Label>
              <Form.Control
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              ></Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className={styles.btnCancel}
            onClick={() => setAddMilestoneModalShow(false)}
          >
            Cancel
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveNewMilestone}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Milestones;
