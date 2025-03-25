// pages/dashboard/index.js
import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Alert,
  Nav,
  Image,
} from "react-bootstrap";
import styles from "./dashboard.module.css";
import Link from "next/link";
import VoiceControl from "@/components/VoiceControl/VoiceControl";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MultipleFeedingSchedules from "@/components/MultipleFeedingSchedules/MultipleFeedingSchedules";

const Dashboard = () => {
  const { t } = useTranslation("common");

  return (
    <Container className={`${styles.container} pt-5`}>
      <h2 className={styles.heading}>{t("Dashboard")}</h2>

      <VoiceControl />
      <br />
      <Row>
        {/* Main Content */}
        <Col md={10}>
          {/* <Alert variant="danger" className="my-3">
            {t(`Feed is due now`)}
            <br />
            <small>{t("Last feed at 7:12 AM - 7 oz")}</small>
          </Alert> */}

          <Row>
            {/* Today's Meals Section */}
            <Col md={12}>
              <Card className={styles.card}>
                <Card.Body>
                  <Card.Title>{t("Feedings")}</Card.Title>
                  <MultipleFeedingSchedules />
                  <div className="mt-3">
                    <Link
                      href="/feeding-schedule"
                      className={styles.viewMoreLink}
                    >
                      {t("Manage Schedule")} →
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            {/* Feed Chart */}
            <Col md={6}>
              <Nav.Link
                as={Link}
                href="/feeding-schedule"
                className={styles.navlink}
              >
                <Card className={`${styles.cardHover} mb-4`}>
                  <Card.Body>
                    <Card.Title>{t("Feedings")}</Card.Title>
                    <div
                      style={{ height: "200px", backgroundColor: "#f7f7f7" }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://experience.sap.com/fiori-design-web/wp-content/uploads/sites/5/2017/11/Line-chart-using-pallettes_012.png"
                        alt="feeding schedule"
                        style={{ height: "105%", width: "100%" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>

            {/* Height Chart */}
            <Col md={6}>
              <Nav.Link as={Link} href="/height" className={styles.navlink}>
                <Card className={`${styles.cardHover} mb-4`}>
                  <Card.Body>
                    <Card.Title>{t("Height")}</Card.Title>
                    <div
                      style={{ height: "200px", backgroundColor: "#f7f7f7" }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://miro.medium.com/v2/resize:fit:4800/format:webp/1*7vT2GwcznErKQUARBw5fVQ.png"
                        alt="height chart"
                        style={{ height: "105%", width: "100%" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>
          </Row>

          <Row>
            {/* Weight Chart */}
            <Col md={6}>
              <Nav.Link as={Link} href="/weight" className={styles.navlink}>
                <Card className={`${styles.cardHover} mb-4`}>
                  <Card.Body>
                    <Card.Title>{t("Weight")}</Card.Title>
                    <div
                      style={{ height: "200px", backgroundColor: "#f7f7f7" }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://miro.medium.com/v2/resize:fit:4800/format:webp/1*7vT2GwcznErKQUARBw5fVQ.png"
                        alt="weight chart"
                        style={{ height: "105%", width: "100%" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>
            {/* Stool Colour Chart */}
            <Col md={6}>
              <Nav.Link
                as={Link}
                href="/stool-colour"
                className={styles.navlink}
              >
                <Card className={`${styles.cardHover} mb-4`}>
                  <Card.Body>
                    <Card.Title>{t("Stool Color")} </Card.Title>
                    <div
                      style={{ height: "200px", backgroundColor: "#f7f7f7" }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://www.tableau.com/sites/default/files/2021-06/DataGlossary_Icons_Pie%20Chart.jpg"
                        alt="stool colour chart"
                        style={{ height: "108%", width: "100%" }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
