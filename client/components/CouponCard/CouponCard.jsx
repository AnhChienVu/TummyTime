// CouponCard
import React from "react";
import { Card, Button } from "react-bootstrap";
import styles from "./CouponCard.module.css";
import printCoupon from "@/utils/printCoupon";

function CouponCard({ coupon }) {
  return (
    <div className={styles.couponCardContainer}>
      <Card className={styles.couponCard}>
        <div className={styles.cardImageWrapper}>
          {coupon.image_url ? (
            <Card.Img
              variant="top"
              src={coupon.image_url}
              className={styles.cardImage}
              alt={coupon.product_name}
            />
          ) : (
            <div className={styles.cardImage} />
          )}
          <span className={styles.discountAmount}>
            {coupon.discount_symbol}
            {coupon.discount_amount} OFF
          </span>
        </div>
        <Card.Body className={`${styles.cardBody} d-flex flex-column`}>
          <div className={styles.cardContent}>
            <div className={styles.storeDetails}>
              <span className={styles.storeName}>
                {coupon.store || "Online Store"}
              </span>
              <span className={styles.location}>{coupon.city || "Online"}</span>
            </div>
            <Card.Title className={styles.productTitle}>
              {coupon.product_name}
            </Card.Title>
            <Card.Text className={styles.description}>
              {coupon.discount_description}
            </Card.Text>
          </div>
          <div className={styles.cardFooter}>
            <div className={styles.couponCode}>
              <span>Code:</span>
              <strong>{coupon.discount_code}</strong>
            </div>
            <Button
              variant="primary"
              className={styles.printButton}
              onClick={(e) => {
                e.stopPropagation();
                printCoupon(coupon);
              }}
            >
              Print Coupon
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default CouponCard;
