// client/pages/[aboutUs]/index.js
import React from "react";
import { Container, Row, Col, Image, Button } from "react-bootstrap";

const AboutUs = () => {
  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">About Tummy Time</h1>

      {/* Company History & Mission Section */}
      <Row className="mb-5">
        <Col md={12}>
          <h2 className="text-center mb-3">Our History</h2>
          <p className="text-center">
            Tummy Time was created as a project by a group of passionate
            students at Seneca Polytechnic. Our journey began in the classrooms
            and labs, where we aimed to make a difference in the way parents
            monitor and support their baby’s development.
          </p>
        </Col>

        {/* Image Section */}
        {/* <Col md={6}>
          <Image
            src="/images/about-history.jpg" // Replace with actual image path
            alt="Team working on Tummy Time project"
            fluid
            rounded
          />
        </Col> */}
      </Row>

      <Row className="mb-5">
        <Col md={12} className="order-md-2">
          <h2 className="text-center mb-3">Our Mission</h2>
          <p className="text-center">
            Our mission is to empower parents with innovative tools and reliable
            insights to help monitor their baby&#39;s health and development. We
            strive to build an engaging and supportive platform that combines
            cutting-edge technology with compassionate care.
          </p>
        </Col>

        {/* Image Section */}
        {/* <Col md={6} className="order-md-1">
          <Image
            src="/images/mission.jpg" // Replace with actual image path
            alt="Illustration of our mission"
            fluid
            rounded
          />
        </Col> */}
      </Row>

      {/* Team Members Section */}
      {/* <Row className="mb-5">
        <Col>
          <h2 className="text-center mb-4">Meet Our Team</h2>
          <Row> 
            <Col xs={12} sm={6} md={4} className="mb-4">
              <div className="text-center">
                <Image
                  src="/images/team/member1.jpg" // Replace with actual image path
                  alt="Team Member 1"
                  roundedCircle
                  fluid
                />
                <h5 className="mt-2">Alice Johnson</h5>
                <p>Frontend Developer</p>
                <Button
                  variant="outline-primary"
                  href="https://linkedin.com/in/alicejohnson"
                  target="_blank"
                >
                  LinkedIn
                </Button>
              </div>
            </Col>
            


            <Col xs={12} sm={6} md={4} className="mb-4">
              <div className="text-center">
                <Image
                  src="/images/team/member2.jpg" // Replace with actual image path
                  alt="Team Member 2"
                  roundedCircle
                  fluid
                />
                <h5 className="mt-2">Michael Lee</h5>
                <p>Backend Developer</p>
                <Button
                  variant="outline-primary"
                  href="https://linkedin.com/in/michaellee"
                  target="_blank"
                >
                  LinkedIn
                </Button>
              </div>
            </Col>
            


            <Col xs={12} sm={6} md={4} className="mb-4">
              <div className="text-center">
                <Image
                  src="/images/team/member3.jpg" // Replace with actual image path
                  alt="Team Member 3"
                  roundedCircle
                  fluid
                />
                <h5 className="mt-2">Sara Patel</h5>
                <p>UI/UX Designer</p>
                <Button
                  variant="outline-primary"
                  href="https://linkedin.com/in/sarapatel"
                  target="_blank"
                >
                  LinkedIn
                </Button>
              </div>
            </Col>
          </Row>
        </Col>
      </Row> */}

      {/* Additional Information */}
      <Row>
        <Col>
          <h2 className="text-center mb-3">Our Core Values</h2>
          <ul className="list-unstyled text-center">
            <li>
              <strong>Innovation:</strong> We embrace creative solutions.
            </li>
            <li>
              <strong>Collaboration:</strong> We believe in teamwork.
            </li>
            <li>
              <strong>Integrity:</strong> We operate with honesty and
              transparency.
            </li>
            <li>
              <strong>Empathy:</strong> We put people first.
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutUs;
