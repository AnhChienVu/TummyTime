// client/components/[TipsNotificationPopup.js]

// Display a random tip notification:
//  - DAILY: ON INTERVAL counting since user logged in (REGULARLY SINCE LOGGED IN)
//  - WEEKLY: ONLY ONCE when user logged in (ONCE SINCE LOGGED IN)
//  - EVERY TIME RELOAD /tips page
//  - will DISAPPEAR after ~10 seconds
import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";

const TipsNotificationPopup = () => {
  const [tip, setTip] = useState(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Determine whether the user is logged in.
    // const token = localStorage.getItem("token");
    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tips/notification`;
    // //   Check if Logged-in
    // if (token) {
    //     // Logged-in: call API for customized tip notifications
    //     apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tips/notification`;
    // } else {
    //     // Not logged in: default to Daily
    //     apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tips/notification?default=true`;
    // }

    // MOCK RESPONSE
    const mockData = {
      data: [
        {
          id: 1,
          tip_text: "Baby from 0-3 months should sleep 14-17 hours a day.",
        },
        {
          id: 2,
          tip_text: "Your baby should sleep on their back.",
        },
        {
          id: 3,
          tip_text: "It is recommended to have a consistent bedtime routine.",
        },
        {
          id: 4,
          tip_text:
            "Try to put your baby to sleep when they are drowsy but still awake.",
        },
        {
          id: 5,
          tip_text: "Create a safe sleep environment for your baby.",
        },
        {
          id: 6,
          tip_text: "Avoid overheating your baby.",
        },
      ],
    };

    const fetchTip = async () => {
      try {
        // const response = await fetch(apiUrl);
        // const data = await response.json();

        const data = mockData;

        // Assume the API returns { data: [ tip1, tip2, ... ] }
        if (data.data && data.data.length > 0) {
          // CHOOSE A RANDOM TIP
          const randomIndex = Math.floor(Math.random() * data.data.length);
          setTip(data.data[randomIndex]);
          setShow(true);
        }
      } catch (error) {
        console.error("Error fetching tip notification:", error);
      }
    };

    // Initial fetch
    fetchTip();

    // REFRESH TIP (user will see a new tip)
    // - DAILY: Every 5min ONLY ONCE or when user logged in
    // - WEEKLY: Every 7 days ONLY ONCE or when user logged in
    const intervalId = setInterval(fetchTip, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // HIDE TIP after 10 seconds
  if (show) {
    setTimeout(() => {
      setShow(false);
    }, 11000);
  }

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
