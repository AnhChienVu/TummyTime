import React from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";

function BabyListModal({ show, handleClose, babies, onSelectBaby }) {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Select a baby</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          {babies.map((baby) => (
            <ListGroup.Item
              key={baby.baby_id}
              action
              onClick={() => onSelectBaby(baby)}
            >
                {baby.first_name} {baby.last_name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BabyListModal;
