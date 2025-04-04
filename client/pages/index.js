// pages/index.js
import React from "react";
import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import {
  FaBabyCarriage,
  FaChartLine,
  FaCalendarAlt,
  FaRobot,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import styles from "./index.module.css";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [showScroll, setShowScroll] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const features = [
    {
      icon: <FaBabyCarriage size={40} />,
      title: "Baby Tracking",
      description: "Record feeding, diapers, and growth milestones with ease",
    },
    {
      icon: <FaChartLine size={40} />,
      title: "Health Reports",
      description: "Generate detailed health reports to share with caregivers",
    },
    {
      icon: <FaCalendarAlt size={40} />,
      title: "Feed Schedules",
      description: "Log feeding and care schedules for your baby",
    },
    {
      icon: <FaRobot size={40} />,
      title: "AI Assistant",
      description: "Get intelligent insights and recommendations for baby care",
    },
  ];

  const testimonials = [
    {
      text: "Tummy Time has made tracking my baby's development so much easier!",
      author: "Sarah M.",
      role: "New Parent",
    },
    {
      text: "The AI recommendations are spot-on and help me make better decisions.",
      author: "Michael R.",
      role: "Father of Two",
    },
    {
      text: "I love how easy it is to track my baby's feeding schedule!",
      author: "Emma L.",
      role: "Mother of Twins",
    },
    {
      text: "The growth tracking features are incredibly helpful.",
      author: "David K.",
      role: "First-time Parent",
    },
  ];

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", checkScrollTop);
    checkScrollTop(); // Check initial scroll position

    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) =>
        prevIndex + 2 >= testimonials.length ? 0 : prevIndex + 2,
      );
    }, 5000); // Change testimonials every 5 seconds

    return () => clearInterval(timer);
  });

  return (
    <div className={styles.container} style={{ marginLeft: 0, marginRight: 0 }}>
      {/* Top Navigation */}
      <div className={styles.navContainer}>
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="Tummy Time Logo"
            className={styles.logo}
            width={40}
            height={40}
            priority
          />
          <span className={styles.brandName}>Tummy Time</span>
        </div>
        <div className={styles.topNav}>
          <Button
            variant="light"
            className="mx-2"
            onClick={() => router.push("/register")}
          >
            Get Started
          </Button>
          <Button
            variant="outline-light"
            className="mx-2"
            onClick={() => router.push("/login")}
          >
            Log In
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <Container
        fluid
        className={`${styles.heroSection} py-0`}
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1552819289-824d37ca69d2')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={styles.heroBackground}>
          <div className={styles.overlay}></div>
        </div>
        <Row className="justify-content-center align-items-center min-vh-100 position-relative">
          <Col md={8} lg={6} className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={`${styles.mainTitle} ${styles.slideIn}`}>
                Welcome to
                <br />
                Tummy Time.
              </h1>
              <p className={`${styles.subheading} ${styles.slideInDelayed}`}>
                Your all-in-one baby care companion for smart tracking and peace
                of mind. A modern, user-friendly platform for record-keeping,
                health metrics monitoring, and data export improves the
                caregiving process and communication with healthcare
                professionals. Keep track of essential activities crucial to the
                health and wellbeing of your child.
              </p>
            </div>
            <div className={`${styles.ctaButtons} ${styles.slideInDelayed}`}>
              <Button
                variant="primary"
                size="lg"
                className={`${styles.ctaButton} ${styles.primaryButton} mx-2`}
                onClick={() => router.push("/register")}
              >
                Sign Up
              </Button>
              <Button
                variant="outline-primary"
                size="lg"
                className={`${styles.ctaButton} ${styles.secondaryButton} mx-2`}
                onClick={() => router.push("/login")}
              >
                Log In
              </Button>
            </div>
            <div className={`${styles.trustBadges} ${styles.slideInDelayed}`}>
              <span className={styles.trustBadge}>🔒 Secure & Private</span>
              <span className={styles.trustBadge}>⭐ 4.9/5 Rating</span>
              <span className={styles.trustBadge}>
                👶 10,000+ Happy Parents
              </span>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Features Section */}
      <Container fluid className="px-0 py-5">
        <h2 className="text-center mb-5">Why Choose Tummy Time?</h2>
        <Row className="g-4">
          {features.map((feature, index) => (
            <Col key={index} md={6} lg={3}>
              <Card className={styles.featureCard}>
                <Card.Body className="text-center">
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <Card.Title>{feature.title}</Card.Title>
                  <Card.Text>{feature.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Testimonials Section */}
      <Container fluid className={`${styles.testimonialSection} px-0 py-5`}>
        <Container>
          <h2 className="text-center mb-4">What Parents Say</h2>
          <Row className="justify-content-center">
            {testimonials
              .slice(currentTestimonialIndex, currentTestimonialIndex + 2)
              .map((testimonial, index) => (
                <Col md={4} key={currentTestimonialIndex + index}>
                  <div className={`${styles.testimonialCard} ${styles.fadeIn}`}>
                    <p>&quot;{testimonial.text}&quot;</p>
                    <footer>
                      - {testimonial.author}, {testimonial.role}
                    </footer>
                  </div>
                </Col>
              ))}
          </Row>
          <div className={styles.testimonialDots}>
            {Array(testimonials.length / 2)
              .fill()
              .map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.dot} ${
                    currentTestimonialIndex === idx * 2 ? styles.activeDot : ""
                  }`}
                  onClick={() => setCurrentTestimonialIndex(idx * 2)}
                />
              ))}
          </div>
        </Container>
      </Container>

      {/* Call to Action Section */}
      <Container className="text-center py-5">
        <h2>Ready to Start Your Journey?</h2>
        <p className="mb-4">
          Join thousands of parents who trust Tummy Time for their baby care
          needs
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push("/register")}
          className={styles.primaryButton}
        >
          Get Started Now
        </Button>
      </Container>

      {showScroll && (
        <Button
          className={`${styles.scrollTop} ${showScroll ? styles.visible : ""}`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          ↑
        </Button>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <Container>
          <Row className="py-4">
            <Col md={4}>
              <h5>Contact Us</h5>
              <p>support@tummytime.com</p>
              <p>+1 (416) 123-4567</p>
              <p>
                123 Sesame Street
                <br />
                Toronto, ON M1M 1M1
              </p>
            </Col>
            <Col md={4}>
              <h5>Follow Us</h5>
              <div className={styles.socialLinks}>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook size={24} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram size={24} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin size={24} />
                </a>
              </div>
            </Col>
            <Col md={4}>
              <h5>Links</h5>
              <ul className={styles.footerLinks}>
                <li>
                  <a href="/privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms">Terms of Service</a>
                </li>
                <li>
                  <a href="/faq">FAQ</a>
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
