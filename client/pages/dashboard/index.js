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
import Sidebar from "@/components/Sidebar/Sidebar";
import Link from "next/link";
import VoiceControl from "@/components/VoiceControl/VoiceControl";

const Dashboard = () => {
  return (
    <Container className={`${styles.container} pt-5`}>
      <VoiceControl />
      <Row>
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <Col md={10}>
          <Alert variant="danger" className="my-3">
            Feed is due <strong>now</strong>
            <br />
            <small>Last feed at 7:12 AM - 7 oz</small>
          </Alert>

          <h2 className={styles.heading}>Dashboard</h2>

          <Row>
            {/* Today's Meals Section */}
            <Col md={12}>
              <Card className={styles.card}>
                <Card.Body>
                  <Card.Title>Today&apos;s Meals</Card.Title>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Meal</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Breakfast</td>
                        <td>Baby formula</td>
                        <td>7.8 oz</td>
                        <td>Only drank half</td>
                        <td>
                          <Button variant="outline-primary" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <Button
                    variant="primary"
                    className={styles.addButton}
                    href="http://localhost:3000/feeding-schedule"
                  >
                    + Add
                  </Button>
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
                    <Card.Title>Feedings</Card.Title>
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
                    <Card.Title>Height</Card.Title>
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
                    <Card.Title>Weight</Card.Title>
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
                    <Card.Title>Stool Color</Card.Title>
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
