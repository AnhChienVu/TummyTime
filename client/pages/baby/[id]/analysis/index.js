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

// Helper function to determine if we have enough data points for a meaningful analysis
function hasEnoughDataPoints(data, timeRange) {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // For week view, we want at least 3 data points
  // For month view, we want at least 7 data points
  const minimumPoints = timeRange === "week" ? 3 : 7;
  
  // For chart data that might have a different structure
  // Count the number of unique dates with data
  if (data[0] && (data[0].date || data[0].timestamp)) {
    const uniqueDates = new Set();
    data.forEach(item => {
      const dateStr = item.date || item.timestamp;
      if (dateStr) uniqueDates.add(dateStr.split('T')[0]);
    });
    return uniqueDates.size >= minimumPoints;
  }
  
  return data.length >= minimumPoints;
}

// Helper function to validate date ranges
function validateDateRange(start, end, minDate, maxDate, timeRange) {
  // Handle empty inputs safely
  if (!start || !end || !minDate || !maxDate) {
    return {
      start: minDate || "",
      end: maxDate || ""
    };
  }
  
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const minLogDate = parseISO(minDate);
  const maxLogDate = parseISO(maxDate);
  
  // Ensure all dates are valid
  if (isNaN(startDate) || isNaN(endDate) || isNaN(minLogDate) || isNaN(maxLogDate)) {
    console.error("Invalid date detected in validateDateRange");
    return {
      start: minDate,
      end: maxDate
    };
  }
  
  let validStart = startDate;
  let validEnd = endDate;
  
  // Ensure start date isn't before minLoggedDate
  if (startDate < minLogDate) {
    validStart = minLogDate;
  }
  
  // Ensure end date isn't after maxLoggedDate
  if (endDate > maxLogDate) {
    validEnd = maxLogDate;
  }
  
  // Ensure start date isn't after end date
  if (validStart > validEnd) {
    validStart = new Date(validEnd);
    validStart.setDate(validStart.getDate() - (timeRange === "week" ? 6 : 29));
    
    // If this puts us before minLoggedDate, adjust again
    if (validStart < minLogDate) {
      validStart = minLogDate;
    }
  }
  
  return {
    start: format(validStart, "yyyy-MM-dd"),
    end: format(validEnd, "yyyy-MM-dd")
  };
}

