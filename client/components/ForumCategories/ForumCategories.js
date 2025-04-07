// components/ForumCategories/ForumCategories.js
// A component for displaying forum categories
import React from "react";
import styles from "./ForumCategories.module.css";

const ForumCategories = ({ selectedCategory, setCategory }) => {
  const categories = [
    { id: "general", name: "General Discussion", icon: "💬" },
    { id: "help", name: "Help & Support", icon: "❓" },
    { id: "feedback", name: "Feedback", icon: "📝" },
    { id: "other", name: "Other", icon: "📌" },
  ];

  const handleCategoryClick = (categoryId) => {
    // If clicking the already selected category, unselect it
    if (selectedCategory === categoryId) {
      setCategory("");
    } else {
      setCategory(categoryId);
    }
  };

  return (
    <div className={styles.categoryGrid}>
      {categories.map((category) => (
        <div
          key={category.id}
          className={`${styles.categoryCard} ${
            selectedCategory === category.id ? styles.selected : ""
          }`}
          onClick={() => handleCategoryClick(category.id)}
        >
          <span className={styles.categoryIcon}>{category.icon}</span>
          <span className={styles.categoryName}>{category.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ForumCategories;
