// client/pages/[quiz]/index.js
import React, { useState } from "react";

const QuizPage = () => {
  const [category, setCategory] = useState("ALL");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // key: question_id, value: selected option
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchQuiz = async () => {
    setError("");
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/v1/quiz?category=${encodeURIComponent(category)}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load quiz questions");
      }
      const data = await res.json();
      console.log(data);

      setQuestions(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Error loading quiz.");
    }
  };

  const handleOptionChange = (question_id, selected) => {
    setAnswers((prev) => ({ ...prev, [question_id]: selected }));
  };

  const submitQuiz = async () => {
    setError("");
    try {
      // Prepare answers payload as an array
      const payloadAnswers = Object.keys(answers).map((qid) => ({
        question_id: parseInt(qid, 10),
        selected: answers[qid],
      }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header if required:
          // Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          category,
          answers: payloadAnswers,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Quiz submission failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Error submitting quiz.");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Interactive Quiz</h2>

      {/* Select Category */}
      <div className="mb-3">
        <label htmlFor="categorySelect">Quiz Category:</label>
        <select
          id="categorySelect"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-control"
        >
          <option value="ALL">ALL</option>
          <option value="SLEEP">SLEEP</option>
          <option value="HYGIENE">HYGIENE</option>
          <option value="PHYSICAL ACTIVITIES">PHYSICAL ACTIVITIES</option>
          <option value="LANGUAGE DEVELOPMENT">LANGUAGE DEVELOPMENT</option>
        </select>
      </div>

      <button className="btn btn-primary mb-3" onClick={fetchQuiz}>
        Start Quiz
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Display quiz questions if loaded */}
      {questions.length > 0 && (
        <form>
          {questions.map((q) => (
            <div key={q.question_id} className="mb-4">
              <p>
                <strong>{q.question_text}</strong>
              </p>
              {["A", "B", "C", "D"].map((opt) => {
                const optionText = q[`option_${opt.toLowerCase()}`];
                return (
                  <div key={opt} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`question_${q.question_id}`}
                      id={`q${q.question_id}_${opt}`}
                      value={opt}
                      checked={answers[q.question_id] === opt}
                      onChange={() => handleOptionChange(q.question_id, opt)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`q${q.question_id}_${opt}`}
                    >
                      {optionText}
                    </label>
                  </div>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-success"
            onClick={submitQuiz}
          >
            Submit Quiz
          </button>
        </form>
      )}

      {/* Show results */}
      {result && (
        <div className="mt-4">
          <h4>Quiz Results</h4>
          <p>
            You answered {result.correct} out of {result.total} correctly.
          </p>
          {result.wrong.length > 0 && (
            <p>Review the questions you missed: {result.wrong.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
