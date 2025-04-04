// components/Navbar/HomePageNavBar.js
// This is a component for the navigation bar on the home page
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./HomePageNavBar.module.css";

const HomePageNavBar = ({ variant = "default" }) => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`${styles.navContainer} ${styles[variant]}`}>
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
  );
};

export default HomePageNavBar;
