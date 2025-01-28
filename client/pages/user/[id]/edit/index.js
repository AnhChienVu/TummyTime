// client/pages/user/index.js        languageMode: JSX
/* User Information Edit page */

import { useState, useEffect } from "react";
import { Row, Col, Container, Button, Modal, Form } from "react-bootstrap";
import styles from "./user.module.css";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function EditUserProfile() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
    },
  });

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const userProfile = router.query?.profile
        ? JSON.parse(router.query.profile)
        : null;
      setUser(userProfile);

      setValue("first_name", userProfile?.first_name);
      setValue("last_name", userProfile?.last_name);
      setValue("email", userProfile?.email);
      setValue("role", userProfile?.role);
    }
  }, [router.isReady, router.query, setValue]);

  const submitForm = async (data) => {
    //submitting form of user data
    try {
      // add "created_at" key
      data.created_at = new Date().toISOString();
      console.log("Submitting form with data: ", data);

      const res = await fetch(`http://localhost:8080/v1/user/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        console.log(
          `User ${user.user_id} updated successfully with this data: `,
          updatedUser,
        );
        alert("User information updated successfully!");
        router.push("/profile"); // redirect to /profile page (showing user and babies)
      } else {
        const errorData = await res.json();
        console.error(`Error updating user ${user.user_id}: `, errorData);
        alert("Error updating user information. Please try again.");
      }
    } catch (err) {
      console.error(`Error updating user ${user.user_id}: `, err);
      alert("Error updating user information. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      // deleting User
      await fetch(`http://localhost:8080/v1/user/${user.user_id}`, {
        method: "DELETE",
      });
      alert("User deleted successfully!");
      router.push("/");
    } catch (err) {
      console.error(`Error deleting user ${userID}: `, err);
      alert("Error deleting user information. Please try again.");
    }
  };

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <Form onSubmit={handleSubmit(submitForm)}>
          {/* Title */}
          <p className={styles.title}>Edit Your User Information</p>

          {/* Name Field */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="First name"
                  {...register("first_name", {
                    required: "First name is required.",
                  })}
                  isInvalid={!!errors?.first_name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.first_name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Last name"
                  {...register("last_name", {
                    required: "Last name is required.",
                  })}
                  isInvalid={!!errors?.last_name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.last_name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Email Field */}
          <Row className="mb-3">
            <Col>
              <Form.Group className="mb-3">
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="Email"
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email is not valid.",
                    },
                  })}
                  isInvalid={!!errors?.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.email?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Role Field */}
          <Row className="mb-3">
            <Col>
              <Form.Group className="mb-3">
                <Form.Select
                  name="role"
                  type="text"
                  placeholder="Role"
                  {...register("role", {
                    required: "Role is required.",
                  })}
                  isInvalid={!!errors?.role}
                >
                  <option value="Parent">Parent</option>
                  <option value="Caregiver">Caregiver</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors?.role?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            {/* Save Button */}
            <Col>
              <Button
                variant="primary"
                type="submit"
                className={styles.submitButton}
              >
                Save Changes
              </Button>
            </Col>
          </Row>

          {/* Delete Button */}
          <Row className="mb-3">
            <Col>
              <Button
                variant="danger"
                className={styles.deleteButton}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete User Profile
              </Button>
            </Col>
          </Row>
        </Form>

        {/* Delete Modal: when clicking delete-user button */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          aria-labelledby="user-profile-delete-modal"
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Confirm Delete User Profile
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Are you sure you want to delete your profile?</h5>
            <p>This action cannot be undone. All your data will be lost.</p>
          </Modal.Body>
          <Modal.Footer>
            {/* Cancel Button */}
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            {/* Delete Button */}
            <Button variant="danger" onClick={handleDelete}>
              Delete User Profile
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Container>
  );
}
