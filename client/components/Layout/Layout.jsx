import React, { useState, useEffect } from "react";
import NavBar from "../Navbar/NavBar";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css"
import { Container } from "react-bootstrap";

export default function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated])

  return (
    <>
      <NavBar />
        <Container fluid className={styles.container}>
            {isAuthenticated ? <Sidebar /> : null}
            <main className={styles.main}>{children}</main>
        </Container>
      <Footer />
    </>
  );
}
