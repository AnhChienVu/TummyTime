import React, { useState } from "react";
import { FaUserMd, FaSearch } from "react-icons/fa";
import { Line, Pie } from "react-chartjs-2";
import styles from "./doctor.module.css";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState("vitals");

  const dummyPatients = [
    {
      id: 1,
      name: "John Doe",
      age: 45,
      lastConsult: "2024-01-15",
      status: "Stable",
    },
    {
      id: 2,
      name: "Jane Smith",
      age: 32,
      lastConsult: "2024-01-14",
      status: "Critical",
    },
    {
      id: 3,
      name: "Robert Brown",
      age: 58,
      lastConsult: "2024-01-13",
      status: "Review",
    },
  ];

  const vitalData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Blood Pressure",
        data: [120, 125, 118, 122, 119],
        borderColor: "#3B82F6",
        tension: 0.4,
      },
    ],
  };

  const medicalHistoryData = {
    labels: ["Cardiovascular", "Respiratory", "Neurological"],
    datasets: [
      {
        data: [30, 40, 30],
        backgroundColor: ["#3B82F6", "#34D399", "#F87171"],
      },
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaUserMd className={styles.icon} />
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        </div>
      </div>

      <div className={styles.content}>
        {/* Overview Cards */}
        <div className={styles.overviewCard}>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">Recent Patients</h3>
            <p className={`${styles.value} ${styles.value1}`}>24</p>
          </div>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">
              Upcoming Appointments
            </h3>
            <p className={`${styles.value} ${styles.value2}`}>8</p>
          </div>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">Critical Alerts</h3>
            <p className={`${styles.value} ${styles.value3}`}>3</p>
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* Patient List */}
          <div className={styles.patientList}>
            <div className={styles.patientListHeader}>
              <h2 className="text-lg font-bold">Patient Directory</h2>
              <div className={styles.searchBar}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Last Consultation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyPatients.map((patient) => (
                    <tr key={patient.id} className={styles.tableRow}>
                      <td>{patient.name}</td>
                      <td>{patient.age}</td>
                      <td>{patient.lastConsult}</td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            patient.status === "Critical"
                              ? styles.statusCritical
                              : patient.status === "Stable"
                              ? styles.statusStable
                              : styles.statusReview
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Data Panel */}
          <div className={styles.medicalHistoryData}>
            <div>
              <button
                onClick={() => setActiveTab("vitals")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "vitals"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Vitals
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "history"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                History
              </button>
            </div>

            {activeTab === "vitals" ? (
              <div className="h-64">
                <Line
                  data={vitalData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <div className="h-64">
                <Pie
                  data={medicalHistoryData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
