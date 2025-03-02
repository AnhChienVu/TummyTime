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
import { parseISO, format, isWithinInterval } from "date-fns";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./analysis.module.css";

function convertResponseToArray(data) {
  if (!data || typeof data !== "object") return [];
  return Object.keys(data)
    .filter((k) => k !== "status")
    .map((k) => data[k]);
}

function flattenApiData(apiData) {
  if (!apiData) return [];
  if (Array.isArray(apiData)) {
    if (apiData.length === 1 && apiData[0] && typeof apiData[0] === "object") {
      const numericKeys = Object.keys(apiData[0]).filter(
        (k) => !isNaN(Number(k)),
      );
      if (numericKeys.length > 0) return numericKeys.map((k) => apiData[0][k]);
    }
    return apiData;
  }
  if (typeof apiData === "object") {
    return Object.keys(apiData)
      .filter((k) => !isNaN(Number(k)))
      .map((k) => apiData[k]);
  }
  return [];
}

function formatTimeToHourMinuteAmPm(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  let minute = parts[1].split(".")[0];
  let amPm = "AM";
  if (hour === 0) hour = 12;
  else if (hour === 12) amPm = "PM";
  else if (hour > 12) {
    hour -= 12;
    amPm = "PM";
  }
  minute = minute.padStart(2, "0");
  return `${hour}:${minute} ${amPm}`;
}

function CustomFeedTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const { total, feedings = [] } = payload[0].payload;
  const parsedDate = parseISO(label);
  const formattedDate = isNaN(parsedDate)
    ? label
    : format(parsedDate, "MMM do, yyyy");
  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #ccc",
        padding: "12px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        maxWidth: "280px",
      }}
    >
      <div
        style={{ marginBottom: "8px", fontWeight: "bold", fontSize: "1rem" }}
      >
        {formattedDate}
      </div>
      {feedings.map((feed, idx) => {
        const displayTime = formatTimeToHourMinuteAmPm(feed.time);
        return (
          <div key={idx} style={{ marginBottom: "10px", lineHeight: 1.4 }}>
            <div style={{ fontWeight: "bold" }}>
              {feed.meal || "Meal"}: {feed.type || "N/A"}
            </div>
            <div
              style={{ fontSize: "0.9rem", color: "#666", marginLeft: "12px" }}
            >
              {displayTime} - {feed.amount} oz
            </div>
            {feed.notes && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginLeft: "12px",
                }}
              >
                Notes: {feed.notes}
              </div>
            )}
            {feed.issues && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#b00",
                  marginLeft: "12px",
                }}
              >
                Issues: {feed.issues}
              </div>
            )}
          </div>
        );
      })}
      <hr
        style={{
          margin: "0 0 8px 0",
          border: "none",
          borderTop: "1px solid #ccc",
        }}
      />
      <div style={{ fontWeight: "bold" }}>Daily Total: {total} oz</div>
    </div>
  );
}

function CustomStoolTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const slice = payload[0].payload;
  return (
    <div
      style={{ background: "#fff", border: "1px solid #ccc", padding: "8px" }}
    >
      <p style={{ margin: 0, fontWeight: "bold" }}>
        {slice.name}: {slice.value}
      </p>
      {slice.name === "Other" && slice.details && (
        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
          {Object.entries(slice.details).map(([subColor, count]) => (
            <li key={subColor} style={{ listStyleType: "disc" }}>
              {subColor}: {count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildStoolColorData(stools) {
  const colorCount = { Brown: 0, Green: 0, Yellow: 0, Other: 0 };
  const otherMap = {};
  stools.forEach((item) => {
    let c = item.color || "Unknown";
    if (c === "Greenish") c = "Green";
    if (c === "Brown" || c === "Green" || c === "Yellow") {
      colorCount[c]++;
    } else {
      colorCount.Other++;
      otherMap[c] = (otherMap[c] || 0) + 1;
    }
  });
  return [
    { name: "Brown", value: colorCount.Brown },
    { name: "Green", value: colorCount.Green },
    { name: "Yellow", value: colorCount.Yellow },
    { name: "Other", value: colorCount.Other, details: otherMap },
  ];
}

export default function Analysis() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id } = router.query;

  const [feedData, setFeedData] = useState([]);
  const [stoolData, setStoolData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [feedStart, setFeedStart] = useState("");
  const [feedEnd, setFeedEnd] = useState("");
  const [feedTimeRange, setFeedTimeRange] = useState("month");

  const [stoolStart, setStoolStart] = useState("");
  const [stoolEnd, setStoolEnd] = useState("");

  const [growthStart, setGrowthStart] = useState("");
  const [growthEnd, setGrowthEnd] = useState("");

  // Track earliest and latest
  const [minLoggedDate, setMinLoggedDate] = useState("");
  const [maxLoggedDate, setMaxLoggedDate] = useState("");

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const feedRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/getFeedingSchedules`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!feedRes.ok)
          throw new Error(`Failed to fetch feeding data: ${feedRes.status}`);
        const feedJson = await feedRes.json();
        setFeedData(
          feedJson.status === "ok" ? convertResponseToArray(feedJson) : [],
        );

        const stoolRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/stool`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!stoolRes.ok) {
          console.error(`Failed to fetch stool data: ${stoolRes.status}`);
          setStoolData([]);
        } else {
          const stoolJson = await stoolRes.json();
          setStoolData(
            stoolJson.status === "ok" ? convertResponseToArray(stoolJson) : [],
          );
        }

        const growthRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/growth`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!growthRes.ok) {
          console.error(`Failed to fetch growth data: ${growthRes.status}`);
          setGrowthData([]);
        } else {
          const growthJson = await growthRes.json();
          const rawGrowth = growthJson.data ? growthJson.data : growthJson;
          setGrowthData(
            !growthJson.status || growthJson.status === "ok"
              ? flattenApiData(rawGrowth)
              : [],
          );
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!feedData.length && !stoolData.length && !growthData.length) return;
    const allDates = [];
    [feedData, stoolData, growthData].forEach((arr) => {
      arr.forEach((item) => {
        let d =
          item.timestamp ||
          item.date ||
          item.created_at ||
          item.measurement_date;
        if (d && d.includes("T")) d = d.split("T")[0];
        const parsed = parseISO(d);
        if (parsed && !isNaN(parsed)) allDates.push(parsed);
      });
    });
    if (allDates.length > 0) {
      const earliest = new Date(Math.min(...allDates.map((x) => x.getTime())));
      const latest = new Date(Math.max(...allDates.map((x) => x.getTime())));
      setMinLoggedDate(format(earliest, "yyyy-MM-dd"));
      setMaxLoggedDate(format(latest, "yyyy-MM-dd"));
    }
  }, [feedData, stoolData, growthData]);

  useEffect(() => {
    if (!maxLoggedDate || !minLoggedDate) return;
    setFeedEnd(maxLoggedDate);
    const maxDateObj = parseISO(maxLoggedDate);
    const prior = new Date(maxDateObj);
    feedTimeRange === "week"
      ? prior.setDate(prior.getDate() - 6)
      : prior.setDate(prior.getDate() - 29);
    const newFeedStart = format(prior, "yyyy-MM-dd");
    // Ensure feedStart is not before minLoggedDate
    if (parseISO(newFeedStart) < parseISO(minLoggedDate)) {
      setFeedStart(minLoggedDate);
    } else {
      setFeedStart(newFeedStart);
    }

    setStoolEnd(maxLoggedDate);
    const stoolPrior = new Date(maxDateObj);
    stoolPrior.setDate(stoolPrior.getDate() - 29);
    const newStoolStart = format(stoolPrior, "yyyy-MM-dd");
    if (parseISO(newStoolStart) < parseISO(minLoggedDate)) {
      setStoolStart(minLoggedDate);
    } else {
      setStoolStart(newStoolStart);
    }

    setGrowthEnd(maxLoggedDate);
    const growthPrior = new Date(maxDateObj);
    growthPrior.setDate(growthPrior.getDate() - 29);
    const newGrowthStart = format(growthPrior, "yyyy-MM-dd");
    if (parseISO(newGrowthStart) < parseISO(minLoggedDate)) {
      setGrowthStart(minLoggedDate);
    } else {
      setGrowthStart(newGrowthStart);
    }
  }, [maxLoggedDate, minLoggedDate, feedTimeRange]);

  function getFeedChartData(feeds) {
    if (!Array.isArray(feeds) || feeds.length === 0) return [];
    const grouped = {};
    feeds.forEach((item) => {
      let d = item.timestamp || item.date || item.created_at;
      if (d && d.includes("T")) d = d.split("T")[0];
      if (!d) return;
      if (!grouped[d]) grouped[d] = { date: d, total: 0, feedings: [] };
      const amt = parseFloat(item.amount || item.feed_amount || 0) || 0;
      grouped[d].total += amt;
      grouped[d].feedings.push({
        meal: item.meal || "Meal",
        type: item.type || "N/A",
        amount: amt,
        time: item.time || "",
        notes: item.notes || "",
        issues: item.issues || "",
      });
    });
    return Object.values(grouped).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function buildGrowthChartData(growth) {
    if (!Array.isArray(growth) || growth.length === 0) return [];
    const mapped = growth.map((item) => {
      let d =
        item.timestamp || item.date || item.created_at || item.measurement_date;
      if (d && d.includes("T")) d = d.split("T")[0];
      return {
        date: d,
        height: parseFloat(item.height || item.height_inches || 0),
        weight: parseFloat(item.weight || item.weight_lbs || 0),
      };
    });
    return mapped
      .filter((x) => x.date)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function filterDataByRange(dataArray, startDate, endDate) {
    if (!startDate || !endDate || !Array.isArray(dataArray)) return [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return dataArray.filter((item) => {
      const dStr =
        item.timestamp || item.date || item.created_at || item.measurement_date;
      if (!dStr) return false;
      const d = parseISO(dStr);
      return d && !isNaN(d) && isWithinInterval(d, { start, end });
    });
  }

  const rawFeedChartData = getFeedChartData(feedData);
  const rawGrowthData = buildGrowthChartData(growthData);
  const filteredFeedChartData = filterDataByRange(
    rawFeedChartData,
    feedStart,
    feedEnd,
  );
  const filteredStoolData = filterDataByRange(stoolData, stoolStart, stoolEnd);
  const stoolColorData = buildStoolColorData(filteredStoolData);
  const filteredGrowthData = filterDataByRange(
    growthData,
    growthStart,
    growthEnd,
  );
  const growthChartData = buildGrowthChartData(filteredGrowthData);

  if (loading) {
    return (
      <Container>
        <Row>
          <Col>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "300px",
              }}
            >
              <p>{t("Loading analysis data...")}</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  if (error) {
    return (
      <Container>
        <Row>
          <Col>
            <div className="alert alert-danger">
              <p>
                {t("Error loading analysis data")}: {error}
              </p>
              <button className="btn btn-primary" onClick={() => router.back()}>
                {t("Go Back")}
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  const PIE_COLORS = ["#A0522D", "#2E8B57", "#FFD700", "#999999"];

  return (
    <Container className={styles.analysisContainer}>
      <Row>
        <Col>
          <h1>{t("Analytics")}</h1>
          <p className="text-muted">
            {t("Select a tab to view Feed, Stool, or Growth charts.")}
          </p>
          <Tab.Container defaultActiveKey="feed">
            <Nav variant="tabs" className={styles.customNavTabs}>
              <Nav.Item>
                <Nav.Link eventKey="feed">{t("Feed")}</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stool">{t("Stool")}</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="growth">{t("Growth")}</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content className={styles.noPaneBorder + " py-4"}>
              <Tab.Pane eventKey="feed">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={feedStart}
                      onChange={(e) => setFeedStart(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={feedEnd}
                      onChange={(e) => setFeedEnd(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => setFeedTimeRange("week")}
                        className={`${styles.toggleButton} ${
                          feedTimeRange === "week"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Week")}
                      </button>
                      <button
                        onClick={() => setFeedTimeRange("month")}
                        className={`${styles.toggleButton} ${
                          feedTimeRange === "month"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Month")}
                      </button>
                    </div>
                  </Col>
                </Row>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("Feed Chart (Daily Total)")}</Card.Title>
                    {filteredFeedChartData.length === 0 ? (
                      <p>
                        {t("No feed data found for your selected date range.")}
                      </p>
                    ) : (
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                          <LineChart data={filteredFeedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(dateStr) => {
                                const parsed = parseISO(dateStr);
                                return isNaN(parsed)
                                  ? dateStr
                                  : format(parsed, "MMM d");
                              }}
                            />
                            <YAxis />
                            <Tooltip content={<CustomFeedTooltip />} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#8884d8"
                              strokeWidth={2}
                              name={t("Total Ounces")}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="stool">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={stoolStart}
                      onChange={(e) => setStoolStart(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={stoolEnd}
                      onChange={(e) => setStoolEnd(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                </Row>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("Stool Color Chart")}</Card.Title>
                    {stoolColorData.length === 0 ? (
                      <p>
                        {t("No stool data found for your selected date range.")}
                      </p>
                    ) : (
                      <div style={{ width: "100%", height: 300 }}>
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
                            <Tooltip content={<CustomStoolTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="growth">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={growthStart}
                      onChange={(e) => setGrowthStart(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={growthEnd}
                      onChange={(e) => setGrowthEnd(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Body>
                        <Card.Title>{t("Height Growth")}</Card.Title>
                        {growthChartData.length === 0 ? (
                          <p>
                            {t(
                              "No growth data found for your selected date range.",
                            )}
                          </p>
                        ) : (
                          <div style={{ width: "100%", height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={(dateStr) => {
                                    const parsed = parseISO(dateStr);
                                    return isNaN(parsed)
                                      ? dateStr
                                      : format(parsed, "MMM d");
                                  }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="height"
                                  stroke="#82ca9d"
                                  strokeWidth={2}
                                  name={t("Height (in)")}
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
                        <Card.Title>{t("Weight Growth")}</Card.Title>
                        {growthChartData.length === 0 ? (
                          <p>
                            {t(
                              "No growth data found for your selected date range.",
                            )}
                          </p>
                        ) : (
                          <div style={{ width: "100%", height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={(dateStr) => {
                                    const parsed = parseISO(dateStr);
                                    return isNaN(parsed)
                                      ? dateStr
                                      : format(parsed, "MMM d");
                                  }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="weight"
                                  stroke="#FF8042"
                                  strokeWidth={2}
                                  name={t("Weight (lbs)")}
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
