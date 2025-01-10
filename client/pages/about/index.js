// client/pages/about/index.js
import { useForm } from "react-hook-form";
import { Row, Col, Form, Button, Container } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./about.module.css";

export default function AdvancedSearch() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "",
      firstName: "",
      lastName: "",
      weight: "",
    },
  });

  const router = useRouter();

  async function submitForm(data) {
    console.log("form submitted: ", data);
    router.push(`/`); // Should go to another page that's not the login page
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
                  {...register("firstName")}
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
                  {...register("lastName")}
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
                  min={5} // Accept a minimum weight of 5lbs
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
            className={styles.loginButton}
          >
            Create baby profile
          </Button>
        </Form>
      </div>
    </Container>
  );
}
