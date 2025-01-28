import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Tab, Nav, Form } from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { parseISO, isWithinInterval } from "date-fns";

import mockAnalysisData from "./mockAnalysisData.json";
import styles from "./analysis.module.css";
import Sidebar from "@/components/Sidebar/Sidebar";

function Analysis() {
  const [feedData, setFeedData] = useState([]);
  const [stoolData, setStoolData] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  // Date filtering
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-31");
  const [timeRange, setTimeRange] = useState("month"); // 'week' | 'month'

  // Load data once
  useEffect(() => {
    setFeedData(mockAnalysisData.feeding);
    setStoolData(mockAnalysisData.stool);
    setGrowthData(mockAnalysisData.growth);
  }, []);

  // A) DATA PREP & FILTERS
  function getFeedChartData(feeds) {
    const totalsByDate = {};
    feeds.forEach((item) => {
      const dateKey = item.date;
      const numericAmount = parseFloat(item.amount);
      if (!totalsByDate[dateKey]) totalsByDate[dateKey] = 0;
      totalsByDate[dateKey] += isNaN(numericAmount) ? 0 : numericAmount;
    });
    const result = Object.entries(totalsByDate).map(([date, total]) => ({
      date,
      total,
    }));
    result.sort((a, b) => (a.date < b.date ? -1 : 1));
    return result;
  }

  function getStoolColorData(stools) {
    const colorCount = {};
    stools.forEach((item) => {
      if (!colorCount[item.color]) colorCount[item.color] = 0;
      colorCount[item.color]++;
    });
    return Object.entries(colorCount).map(([color, count]) => ({
      name: color,
      value: count,
    }));
  }

  function getGrowthChartData(growth) {
    return [...growth].sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function filterByDate(dataArray) {
    if (!startDate || !endDate) return dataArray;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return dataArray.filter((item) => {
      const itemDate = parseISO(item.date);
      return isWithinInterval(itemDate, { start, end });
    });
  }

  // B) BUILD CHART DATA
  const rawFeedChartData = getFeedChartData(feedData);
  const rawStoolColorData = getStoolColorData(stoolData);
  const rawGrowthData = getGrowthChartData(growthData);

  const filteredFeedChartData = rawFeedChartData.filter((item) => {
    const d = parseISO(item.date);
    return isWithinInterval(d, {
      start: parseISO(startDate),
      end: parseISO(endDate),
    });
  });
  const filteredStoolData = filterByDate(stoolData);
  const filteredGrowthData = filterByDate(growthData);

  const stoolColorData = getStoolColorData(filteredStoolData);
  const growthChartData = getGrowthChartData(filteredGrowthData);

  // C) WEEK / MONTH TOGGLE
  useEffect(() => {
    const today = new Date("2025-01-31");
    if (timeRange === "week") {
      const prior = new Date(today);
      prior.setDate(prior.getDate() - 6);
      setStartDate(prior.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
    } else {
      const prior = new Date(today);
      prior.setDate(prior.getDate() - 29);
      setStartDate(prior.toISOString().substring(0, 10));
      setEndDate(today.toISOString().substring(0, 10));
    }
  }, [timeRange]);

  // D) MINIMUM DATA CHECK
  const hasEnoughFeedData = feedData.length >= 20;
  const hasEnoughStoolData = stoolData.length >= 20;
  const hasEnoughGrowthData = growthData.length >= 20;

  // Pie colors
  const PIE_COLORS = ["#8884D8", "#82CA9D", "#FFBB28", "#FF8042", "#00C49F"];

  // E) RENDER
  return (
    <Container className={styles.analysisContainer} fluid>
      <Row>
        <Sidebar />

        <Col>
          <h1>Analytics</h1>
          <p className="text-muted">
            Select a tab to view Feed, Stool, or Growth charts.
          </p>

          <Tab.Container defaultActiveKey="feed">
            <Nav variant="tabs" className={styles.customNavTabs}>
              <Nav.Item>
                <Nav.Link eventKey="feed">Feed</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stool">Stool</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="growth">Growth</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className={`py-4 ${styles.noPaneBorder}`}>
              {/* FEED TAB */}
              <Tab.Pane eventKey="feed">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>From</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>To</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => setTimeRange("week")}
                        className={`${styles.toggleButton} ${
                          timeRange === "week" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setTimeRange("month")}
                        className={`${styles.toggleButton} ${
                          timeRange === "month" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </Col>
                </Row>

                <Card>
                  <Card.Body>
                    <Card.Title>Feed Chart (Daily Total)</Card.Title>
                    {!hasEnoughFeedData ? (
                      <p>
                        You need at least 20 feed records before this chart can
                        be displayed.
                      </p>
                    ) : filteredFeedChartData.length === 0 ? (
                      <p>No feed data found for your selected date range.</p>
                    ) : (
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                          <LineChart data={filteredFeedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#8884d8"
                              strokeWidth={2}
                              name="Total Ounces"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* STOOL TAB */}
              <Tab.Pane eventKey="stool">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>From</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>To</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => setTimeRange("week")}
                        className={`${styles.toggleButton} ${
                          timeRange === "week" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setTimeRange("month")}
                        className={`${styles.toggleButton} ${
                          timeRange === "month" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </Col>
                </Row>

                <Card>
                  <Card.Body>
                    <Card.Title>Stool Color Chart</Card.Title>
                    {!hasEnoughStoolData ? (
                      <p>
                        You need at least 20 stool records before this chart can
                        be displayed.
                      </p>
                    ) : stoolColorData.length === 0 ? (
                      <p>No stool data found for your selected date range.</p>
                    ) : (
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={stoolColorData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={100}
                              label
                            >
                              {stoolColorData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* GROWTH TAB */}
              <Tab.Pane eventKey="growth">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>From</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>To</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => setTimeRange("week")}
                        className={`${styles.toggleButton} ${
                          timeRange === "week" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setTimeRange("month")}
                        className={`${styles.toggleButton} ${
                          timeRange === "month" ? styles.toggleButtonActive : ""
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Body>
                        <Card.Title>Height Growth</Card.Title>
                        {!hasEnoughGrowthData ? (
                          <p>
                            You need at least 20 growth records before this
                            chart can be displayed.
                          </p>
                        ) : growthChartData.length === 0 ? (
                          <p>
                            No growth data found for your selected date range.
                          </p>
                        ) : (
                          <div className={styles.chartContainer}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="height"
                                  stroke="#82ca9d"
                                  strokeWidth={2}
                                  name="Height (inches)"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <Card.Title>Weight Growth</Card.Title>
                        {!hasEnoughGrowthData ? (
                          <p>
                            You need at least 20 growth records before this
                            chart can be displayed.
                          </p>
                        ) : growthChartData.length === 0 ? (
                          <p>
                            No growth data found for your selected date range.
                          </p>
                        ) : (
                          <div className={styles.chartContainer}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="weight"
                                  stroke="#FF8042"
                                  strokeWidth={2}
                                  name="Weight (lbs)"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
}

export default Analysis;
