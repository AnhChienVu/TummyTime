import React, { useState, useEffect } from "react";
import NavBar from "../Navbar/NavBar";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";
import { Container } from "react-bootstrap";
import DoctorSidebar from "../DoctorSidebar/DoctorSidebar";
import TipsNotificationPopup from "../tipsNotificationPopup/tipsNotificationPopup";
import TokenExpirationNotification from "../TokenExpirationNotification/TokenExpirationNotification";

export default function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

  // State to simulate token expiration (by deleting the token)
  const [tokenExpired, setTokenExpired] = useState(false);
  const handleSimulateExpire = () => {
    setTokenExpired(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    if (token && userId) {
      setIsAuthenticated(true);
      setUserRole(userRole);
    } else {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  return (
    <>
      <NavBar />
      <TipsNotificationPopup />
      <Container fluid className={styles.container}>
        {isAuthenticated ? (
          userRole === "Parent" ? (
            <Sidebar />
          ) : (
            <DoctorSidebar />
          )
        ) : null}
        <main className={styles.main}>{children}</main>
      </Container>
      <Footer onSimulateExpire={handleSimulateExpire} />{" "}
      {/* Pass the function to simulate token expiration */}
      <TokenExpirationNotification show={tokenExpired} />
    </>
  );
}
