// client/components/[tipsNotificationPopup.js]
import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";

const TipsNotificationPopup = () => {
  const [tip, setTip] = useState(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Determine whether the user is logged in.
    const token = localStorage.getItem("token");
    let apiUrl = "";
    if (token) {
      // Logged-in: call API for customized tip notifications
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tips/notification`;
    } else {
      // Not logged in: default to daily tips
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tips/notification?default=true`;
    }

    const fetchTip = () => {
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          // Assume the API returns { data: [ tip1, tip2, ... ] }
          if (data.data && data.data.length > 0) {
            // For simplicity, show the first tip
            setTip(data.data[0]);
            setShow(true);
          }
        })
        .catch((error) =>
          console.error("Error fetching tip notification:", error),
        );
    };

    // Initial fetch
    fetchTip();

    // Refresh tip every 60 seconds (or adjust as needed)
    const intervalId = setInterval(fetchTip, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (!tip || !show) return null;

  return (
    <Alert
      variant="info"
      style={{
        position: "fixed",
        top: "70px", // position just below the fixed navbar
        right: "20px",
        width: "300px",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "8px",
      }}
    >
      <div>
        <strong>Tip: </strong> {tip.tip_text}
      </div>
      <Button
        variant="light"
        size="sm"
        onClick={() => setShow(false)}
        style={{ marginLeft: "10px" }}
      >
        X
      </Button>
    </Alert>
  );
};

export default TipsNotificationPopup;
