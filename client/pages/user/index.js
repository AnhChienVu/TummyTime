// client/pages/user/index.js        languageMode: JSX
/* User Information Edit page */

import { useState, useEffect } from "react";
import { Row, Col, Container, Button, Modal, Form } from "react-bootstrap";
import styles from "./user.module.css";
import { set, useForm } from "react-hook-form";
import { useRouter } from "next/router";

// MOCK DATA
// NOTE:-ASSUMPTION: The user is already logged in with a valid session
// The userID is stored in the session after login
const userID = 1;
// NOTE:-ASSUMMING: API url is http://localhost:8080/
const API_URL = "http://localhost:8080";

export default function EditUserProfile() {
  let userData; // store all fields of user data in database

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => { 
    async function fetchUser() { 
      try {
        //TODO-: ===> NEED to change to RETRIEVE User data with the correct userID from session cache
        const res = await fetch(`${API_URL}/v1/users/${userID}`);

        if (res.ok) {
          userData = await res.json();
          console.log("Fetched User data:", userData);
        } else {
          console.error("Failed to fetch user:", userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      setValue("first_name", userData?.first_name);
      setValue("last_name", userData?.last_name);
      setValue("email", userData?.email);
      setValue("role", userData?.role);
    }

    fetchUser();
  }, [setValue]); // [setValue] will only run once

  const submitForm = async (data) => {
    //submitting form of user data
    try {
      // add "created_at" key
      data.created_at = new Date().toISOString();
      console.log("Submitting form with data: ", data);

      await fetch(`${API_URL}/v1/users/${userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log(`User ${userID} updated successfully with this data: `, data);
      alert("User information updated successfully!");
      router.push("/profile");  // redirect to /profile page (showing user and babies)
    } catch (err) {
      console.error(`Error updating user ${userID}: `, err);
      alert("Error updating user information. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      // deleting User
      await fetch(`${API_URL}/v1/users/${userID}`, {
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
                  isInvalid={
                    !!errors?.first_name
                  }
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
                      value:
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
                      ,
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
                <Form.Control
                  name="role"
                  type="text"
                  placeholder="Role"
                  {...register("role", {
                    required: "Role is required.",
                  })}
                  isInvalid={!!errors?.role}
                />
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
