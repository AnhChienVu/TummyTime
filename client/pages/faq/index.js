// pages/faq/index.js
import { useState } from "react";
import HomePageNavBar from "@/components/Navbar/HomePageNavBar";
import styles from "./faq.module.css";

const FAQCategory = ({ title, questions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={styles.section}>
      <div
        className={styles.categoryHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2>{title}</h2>
        <span className={styles.expandIcon}>{isExpanded ? "−" : "+"}</span>
      </div>
      {isExpanded && (
        <div className={styles.questionsList}>
          {questions.map((qa, index) => (
            <div key={index} className={styles.questionItem}>
              <h3>{qa.question}</h3>
              <p>{qa.answer}</p>
              {qa.links && (
                <div className={styles.relatedLinks}>
                  <span>Related: </span>
                  {qa.links.map((link, i) => (
                    <a key={i} href={link.url} className={styles.link}>
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const FAQ = () => {
  const faqData = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "What is TummyTime?",
          answer:
            "TummyTime is a baby tracking application that helps you monitor feeding schedules, growth, milestones and more for your little one.",
        },
        {
          question: "How do I start using TummyTime?",
          answer:
            "Create an account, add your baby's profile, and start tracking their daily activities like feeding times, growth measurements, and milestones.",
          links: [{ text: "Quick Start Guide", url: "/guide/quickstart" }],
        },
      ],
    },
    {
      category: "Feeding Tracking",
      questions: [
        {
          question: "How do I log a feeding?",
          answer:
            "Go to your baby's feeding schedule page, click 'Add Feed', and enter details like time, food type, and amount.",
        },
        {
          question: "Can I set feeding reminders?",
          answer:
            "Yes! When adding or editing a feed, enable the reminder option and set how many minutes before the next feed you'd like to be notified.",
        },
      ],
    },
    {
      category: "Growth Tracking",
      questions: [
        {
          question: "How do I track my baby's growth?",
          answer:
            "Visit the Growth section to record your baby's height and weight measurements. You can view trends over time and compare to standard growth charts.",
        },
        {
          question: "How often should I update growth measurements?",
          answer:
            "We recommend updating growth measurements monthly for babies under 1 year, and every 2-3 months for older babies, or as recommended by your pediatrician.",
        },
      ],
    },
    {
      category: "Milestones",
      questions: [
        {
          question: "What kind of milestones can I track?",
          answer:
            "You can track all types of developmental milestones including first smile, rolling over, first steps, and more. Add photos and notes to capture these special moments.",
        },
        {
          question: "Can I export milestone data?",
          answer:
            "Yes! Use our export feature to download all milestone data in various formats for easy sharing or record keeping.",
        },
      ],
    },
    {
      category: "Product Safety",
      questions: [
        {
          question: "How does the product safety scanner work?",
          answer:
            "Use your computer's (or tablet's) camera to scan product barcodes or search by product name. We'll check against recall databases and safety alerts to ensure the product is safe for your baby.",
        },
        {
          question: "Where do you get safety data from?",
          answer:
            "We aggregate safety data from multiple official sources including government consumer safety databases and manufacturer recall notices.",
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "What devices support TummyTime?",
          answer:
            "TummyTime works on all modern browsers including Chrome, Firefox, Safari, and Edge.",
        },
        {
          question: "Is my data secure?",
          answer:
            "Yes! We use industry-standard encryption to protect all your data. Your baby's information is private and only accessible to authorized caregivers you approve.",
        },
      ],
    },
    {
      category: "Account Management",
      questions: [
        {
          question: "How do I create an account?",
          answer:
            "To create an account, click the 'Get Started' button in the top right corner and follow the registration process. You'll need to provide your email, create a password, and verify your account.",
          links: [{ text: "Sign Up Guide", url: "/guide/signup" }],
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "What browsers are supported?",
          answer:
            "Our application supports the latest versions of Chrome, Firefox, Safari, and Edge.",
        },
        {
          question: "The app isn't working on my device",
          answer:
            "Try clearing your browser cache and cookies. If the issue persists, please contact our support team.",
          links: [
            { text: "Contact Support", url: "mailto:privacy@tummytime.com" },
          ],
        },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      <HomePageNavBar variant="dark" />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Frequently Asked Questions</h1>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.content}>
          {faqData.map((category, index) => (
            <FAQCategory
              key={index}
              title={category.category}
              questions={category.questions}
            />
          ))}
        </div>

        <footer className={styles.footer}>
          <p>
            Can&apos;t find what you&apos;re looking for?
            <a href="mailto:support@tummytime.com" className={styles.link}>
              Contact Support
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

FAQ.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export default FAQ;
