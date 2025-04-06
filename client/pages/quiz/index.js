// client/pages/[quiz]/index.js
import React, { useState } from "react";

const QuizPage = () => {
  const [category, setCategory] = useState("ALL");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // key: question_id, value: selected option
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // FETCH QUIZ QUESTIONS
  const fetchQuiz = async () => {
    setError("");
    setResult(null);
    setAnswers({});
    setSubmitted(false);

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

      const quizQuestions = data.dataQuiz || [];
      setQuestions(quizQuestions);

      // Log the correct answer + COUNT
      quizQuestions.forEach((q, index) => {
        console.log(
          `Question ${index + 1}: Correct Answer is ${q.correct_option}`,
        );
      });
    } catch (err) {
      console.error(`Error fetching quiz:`, err);
      setError("Error loading quiz. Please try again.");
    }
  };

  const handleOptionChange = (question_id, selected) => {
    setAnswers((prev) => ({ ...prev, [question_id]: selected }));
  };

  // SUBMIT QUIZ without API
  const submitQuiz = () => {
    setError("");
    let correctCount = 0;
    const wrongQuestions = [];
    questions.forEach((q) => {
      const selected = answers[q.question_id];
      if (!selected || selected !== q.correct_option) {
        wrongQuestions.push(q.question_id);
      } else {
        correctCount++;
      }
    });
    setResult({
      total: questions.length,
      correct: correctCount,
      wrong: wrongQuestions,
    });
    setSubmitted(true);
  };

  // const submitQuiz = async () => {
  //   setError("");
  //   try {
  //     // Prepare answers payload as an array
  //     const payloadAnswers = Object.keys(answers).map((qid) => ({
  //       question_id: parseInt(qid, 10),
  //       selected: answers[qid],
  //     }));

  //     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/quiz`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         // Include Authorization header if required:
  //         // Authorization: `Bearer ${localStorage.getItem('token')}`
  //       },
  //       body: JSON.stringify({
  //         category,
  //         answers: payloadAnswers,
  //       }),
  //     });

  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       throw new Error(errorData.error?.message || "Quiz submission failed");
  //     }
  //     const data = await res.json();
  //     setResult(data);
  //   } catch (err) {
  //     console.error(err);
  //     setError("Error submitting quiz.");
  //   }
  // };

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

      {/* Change button text if quiz is loaded */}
      <button className="btn btn-primary mb-3" onClick={fetchQuiz}>
        {questions.length > 0 ? "Start Another Quiz" : "Start Quiz"}{" "}
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Display quiz questions if loaded */}
      {questions.length > 0 && (
        <form>
          {questions.map((q, index) => {
            // Determine if no answer was provided for this question
            const noAnswer = submitted && !answers[q.question_id];
            return (
              <div
                key={q.question_id}
                className="mb-4"
                style={
                  noAnswer
                    ? { borderBottom: "2px solid red" } // highlight question in red if no answer
                    : {}
                }
              >
                <p>
                  <strong>
                    {index + 1}. {q.question_text}
                  </strong>
                </p>
                {/* Display options A, B, C, D */}
                {["A", "B", "C", "D"].map((opt) => {
                  let optionText = `${opt}. `;
                  optionText += q[`option_${opt.toLowerCase()}`];

                  // Determine styles based on submission and correctness
                  let optionStyle = {};
                  let extraText = "";
                  if (submitted) {
                    if (opt === q.correct_option) {
                      // Highlight correct answer in green
                      optionStyle = { backgroundColor: "#d4edda" }; // green background
                      extraText = " CORRECT"; // extra text appended
                    }
                    if (
                      answers[q.question_id] &&
                      answers[q.question_id] === opt &&
                      answers[q.question_id] !== q.correct_option
                    ) {
                      // Highlight selected wrong answer in red
                      optionStyle = { backgroundColor: "#f8d7da" }; // red background
                    }
                  }
                  return (
                    <div key={opt} className="form-check" style={optionStyle}>
                      {" "}
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`question_${q.question_id}`}
                        id={`q${q.question_id}_${opt}`}
                        value={opt}
                        checked={answers[q.question_id] === opt}
                        onChange={() => handleOptionChange(q.question_id, opt)}
                        disabled={submitted} // disable options after submission
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`q${q.question_id}_${opt}`}
                      >
                        {optionText}
                        {opt === q.correct_option &&
                          submitted && ( // append "CORRECT" for correct answer
                            <span
                              style={{ marginLeft: "10px", fontWeight: "bold" }}
                            >
                              {extraText}
                            </span>
                          )}
                      </label>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <button
            type="button"
            className="btn btn-success"
            onClick={submitQuiz}
            disabled={submitted} // disable submit button after submission
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
