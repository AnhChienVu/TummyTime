// client/pages/user/index.js        languageMode: JSX
/* User Profile Edit page */

import { useState, useEffect } from "react";
import { Row, Col, Container, Button, Modal, Form } from "react-bootstrap";
import styles from "./user.module.css";
import { set, useForm } from "react-hook-form";
import { useRouter } from "next/router"; // useRouter hook: to access the router object inside any function

// MOCK DATA
// NOTE-ASSUMPTION: The user is already logged in with a valid session
// The userID is stored in the session after l
const userID = 1;
// NOTE-ASSUMMING: API url is http://localhost:8080/
const API_URL = "http://localhost:8080";

export default function EditUserProfile() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      role: "",
    },
  });

  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false); // state to show/hide delete modal window when clicking delete-user button

  useEffect(() => {
    // load user data first
    async function fetchUser() {
      let userData;

      // Fetches the user's data from the API
      try {
        //DEBUG: => NEED TESTING fetch FOR User data +API `GET USER`
        //TODO-: ===> NEED to change to RETRIEVE User data with the correct userID
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

      setValue("firstname", userData?.firstname);
      setValue("lastname", userData?.lastname);
      setValue("email", userData?.email);
      setValue("role", userData?.role);
    }

    fetchUser();
  }, [setValue]); // [setValue] is a dependency array to prevent infinite loop, meaning useEffect will only run once

  const submitForm = async (data) => {
    try {
      //DEBUG: => NEED TESTING fetch FOR save-changes BUTTON +API `PUT /users/:id`
      await fetch(`${API_URL}/v1/users/${userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log(`User ${userID} updated successfully with this data: `, data);
      alert("User information updated successfully!");
      router.push("/profile");
    } catch (err) {
      console.error(`Error updating user ${userID}: `, err);
      alert("Error updating user information. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      //DEBUG: => NEED TESTING fetch FOR delete-user BUTTON +API `DELETE /users/:id`
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
      {/* "fluid" means .container-fluid class: a full-width container, spanning the entire width of the viewport */}
      <div className={styles.formContainer}>
        <Form onSubmit={handleSubmit(submitForm)}>
          {/* Title */}
          <p className={styles.title}>Edit Your User Information</p>

          {/* Name Field */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                {/* mb-3 means margin-bottom: 3rem 
                - margin-bottom means spacing under this element
                - (3x the default font-size 16px = 48px) */}
                <Form.Control
                  type="text"
                  placeholder="First name"
                  {...register("firstname", {
                    required: "First name is required.",
                  })} // set validation rules for Name
                  isInvalid={
                    !!errors?.firstname
                  } /* Highlight field if there's an error. `!!` converts the value to a boolean true/false. */
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.firstname?.message}
                  {/* if name is empty, it will show errors.name.message: "Name is required." */}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Last name"
                  {...register("lastname", {
                    required: "Last name is required.",
                  })}
                  isInvalid={!!errors?.lastname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.lastname?.message}
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
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/ /* Validation rule for email format:
                                        - ^[^\s@]+: start with any character except whitespace `^\s` and `^@`
                                        - @[^\s@]+: followed by `@` and any character except whitespace `^\s` and `^@`
                                        - \.[^\s@]+$: end with `.` and any character except whitespace `^\s` and `^@`
                                        */,
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
