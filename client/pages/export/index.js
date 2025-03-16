// client/pages/[export]/index.js
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA WITHIN DATE RANGE [START DATE, END DATE]: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE
// Step3: EXPORT THE DATA AS CSV

const ExportDataPage = () => {
  const [selectedOptions, setSelectedOptions] = useState({
    babyInfo: true,
    growthRecords: true,
    milestones: true,
    feedingSchedule: true,
    stoolRecords: true,
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [exportLink, setExportLink] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Simulate fetching the earliest baby profile creation date from the server.
  useEffect(() => {
    // Replace this with an API call if needed.
    const earliestDate = new Date("2020-01-01");
    setStartDate(earliestDate);
  }, []);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedOptions((prev) => ({ ...prev, [name]: checked }));
  };

  // Dummy function to simulate storing export record in the "exporteddocument" table.
  const storeExportRecord = async (fileName, fileFormat, date) => {
    // In a real application, you would call your backend API here.
    // For simulation, we return a promise that resolves with a generated document id.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ document_id: Math.floor(Math.random() * 1000) });
      }, 500);
    });
  };

  const validateData = () => {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return false;
    }
    // Additional data validation logic can be added here.
    return true;
  };

  const handleExport = async () => {
    setError("");
    setSuccessMessage("");

    if (!validateData()) return;

    // Simulate CSV export logic.
    // In a real application, you would generate a CSV with separate Excel tabs for each baby.
    const fileName = `BabyData_Export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    const fileFormat = "CSV";

    try {
      // Simulate storing the export record in the "exporteddocument" table.
      const result = await storeExportRecord(
        fileName,
        fileFormat,
        new Date().toISOString().split("T")[0],
      );
      // Simulate a download link for the generated CSV.
      const simulatedDownloadLink = `http://example.com/download/${fileName}`;
      setExportLink(simulatedDownloadLink);
      setSuccessMessage(
        `Export successful! Document ID: ${result.document_id}. Click the link below to download your CSV file.`,
      );
    } catch (error) {
      setError("There was an error saving the export record.");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Export Baby Health Data</h2>
      <div className="card p-4 mt-4">
        <h4>Select Data to Export</h4>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="babyInfo"
            name="babyInfo"
            checked={selectedOptions.babyInfo}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="babyInfo">
            Baby Information
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="growthRecords"
            name="growthRecords"
            checked={selectedOptions.growthRecords}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="growthRecords">
            Growth Records
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="milestones"
            name="milestones"
            checked={selectedOptions.milestones}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="milestones">
            Milestones Information
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="feedingSchedule"
            name="feedingSchedule"
            checked={selectedOptions.feedingSchedule}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="feedingSchedule">
            Feeding Schedule
          </label>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="stoolRecords"
            name="stoolRecords"
            checked={selectedOptions.stoolRecords}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="stoolRecords">
            Stool Records
          </label>
        </div>
        <hr />
        <h4>Enter Dates</h4>
        <div className="row">
          <div className="col-md-6">
            <label>Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="form-control"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div className="col-md-6">
            <label>End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="form-control"
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
            />
          </div>
        </div>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        {successMessage && (
          <div className="alert alert-success mt-3">
            {successMessage}{" "}
            <a href={exportLink} target="_blank" rel="noopener noreferrer">
              Download CSV
            </a>
          </div>
        )}
        <button className="btn btn-primary mt-3" onClick={handleExport}>
          Export Data
        </button>
      </div>
    </div>
  );
};

export default ExportDataPage;
