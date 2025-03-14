import React, { useState } from "react";
import styles from "./SearchByCategoryBox.module.css";

function SearchByCategoryBox() {
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const baseUrl = "https://globalrecalls.oecd.org/ws/search.xqy";

  const contructQuery = (category, searchTerm) => {
    const categoryCodes = {
      clothing: "67000000",
      food: "86000000",
      toys: "49000000",
      electronics: "54000000",
      furniture: "71000000",
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
      // const apiUrl = `https://globalrecalls.oecd.org/ws/search.xqy?q=(${category}:${encodeURIComponent(
      //   searchTerm,
      // )})`;
      // const apiUrl = `${baseUrl}?end=20&lang=en&order=desc&q=(gs1-gpc-segment:${gpcCode})&sort=date&start=0&uiLang=en`;

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
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="toys">Toys</option>
          <option value="clothing">Clothing</option>
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="personalCare">PersonalCare</option>
        </select>
        <input
          type="text"
          id={styles.searchInput}
          placeholder="Enter your search term..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button id={styles.searchButton} onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className={styles.searchResults}>
        {results.length > 0 ? (
          results.map((item, index) => (
            <div className={styles.resultItem} key={index}>
              <p>
                <strong>Product&apos;s name:</strong> {item["product.name"]}
              </p>
              <p>
                <a href={item.extUrl} className={styles.itemLink}>
                  External website
                </a>
              </p>
            </div>
          ))
        ) : (
          <p>No results found</p>
        )}
      </div>
    </div>
  );
}

export default SearchByCategoryBox;
