import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import NavBar from "@/components/Navbar/NavBar";
import styles from "./index.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Navbar */}
      <NavBar />

      {/* Hero Section */}
      <Container fluid className="hero-section text-center py-5 flex-grow-1">
        <Row className="justify-content-center align-items-center">
          <Col md={6} className="mt-5 pt-5">
            <h1 className="display-4">Tummy Time</h1>
            <p className="lead">
              A baby care app for parents, caregivers, and medical
              professionals. Features dynamic feeding schedules, diaper and
              growth tracking, journaling, AI-driven assistance, exportable
              health reports, and a gamified quiz to engage users in baby care
              tracking.
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
