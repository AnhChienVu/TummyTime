import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, Container } from "react-bootstrap";
import styles from "./index.module.css";
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (form.checkValidity() === true) {
      setValidated(true);

      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        console.log("Success");
        router.push("/about");
      } else {
        setError("Invalid credentials");
      }
    }
  };

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <Form
          noValidate
          validated={validated}
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <p className={styles.title}>Welcome back !</p>

          <Form.Group className="mb-3" controlId="emailLogin">
            <Form.Control
              type="email"
              placeholder="Enter email"
              className={styles.formControl}
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="passwordLogin">
            <Form.Control
              type="password"
              placeholder="Password"
              className={styles.formControl}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className={styles.loginButton}
          >
            Login
          </Button>

          <div className="mt-3">
            <Link href="/" className={styles.link}>
              Forgot password ?
            </Link>
            <p>
              Dont have an account ?{" "}
              <Link href="/register" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}
