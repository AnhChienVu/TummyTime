// pages/add.js
// Form for adding a baby profile
import { useForm } from "react-hook-form";
import { Row, Col, Form, Button, Container } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./add.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function AddBaby() {
  const { t, i18n } = useTranslation("common");
  console.log(i18n.language);
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
      // birthdate: "",
      // height: "",
    },
  });

  const router = useRouter();

  async function submitForm(data) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/baby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          <p>
            {t(
              "Congratulations on growing your family! Let's start by adding your new baby to Tummy Time.",
            )}
          </p>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder={t("First name")}
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
                  placeholder={t("Last name")}
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
                  placeholder={t("Weight at birth (lb)")}
                  min={5}
                  {...register("weight")}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* NEW: Add DOB and Height fields */}
          {/* <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>{t("Date of Birth")}</Form.Label>
                <Form.Control
                  {...register("birthdate", {
                    required: true,
                    // Validation:
                    validate: (value) => {
                      const today = new Date();
                      const birthDate = new Date(value);
                      return (
                        birthDate <= today && // not in the future
                        birthDate >= new Date(today.getFullYear() - 50, 0, 1) // not earlier than 50 years ago
                      );
                    },
                  })}
                  type="date"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>{t("Height")} (cm)</Form.Label>
                <Form.Control
                  {...register("height", {
                    required: true,
                    min: 5, // min height: 5cm
                    max: 200, // max height: 2meters
                  })}
                  type="number"
                  placeholder={t("Enter height in cm")}
                  required
                />
              </Form.Group>
            </Col>
          </Row> */}

          <Row className="mb-3">
            <Col>
              <Form.Select
                name="gender"
                defaultValue=""
                className="mb-3"
                {...register("gender")}
                placeholder={t("Gender")}
                required
              >
                <option value="" disabled>
                  {t("Gender")}
                </option>
                <option value="boy">{t("Boy")}</option>
                <option value="girl">{t("Girl")}</option>
              </Form.Select>
            </Col>
          </Row>

          <Button
            variant="primary"
            type="submit"
            className={styles.submitButton}
          >
            {t("Create baby profile")}
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
