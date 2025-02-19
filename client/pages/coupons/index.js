// client/pages/[coupons]/index.js
import React, { useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import { Form, Col, Card, Image } from "react-bootstrap";
import "react-multi-carousel/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./coupons.module.css";
import Link from "next/link";
import CouponCardCarousel from "@/components/CouponCardCarousel/CouponCardCarousel";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const CouponPage = () => {
  const { t } = useTranslation("common");
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
      // console.log("couponsData", couponsData);
      setAllCoupons(couponsData);

      // Fetch featured coupons
      const featuredCouponsData = couponsData.filter(
        (coupon) => coupon.is_featured,
      );
      // console.log("featuredCouponsData", featuredCouponsData);
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

  // fetching for allCoupons, featuredCoupons, and search results by city
  const fetchCoupons = async (
    city = "",
    filterValue = "",
    filterField = "",
  ) => {
    let data = [];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/coupons`);
      data = await res.json();

      if (data.status !== "ok") {
        return res.status(500).json({ error: "Error fetching coupons" });
      }

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

  // *** Render Page ***
  return (
    <div className={styles.couponContainer}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">{t("Discounts and Coupons")}</h1>
        <p className="text-gray-600">
          {t(
            "As part of our partner program, find deals and discounts you won't find anywhere else!",
          )}
        </p>
        {/*  SEARCH FORM by city */}
        <Form
          className="mb-4 d-flex"
          onSubmit={(e) => {
            e.preventDefault();
            fetchCoupons();
          }}
        >
          <Form.Control
            type="text"
            placeholder={t("Enter city name")}
            value={city}
            onChange={(e) => {
              setCity(e.target.value.trim());
              setnoResultsearch(false);
            }}
            style={{ width: "88%" }}
            className="border rounded me-2"
          />
        </Form>

        {/*Grid of SEARCHED COUPONS Cards*/}
        <br />
        {/* if city is filled AND has RESULT , show header with capital first letter */}
        {city !== "" && !noResultsearch && dataSearch.length > 0 && (
          <Col xs={12}>
            <h3 className="text-2xl font-bold mb-3">
              {t("Discounts near")}{" "}
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </h3>
          </Col>
        )}
        {city !== "" && noResultsearch === true && (
          <h5 className="mb-2 text-muted" style={{ fontWeight: "bold" }}>
            {t("No coupons found in this city:")} {city}
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
              autoPlaySpeed={4000}
              keyBoardControl={true}
              customTransition="transform 0.5s ease-in-out"
              transitionDuration={500}
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

      {/*====== FEATURED Discounts ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className="text-2xl font-bold">{t("Featured Discounts")}</h3>
        <Link
          href="/coupons/featuredCoupons"
          style={{
            color: "purple",
            textDecoration: "none", // remove underline
            marginRight: "16%",
            fontSize: "1.4em",
          }}
        >
          {t("View more")}
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
        autoPlaySpeed={4000}
        keyBoardControl={true}
        customTransition="transform 0.5s ease-in-out"
        transitionDuration={500}
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

      {/*====== BABY PRODUCT Deals ===== */}
      <h3 className="text-2xl font-bold">{t("Baby Product Deals")}</h3>
      <Carousel
        swipeable={true}
        draggable={true}
        showDots={true}
        responsive={responsive}
        ssr={true} // means to render carousel on server-side.
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={4000}
        keyBoardControl={true}
        customTransition="transform 0.5s ease-in-out"
        transitionDuration={500}
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
