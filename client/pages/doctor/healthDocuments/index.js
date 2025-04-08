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
          console.error("Error fetching documents:", data.message);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };
    fetchDocuments();
    fetchSentDocuments();
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
    const parentDocuments = documents[parentId];
    const uniqueBabies = {};

    parentDocuments.forEach((doc) => {
      if (!uniqueBabies[doc.baby_id]) {
        uniqueBabies[doc.baby_id] = {
          baby_id: doc.baby_id,
          parent_id: parentId,
          documents: parentDocuments.filter((d) => d.baby_id === doc.baby_id),
        };
      }
    });
    return Object.values(uniqueBabies);
  };

  const handleOpenDocumentsModal = (babyId, parentId, openTo) => {
    if (openTo === "receive") {
      console.log("Parent ID:", parentId);
      console.log("receive", documents[parentId]);
      const babyDocuments = documents[parentId]?.filter(
        (doc) => doc.baby_id === babyId,
      );
      setSelectedBabyDocuments(babyDocuments);
      setSelectedBabyId(babyId);
      setShowDocumentsModal(true);
      setPurpose("receive");
    } else if (openTo === "send") {
      const babyDocuments = sentDocuments[babyId];
      setSelectedBabyDocuments(babyDocuments);
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
      {Object.keys(documents).length > 0 ? (
        Object.keys(documents).map((parentId) => (
          <div key={parentId} className={styles.parentContainer}>
            <h3>Parent: {documents[parentId].parentName}</h3>
            <button
              className={styles.viewBabiesButton}
              onClick={() => handleOpenModal(parentId)}
            >
              View Babies
            </button>
          </div>
        ))
      ) : (
        <p>No documents found.</p>
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
      />
    </div>
  );
}

export default HealthDocuments;
