import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useRouter } from "next/router";
import BabyCard from "../../components/BabyCard/BabyCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const containerStyle = {
  maxWidth: "1200px",
  margin: "50px auto",
  padding: "20px",
};

const headerStyle = {
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "2rem",
  fontWeight: "bold",
};

export default function Analysis() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Navigate to baby's analysis page
  const handleSelectBaby = (babyId) => {
    router.push(`/baby/${babyId}/analysis`);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <Container style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container style={containerStyle}>
      <Row>
        <Col>
          <div style={headerStyle}>
            <h1 style={titleStyle}>{t("Analysis")}</h1>
          </div>
          <p>{t("Select a baby to view their analysis")}</p>
          <BabyCard
            buttons={[
              {
                name: "View Analysis",
                functionHandler: handleSelectBaby,
              },
            ]}
          />
        </Col>
      </Row>
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
