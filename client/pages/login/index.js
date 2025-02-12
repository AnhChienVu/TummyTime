// pages/login/index.js
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form } from "react-bootstrap";
import styles from "./login.module.css";
import Link from "next/link";
import { Container } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Login() {
  const { t, i18n } = useTranslation("common");
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

      const res = await fetch(`${process.env.API_URL}v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.redirect === "/register") {
          console.log("Login successfully, please complete your registration");
          localStorage.setItem("token", data.token);
          router.push("/register");
        } else {
          console.log("Login successfully");
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.userId);
          router.push("/profile");
        }
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
          <p className={styles.title}>{t("Welcome back !")}</p>

          <Form.Group className="mb-3" controlId="emailLogin">
            <Form.Control
              type="email"
              placeholder={t("Enter email")}
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
              placeholder={t("Password")}
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
            {t("Login")}
          </Button>

          <div className="mt-3">
            <p>
              {t("Dont have an account ?")}{" "}
              <Link
                href="https://us-east-26an90qfwo.auth.us-east-2.amazoncognito.com/signup?client_id=aiir77i4edaaitkoi3l132an0&redirect_uri=https%3A%2F%2Fteam-06-prj-666-winter-2025.vercel.app%2Flogin&response_type=code&scope=openid"
                className={styles.link}
              >
                {t("Sign up")}
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

Login.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
