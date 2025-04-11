import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./growth.module.css";
import BabyCardGrowth from "@/components/BabyCardGrowth/BabyCardGrowth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function Growth() {
  const { t } = useTranslation("common");

  return (
    <Container className={styles.container} fluid>
      <Row className={styles.headerRow}>
        <Col>
          <h1 className={styles.title}>{t("Growths")}</h1>
          <p>{t("Manage your baby's height and weight data")}</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <BabyCardGrowth
            buttons={[
              {
                name: t("See Details"),
                path: "growth",
              },
            ]}
          />
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
