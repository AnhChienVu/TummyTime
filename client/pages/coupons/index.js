// client/pages/[coupons]/index.js
import React, { useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import {
  Modal,
  Button,
  Form,
  Container,
  Row,
  Col,
  Card,
  Image,
} from "react-bootstrap";
import "react-multi-carousel/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./coupons.module.css";
import { set } from "date-fns";
import Link from "next/link";

const CouponPage = () => {
  const [city, setCity] = useState("");
  const [noResultsearch, setnoResultsearch] = useState(true);
  const [dataSearch, setDataSearch] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [featuredCoupons, setFeaturedCoupons] = useState([]);

  // ================== Fetch Coupons Data ==================
  // ***** useEffect for allCoupons and featuredCoupons *****
  useEffect(() => {
    // Fetch all coupons for (featured and Baby Products)
    const getAllCoupons = async () => {
      const couponsData = await fetchCoupons();
      console.log("couponsData", couponsData);
      setAllCoupons(couponsData);

      // Fetch featured coupons
      const featuredCouponsData = couponsData.filter(
        (coupon) => coupon.is_featured,
      );
      console.log("featuredCouponsData", featuredCouponsData);
      setFeaturedCoupons(featuredCouponsData);
    };

    getAllCoupons();
  }, []); // only run ONCE

  // ***** useEffect for SEARCH when city changes *****
  useEffect(() => {
    const getCouponsByCity = async () => {
      // SEARCH: Fetch all coupons for the city
      if (city !== "") {
        const couponsData = await fetchCoupons(city);
        setDataSearch(couponsData);
        setnoResultsearch(couponsData.length === 0);
      } else {
        setnoResultsearch(false);
      }
    };

    getCouponsByCity();
  }, [city]); // only run when city changes

  // const express = require("express");
  // const app = express();

  // const couponsMock = [
  //   // Toronto
  //   {
  //     store_name: "Enfamil Family Beginnings",
  //     product_name: "Baby Formula",
  //     discount_description: "Get up to $400 in FREE gifts from Enfamil.",
  //     discount_code: "ENFAMIL400",
  //     expiration_date: "2025-04-10",
  //     is_online: true,
  //     city: "Toronto",
  //     image_url:
  //       "https://new-lozo-prod.s3.amazonaws.com/offers/images/offer_140945.jpeg",
  //     brands: "Enfamil®",
  //     store: null,
  //     is_featured: true,
  //     discount_amount: 400.0,
  //   },
  // ];

  // fetching for allCoupons, featuredCoupons, and search results by city
  const fetchCoupons = async (
    city = "",
    filterValue = "",
    filterField = "",
  ) => {
    let data = [];
    try {
      //   CREATE TABLE Coupons (
      //     coupon_id SERIAL PRIMARY KEY,
      //     store_name VARCHAR(255),
      //     product_name VARCHAR(255),
      //     discount_description TEXT,
      //     discount_code VARCHAR(50),
      //     expiration_date DATE,
      //     is_online BOOLEAN,
      //     city VARCHAR(100),
      //     image_url TEXT,
      //     brands VARCHAR(255),
      //     store VARCHAR(255),
      //     is_featured BOOLEAN DEFAULT FALSE,
      //     discount_amount DECIMAL(6,2),
      //     discount_symbol VARCHAR(4) DEFAULT '$',
      //     label VARCHAR(50) GENERATED ALWAYS AS ('$' || discount_amount || ' off') STORED
      // );

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons`);
      data = await res.json();

      // data: { status: "ok", data: (49) […] }
      data = data.data;

      // if no city selected, return all coupons
      if (city == "") {
        data = data;
      } else {
        // if city is selected, filter by city
        data = data.filter((coupon) => {
          return coupon.city.toLowerCase() === city.toLowerCase();
        });
      }

      // if filterValue and filterField are provided, filter by them
      if (filterValue !== "" && filterField !== "") {
        // if city is empty => IGNORE CITY CHECK
        if (city == "") {
          data = data.filter((coupon) => {
            return (
              coupon[filterField].toString().toLowerCase() ===
              filterValue.toLowerCase() // in case boolean/number ->convert it to string
            );
          });
        } else {
          // if city is selected, filter by city and filterValue/filterField
          data = data.filter((coupon) => {
            return (
              coupon.city.toLowerCase() === city.toLowerCase() &&
              coupon[filterField].toString().toLowerCase() ===
                filterValue.toLowerCase() // in case boolean/number ->convert it to string
            );
          });
        }
      }

      // // MOCK DATA
      // // if no city selected, return all coupons
      // if (city == "") {
      //   data = couponsMock;
      // } else {
      //   // if city is selected, filter by city
      //   data = couponsMock.filter((coupon) => {
      //     return coupon.city.toLowerCase() === city.toLowerCase();
      //   });
      // }

      // // if filterValue and filterField are provided, filter by them
      // if (filterValue !== "" && filterField !== "") {
      //   // if city is empty => IGNORE CITY CHECK
      //   if (city == "") {
      //     data = data.filter((coupon) => {
      //       return (
      //         coupon[filterField].toString().toLowerCase() ===
      //         filterValue.toLowerCase() // in case boolean/number ->convert it to string
      //       );
      //     });
      //   } else {
      //     // if city is selected, filter by city and filterValue/filterField
      //     data = data.filter((coupon) => {
      //       return (
      //         coupon.city.toLowerCase() === city.toLowerCase() &&
      //         coupon[filterField].toString().toLowerCase() ===
      //           filterValue.toLowerCase() // in case boolean/number ->convert it to string
      //       );
      //     });
      //   }
      // }

      return data;
    } catch (error) {
      console.error("Error fetching coupons data:", error);
      return [];
    }
  };

  // ================== /end Fetch Coupons ==================

  // ================== Card components ==================
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 5000, min: 1333 },
      items: 7,
      slidesToSlide: 5, // optional, default to 1.
    },
    desktop: {
      breakpoint: { max: 1333, min: 999 },
      items: 6,
      slidesToSlide: 4, // optional, default to 1.
    },
    tablet: {
      breakpoint: { max: 999, min: 777 },
      items: 5,
      slidesToSlide: 4, // optional, default to 1.
    },
    mobile: {
      breakpoint: { max: 777, min: 0 },
      items: 2,
      slidesToSlide: 2, // optional, default to 1.
    },
  };

  // Print Button component
  const PrintButtonCarousel = ({ coupon }) => (
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
  );

  const PrintButton = ({ coupon }) => (
    <a
      href="#"
      className={styles.printButton}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        printCoupon(coupon);
      }}
    >
      Print
    </a>
  );

  // CouponCardCarousel
  const CouponCardCarousel = ({ coupon }) => (
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
          <PrintButtonCarousel coupon={coupon} />
        </div>
      </button>{" "}
      {/* End of main button */}
    </div>
  );

  // CouponCard
  const CouponCard = ({ coupon }) => (
    <Card
      bg="light"
      text="dark"
      style={{ width: "11rem", position: "relative" }}
      className="h-100" // make sure all cards are the same height
    >
      {coupon.image_url && (
        <Card.Img
          variant="top"
          src={coupon.image_url}
          style={{
            height: "90%",
            objectFit: "contain",
            boxSizing: "border-box",
            padding: "20px",
          }}
        />
      )}
      <Card.Body style={{ paddingBottom: "60px" }}>
        <Card.Title>{coupon.discount_description}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {coupon.store ? coupon.store : "Online"}
        </Card.Subtitle>
        <Card.Text as="h6">{coupon.product_name}</Card.Text>
        <Card.Text>
          Expires: {coupon.expiration_date.substring(0, 10)}
        </Card.Text>
        <Card.Text style={{ fontWeight: "bold" }}>
          Code: {coupon.discount_code}
        </Card.Text>
        {/* PRINT BUTTON */}
        <PrintButton coupon={coupon} />
      </Card.Body>
    </Card>
  );

  // ================== /end Carousel ==================

  // ================== PRINT Function ==================
  const printCoupon = (coupon) => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) return;

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
    printWindow.close();
  };

  // ================== /end PRINT Function ==================

  // *** Render Page ***
  return (
    <div className={styles.couponContainer}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Discounts and Coupons</h1>
        <p className="text-gray-600">
          As part of our partner program, find deals and discounts you
          won&apos;t find anywhere else!
        </p>
        {/**
         *
         *
         *
         *
         *  SEARCH FORM by city */}
        <Form
          className="mb-4 d-flex"
          onSubmit={(e) => {
            e.preventDefault();
            fetchCoupons();
          }}
        >
          <Form.Control
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => {
              setCity(e.target.value.trim());
              setnoResultsearch(false);
            }}
            style={{ width: "88%" }}
            className="border rounded me-2"
          />
          {/* 
          <Button variant="primary" type="submit">
            Search
          </Button> 
          */}
        </Form>

        {/**
         *
         *
         *
         *
         *
         *
         *  Grid of SEARCHED COUPONS Cards*/}
        <br />
        {/* if city is filled AND has RESULT , show header with capital first letter */}
        {city !== "" && !noResultsearch && dataSearch.length > 0 && (
          <Col xs={12}>
            <h3 className="text-2xl font-bold mb-3">
              Discounts near {city.charAt(0).toUpperCase() + city.slice(1)}
            </h3>
          </Col>
        )}
        {city !== "" && noResultsearch === true && (
          <h5 className="mb-2 text-muted" style={{ fontWeight: "bold" }}>
            No coupons found in this city: {city}
          </h5>
        )}

        {city !== "" && noResultsearch === false && dataSearch.length > 0 && (
          <>
            <Carousel
              swipeable={true}
              draggable={true}
              showDots={true}
              responsive={responsive}
              ssr={true}
              infinite={true}
              autoPlay={true}
              autoPlaySpeed={6000}
              keyBoardControl={true}
              customTransition="all .5"
              transitionDuration={1000}
              containerClass="carousel-container"
              dotListClass="custom-dot-list-style"
              itemClass="carousel-item-padding-40-px"
              rewind={true}
              rewindWithAnimation={true}
            >
              {dataSearch.map((coupon, index) => (
                <CouponCardCarousel key={index} coupon={coupon} />
              ))}
            </Carousel>
          </>
        )}
      </div>
      <br />
      <br />
      {/**
       *
       *
       *
       *
       *
       * ====== FEATURED Discounts ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className="text-2xl font-bold">Featured Discounts</h3>
        <Link
          href="/coupons/featuredCoupons"
          style={{
            color: "purple",
            textDecoration: "none", // remove underline
            marginRight: "16%",
            fontSize: "1.4em",
          }}
        >
          View more
        </Link>
      </div>
      <Carousel
        swipeable={true}
        draggable={true}
        showDots={true}
        responsive={responsive}
        ssr={true} // means to render carousel on server-side.
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={6000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={1000}
        containerClass="carousel-container"
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
        // centerMode={true} //Shows the next/previous partially
        rewind={true}
        rewindWithAnimation={true}
      >
        {featuredCoupons?.map((coupon, index) => (
          <CouponCardCarousel key={index} coupon={coupon} />
        ))}
      </Carousel>
      <br />
      <br />
      {/**
       *
       *
       *
       *
       *
       *
       * ====== BABY PRODUCT Deals ===== */}
      <h3 className="text-2xl font-bold">Baby Product Deals</h3>
      <Carousel
        swipeable={true}
        draggable={true}
        showDots={true}
        responsive={responsive}
        ssr={true} // means to render carousel on server-side.
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={6000}
        keyBoardControl={true}
        customTransition="all .5"
        transitionDuration={1000}
        containerClass="carousel-container"
        dotListClass="custom-dot-list-style"
        itemClass="carousel-item-padding-40-px"
        // centerMode={true} //Shows the next/previous partially
        rewind={true}
        rewindWithAnimation={true}
      >
        {allCoupons?.map((coupon, index) => (
          <CouponCardCarousel key={index} coupon={coupon} />
        ))}
      </Carousel>
      <br />
      <br />
    </div> //end couponCONTAINER div
  );
};

export default CouponPage;
