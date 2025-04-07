import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./growth.module.css";
import BabyCardGrowth from "@/components/BabyCardGrowth/BabyCardGrowth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function Growth() {
  const { t } = useTranslation("common");

  return (
    <div className={styles.container}>
      <h1>Growth</h1>
      <BabyCardGrowth buttons={[{ name: "See Details", path: "growth" }]} />
    </div>
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
