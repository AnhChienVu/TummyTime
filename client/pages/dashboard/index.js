// pages/dashboard/index.js
import React, { useState, useEffect } from "react";
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
  Badge,
} from "react-bootstrap";
import styles from "./dashboard.module.css";
import Link from "next/link";
import VoiceControl from "@/components/VoiceControl/VoiceControl";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MultipleFeedingSchedules from "@/components/MultipleFeedingSchedules/MultipleFeedingSchedules";

const Dashboard = () => {
  const { t } = useTranslation("common");
  const [todayMilestones, setTodayMilestones] = useState([]);

  useEffect(() => {
    const fetchTodayMilestones = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/milestones?today=true`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const result = await response.json();
        if (result.status === "ok") {
          setTodayMilestones(result.data);
        }
      } catch (error) {
        console.error("Error fetching today's milestones:", error);
      }
    };

    fetchTodayMilestones();
  }, []);

  return (
    <Container fluid className={`${styles.container} py-4 px-3 px-md-4`}>
      <h2 className={styles.heading}>{t("Dashboard")}</h2>

      <VoiceControl />
      <br />

      {/* Milestone Alerts */}
      {todayMilestones.length > 0 && (
        <Row className="mb-4">
          <Col xs={12}>
            <Alert variant="info" className={styles.milestoneAlert}>
              <Alert.Heading>
                <i className="fas fa-star me-2"></i>
                {t("Today's Milestones")}
              </Alert.Heading>
              {todayMilestones.map((milestone) => (
                <div key={milestone.id} className={styles.milestoneItem}>
                  <Badge bg="primary" className={styles.milestoneBadge}>
                    {milestone.first_name}&nbsp;{milestone.last_name}
                  </Badge>
                  <span className={styles.milestoneDetails}>
                    {milestone.title}
                  </span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-end">
                <Link href="/milestones" className={styles.viewMoreLink}>
                  {t("View All Milestones")} →
                </Link>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col xs={12}>
          <Card className={styles.card}>
            <Card.Body>
              <Card.Title>{t("Quick Actions")}</Card.Title>
              <div className="d-flex gap-2 flex-wrap">
                <Button variant="primary" size="sm">
                  <i className="fas fa-plus me-2"></i>
                  {t("Log Feeding")}
                </Button>
                <Button variant="info" size="sm">
                  <i className="fas fa-baby me-2"></i>
                  {t("Log Diaper Change")}
                </Button>
                <Button variant="success" size="sm">
                  <i className="fas fa-weight me-2"></i>
                  {t("Update Weight")}
                </Button>
                <Button variant="warning" size="sm">
                  <i className="fas fa-ruler-vertical me-2"></i>
                  {t("Update Height")}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xs={12}>
          <Card className={styles.card}>
            <Card.Body>
              <Card.Title>{t("Upcoming")}</Card.Title>
              <Table responsive borderless hover>
                <tbody>
                  <tr>
                    <td>
                      <Badge bg="primary">Today 2:00 PM</Badge>
                    </td>
                    <td>Doctor&apos;s Appointment</td>
                  </tr>
                  <tr>
                    <td>
                      <Badge bg="info">Tomorrow</Badge>
                    </td>
                    <td>Vaccination Due</td>
                  </tr>
                  <tr>
                    <td>
                      <Badge bg="warning">In 2 days</Badge>
                    </td>
                    <td>Growth Check</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Main Content - Update Col to be responsive */}
        <Col xs={12} lg={10} className="mx-auto">
          {/* Stats Summary - Update columns to be responsive */}
          <Row className="mb-4 g-3">
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">7</h3>
                  <small className="text-muted">{t("Feedings Today")}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">32 oz</h3>
                  <small className="text-muted">
                    {t("Total Volume Today")}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">15.5 lbs</h3>
                  <small className="text-muted">{t("Current Weight")}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">24.5 in</h3>
                  <small className="text-muted">{t("Current Height")}</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">6 hrs</h3>
                  <small className="text-muted">
                    {t("Last Sleep Duration")}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className={styles.statsCard}>
                <Card.Body className="text-center">
                  <h3 className="mb-1">3</h3>
                  <small className="text-muted">
                    {t("Diaper Changes Today")}
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

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

          <Row className="g-3">
            {/* Feed Chart */}
            <Col xs={12} lg={6}>
              <Nav.Link
                as={Link}
                href="/feeding-schedule"
                className={styles.navlink}
              >
                <Card className={`${styles.cardHover} h-100`}>
                  <Card.Body>
                    <Card.Title>{t("Feedings")}</Card.Title>
                    <div
                      style={{
                        height: "clamp(150px, 30vh, 250px)",
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        padding: "clamp(10px, 2vw, 15px)",
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://experience.sap.com/fiori-design-web/wp-content/uploads/sites/5/2017/11/Line-chart-using-pallettes_012.png"
                        alt="feeding schedule"
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>

            {/* Height Chart */}
            <Col xs={12} lg={6}>
              <Nav.Link as={Link} href="/height" className={styles.navlink}>
                <Card className={`${styles.cardHover} h-100`}>
                  <Card.Body>
                    <Card.Title>{t("Height")}</Card.Title>
                    <div
                      style={{
                        height: "clamp(150px, 30vh, 250px)",
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        padding: "clamp(10px, 2vw, 15px)",
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://miro.medium.com/v2/resize:fit:4800/format:webp/1*7vT2GwcznErKQUARBw5fVQ.png"
                        alt="height chart"
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>
          </Row>

          <Row className="g-3">
            {/* Weight Chart */}
            <Col xs={12} lg={6}>
              <Nav.Link as={Link} href="/weight" className={styles.navlink}>
                <Card className={`${styles.cardHover} h-100`}>
                  <Card.Body>
                    <Card.Title>{t("Weight")}</Card.Title>
                    <div
                      style={{
                        height: "clamp(150px, 30vh, 250px)",
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        padding: "clamp(10px, 2vw, 15px)",
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://miro.medium.com/v2/resize:fit:4800/format:webp/1*7vT2GwcznErKQUARBw5fVQ.png"
                        alt="weight chart"
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            </Col>
            {/* Stool Colour Chart */}
            <Col xs={12} lg={6}>
              <Nav.Link
                as={Link}
                href="/stool-colour"
                className={styles.navlink}
              >
                <Card className={`${styles.cardHover} h-100`}>
                  <Card.Body>
                    <Card.Title>{t("Stool Color")} </Card.Title>
                    <div
                      style={{
                        height: "clamp(150px, 30vh, 250px)",
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        padding: "clamp(10px, 2vw, 15px)",
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Placeholder for Chart */}
                      <Image
                        src="https://www.tableau.com/sites/default/files/2021-06/DataGlossary_Icons_Pie%20Chart.jpg"
                        alt="stool colour chart"
                        style={{
                          height: "100%",
                          width: "100%",
                          objectFit: "contain",
                        }}
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
