import React from "react";
import { Container } from "react-bootstrap";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <Container className={styles.footer} fluid>
      <p className="mb-0">
        &copy; {new Date().getFullYear()} Baby Page. All rights reserved.
      </p>
    </Container>
  );
}

export default Footer;
