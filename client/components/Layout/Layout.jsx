import React, { useState, useEffect } from "react";
import NavBar from "../Navbar/NavBar";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";
import { Container } from "react-bootstrap";
import DoctorSidebar from "../DoctorSidebar/DoctorSidebar";

export default function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");

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
      <Footer />
    </>
  );
}
