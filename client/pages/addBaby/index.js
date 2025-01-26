// pages/addBaby/index.js
import { useForm } from "react-hook-form";
import { Row, Col, Form, Button, Container } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./addBaby.module.css";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function AddBaby() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "",
      first_name: "",
      last_name: "",
      weight: "",
    },
  });

  const router = useRouter();

  async function submitForm(data) {
    try {
      const res = await fetch("http://localhost:8080/v1/addBaby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      console.log("Data:", data);

      if (res.ok) {
        const result = await res.json();
        console.log("Baby added:", result);
        router.push(`/profile`);
      } else {
        console.error("Failed to add baby: ", res);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <Form onSubmit={handleSubmit(submitForm)}>
          <p className={styles.title}>Welcome!</p>
          <p>
            Congratulations on growing your family! Let&apos;s start by adding
            your new baby to Tummy Time.
          </p>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="First name"
                  name="firstName"
                  {...register("first_name")}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Last name"
                  name="lastName"
                  {...register("last_name")}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <hr />

          <Row className="mb-3">
            <Col>
              <Form.Group>
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

          <Row className="mb-3">
            <Col>
              <Form.Select
                name="gender"
                defaultValue=""
                className="mb-3"
                {...register("gender")}
                placeholder="Gender"
                required
              >
                <option value="" disabled>
                  Gender
                </option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </Form.Select>
            </Col>
          </Row>

          <Button
            variant="primary"
            type="submit"
            className={styles.submitButton}
          >
            Create baby profile
          </Button>
        </Form>
      </div>
    </Container>
  );
}
