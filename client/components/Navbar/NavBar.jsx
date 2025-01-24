import React from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap';
import styles from "./Navbar.module.css"
import { useTranslation } from "next-i18next";
import Link from 'next/link';

function NavBar() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;
    
  return (
    <Navbar expand="lg" fixed="top" className={styles.navbar}>
        <Container>
          <Navbar.Brand href="#home">Tummy Time</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#about-us">{t("About Us")}</Nav.Link>
              <Nav.Link href="/register">FAQ</Nav.Link>
              {/* <Nav.Link href="/login">Login</Nav.Link> */}
              <Nav.Link as={Link} href="/login" locale={locale}>
              {t("Login")}
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  )
}

export default NavBar