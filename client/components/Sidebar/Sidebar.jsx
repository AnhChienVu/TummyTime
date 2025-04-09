// components/Sidebar/Sidebar.jsx
import React from "react";
import { Col, Nav } from "react-bootstrap";
import styles from "./Sidebar.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'; // Icons for sidebar collapse/expand
import { 
  MdDashboard,
  MdAnalytics,
  MdRestaurant,
  MdForum,
  MdTrendingUp,
  MdNotifications,
  MdPerson,
  MdBook,
  MdLocalOffer,
  MdLightbulb,
  MdQuiz,
  MdSettings,
  MdFileDownload,
  MdLocalHospital,
  MdSearch,
  MdChildCare,
  MdChat,
  MdCake,
} from 'react-icons/md';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  return (
    <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <button
          className={`${styles.toggleButton}`}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
        <div className={styles.sidebarContent}>
          <Col md={2} className={styles.sidebar}>
            <Nav defaultActiveKey="/" className="flex-column">
              <Nav.Link
                as={Link}
                href="/dashboard"
                locale={locale}
                className={styles.navlink}
                title={t("Dashboard")}
              >
                <span className={styles.icon}><MdDashboard /></span>
                <span className={styles.linkText}>{t("Dashboard")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/analysis"
                locale={locale}
                className={styles.navlink}
                title={t("Analytics")}
              >
                <span className={styles.icon}><MdAnalytics /></span>
                <span className={styles.linkText}>{t("Analytics")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/feeding-schedule"
                locale={locale}
                className={styles.navlink}
                title={t("Feeding Schedule")}
              >
                <span className={styles.icon}><MdRestaurant /></span>
                <span className={styles.linkText}>{t("Feeding Schedule")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/forum"
                locale={locale}
                className={styles.navlink}
                title={t("Forum")}
              >
                <span className={styles.icon}><MdForum /></span>
                <span className={styles.linkText}>{t("Forum")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/milestones"
                locale={locale}
                className={styles.navlink}
                title={t("Milestones")}
              >
                <span className={styles.icon}><MdCake /></span>
                <span className={styles.linkText}>{t("Milestones")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/growth"
                locale={locale}
                className={styles.navlink}
                title={t("Growths")}
              >
                <span className={styles.icon}><MdTrendingUp /></span>
                <span className={styles.linkText}>{t("Growths")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/reminders"
                locale={locale}
                className={styles.navlink}
                title={t("Reminders")}
              >
                <span className={styles.icon}><MdNotifications /></span>
                <span className={styles.linkText}>{t("Reminders")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/profile"
                locale={locale}
                className={styles.navlink}
                title={t("Profile")}
              >
                <span className={styles.icon}><MdPerson /></span>
                <span className={styles.linkText}>{t("Profile")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/journal"
                locale={locale}
                className={styles.navlink}
                title={t("Journal")}
              >
                <span className={styles.icon}><MdBook /></span>
                <span className={styles.linkText}>{t("Journal")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/coupons"
                locale={locale}
                className={styles.navlink}
                title={t("Coupons")}
              >
                <span className={styles.icon}><MdLocalOffer /></span>
                <span className={styles.linkText}>{t("Coupons")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/tips"
                locale={locale}
                className={styles.navlink}
                title={t("Curated Tips")}
              >
                <span className={styles.icon}><MdLightbulb /></span>
                <span className={styles.linkText}>{t("Curated Tips")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/quiz"
                locale={locale}
                className={styles.navlink}
                title={t("Quiz")}
              >
                <span className={styles.icon}><MdQuiz /></span>
                <span className={styles.linkText}>{t("Quiz")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/settings"
                locale={locale}
                className={styles.navlink}
                title={t("Settings")}
              >
                <span className={styles.icon}><MdSettings /></span>
                <span className={styles.linkText}>{t("Settings")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/export"
                locale={locale}
                className={styles.navlink}
                title={t("Export")}
              >
                <span className={styles.icon}><MdFileDownload /></span>
                <span className={styles.linkText}>{t("Export")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/medicalProfessional"
                locale={locale}
                className={styles.navlink}
                title={t("Medical Professional")}
              >
                <span className={styles.icon}><MdLocalHospital /></span>
                <span className={styles.linkText}>{t("Medical Professional")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/checkProduct"
                locale={locale}
                className={styles.navlink}
                title={t("Check Product")}
              >
                <span className={styles.icon}><MdSearch /></span>
                <span className={styles.linkText}>{t("Check Product")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/careServices"
                locale={locale}
                className={styles.navlink}
                title={t("Childcare Services")}
              >
                <span className={styles.icon}><MdChildCare /></span>
                <span className={styles.linkText}>{t("Childcare Services")}</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/chat"
                locale={locale}
                className={styles.navlink}
                title={t("Ask Tummy AI")}
              >
                <span className={styles.icon}><MdChat /></span>
                <span className={styles.linkText}>{t("Ask Tummy AI")}</span>
              </Nav.Link>
            </Nav>
          </Col>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;