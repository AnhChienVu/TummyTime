import React from "react";
import { Nav } from "react-bootstrap";
import styles from "./Sidebar.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";
function Sidebar() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  return (
    <div className={styles.sidebar}>
      <Nav className="flex-column">
        <Nav.Link
          as={Link}
          href="/dashboard"
          locale={locale}
          className={styles.navlink}
        >
          {t("Dashboard")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Growth Tracker")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Health Records")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Schedules")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("Milestones")}
        </Nav.Link>
        <Nav.Link as={Link} href="/" locale={locale} className={styles.navlink}>
          {t("User")}
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
    </div>
  );
}

export default Sidebar;
