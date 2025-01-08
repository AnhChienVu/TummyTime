import React, { useEffect, useState } from "react";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import styles from "./index.module.css";
import Link from "next/link";

export default function Home() {
  // useEffect(() => {
  //   fetch("http://localhost:8080/")
  //     .then((res) => res.json())
  //     .then((data) => console.log(data));
  // }, []);

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <Form className={styles.form}>
          <p className={styles.title}>Welcome back !</p>

          <Form.Group className="mb-3" controlId="emailLogin">
            <Form.Control
              type="email"
              placeholder="Enter email"
              className={styles.formControl}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="passwordLogin">
            <Form.Control
              type="password"
              placeholder="Password"
              className={styles.formControl}
            />
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
              <Link href="/" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}
