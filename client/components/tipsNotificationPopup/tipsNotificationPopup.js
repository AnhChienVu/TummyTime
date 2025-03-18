// client/components/[TipsNotificationPopup.js]

// Display a random tip notification:
//  - DAILY: ON INTERVAL counting EVERY 3MIN since user logged in (REGULARLY SINCE LOGGED IN)
//  - WEEKLY: ONCE SINCE LOGGED IN (bc JWT token will expire < 1day)
// ==> add a localStorage flag to check most recent notification timestamp
//  - EVERY TIME RELOAD OR GO TO /tips page
//  - will DISAPPEAR after ~10 seconds
import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";

const TipsNotificationPopup = () => {
  const [tip, setTip] = useState(null); // Tip content
  const [show, setShow] = useState(true); // Initially show the tip

  useEffect(() => {
    // save Frequency in localStorage.
    // - If user is logged in, save the preference on the backend + localStorage
    const frequency = localStorage.getItem("notificationFrequency") || "Daily";
    localStorage.setItem("notificationFrequency", frequency);

    // check if the user is on the tips page
    const currentPath = window.location.pathname;
    const isTipsPage = currentPath === "/tips";

    // check logged in
    const token = localStorage.getItem("token");
    let apiUrl = "";
    if (token) {
      // If logged in, get notification settings + custom tips
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/tips/notification`;
    } else {
      // If not logged in, get all tips
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/tips`;
    }

    // // MOCK RESPONSE
    // const mockData = {
    //   data: [
    //     {
    //       id: 1,
    //       tip_text: "Baby from 0-3 months should sleep 14-17 hours a day.",
    //     },
    //     {
    //       id: 2,
    //       tip_text: "Your baby should sleep on their back.",
    //     },
    //     {
    //       id: 3,
    //       tip_text: "It is recommended to have a consistent bedtime routine.",
    //     },
    //     {
    //       id: 4,
    //       tip_text:
    //         "Try to put your baby to sleep when they are drowsy but still awake.",
    //     },
    //     {
    //       id: 5,
    //       tip_text: "Create a safe sleep environment for your baby.",
    //     },
    //     {
    //       id: 6,
    //       tip_text: "Avoid overheating your baby.",
    //     },
    //   ],
    // };

    // Helper function to fetch and display a tip
    const fetchAndShowTip = async () => {
      try {
        const response = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          // show a random tip
          const randomIndex = Math.floor(Math.random() * data.data.length);
          setTip(data.data[randomIndex]);
          setShow(true);

          // Update tip timestamp in localStorage
          localStorage.setItem("lastTipTimestamp", Date.now().toString());

          // Hide tip after 10 seconds
          setTimeout(() => {
            setShow(false);
          }, 10000);
        }
      } catch (error) {
        console.error("Error fetching tip notification:", error);
      }
    };

    if (isTipsPage) {
      // On /tips page, always fetch tip immediately
      fetchAndShowTip();
    } else {
      if (frequency === "Weekly") {
        // For Weekly, only show tip if no timestamp is stored (Once since logged in)
        if (!localStorage.getItem("lastTipTimestamp")) {
          fetchAndShowTip();
        }
      } else if (frequency === "Daily") {
        // For Daily, check if at least 3 minutes have passed since last tip
        const lastTimestamp = parseInt(
          localStorage.getItem("lastTipTimestamp") || "0",
          10,
        );
        const now = Date.now();
        if (now - lastTimestamp >= 3 * 60000) {
          fetchAndShowTip();
        }

        const intervalId = setInterval(() => {
          fetchAndShowTip();
        }, 3 * 60000); // Every 3 minutes
        return () => clearInterval(intervalId);
      }
    }
  }, []);

  if (!tip || !show) return null; // Do not render if no tip or not shown

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
