import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import styles from "./Navbar.module.css";
import { useTranslation } from "next-i18next";
import Link from 'next/link';


function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

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
            <Nav.Link href="#about-us">{t("About Us")}</Nav.Link>
            <Nav.Link href="/register">FAQ</Nav.Link>
            {isAuthenticated ? (
              <Nav.Link href="/" onClick={handleLogoutBtn}>{t("Log out")}</Nav.Link>
            ) : (
              <Nav.Link as={Link} href="/login" locale={locale}>{t("Login")}</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
