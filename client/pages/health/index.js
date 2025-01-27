// client/pages/health/index.js         languageMode: JSX
/* Health Insights page */
// This page have 3 tabs: Feed, Stool, Growth showing analytics data (feeding times, stool color, height, weight) for a baby

import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import styles from "./health.module.css";

// MOCK DATA
const feedData = [
  // Feeds: Number of feeds per day
  { date: "1/10", feeds: 6 },
  { date: "3/10", feeds: 7 },
  { date: "5/10", feeds: 5 },
  { date: "7/10", feeds: 8 },
  { date: "9/10", feeds: 6 },
  { date: "11/10", feeds: 7 },
  { date: "13/10", feeds: 8 },
  { date: "15/10", feeds: 5 },
  { date: "17/10", feeds: 6 },
  { date: "19/10", feeds: 8 },
  { date: "21/10", feeds: 7 },
  { date: "23/10", feeds: 9 },
  { date: "25/10", feeds: 6 },
  { date: "27/10", feeds: 9 },
  { date: "29/10", feeds: 11 },
];

//   const stoolData = [
//     // Stool: Type of stool each time logging baby's stool
//     { date: "1/10", type: "Yellow" },
//     { date: "3/10", type: "Brown" },
//     { date: "5/10", type: "Green" },
//     { date: "6/10", type: "Other" },
//     { date: "7/10", type: "Light Brown" },
//     { date: "9/10", type: "Dark Brown" },
//     { date: "11/10", type: "Yellow" },
//     { date: "13/10", type: "Green" },
//     { date: "15/10", type: "Brown" },
//     { date: "17/10", type: "Yellow" },
//     { date: "19/10", type: "Green" },
//     { date: "21/10", type: "Brown" },
//     { date: "23/10", type: "Other" },
//     { date: "23/10", type: "Yellow" },
//     { date: "25/10", type: "Green" },
//     { date: "27/10", type: "Brown" },
//     { date: "29/10", type: "Yellow" },
//   ];
const stoolData = [
  { name: "Yellow", value: 40 },
  { name: "Brown", value: 20 },
  { name: "Green", value: 10 },
  { name: "Light Brown", value: 5 },
  { name: "Dark Brown", value: 15 },
  { name: "Other", value: 10 },
];

const growthData = [
  { date: "1/1", weight: 6.5, height: 55 },
  { date: "2/2", weight: 7.0, height: 56 },
  { date: "11/3", weight: 7.4, height: 57 },
  { date: "7/4", weight: 7.9, height: 57 },
  { date: "22/4", weight: 8.2, height: 57 },
  { date: "22/6", weight: 8.2, height: 60 },
  { date: "1/7", weight: 8.7, height: 61 },
  { date: "17/7", weight: 8.0, height: 62 },
  { date: "2/8", weight: 7.5, height: 62 },
  { date: "3/9", weight: 8.4, height: 63 },
  { date: "3/11", weight: 10.2, height: 65 },
  { date: "10/12", weight: 12.6, height: 67 },
];

// colors for PieChart for each stool type
const COLORS = [
  "#ffdd00", // Yellow
  "#8B4513", // Brown
  "#29bf12", // Green
  "#d4a276", // Light Brown
  "#49111c", // Dark Brown
  "#6e44ff", // Other
];

function HealthInsights() {
  const [tabValue, setTabValue] = useState(0);
  // isClient: to mark if rendering on client side, to avoid Hydration issues
  const [isClient, setIsClient] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    // after initial render, setIsClient(true) to start rendering on client side
    setIsClient(true);
  }, []);

  return (
    <Box className={styles.container}>
      <Box className={styles.tabs}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="health tabs"
        >
          <Tab label="Feed" />
          <Tab label="Stool" />
          <Tab label="Growth" />
        </Tabs>
      </Box>
      <Box className={styles.tabContent}>
        {/* Feed Tab */}
        {tabValue === 0 && isClient && (
          <Box>
            <h3>Feeding Times</h3>
            <span style={{ color: "#888", fontSize: "0.8rem" }}>
              {`Date Range: ${feedData[0].date} to ${
                feedData[feedData.length - 1].date
              }`}
            </span>
            <Box className={styles.chartContainer}>
              <LineChart width={600} height={300} data={feedData}>
                <Line type="monotone" dataKey="feeds" stroke="#8884d8" />
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </Box>
          </Box>
        )}

        {/* Stool Tab */}
        {tabValue === 1 && isClient && (
          <Box>
            <h3>Stool Color</h3>
            <span style={{ color: "#888", fontSize: "0.8rem" }}>
              {`Date Range: ${feedData[0].date} to ${
                feedData[feedData.length - 1].date
              }`}
            </span>
            <Box className={styles.chartContainerNoBorder}>
              <PieChart width={600} height={300}>
                <Pie
                  data={stoolData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {stoolData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
              </PieChart>
            </Box>
          </Box>
        )}
        {/* Weight Tab */}
        {tabValue === 2 && isClient && (
          <Box>
            <Box style={{ marginBottom: "3rem" }}>
              {/* Weight Chart */}
              <h3>Weight Progression</h3>
              <span style={{ color: "#888", fontSize: "0.8rem" }}>
                {`Date Range: ${growthData[0].date} to ${
                  growthData[growthData.length - 1].date
                }`}
              </span>
              <Box className={styles.chartContainer}>
                <LineChart
                  width={600}
                  height={300}
                  data={growthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#82ca9d"
                    name="Weight (kg)"
                  />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="date" />
                  <YAxis
                    label={{
                      value: "Weight (kg)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                </LineChart>
              </Box>
            </Box>

            {/* Height Chart */}
            <Box>
              <h3>Height Progression</h3>
              <span style={{ color: "#888", fontSize: "0.8rem" }}>
                {`Date Range: ${growthData[0].date} to ${
                  growthData[growthData.length - 1].date
                }`}
              </span>
              <Box className={styles.chartContainer}>
                <LineChart
                  width={600}
                  height={300}
                  data={growthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <Line
                    type="monotone"
                    dataKey="height"
                    stroke="#8884d8"
                    name="Height (cm)"
                  />
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="date" />
                  <YAxis
                    label={{
                      value: "Height (cm)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                </LineChart>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default HealthInsights;
