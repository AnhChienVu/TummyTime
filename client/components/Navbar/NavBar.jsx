import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import styles from "./Navbar.module.css";

function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogoutBtn = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
  }

  return (
    <Navbar expand="lg" fixed="top" className={styles.navbar}>
      <Container>
        <Navbar.Brand href="/dashboard">Tummy Time</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#about-us">About Us</Nav.Link>
            <Nav.Link href="/register">FAQ</Nav.Link>
            {isAuthenticated ? (
              <Nav.Link href="/" onClick={handleLogoutBtn}>Log out</Nav.Link>
            ) : (
              <Nav.Link href="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
