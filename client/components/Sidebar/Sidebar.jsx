import React from "react";
import { Col, Nav, Dropdown } from "react-bootstrap";
import styles from "./Sidebar.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";

function Sidebar() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  return (
    <Col md={2} className={styles.sidebar}>
      <Nav defaultActiveKey="/" className="flex-column">
        {/* Dropdown menu */}
        {/* <Dropdown className="mb-3">
          <Dropdown.Toggle
            variant="light"
            id="dropdown-basic"
            className={styles.dropdownToggle}
          >
            {t("Resources")}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Nav.Link
              as={Link}
              href="/directory"
              locale={locale}
              className={styles.navlink}
            >
              {t("Service Directory")}
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/safety-hazards"
              locale={locale}
              className={styles.navlink}
            >
              {t("Safety & Hazards")}
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/quizzes"
              locale={locale}
              className={styles.navlink}
            >
              {t("Quizzes")}
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/curated-tips"
              locale={locale}
              className={styles.navlink}
            >
              {t("Curated Tips")}
            </Nav.Link>
          </Dropdown.Menu>
        </Dropdown> */}

        <Nav.Link
          as={Link}
          href="/dashboard"
          locale={locale}
          className={styles.navlink}
        >
          {t("Dashboard")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/analysis"
          locale={locale}
          className={styles.navlink}
        >
          {t("Analytics")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/feeding-schedule"
          locale={locale}
          className={styles.navlink}
        >
          {t("Feeding Schedule")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/forum"
          locale={locale}
          className={styles.navlink}
        >
          {t("Forum")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/milestones"
          locale={locale}
          className={styles.navlink}
        >
          {t("Milestones")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/growth"
          locale={locale}
          className={styles.navlink}
        >
          {t("Growths")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/profile"
          locale={locale}
          className={styles.navlink}
        >
          {t("Profile")}
        </Nav.Link>

        <Nav.Link
          as={Link}
          href="/journal"
          locale={locale}
          className={styles.navlink}
        >
          {t("Journal")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/coupons"
          locale={locale}
          className={styles.navlink}
        >
          {t("Coupons")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/tips"
          locale={locale}
          className={styles.navlink}
        >
          {t("Curated Tips")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/settings"
          locale={locale}
          className={styles.navlink}
        >
          {t("Settings")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/medicalProfessional"
          locale={locale}
          className={styles.navlink}
        >
          {t("Medical Professional")}
        </Nav.Link>
      </Nav>
    </Col>
  );
}

export default Sidebar;
