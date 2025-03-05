import React, { useState, useCallback } from "react";
import styles from "./checkProduct.module.css";
import BarcodeScanner from "@/components/BarcodeScanner/BarcodeScanner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCameraSlash,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";

function CheckProduct() {
  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");

  const toggleCamera = () => {
    setCameraActive((prev) => !prev);
  };

  const fetchSafetyInfoFromBarcode = async (code) => {
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
      setError("Failed to fetch product safety information");
      setResult(null);
    }
  };

  const handleBarcodeDetected = (code) => {
    fetchSafetyInfoFromBarcode(code);
  };

  const checkInput = (input) => {
    console.log(input);
    if (/^\d{1,13}$/.test(input)) {
      // It's a barcode
      handleBarcodeDetected(input);
    } else {
      // It's a product name
      fetchSafetyInfo(input, "productName");
    }
  };

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  return (
    <div className={styles.container}>
      <h2>Check Product Safety</h2>
      <h1>Barcode Scanner</h1>
      <div className={styles.barcodeScanner}>
        <button onClick={toggleCamera} className={styles.cameraToggleButton}>
          <FontAwesomeIcon icon={faCamera} />
          {cameraActive ? " Turn Off Camera" : " Turn On Camera"}
        </button>
        {cameraActive && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            cameraActive={cameraActive}
          />
        )}
        {/* <BarcodeScanner onDetected={fetchSafetyInfoFromBarcode} /> */}

        <div className={styles.barcodeForm}>
          <input
            type="text"
            id="input"
            name="input"
            value={input}
            placeholder="Enter barcode or product code"
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

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div>
          <h3>{result.product}</h3>
          <p>Safety Levels: {result.safetyLevel}</p>
          {result.recalls.map((alert) => (
            <div key={alert.NID}>
              <h4>{alert.Title}</h4>
              <a href={alert.URL} target="_blank" rel="noopener noreferrer">
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
