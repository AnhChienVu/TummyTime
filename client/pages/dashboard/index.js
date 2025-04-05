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
  Form,
} from "react-bootstrap";
import styles from "./dashboard.module.css";
import Link from "next/link";
import VoiceControl from "@/components/VoiceControl/VoiceControl";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MultipleFeedingSchedules from "@/components/MultipleFeedingSchedules/MultipleFeedingSchedules";
import { useConfetti } from "@/hooks/useConfetti";

const formatEventDate = (date, time, createdAt) => {
  if (time) {
    // Calculate time elapsed since reminder was created
    const creationTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - creationTime) / (1000 * 60 * 60);

    // Calculate remaining time by subtracting elapsed time from reminder_in
    const remainingHours = parseFloat(time) - elapsedHours;

    // Handle cases where time has already passed
    if (remainingHours <= 0) {
      return "Overdue";
    }

    // Convert to minutes if less than 1 hour
    if (remainingHours < 1) {
      const minutes = Math.round(remainingHours * 60);
      return `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    // Show exact hour if between 1 and 2 hours
    if (remainingHours < 2) {
      return "In 1 hour";
    }

    // Round to nearest hour for longer durations
    return `In ${Math.round(remainingHours)} hours`;
  }

  const eventDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (eventDate.toDateString() === today.toDateString()) {
    return "Today";
  } else if (eventDate.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return `In ${Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))} days`;
  }
};

const Dashboard = () => {
  const { t } = useTranslation("common");
  const [todayMilestones, setTodayMilestones] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [babies, setBabies] = useState([]);
  const [hiddenReminders, setHiddenReminders] = useState(new Set());
  const [user, setUser] = useState(null);
  const { ConfettiComponent, startConfetti } = useConfetti();

  const handleHideReminder = (reminderId) => {
    setHiddenReminders((prev) => new Set([...prev, reminderId]));
  };

  useEffect(() => {
    const fetchBabies = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/babies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        console.log("Raw response:", response);

        // Check if response is ok before parsing JSON
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Parsed result:", result);

        if (result.status === "ok" && result.babies?.length > 0) {
          setBabies(result.babies);
        } else {
          console.log("No babies found or invalid response format:", result);
        }
      } catch (error) {
        console.error("Error in fetchBabies:", error);
        if (error.response) {
          console.error("Response:", error.response);
        }
      }
    };

    fetchBabies();
  }, []);

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

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        // Fetch reminders for all babies in parallel
        const reminderPromises = babies.map((baby) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby.baby_id}/reminders?upcoming=true`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          ).then((res) => res.json()),
        );

        const results = await Promise.all(reminderPromises);
        console.log("results:", results);

        // Combine and process all reminders
        const allReminders = results.flatMap((result, index) => {
          if (result.status === "ok") {
            return Object.entries(result)
              .filter(([key]) => key !== "status")
              .map(([_, reminder]) => ({
                id: reminder.reminder_id,
                title: reminder.title,
                date: reminder.date,
                // Convert minutes to hours
                time: reminder.reminder_in
                  ? (parseFloat(reminder.reminder_in) / 60).toString()
                  : null,
                created_at: reminder.created_at,
                notes: reminder.notes,
                type: reminder.type,
                next_reminder: reminder.next_reminder,
                babyName: `${babies[index].first_name} ${babies[index].last_name}`,
                baby_id: babies[index].baby_id,
              }));
          }
          return [];
        });

        // Filter and sort the combined reminders
        const sortedReminders = allReminders
          .filter((reminder) => reminder.time !== null)
          .sort((a, b) => {
            if (a.next_reminder && !b.next_reminder) return -1;
            if (!a.next_reminder && b.next_reminder) return 1;

            // Compare hours instead of minutes now
            const timeCompare = parseFloat(a.time) - parseFloat(b.time);
            if (timeCompare !== 0) return timeCompare;

            return a.babyName.localeCompare(b.babyName);
          });

        console.log("sortedReminders:", sortedReminders);

        setUpcomingEvents(sortedReminders);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setUpcomingEvents([]);
      }
    };

    if (babies.length > 0) {
      fetchUpcomingEvents();
    }
  }, [babies]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/user`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === "ok") {
          setUser(result);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <Container fluid className={`${styles.container} py-4 px-3 px-md-4`}>
      <h2 className={styles.heading}>
        {user
          ? t("Welcome, {{name}}", { name: user.first_name })
          : t("Dashboard")}
      </h2>
      <VoiceControl />
      <br />

      {/* Main Content - TODO Update Col to be responsive */}
      <Col xs={12} className="mb-4">
        {/* Stats Summary - TODO Update columns to be responsive */}
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
                <h3 className="mb-1">Enter today milestones here</h3>
                <small className="text-muted">{t("Milestones Today")}</small>
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
        </Row>

        {/* Quick Actions section */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className={styles.quickActionsCard}>
              <Card.Body>
                <Card.Title>{t("Quick Actions")}</Card.Title>
                <div className="d-flex gap-2 flex-wrap">
                  <Button className={styles.feedButton}>
                    <i className="fas fa-plus me-2"></i>
                    {t("Log Feeding")}
                  </Button>
                  <Button className={styles.weightButton}>
                    <i className="fas fa-baby me-2"></i>
                    {t("Update Weight")}
                  </Button>
                  <Button className={styles.heightButton}>
                    <i className="fas fa-weight me-2"></i>
                    {t("Update Height")}
                  </Button>
                  <Button className={styles.journalButton}>
                    <i className="fas fa-ruler-vertical me-2"></i>
                    {t("Access Journal")}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Milestone Alerts */}
        {todayMilestones.length > 0 && (
          <Row className="mb-4">
            <Col xs={12}>
              <Alert variant="info" className={styles.milestoneAlert}>
                {ConfettiComponent}
                <Alert.Heading>
                  <i className="fas fa-star me-2"></i>
                  {t("Today's Milestones 🎉🎉🎉")}
                </Alert.Heading>
                {todayMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={styles.milestoneItem}
                    onMouseEnter={startConfetti}
                  >
                    <Badge bg="primary" className={styles.milestoneBadge}>
                      👶 {milestone.first_name}&nbsp;{milestone.last_name}
                    </Badge>
                    <span className={styles.milestoneDetails}>
                      <strong> {milestone.title}:</strong> {milestone.details}
                    </span>
                  </div>
                ))}

                <div className="d-flex">
                  <Link href="/milestones" className={styles.viewMoreLink}>
                    {t("Manage Milestones")} →
                  </Link>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Feeding Schedule and Reminders Row */}
        <Row className="mb-4">
          {/* Feeding Schedule Section */}
          <Col md={6}>
            <Card className={styles.feedingCard}>
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

          {/* Reminders section */}
          <Col md={6}>
            <Card className={styles.card}>
              <Card.Body>
                <Card.Title>{t("Upcoming Reminders")}</Card.Title>
                <Table responsive borderless hover>
                  <tbody>
                    {upcomingEvents
                      .filter((event) => !hiddenReminders.has(event.id))
                      .map((event) => {
                        const isOverdue =
                          formatEventDate(
                            event.date,
                            event.time,
                            event.created_at,
                          ) === "Overdue";
                        return (
                          <tr key={event.id}>
                            <td className="d-flex justify-content-between align-items-center">
                              <div>
                                <Badge
                                  className="fs-6 py-2 px-3"
                                  bg={isOverdue ? "danger" : "primary"}
                                >
                                  {formatEventDate(
                                    event.date,
                                    event.time,
                                    event.created_at,
                                  )}
                                </Badge>
                                &nbsp;
                                <Badge
                                  bg="secondary"
                                  className="fs-6 py-2 px-3"
                                >
                                  👶 {event.babyName}
                                </Badge>
                                &nbsp;&nbsp;{event.title}
                              </div>
                              {isOverdue && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleHideReminder(event.id)}
                                  className="ms-2"
                                >
                                  <i className="fas fa-eye-slash"></i>{" "}
                                  {t("Hide")}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {upcomingEvents.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center text-muted">
                          {t("No upcoming events")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                <div className="d-flex mt-2">
                  <Link href="/reminders" className={styles.viewMoreLink}>
                    {t("Manage Reminders")} →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Col>
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