// Helper function to compare dates for sorting (newest first)
function compareDates(a, b) {
  const dateA = a.date || a.timestamp || a.created_at || a.measurement_date || '';
  const dateB = b.date || b.timestamp || b.created_at || b.measurement_date || '';
  
  // If dates are exactly the same or one is missing, try using time as tie-breaker
  if (dateA === dateB || !dateA || !dateB) {
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeB.localeCompare(timeA); // Latest time first
  }
  
  // Convert to date objects for comparison
  const parsedA = parseISO(dateA);
  const parsedB = parseISO(dateB);
  
  // If both are valid dates, compare them (newest first)
  if (!isNaN(parsedA) && !isNaN(parsedB)) {
    return parsedB - parsedA;
  }
  
  // Fall back to string comparison if date parsing fails
  return dateB.localeCompare(dateA);
}

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

  // Initialize dates - using 2025-04-12 as the current date
  const [feedStart, setFeedStart] = useState("");
  const [feedEnd, setFeedEnd] = useState("2025-04-12");
  const [feedTimeRange, setFeedTimeRange] = useState("month");

  const [stoolStart, setStoolStart] = useState("");
  const [stoolEnd, setStoolEnd] = useState("2025-04-12");

  const [growthStart, setGrowthStart] = useState("");
  const [growthEnd, setGrowthEnd] = useState("2025-04-12");

  // Track earliest and latest
  const [minLoggedDate, setMinLoggedDate] = useState("");
  const [maxLoggedDate, setMaxLoggedDate] = useState("");
  
  // Flag to indicate data is loaded and dates have been processed
  const [datesInitialized, setDatesInitialized] = useState(false);

  // Fetch data when component mounts
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
        const rawFeedData = feedJson.status === "ok" ? convertResponseToArray(feedJson) : [];
        
        // Sort feed data by date (newest first)
        rawFeedData.sort(compareDates);
        setFeedData(rawFeedData);

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
          const rawStoolData = stoolJson.status === "ok" ? convertResponseToArray(stoolJson) : [];
          
          // Sort stool data by date (newest first)
          rawStoolData.sort(compareDates);
          setStoolData(rawStoolData);
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
          const rawGrowthData = !growthJson.status || growthJson.status === "ok"
            ? flattenApiData(rawGrowth)
            : [];
          
          // Sort growth data by date (newest first)
          rawGrowthData.sort(compareDates);
          setGrowthData(rawGrowthData);
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

  // Process all datasets to find the date range once data is loaded
  useEffect(() => {
    if (loading || (!feedData.length && !stoolData.length && !growthData.length)) return;
    
    console.log("Processing data to determine date ranges");
    
    const allDates = [];
    
    // Helper function to extract and process dates from various data items
    const extractDates = (item) => {
      // Check all possible date fields
      const dateStr = item.date || item.timestamp || item.created_at || item.measurement_date;
      
      if (dateStr) {
        // Handle ISO date strings by removing time portion
        const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parsed = parseISO(cleanDateStr);
        
        if (!isNaN(parsed)) {
          allDates.push(parsed);
          return true;
        }
      }
      return false;
    };
    
    // Process all datasets
    [...feedData, ...stoolData, ...growthData].forEach(extractDates);
    
    // Debug logging
    console.log("Found dates:", allDates.map(d => format(d, "yyyy-MM-dd")));
    
    // If we found any valid dates
    if (allDates.length > 0) {
      allDates.sort((a, b) => a - b); // Sort dates chronologically
      
      const earliest = allDates[0];
      const latest = allDates[allDates.length - 1];
      
      const newMinDate = format(earliest, "yyyy-MM-dd");
      const newMaxDate = format(latest, "yyyy-MM-dd");
      
      console.log(`Date range detected: ${newMinDate} to ${newMaxDate}`);
      
      // Update the state with the min and max dates
      setMinLoggedDate(newMinDate);
      setMaxLoggedDate(newMaxDate);
      
      // Initialize all date pickers once we know the date range
      if (!datesInitialized) {
        console.log("Initializing date pickers with appropriate dates");
        
        // Current date is set to 2025-04-12
        const currentDate = "2025-04-12";
        
        // Keep the current date (2025-04-12) as end date if it's within or before the logged date range
        // otherwise use the max logged date
        if (newMaxDate < currentDate) {
          console.log("Max logged date is earlier than current date, using max logged date");
          setFeedEnd(newMaxDate);
          setStoolEnd(newMaxDate);
          setGrowthEnd(newMaxDate);
        } else {
          console.log("Using current date (2025-04-12) for end dates");
          // Keep the current date (already set in state initialization)
        }
        
        // Calculate start dates based on the time range and end date
        const parsedEndDate = parseISO(feedEnd !== "" ? feedEnd : currentDate);
        const feedStartDate = new Date(parsedEndDate);
        feedTimeRange === "week" 
          ? feedStartDate.setDate(feedStartDate.getDate() - 6)
          : feedStartDate.setDate(feedStartDate.getDate() - 29);
        
        // Ensure start dates aren't before the earliest date
        if (feedStartDate < earliest) {
          setFeedStart(newMinDate);
        } else {
          setFeedStart(format(feedStartDate, "yyyy-MM-dd"));
        }
        
        // Similar calculations for stool and growth start dates (always 30 days)
        const parsedStoolEndDate = parseISO(stoolEnd !== "" ? stoolEnd : currentDate);
        const stoolStartDate = new Date(parsedStoolEndDate);
        stoolStartDate.setDate(stoolStartDate.getDate() - 29);
        if (stoolStartDate < earliest) {
          setStoolStart(newMinDate);
        } else {
          setStoolStart(format(stoolStartDate, "yyyy-MM-dd"));
        }
        
        const parsedGrowthEndDate = parseISO(growthEnd !== "" ? growthEnd : currentDate);
        const growthStartDate = new Date(parsedGrowthEndDate);
        growthStartDate.setDate(growthStartDate.getDate() - 29);
        if (growthStartDate < earliest) {
          setGrowthStart(newMinDate);
        } else {
          setGrowthStart(format(growthStartDate, "yyyy-MM-dd"));
        }
        
        setDatesInitialized(true);
        console.log("Date pickers initialized with data-based range");
      }
    } else {
      console.warn("No valid dates found in any dataset");
    }
  }, [feedData, stoolData, growthData, loading, feedTimeRange, datesInitialized, feedEnd, stoolEnd, growthEnd]);

  // Double-check to ensure dates are set to current date (2025-04-12) or max logged date
  useEffect(() => {
    if (maxLoggedDate && !datesInitialized) {
      console.log("Second check: Ensuring end dates are not after max logged date");
      // Only update if current date (2025-04-12) is greater than max logged date
      if (maxLoggedDate < "2025-04-12") {
        setFeedEnd(maxLoggedDate);
        setStoolEnd(maxLoggedDate);
        setGrowthEnd(maxLoggedDate);
      }
    }
  }, [maxLoggedDate, datesInitialized]);

  // Update date range when time range changes
  const handleTimeRangeChange = (newRange) => {
    setFeedTimeRange(newRange);
    
    // Use the current end date (which should be 2025-04-12 or max logged date)
    // and calculate a new start date based on the selected time range
    const currentEndDate = feedEnd || "2025-04-12";
    console.log(`Calculating new start date based on end date: ${currentEndDate} and time range: ${newRange}`);
    
    // Calculate start date based on selected time range
    const endDate = parseISO(currentEndDate);
    const startDate = new Date(endDate);
    
    newRange === "week"
      ? startDate.setDate(startDate.getDate() - 6)
      : startDate.setDate(startDate.getDate() - 29);
    
    // Ensure start date isn't before min logged date
    if (minLoggedDate) {
      const minDate = parseISO(minLoggedDate);
      if (startDate < minDate) {
        setFeedStart(minLoggedDate);
      } else {
        setFeedStart(format(startDate, "yyyy-MM-dd"));
      }
    } else {
      setFeedStart(format(startDate, "yyyy-MM-dd"));
    }
  };

  // Handle feed date changes with validation and respect time range selection
  const handleFeedStartChange = (newStart) => {
    console.log("Feed start date changing to:", newStart, "with time range:", feedTimeRange);
    
    // If time range is set, we need to adjust the end date based on the selected start date
    if (feedTimeRange === "week" || feedTimeRange === "month") {
      const startDate = parseISO(newStart);
      const endDate = new Date(startDate);
      
      // Calculate end date based on time range (add 6 days for week, 29 days for month)
      feedTimeRange === "week"
        ? endDate.setDate(endDate.getDate() + 6)
        : endDate.setDate(endDate.getDate() + 29);
      
      // Ensure end date doesn't exceed max logged date
      if (maxLoggedDate && format(endDate, "yyyy-MM-dd") > maxLoggedDate) {
        // If end date would exceed max logged date, adjust start date instead
        const maxDate = parseISO(maxLoggedDate);
        const adjustedStart = new Date(maxDate);
        feedTimeRange === "week"
          ? adjustedStart.setDate(adjustedStart.getDate() - 6)
          : adjustedStart.setDate(adjustedStart.getDate() - 29);
        
        // Ensure adjusted start isn't before min logged date
        if (minLoggedDate && format(adjustedStart, "yyyy-MM-dd") < minLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setFeedStart(minLoggedDate);
          setFeedEnd(maxLoggedDate);
        } else {
          // Use adjusted start and max end
          setFeedStart(format(adjustedStart, "yyyy-MM-dd"));
          setFeedEnd(maxLoggedDate);
        }
      } else {
        // Normal case: set start to selected date and calculate appropriate end date
        setFeedStart(newStart);
        setFeedEnd(format(endDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        newStart,
        feedEnd,
        minLoggedDate,
        maxLoggedDate,
        feedTimeRange
      );
      setFeedStart(validated.start);
      setFeedEnd(validated.end);
    }
  };

  const handleFeedEndChange = (newEnd) => {
    console.log("Feed end date changing to:", newEnd, "with time range:", feedTimeRange);
    
    // If time range is set, we need to adjust the start date based on the selected end date
    if (feedTimeRange === "week" || feedTimeRange === "month") {
      const endDate = parseISO(newEnd);
      const startDate = new Date(endDate);
      
      // Calculate start date based on time range (subtract 6 days for week, 29 days for month)
      feedTimeRange === "week"
        ? startDate.setDate(startDate.getDate() - 6)
        : startDate.setDate(startDate.getDate() - 29);
      
      // Ensure start date isn't before min logged date
      if (minLoggedDate && format(startDate, "yyyy-MM-dd") < minLoggedDate) {
        // If start date would be before min logged date, adjust end date instead
        const minDate = parseISO(minLoggedDate);
        const adjustedEnd = new Date(minDate);
        feedTimeRange === "week"
          ? adjustedEnd.setDate(adjustedEnd.getDate() + 6)
          : adjustedEnd.setDate(adjustedEnd.getDate() + 29);
        
        // Ensure adjusted end isn't after max logged date
        if (maxLoggedDate && format(adjustedEnd, "yyyy-MM-dd") > maxLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setFeedStart(minLoggedDate);
          setFeedEnd(maxLoggedDate);
        } else {
          // Use min start and adjusted end
          setFeedStart(minLoggedDate);
          setFeedEnd(format(adjustedEnd, "yyyy-MM-dd"));
        }
      } else {
        // Normal case: set end to selected date and calculate appropriate start date
        setFeedEnd(newEnd);
        setFeedStart(format(startDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        feedStart,
        newEnd,
        minLoggedDate,
        maxLoggedDate,
        feedTimeRange
      );
      setFeedStart(validated.start);
      setFeedEnd(validated.end);
    }
  };

  // Handle stool date changes with validation
  const handleStoolStartChange = (newStart) => {
    const validated = validateDateRange(
      newStart,
      stoolEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setStoolStart(validated.start);
    setStoolEnd(validated.end);
  };

  const handleStoolEndChange = (newEnd) => {
    const validated = validateDateRange(
      stoolStart,
      newEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setStoolStart(validated.start);
    setStoolEnd(validated.end);
  };

  // Handle growth date changes with validation
  const handleGrowthStartChange = (newStart) => {
    const validated = validateDateRange(
      newStart,
      growthEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setGrowthStart(validated.start);
    setGrowthEnd(validated.end);
  };

  const handleGrowthEndChange = (newEnd) => {
    const validated = validateDateRange(
      growthStart,
      newEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setGrowthStart(validated.start);
    setGrowthEnd(validated.end);
  };

  function getFeedChartData(feeds) {
    if (!Array.isArray(feeds) || feeds.length === 0) return [];
    const grouped = {};
    feeds.forEach((item) => {
      let d = item.date || item.timestamp || item.created_at;
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
    
    // Convert to array and sort by date (oldest to newest for chart display)
    return Object.values(grouped).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function buildGrowthChartData(growth) {
    if (!Array.isArray(growth) || growth.length === 0) return [];
    const mapped = growth.map((item) => {
      let d =
        item.date || item.timestamp || item.created_at || item.measurement_date;
      if (d && d.includes("T")) d = d.split("T")[0];
      return {
        date: d,
        height: parseFloat(item.height || item.height_inches || 0),
        weight: parseFloat(item.weight || item.weight_lbs || 0),
      };
    });
    
    // Sort by date (oldest to newest for chart display)
    return mapped
      .filter((x) => x.date)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function filterDataByRange(dataArray, startDate, endDate) {
    if (!startDate || !endDate || !Array.isArray(dataArray)) return [];
    
    // Add one day to end date to make the range inclusive of the end date
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);
    
    return dataArray.filter((item) => {
      // Get the date from various possible properties
      let dStr = item.date || item.timestamp || item.created_at || item.measurement_date;
      
      // Handle chart data objects which have a date property
      if (!dStr && item.date) {
        dStr = item.date;
      }
      
      if (!dStr) return false;
      
      // If date contains time information, strip it off
      if (dStr.includes('T')) {
        dStr = dStr.split('T')[0];
      }
      
      const d = parseISO(dStr);
      return d && !isNaN(d) && isWithinInterval(d, { start, end: inclusiveEnd });
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

  // Debug log the current date states and verify we're using 2025-04-12
  console.log("Current feed dates:", { feedStart, feedEnd, minLoggedDate, maxLoggedDate });
  console.log("Current date for the app:", "2025-04-12");

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
                      onChange={(e) => handleFeedStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={feedEnd}
                      onChange={(e) => handleFeedEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      // Force the max attribute to be respected
                      onInput={(e) => {
                        console.log("Date input event:", e.target.value, "Max:", maxLoggedDate);
                        if (maxLoggedDate && e.target.value > maxLoggedDate) {
                          console.log("Forcing date to max logged date");
                          e.target.value = maxLoggedDate;
                          setFeedEnd(maxLoggedDate);
                        }
                      }}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleTimeRangeChange("week")}
                        className={`${styles.toggleButton} ${
                          feedTimeRange === "week"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Week")}
                      </button>
                      <button
                        onClick={() => handleTimeRangeChange("month")}
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
                    ) : !hasEnoughDataPoints(filteredFeedChartData, feedTimeRange) ? (
                      <div className="alert alert-info">
                        {feedTimeRange === "week" 
                          ? t("Add more feeding logs to view an accurate weeklyanalysis. At least 3 days with logs are needed.")
                          : t("Add more feeding logs to view an accurate monthly analysis. At least 7 days with logs are needed.")}
                      </div>
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
                      onChange={(e) => handleStoolStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={stoolEnd}
                      onChange={(e) => handleStoolEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      onInput={(e) => {
                        if (maxLoggedDate && e.target.value > maxLoggedDate) {
                          e.target.value = maxLoggedDate;
                          setStoolEnd(maxLoggedDate);
                        }
                      }}
                    />
                  </Col>
                </Row>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("Stool Color Chart")}</Card.Title>
                    {filteredStoolData.length === 0 ? (
                      <p>
                        {t("No stool data found for your selected date range.")}
                      </p>
                    ) : !hasEnoughDataPoints(filteredStoolData, "month") ? (
                      <div className="alert alert-info">
                        {t("Add more stool logs to view an accurate analysis. At least 7 entries are needed.")}
                      </div>
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
                      onChange={(e) => handleGrowthStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={growthEnd}
                      onChange={(e) => handleGrowthEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      onInput={(e) => {
                        if (maxLoggedDate && e.target.value > maxLoggedDate) {
                          e.target.value = maxLoggedDate;
                          setGrowthEnd(maxLoggedDate);
                        }
                      }}
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
                        ) : !hasEnoughDataPoints(growthChartData, "month") ? (
                          <div className="alert alert-info">
                            {t("Add more growth measurements to view an accurate analysis. At least 3 measurements are needed.")}
                          </div>
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
                        ) : !hasEnoughDataPoints(growthChartData, "month") ? (
                          <div className="alert alert-info">
                            {t("Add more growth measurements to view an accurate analysis. At least 3 measurements are needed.")}
                          </div>
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