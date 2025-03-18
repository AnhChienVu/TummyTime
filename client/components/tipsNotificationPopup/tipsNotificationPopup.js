// client/components/[TipsNotificationPopup.js]

// Display a random tip notification:
//  - DAILY: ON INTERVAL counting EVERY 3MIN since user logged in (REGULARLY SINCE LOGGED IN)
//  - WEEKLY: ONCE SINCE LOGGED IN (bc JWT token will expire < 1day)
// ==> add a localStorage flag to check most recent notification timestamp
//  - EVERY TIME RELOAD OR GO TO /tips page
//  - will DISAPPEAR after ~10 seconds

// EXCEPTION: IF AFTER FILTER, number of tips is <=2 ==> SHOW ALL TIPS (ignore custom tips)

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

    // Helper function to fetch and display a tip
    const fetchAndShowTip = async () => {
      try {
        const response = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        console.log(data);
        // {
        //   "notificationSettings": {
        //     "setting_id": 1,
        //     "user_id": 2,
        //     "notification_frequency": "Daily",
        //     "opt_in": true,
        //     "created_at": "2025-03-18T05:10:46.961Z",
        //     "updated_at": "2025-03-18T05:11:16.750Z"
        //   },
        //   "babiesTips": [
        //     {
        //       "tip_id": 13,...
        //       "tip_text": "Talk, sing, and read to your baby frequently to boost language skills."
        //     }
        //   ]
        // }

        let tipArray = [];
        // If API returns custom tips under babiesTips, use that array
        if (data.babiesTips && Array.isArray(data.babiesTips)) {
          tipArray = data.babiesTips;
        } else if (data.data && Array.isArray(data.data)) {
          tipArray = data.data;
        }

        // If after filter, number of custom tips is <=2, fallback to get all tips (ignore custom tips)
        if (tipArray.length <= 2) {
          console.log(
            `There is ONLY ${tipArray.length} custom tips. => SHOW ALL TIPS instead.`,
          );

          const fallbackResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/tips`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          const fallbackData = await fallbackResponse.json();

          // set tipArray
          if (fallbackData.data && Array.isArray(fallbackData.data)) {
            tipArray = fallbackData.data;
          }
        }

        if (tipArray.length > 0) {
          // show a random tip
          const randomIndex = Math.floor(Math.random() * tipArray.length);
          setTip(tipArray[randomIndex]);
          setShow(true);

          // Update last tip timestamp in localStorage
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
        // For Weekly, show tip only once per login (check localStorage flag)
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
