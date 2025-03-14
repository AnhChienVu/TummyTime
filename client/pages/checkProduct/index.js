import React, { useState, useCallback } from "react";
import styles from "./checkProduct.module.css";
import BarcodeScanner from "@/components/BarcodeScanner/BarcodeScanner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCameraSlash,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import SearchByCategoryBox from "@/components/SearchByCategoryBox/SearchByCategoryBox";

function CheckProduct() {
  const { t } = useTranslation("common");
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  const fetchSafetyInfoFromBarcode = useCallback(async (code) => {
    console.log(code);
    setError(null);
    let url = `${process.env.NEXT_PUBLIC_API_URL}/v1/products/checkProduct?barcode=${code}`;

    try {
      const res = await fetch(url, {
        method: "GET",
      });
      const data = await res.json();
      if (data?.error?.message == "Invalid barcode") {
        setError("Invalid barcode");
        setResult(null);
        return;
      }
      if (data.status === "error") {
        setError("Product not found");
        setResult(null);
        return;
      }
      console.log(data);
      setResult(data);
    } catch (err) {
      setError("Failed to fetch product safety information by barcode");
      setResult(null);
    }
  }, []);

  const fetchSafetyInfoFromProductName = useCallback(async (productName) => {
    console.log(productName);
    setError(null);
    let url = `${process.env.NEXT_PUBLIC_API_URL}/v1/products/checkProduct?productName=${productName}`;

    try {
      const res = await fetch(url, {
        method: "GET",
      });
      const data = await res.json();
      if (data.status === "error") {
        setError("Product not found");
        setResult(null);
        return;
      }
      console.log(data);
      setResult(data);
    } catch (err) {
      setError("Failed to fetch product safety information by product name");
      setResult(null);
    }
  }, []);

  const checkInput = useCallback(
    (input) => {
      console.log(input);
      if (/^\d{1,13}$/.test(input)) {
        // It's a barcode
        fetchSafetyInfoFromBarcode(input);
      } else {
        // It's a product name
        fetchSafetyInfoFromProductName(input);
      }
    },
    [fetchSafetyInfoFromBarcode, fetchSafetyInfoFromProductName],
  );

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  return (
    <div className={styles.container}>
      <h1>Barcode Scanner</h1>
      <div className={styles.barcodeScanner}>
        <button onClick={toggleCamera} className={styles.cameraToggleButton}>
          <FontAwesomeIcon icon={faCamera} />
          {cameraActive ? t("Turn Off Camera") : t("Turn On Camera")}
        </button>
        {cameraActive && (
          <div className={styles.scannerCamera}>
            <BarcodeScanner
              onDetected={fetchSafetyInfoFromBarcode}
              cameraActive={cameraActive}
            />
          </div>
        )}
        {/* <BarcodeScanner onDetected={fetchSafetyInfoFromBarcode} /> */}

        <div className={styles.barcodeForm}>
          <input
            type="text"
            id="input"
            name="input"
            value={input}
            placeholder={t("Enter barcode or product code")}
            onChange={handleInputChange}
            className={styles.barcodeInput}
          ></input>
          <button
            onClick={() => {
              checkInput(input);
            }}
            className={styles.searchButton}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </div>

      <br />

      <h1>Search By Category</h1>
      <SearchByCategoryBox />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div>
          <h4>
            {t("Search")}: {result.product}
          </h4>
          <h3>
            {t("Safety Levels")}: {t(result.safetyLevel)}
          </h3>
          {result.recalls.map((alert) => (
            <div key={alert.NID} className={styles.alert}>
              <h4>{alert.Title}</h4>
              <a
                href={alert.URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.alertLink}
              >
                View Recall Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CheckProduct;
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
