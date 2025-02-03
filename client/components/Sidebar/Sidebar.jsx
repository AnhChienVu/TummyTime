import React from "react";
import { Col, Nav, Dropdown} from "react-bootstrap";
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
            <Dropdown className="mb-3">
              <Dropdown.Toggle
                variant="light"
                id="dropdown-basic"
                className={styles.dropdownToggle}
              >
                Resources
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/forum">Forum</Dropdown.Item>
                <Dropdown.Item href="/coupons">Coupons</Dropdown.Item>
                <Dropdown.Item href="/directory">Service Directory</Dropdown.Item>
                <Dropdown.Item href="/safety-hazards">
                  Safety & Hazards
                </Dropdown.Item>
                <Dropdown.Item href="/quizzes">Quizzes</Dropdown.Item>
                <Dropdown.Item href="/curated-tips">Curated Tips</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

        <Nav.Link
          as={Link}
          href="/dashboard"
          locale={locale}
          className={styles.navlink}
        >
          {t("Dashboard")}
        </Nav.Link>
        <Nav.Link as={Link} href="/analysis" locale={locale} className={styles.navlink}>
          {t("Analytics")}
        </Nav.Link>
        <Nav.Link as={Link} href="/feeding-schedule" locale={locale} className={styles.navlink}>
          {t("Feeding Schedule")}
        </Nav.Link>
        {/* <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Health Records")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Milestones")}
        </Nav.Link> */}
        <Nav.Link as={Link} href="/profile" locale={locale} className={styles.navlink}>
          {t("Profile")}
        </Nav.Link>
        <Nav.Link
          as={Link}
          href="/settings"
          locale={locale}
          className={styles.navlink}
        >
          {t("Settings")}
        </Nav.Link>
      </Nav>

      </Col>

  );
}

export default Sidebar;
