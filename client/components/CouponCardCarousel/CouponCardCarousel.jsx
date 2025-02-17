// CouponCardCarousel
import React from "react";
import { Form, Col, Card, Image } from "react-bootstrap";
import styles from "./CouponCardCarousel.module.css";

function CouponCardCarousel({ coupon }) {
  // ================== PRINT Function ==================
  const printCoupon = (coupon) => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      console.error("Failed to open print window.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Coupon</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .coupon-container { border: 1px solid #000; padding: 20px; }
            .coupon-image { max-width: 100%; max-height: 300px; object-fit: contain; }
            .discount-code { font-size: 36px; font-weight: bold; margin: 20px 0; }
            .coupon-details p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="coupon-container">
            ${
              coupon.image_url
                ? `<img class="coupon-image" src="${coupon.image_url}" alt="Coupon Image" />`
                : ""
            }
            <div class="coupon-details">
              <h2>${coupon.product_name}</h2>
              <p>${coupon.discount_description}</p>
              <p>Store: ${coupon.store ? coupon.store : "Online"}</p>
              <p>Expires: ${coupon.expiration_date}</p>
              <div class="discount-code">Code: ${coupon.discount_code}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
  return (
    <div className={styles.carouselCard}>
      <button className={styles.carouselCardButton} tabIndex="0" type="button">
        <div className={styles.carouselImageContainer}>
          <Image
            src={coupon.image_url}
            alt="Coupon Image"
            className={styles.carouselImage}
          />
        </div>
        <div className={styles.carouselCardContent}>
          <h6>{coupon.product_name}</h6>
          <div className={styles.cardText}>
            <p className="text-muted">{coupon.discount_description}</p>
            <p>{coupon.store ? coupon.store : "Online"}</p>
            <p>Expires: {coupon.expiration_date.substring(0, 10)}</p>
            <p className={styles.discountCode}>Code: {coupon.discount_code}</p>
          </div>

          {/* PRINT BUTTON */}
          <a
            href="#"
            className={styles.printButtonCarousel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              printCoupon(coupon);
            }}
          >
            Print
          </a>
        </div>
      </button>{" "}
      {/* End of main button */}
    </div>
  );
}

export default CouponCardCarousel;
