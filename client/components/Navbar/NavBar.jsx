import React from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap';
import styles from "./Navbar.module.css"

function NavBar() {
  return (
    <Navbar expand="lg" fixed="top" className={styles.navbar}>
        <Container>
          <Navbar.Brand href="/dashboard">Tummy Time</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="#about-us">About Us</Nav.Link>
              <Nav.Link href="/register">FAQ</Nav.Link>
              <Nav.Link href="/login">Login</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  )
}

export default NavBar