// client/pages/[tips]/index.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Accordion,
  Button,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import styles from "./tips.module.css";

const CuratedTipsPage = () => {
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  // FILTER inputs: Age (by month) and Gender
  const [babyAge, setBabyAge] = useState("");
  const [gender, setGender] = useState("All");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tips`)
      .then((res) => res.json())
      .then((data) => {
        // If returned data as Object { data: [...] }), or an array []
        const tipsData = data.data || data;
        setTips(tipsData);
        setFilteredTips(tipsData); // Initially display all tips
      })
      .catch((error) => console.error("Error fetching tips:", error));
  }, []); // RUN ONLY ONCE

  // FILTER function by Age and Gender
  const handleFilter = () => {
    const age = parseInt(babyAge, 10); // Convert to int`

    // FILTERING by Age and Gender
    const filtered = tips.filter((tip) => {
      let isMatchedAge;
      // if age is provided, show tips for that age range
      if (!isNaN(age)) {
        isMatchedAge = age >= tip.min_age && age <= tip.max_age;
      } else {
        // If no age is provided, show all tips
        isMatchedAge = true;
      }

      let isMatchedGender;
      // If ALL is selected, or MATCHING GENDER =>show tips
      if (
        gender === "All" ||
        tip.target_gender === "All" ||
        tip.target_gender === gender
      ) {
        isMatchedGender = true;
      } else {
        // if not matched
        isMatchedGender = false;
      }

      return isMatchedAge && isMatchedGender;
    });

    setFilteredTips(filtered);
  };

  // GROUPING TIPS by category
  const groupedTips = {};
  for (const tip of filteredTips) {
    let cat = tip.category;
    // If category Key is not in groupedTips, add Key
    if (!groupedTips[cat]) {
      groupedTips[cat] = [];
    }

    // Push the tip into the same category Key
    groupedTips[cat].push(tip);
  }

  // **** RENDER PAGE ****
  return (
    <Container className={styles.container}>
      <h1 className="mb-4">Curated Tips</h1>

      {/* Filter Card */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Filter Tips</Card.Title>
          <Form>
            <Row>
              {/* Age Input */}
              <Col lg={4} className="mb-1">
                <Form.Group controlId="ageInput">
                  <Form.Label>Baby Age (in months)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Enter age in months"
                    value={babyAge}
                    onChange={(e) => setBabyAge(e.target.value)}
                  />
                </Form.Group>
              </Col>

              {/* Gender Select */}
              <Col lg={4} className="mb-1">
                <Form.Group controlId="genderSelect">
                  <Form.Label>Gender</Form.Label>
                  <Form.Control
                    as="select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                  </Form.Control>
                </Form.Group>
              </Col>

              {/* Filter Button */}
              <Col lg={4} className="d-flex align-items-end mt-2">
                <Button variant="primary" onClick={handleFilter}>
                  Filter
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* TIPS GROUPED by category */}
      {Object.keys(groupedTips).length === 0 ? (
        <p>No tips available for selected filters.</p>
      ) : (
        <Accordion defaultActiveKey="0">
          {Object.keys(groupedTips).map((category, index) => (
            <Accordion.Item eventKey={index.toString()} key={category}>
              {/* Category */}
              <Accordion.Header>{category}</Accordion.Header>

              <Accordion.Body>
                {/* Tip Cards */}
                {groupedTips[category].map((tip) => (
                  <Card className="mb-3" key={tip.tip_id}>
                    <Card.Body>
                      <Card.Title>{tip.notification_frequency} Tip</Card.Title>
                      <Card.Text>{tip.tip_text}</Card.Text>
                      <Card.Text>
                        <small className="text-muted">
                          Age: {tip.min_age} - {tip.max_age} months | Target:{" "}
                          {tip.target_gender}
                        </small>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <br />
      <br />
      <br />
    </Container>
  );
};

export default CuratedTipsPage;
