import React, { useEffect, useState } from "react";
import styles from "./healthDocuments.module.css";
import BabiesModal from "@/components/BabiesModal/BabiesModal";
import DocumentsModal from "@/components/DocumentsModal/DocumentsModal";

function HealthDocuments() {
  const [documents, setDocuments] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedBabies, setSelectedBabies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedBabyDocuments, setSelectedBabyDocuments] = useState([]);
  const [selectedBabyId, setSelectedBabyId] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedBabyForSend, setSelectedBabyForSend] = useState(null);
  const [sentDocuments, setSentDocuments] = useState([]);
  const [purpose, setPurpose] = useState("");
  const [assignedBabies, setAssignedBabies] = useState([]);

  useEffect(() => {
    // Fetch documents sent from parents
    const fetchDocuments = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/doctor/${localStorage.getItem(
            "userId",
          )}/getAllFiles`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await res.json();
        if (data.status === "ok") {
          // Group documents by uploaded_by (parent)
          const groupedDocuments = data.files.reduce((acc, file) => {
            if (!acc[file.uploaded_by]) {
              acc[file.uploaded_by] = [];
            }
            acc[file.uploaded_by].push(file);
            return acc;
          }, {});

          // Fetch parent details for each parent ID
          const parentIds = Object.keys(groupedDocuments);
          const parentDetails = await Promise.all(
            parentIds.map(async (parentId) => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${parentId}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              );
              const parentData = await res.json();
              return {
                parentId,
                parentName: parentData.first_name + " " + parentData.last_name,
              };
            }),
          );

          // Attach parent names to groupedDocuments
          parentDetails.forEach(({ parentId, parentName }) => {
            if (groupedDocuments[parentId]) {
              groupedDocuments[parentId].parentName = parentName;
            }
          });

          setDocuments(groupedDocuments);
        } else {
          console.error("Error fetching documents:", data.message);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    // Fetch documents sent from doctors
    const fetchSentDocuments = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/doctor/${localStorage.getItem(
            "userId",
          )}/getSentFiles`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await res.json();
        if (data.status === "ok") {
          // Group documents by baby_id (baby)
          const groupedDocuments = data.files.reduce((acc, file) => {
            if (!acc[file.baby_id]) {
              acc[file.baby_id] = [];
            }
            acc[file.baby_id].push(file);
            return acc;
          }, {});

          setSentDocuments(groupedDocuments);
        } else {
          setSentDocuments([]);
          console.error("Error fetching documents:", data.message);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    // Fetch assigned babies
    const fetchAssignedBabies = async () => {
      try {
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/v1/medical-professional/${localStorage.getItem("userId")}/babies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const data = await res.json();
        if (data.status === "ok") {
          setAssignedBabies(data.babies);
        } else {
          setAssignedBabies([]);
          console.error("Error fetching assigned babies:", data.message);
        }
      } catch (error) {
        console.error("Error fetching assigned babies:", error);
      }
    };

    fetchDocuments();
    fetchSentDocuments();
    fetchAssignedBabies();
  }, []);

  const handleOpenModal = (parentId) => {
    setSelectedParentId(parentId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedParentId(null);
    setShowModal(false);
  };

  const getBabiesForParent = (parentId) => {
    // Filter assigned babies for the given parentId
    const babiesForParent = assignedBabies.filter(
      (baby) => baby.parent_id === parentId,
    );

    // Map each baby to include documents if available
    return babiesForParent.map((baby) => {
      const parentDocuments = documents[parentId] || []; // Get documents for the parent, or an empty array
      const babyDocuments = parentDocuments.filter(
        (doc) => doc.baby_id === baby.baby_id,
      );

      return {
        baby_id: baby.baby_id,
        parent_id: parentId,
        baby_name: baby.baby_name, // Include baby's name from assignedBabies
        documents: babyDocuments, // Attach documents if available
      };
    });
  };

  const handleOpenDocumentsModal = (babyId, parentId, openTo) => {
    if (openTo === "receive") {
      const babyDocuments = documents[parentId]?.filter(
        (doc) => doc.baby_id === babyId,
      );
      console.log("Receiving documents:", documents[parentId]);
      setSelectedBabyDocuments(babyDocuments);
      setSelectedBabyId(babyId);
      setShowDocumentsModal(true);
      setPurpose("receive");
    } else if (openTo === "send") {
      const babyDocuments = sentDocuments[babyId];
      setSelectedBabyDocuments(babyDocuments);
      console.log("Sending documents:", babyDocuments);
      setSelectedBabyId(babyId);
      setShowDocumentsModal(true);
      setPurpose("send");
    }
  };

  const handleCloseDocumentsModal = () => {
    setShowDocumentsModal(false);
    setSelectedBabyDocuments([]);
    setSelectedBabyId(null);
  };

  return (
    <div className={styles.container}>
      <h1>Health Records</h1>
      {assignedBabies.length > 0 ? (
        assignedBabies.map((baby) => (
          <div key={baby.baby_id} className={styles.parentContainer}>
            <h3>Parent: {baby.parent_name}</h3>
            <button
              className={styles.viewBabiesButton}
              onClick={() => handleOpenModal(baby.parent_id)}
            >
              View Babies
            </button>
          </div>
        ))
      ) : (
        <p>No assigned babies yet.</p>
      )}

      {/* Modal for displaying babies */}
      {selectedParentId && (
        <BabiesModal
          show={showModal}
          handleClose={handleCloseModal}
          babies={getBabiesForParent(selectedParentId)}
          onSendDocument={handleOpenDocumentsModal}
          onReceiveDocument={handleOpenDocumentsModal}
          parentId={selectedParentId}
        />
      )}

      <DocumentsModal
        show={showDocumentsModal}
        handleClose={handleCloseDocumentsModal}
        documents={selectedBabyDocuments}
        babyId={selectedBabyId}
        purpose={purpose}
        parentId={selectedParentId}
      />
    </div>
  );
}

export default HealthDocuments;
