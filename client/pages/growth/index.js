import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./growth.module.css";
import BabyCard from "@/components/BabyCard/BabyCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function Growth() {
  const { t } = useTranslation("common");

  return (
    <Container className={styles.container || ""}>
      <Row>
        <Col>
          <h1>Growth</h1>
          <BabyCard buttons={[{ name: "See Details", path: "growth" }]} />
        </Col>
      </Row>
    </Container>
  );
}

export default Growth;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}