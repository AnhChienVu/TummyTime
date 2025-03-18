import React, { useState } from "react";
import styles from "./SearchByCategoryBox.module.css";
import { useTranslation } from "next-i18next";

function SearchByCategoryBox() {
  const { t } = useTranslation("common");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const contructQuery = (category, searchTerm) => {
    const categoryCodes = {
      clothing: "67000000",
      food: "50000000",
      toys: "86000000",
      electronics: "78000000",
      furniture: "75000000",
      personalCare: "53000000",
    };
    const gpcCode = categoryCodes[category];
    if (!gpcCode) {
      throw new Error("Invalid category");
    }

    if (!searchTerm) {
      return `(gs1-gpc-segment:${gpcCode})`;
    } else {
      return `${encodeURIComponent(searchTerm)} (gs1-gpc-segment:${gpcCode})`;
    }
  };

  const handleSearch = async () => {
    console.log(category, searchTerm);
    const query = contructQuery(category, searchTerm);
    const apiUrl = `https://globalrecalls.oecd.org/ws/search.xqy?end=20&lang=en&order=desc&q=${query}&sort=date&start=0&uiLang=en`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setResults([]);
    }
  };
  return (
    <div>
      <div className={styles.searchByCategory}>
        <select
          id={styles.categoryDropdown}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">{t("All Categories")}</option>
          <option value="food">{t("Food")}</option>
          <option value="toys">{t("Toys")}</option>
          <option value="clothing">{t("Clothing")}</option>
          <option value="electronics">{t("Electronics")}</option>
          <option value="furniture">{t("Furniture")}</option>
          <option value="personalCare">{t("Personal Care")}</option>
        </select>
        <input
          type="text"
          id={styles.searchInput}
          placeholder={t("Enter your search term...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button id={styles.searchButton} onClick={handleSearch}>
          {t("Search")}
        </button>
      </div>

      <div className={styles.searchResults}>
        {results.length > 0 ? (
          results.map((item, index) => (
            <div className={styles.resultItem} key={index}>
              <p>
                <strong>{t("Product's name")}:</strong> {item["product.name"]}
              </p>
              <p>
                <a href={item.extUrl} className={styles.itemLink}>
                  {t("External website")}
                </a>
              </p>
            </div>
          ))
        ) : (
          <p>{t("No results found")}</p>
        )}
      </div>
    </div>
  );
}

export default SearchByCategoryBox;
