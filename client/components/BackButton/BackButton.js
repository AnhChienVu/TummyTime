// components/BackButton.js
import React from "react";
import { Button } from "react-bootstrap";
import { useRouter } from "next/router";

const BackButton = () => {
  const router = useRouter();

  return (
    <div style={{ margin: "1rem" }}>
      <Button variant="outline-secondary" onClick={() => router.back()}>
        Go Back
      </Button>
    </div>
  );
};

export default BackButton;
