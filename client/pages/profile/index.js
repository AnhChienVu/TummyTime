// pages/profile/index.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Image } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./profile.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";

function ProfilePage() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  const [profile, setProfile] = useState(null);
  const [babyProfiles, setBabyProfiles] = useState([]);
  const router = useRouter();
  console.log(profile);
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    async function fetchProfile() {
      // Fetches the user's profile
      try {
        const res = await fetch(`http://localhost:8080/v1/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        // console.log("Fetched user profile data:", data); // Log the response data
        if (res.ok) {
          setProfile(data);
        } else {
          console.error("Failed to fetch profile:", data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }

    async function fetchBabyProfiles() {
      // Fetches the user's baby profiles
      try {
        const res = await fetch(
          `http://localhost:8080/v1/user/${userId}/getBabyProfiles`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await res.json();
        // console.log("Fetched baby profiles data:", data); // Log the response data
        if (res.ok) {
          // Convert the object to an array of baby profiles
          const babyProfilesArray = Object.keys(data)
            .filter((key) => key !== "status")
            .map((key) => data[key]);
          setBabyProfiles(babyProfilesArray);
        } else {
          console.error("Failed to fetch baby profiles:", data);
        }
      } catch (error) {
        console.error("Error fetching baby profiles:", error);
      }
    }

    fetchProfile();
    fetchBabyProfiles();
  }, []); // Ensure the dependency array is empty to run only once on mount

  const handleEditButton = () => {
    router.push({
      pathname: `user/${profile.user_id}/edit`,
      query: { profile: JSON.stringify(profile), locale },
    });
  };
  return (
    <Container className="mt-5">
      {/* Profile Section */}
      <Row className="mb-4">
        <Col className="mt-4 pt-4">
          <h2>{t("Profile")}</h2>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <Image
                src="https://fastly.picsum.photos/id/177/2515/1830.jpg?hmac=G8-2Q3-YPB2TreOK-4ofcmS-z5F6chIA0GHYAe5yzDY"
                alt="Profile"
                className="rounded-circle me-3"
                style={{ width: "80px", height: "80px" }}
              />
              <div className="flex-grow-1">
                <Card.Title>
                  {profile
                    ? `${profile.first_name} ${profile.last_name}`
                    : "Loading..."}
                </Card.Title>
                <Card.Text>{profile ? profile.role : "Loading..."}</Card.Text>
              </div>

              <Button variant="outline-secondary" onClick={handleEditButton}>
                {t("Edit")}
              </Button>
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{t("Baby Profiles")}</h2>
            <Link href={`/addBaby`} locale={locale}>
              <Button variant="primary">{t("Add Baby")}</Button>
            </Link>
          </div>
          {babyProfiles.length > 0 ? (
            babyProfiles.map((baby) => (
              <Card key={baby.baby_id} className="mb-3">
                <Card.Body className="d-flex align-items-center">
                  <Image
                    src="https://images.unsplash.com/photo-1674650638555-8a2c68584ddc?q=80&w=2027&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Profile"
                    className="rounded-circle me-3"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <div className="flex-grow-1">
                    <Card.Title>
                      {baby.first_name} {baby.last_name}
                    </Card.Title>
                    <Card.Text>Gender: {baby.gender}</Card.Text>
                    <Card.Text>Weight: {baby.weight}lbs</Card.Text>
                  </div>

                  <Button className={`${styles.customButton} me-2`}>
                    Analysis
                  </Button>
                  <Button className={styles.customButton}>Growth</Button>
                </Card.Body>
              </Card>
            ))
          ) : (
            <p>{t("No baby profiles found")}</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
