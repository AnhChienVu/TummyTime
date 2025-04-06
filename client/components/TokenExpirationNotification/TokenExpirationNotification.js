// client/components/[TokenExpirationNotification]

// Display a notification for Login again when JWT token expires
import React, { useEffect } from "react";
import { Alert, Button } from "react-bootstrap";
import { useRouter } from "next/router"; // or use your routing mechanism

const TokenExpirationNotification = ({ show, onClose }) => {
  const router = useRouter();

  useEffect(() => {
    if (show) {
      // Automatically remove expired token
      localStorage.removeItem("token"); // DEBUG-:REMOVE TOKEN FROM LOCAL STORAGE
    }
  }, [show]);

  if (!show) return null;

  return (
    <Alert
      variant="danger"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2000,
        textAlign: "center",
        padding: "20px",

        backgroundColor: "#f8d7da",

        border: "2px solid #f5c6cb",
        borderRadius: "8px",
        width: "350px",
      }}
    >
      <p style={{ marginBottom: "1rem" }}>
        Your session has expired. Please{" "}
        <a href="/login" style={{ fontWeight: "bold" }}>
          login again
        </a>
        .
      </p>

      {/* BUTTON TO LOGIN */}
      <Button variant="danger" onClick={() => router.push("/login")}>
        Login
      </Button>
    </Alert>
  );
};

export default TokenExpirationNotification;
