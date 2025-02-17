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

// const NEXT_PUBLIC_API_URL = "http://localhost:8080/v1";

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
    <Container>
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

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// -------------------------
// MOCK DATA
// -------------------------
// const mockData = [
//   // SLEEP category
//   {
//     tip_id: 1,
//     category: "SLEEP",
//     target_gender: "All",
//     min_age: 0,
//     max_age: 3,
//     tip_text: "Establish a consistent sleep routine even in the early weeks.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T12:00:00Z",
//   },
//   {
//     tip_id: 2,
//     category: "SLEEP",
//     target_gender: "Girl",
//     min_age: 4,
//     max_age: 6,
//     tip_text: "Encourage quiet time before naps with soft lullabies.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:05:00Z",
//   },
//   {
//     tip_id: 3,
//     category: "SLEEP",
//     target_gender: "Boy",
//     min_age: 7,
//     max_age: 9,
//     tip_text: "Monitor sleep patterns and adjust bedtime routines as needed.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T12:10:00Z",
//   },
//   {
//     tip_id: 4,
//     category: "SLEEP",
//     target_gender: "All",
//     min_age: 10,
//     max_age: 12,
//     tip_text: "Introduce a bedtime story to help signal winding down.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:15:00Z",
//   },
//   // HYGIENE category
//   {
//     tip_id: 5,
//     category: "HYGIENE",
//     target_gender: "All",
//     min_age: 0,
//     max_age: 3,
//     tip_text:
//       "Keep the baby’s skin clean and moisturized with gentle products.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T12:20:00Z",
//   },
//   {
//     tip_id: 6,
//     category: "HYGIENE",
//     target_gender: "Girl",
//     min_age: 4,
//     max_age: 6,
//     tip_text: "Use hypoallergenic wipes and gentle soap during bath time.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:25:00Z",
//   },
//   {
//     tip_id: 7,
//     category: "HYGIENE",
//     target_gender: "Boy",
//     min_age: 7,
//     max_age: 9,
//     tip_text: "Establish a gentle cleansing routine after feeding.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T12:30:00Z",
//   },
//   {
//     tip_id: 8,
//     category: "HYGIENE",
//     target_gender: "All",
//     min_age: 10,
//     max_age: 12,
//     tip_text: "Introduce a mild baby lotion to keep skin soft.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:35:00Z",
//   },
//   // PHYSICAL ACTIVITIES category
//   {
//     tip_id: 9,
//     category: "PHYSICAL ACTIVITIES",
//     target_gender: "Boy",
//     min_age: 0,
//     max_age: 3,
//     tip_text: "Incorporate tummy time to strengthen neck and shoulder muscles.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:40:00Z",
//   },
//   {
//     tip_id: 10,
//     category: "PHYSICAL ACTIVITIES",
//     target_gender: "Girl",
//     min_age: 0,
//     max_age: 3,
//     tip_text: "Engage in gentle play that encourages reaching and grasping.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:45:00Z",
//   },
//   {
//     tip_id: 11,
//     category: "PHYSICAL ACTIVITIES",
//     target_gender: "All",
//     min_age: 4,
//     max_age: 6,
//     tip_text: "Encourage rolling over with supervised floor play.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T12:50:00Z",
//   },
//   {
//     tip_id: 12,
//     category: "PHYSICAL ACTIVITIES",
//     target_gender: "Boy",
//     min_age: 7,
//     max_age: 9,
//     tip_text: "Promote crawling by placing toys just out of reach.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T12:55:00Z",
//   },
//   // LANGUAGE DEVELOPMENT category
//   {
//     tip_id: 13,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "All",
//     min_age: 0,
//     max_age: 3,
//     tip_text:
//       "Talk, sing, and read to your baby frequently to boost language skills.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T13:00:00Z",
//   },
//   {
//     tip_id: 14,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "Girl",
//     min_age: 4,
//     max_age: 6,
//     tip_text:
//       "Use varied tones and facial expressions when speaking to your baby.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T13:05:00Z",
//   },
//   {
//     tip_id: 15,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "Boy",
//     min_age: 4,
//     max_age: 6,
//     tip_text:
//       "Engage in interactive play that includes simple words and sounds.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T13:10:00Z",
//   },
//   {
//     tip_id: 16,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "All",
//     min_age: 7,
//     max_age: 9,
//     tip_text: "Introduce new vocabulary with picture books and songs.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T13:15:00Z",
//   },
//   {
//     tip_id: 17,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "Girl",
//     min_age: 10,
//     max_age: 12,
//     tip_text:
//       "Encourage simple conversation by asking questions and waiting for responses.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T13:20:00Z",
//   },
//   {
//     tip_id: 18,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "Boy",
//     min_age: 10,
//     max_age: 12,
//     tip_text:
//       "Play interactive games like peek-a-boo to stimulate communication.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T13:25:00Z",
//   },
//   {
//     tip_id: 19,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "All",
//     min_age: 13,
//     max_age: 15,
//     tip_text:
//       "Build language skills with storytime sessions and interactive reading.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T13:30:00Z",
//   },
//   {
//     tip_id: 20,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "All",
//     min_age: 16,
//     max_age: 18,
//     tip_text:
//       "Incorporate descriptive words during daily routines to enhance vocabulary.",
//     notification_frequency: "Weekly",
//     created_at: "2025-02-15T13:35:00Z",
//   },
//   {
//     tip_id: 21,
//     category: "LANGUAGE DEVELOPMENT",
//     target_gender: "All",
//     min_age: 19,
//     max_age: 24,
//     tip_text:
//       "Encourage early word formation through fun repetition and music.",
//     notification_frequency: "Daily",
//     created_at: "2025-02-15T13:40:00Z",
//   },
// ];
