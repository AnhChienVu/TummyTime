// pages/baby/[baby_id]/profile/index.js
// Front-end for one baby profile
import { useForm } from "react-hook-form";
import { Row, Col, Form, Button, Container, Modal } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./profile.module.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import { useState, useEffect } from "react";

export default function BabyProfile() {
  const router = useRouter();
  const { id: baby_id, user_id } = router.query;
  const [baby, setBaby] = useState(null);
  const { register, handleSubmit, setValue, watch } = useForm();
  const [originalData, setOriginalData] = useState(null);
  const formValues = watch(); // React Hook Form's watch to track form values
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  // Get the selected baby's profile information
  useEffect(() => {
    const fetchBabyProfile = async () => {
      if (baby_id) {
        try {
          const res = await fetch(
            `http://localhost:8080/v1/baby/${baby_id}/getBabyProfile`,
          );
          const data = await res.json();

          setBaby(data);
          // Pre-fill form fields
          setValue("first_name", data.first_name);
          setValue("last_name", data.last_name);
          setValue("gender", data.gender);
          setValue("weight", data.weight);
          // setValue("date_of_birth", data.date_of_birth); // TODO add a DOB option to addBaby form and database table
          setOriginalData(data); // Store original data
        } catch (error) {
          console.error("Error fetching baby profile:", error);
        }
      }
    };

    fetchBabyProfile();
  }, [baby_id, setValue]);

  // Check if form values have changed
  const isFormChanged = () => {
    if (!originalData) return false;
    return (
      formValues.first_name !== originalData.first_name ||
      formValues.last_name !== originalData.last_name ||
      formValues.gender !== originalData.gender ||
      formValues.weight !== originalData.weight
    );
  };

  // Update baby profile
  const onSubmit = async (data) => {
    try {
      const res = await fetch(
        `http://localhost:8080/v1/baby/${baby_id}/updateBabyProfile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            user_id: user_id,
          }),
        },
      );
      if (res.ok) {
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error updating baby profile:", error);
    }
  };

  /* Event handler for "Delete Profile" button */
  // First, display a confirmation modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Then, handle the delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmed) return;

    try {
      const res = await fetch(
        `http://localhost:8080/v1/baby/${baby_id}/deleteBabyProfile`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user_id,
          }),
        },
      );
      if (res.ok) {
        setShowDeleteModal(false);
        // Show success notification
        alert("Profile successfully deleted");
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error deleting baby profile:", error);
      alert("Error deleting profile");
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setDeleteConfirmed(false);
  };

  return (
    <div className="d-flex">
      <Container className="py-4">
        <h2>Edit Baby Profile</h2>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  {...register("first_name")}
                  type="text"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control {...register("last_name")} type="text" required />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select {...register("gender")} required>
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="boy">Boy</option>
                  <option value="girl">Girl</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Weight (lbs)</Form.Label>
                <Form.Control
                  name="weight"
                  type="number"
                  placeholder="Weight at birth (lb)"
                  min={5}
                  {...register("weight")}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          {/* <Form.Group className="mb-3">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control {...register("date_of_birth")} type="date" />
          </Form.Group> */}
          <div className="d-flex">
            <Button
              type="submit"
              disabled={!isFormChanged()}
              className={`${
                !isFormChanged() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Save Changes
            </Button>
            <Button onClick={handleDeleteClick} className={styles.deleteButton}>
              Delete Profile
            </Button>
          </div>
        </Form>

        {/* "Confirm Delete" popup */}
        <Modal show={showDeleteModal} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this baby profile?</p>
            <Form.Check
              type="checkbox"
              id="delete-confirm"
              label="I understand that this action cannot be undone and all data will be permanently deleted"
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
              Delete Profile
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}
