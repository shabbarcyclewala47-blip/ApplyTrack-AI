
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import "./CandidateWorkspace.css";

const PREPARATION_CHECKLIST = [
  "Research the company and understand the job description.",
  "Review the technical skills required for the role.",
  "Prepare a clear introduction about yourself.",
  "Practice explaining your projects and contributions.",
  "Prepare examples that demonstrate problem-solving.",
  "Check your internet connection and interview setup.",
];

const PRACTICE_QUESTIONS = {
  Technical: [
    {
      question: "Explain a project you built and the technical decisions you made.",
      tip: "Describe the problem, technology choices, implementation, and result.",
    },
    {
      question: "How would you design a REST API for a job application system?",
      tip: "Discuss endpoints, serializers, authentication, validation, and permissions.",
    },
    {
      question: "How do you identify and fix a difficult software bug?",
      tip: "Explain how you reproduce the issue, inspect logs, isolate the cause, and test the fix.",
    },
  ],
  HR: [
    {
      question: "Tell me about yourself.",
      tip: "Connect your education, technical skills, projects, and career goals.",
    },
    {
      question: "Why should we hire you?",
      tip: "Highlight relevant skills, project experience, willingness to learn, and practical contributions.",
    },
    {
      question: "What are your career goals?",
      tip: "Explain how you want to grow as a developer and contribute to a team.",
    },
  ],
  Behavioral: [
    {
      question: "Tell me about a challenging problem you solved.",
      tip: "Use the STAR method: Situation, Task, Action, and Result.",
    },
    {
      question: "Describe a time you had to learn something quickly.",
      tip: "Explain what you learned, how you approached it, and what you achieved.",
    },
    {
      question: "How do you handle feedback?",
      tip: "Show that you listen, clarify, make improvements, and learn from feedback.",
    },
  ],
  Situational: [
    {
      question: "What would you do if a deadline were approaching and a feature were incomplete?",
      tip: "Discuss prioritization, communication, risks, and a realistic delivery plan.",
    },
    {
      question: "How would you respond if you disagreed with a teammate's technical approach?",
      tip: "Explain how you compare options objectively and work toward a shared decision.",
    },
    {
      question: "What would you do if a production bug affected users?",
      tip: "Focus on impact, investigation, mitigation, communication, and prevention.",
    },
  ],
};

function getInterviewId(interview) {
  return interview?.id ?? interview?.pk;
}

function getInterviewTitle(interview) {
  return (
    interview?.round_name ||
    interview?.job_title ||
    "Interview"
  );
}

function getCompanyName(interview) {
  return interview?.company_name || "Company not specified";
}

function getStatus(interview) {
  return String(interview?.status || "scheduled").toLowerCase();
}

function getStatusLabel(status) {
  const labels = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || status.replaceAll("_", " ");
}

function formatDate(dateValue) {
  if (!dateValue) return "Date not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getTypeLabel(type) {
  const labels = {
    online: "Online",
    in_person: "In-person",
    phone: "Phone",
  };

  return labels[type] || "Interview";
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

export default function CandidateWorkspace() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [activeCategory, setActiveCategory] = useState("Technical");
  const [answers, setAnswers] = useState({});
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [checkedItems, setCheckedItems] = useState([]);
  const [showPreparation, setShowPreparation] = useState(true);

  async function loadInterviews(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await apiRequest("candidate/interviews/");

      const data = Array.isArray(response)
        ? response
        : response?.results || response?.interviews || [];

      setInterviews(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();

    const upcoming = interviews.filter((interview) => {
      const date = new Date(interview.scheduled_at).getTime();

      return (
        getStatus(interview) === "scheduled" &&
        Number.isFinite(date) &&
        date >= now
      );
    });

    const completed = interviews.filter(
      (interview) => getStatus(interview) === "completed"
    );

    const cancelled = interviews.filter(
      (interview) => getStatus(interview) === "cancelled"
    );

    return {
      total: interviews.length,
      upcoming: upcoming.length,
      completed: completed.length,
      cancelled: cancelled.length,
    };
  }, [interviews]);

  const nextInterview = useMemo(() => {
    const now = Date.now();

    return interviews
      .filter((interview) => {
        const date = new Date(interview.scheduled_at).getTime();

        return (
          getStatus(interview) === "scheduled" &&
          Number.isFinite(date) &&
          date >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      )[0] || null;
  }, [interviews]);

  const sortedInterviews = useMemo(() => {
    return [...interviews].sort((a, b) => {
      const aDate = new Date(a.scheduled_at).getTime();
      const bDate = new Date(b.scheduled_at).getTime();

      const aValid = Number.isFinite(aDate) ? aDate : 0;
      const bValid = Number.isFinite(bDate) ? bDate : 0;

      return bValid - aValid;
    });
  }, [interviews]);

  const questions = PRACTICE_QUESTIONS[activeCategory];
  const currentQuestion = questions[activeQuestion];

  const checklistProgress = Math.round(
    (checkedItems.length / PREPARATION_CHECKLIST.length) * 100
  );

  function toggleChecklist(index) {
    setCheckedItems((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function saveAnswer(value) {
    const key = `${activeCategory}-${activeQuestion}`;

    setAnswers((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function changeCategory(category) {
    setActiveCategory(category);
    setActiveQuestion(0);
  }

  function nextQuestion() {
    setActiveQuestion((current) =>
      current >= questions.length - 1 ? 0 : current + 1
    );
  }

  function previousQuestion() {
    setActiveQuestion((current) =>
      current <= 0 ? questions.length - 1 : current - 1
    );
  }

  function getAnswerKey() {
    return `${activeCategory}-${activeQuestion}`;
  }

  function renderInterviewCard(interview) {
    const status = getStatus(interview);
    const interviewType = interview.interview_type;
    const isUpcoming =
      status === "scheduled" &&
      new Date(interview.scheduled_at).getTime() >= Date.now();

    return (
      <article
        className="cw-interview-card"
        key={getInterviewId(interview)}
      >
        <div className="cw-interview-top">
          <div>
            <h3 className="cw-interview-title">
              {getInterviewTitle(interview)}
            </h3>

            <p className="cw-interview-company">
              {getCompanyName(interview)}
            </p>
          </div>

          <span className={`cw-status cw-status-${status}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="cw-interview-meta">
          <span>
            <span aria-hidden="true">📅</span>
            {formatDate(interview.scheduled_at)}
          </span>

          <span>
            <span aria-hidden="true">⏱</span>
            {interview.duration_minutes || 30} minutes
          </span>

          <span>
            <span aria-hidden="true">◉</span>
            {getTypeLabel(interviewType)}
          </span>

          {interview.interviewer_username && (
            <span>
              <span aria-hidden="true">👤</span>
              {interview.interviewer_username}
            </span>
          )}
        </div>

        {interview.instructions && (
          <p className="cw-section-description">
            <strong>Instructions:</strong> {interview.instructions}
          </p>
        )}

        <div className="cw-actions">
          {isUpcoming && interviewType === "online" &&
            interview.meeting_link && (
              <a
                className="cw-button cw-button-primary"
                href={interview.meeting_link}
                target="_blank"
                rel="noreferrer"
              >
                Join Interview ↗
              </a>
            )}

          {isUpcoming && (
            <button
              type="button"
              className="cw-button cw-button-secondary"
              onClick={() => {
                setShowPreparation(true);
                document
                  .getElementById("cw-preparation")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Prepare for Interview
            </button>
          )}

          {interviewType === "in_person" &&
            interview.interview_location && (
              <span className="cw-section-description">
                Location: {interview.interview_location}
              </span>
            )}
        </div>
      </article>
    );
  }

  return (
    <main className="candidate-workspace">
      <header className="cw-header">
        <div>
          <span className="cw-eyebrow">CANDIDATE PORTAL</span>
          <h1 className="cw-title">Interview Centre</h1>
          <p className="cw-subtitle">
            Manage your interviews, prepare with confidence, and track
            your progress throughout your hiring journey.
          </p>
        </div>

        <button
          type="button"
          className="cw-button cw-button-secondary"
          onClick={() => loadInterviews(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      <section className="cw-hero">
        <div className="cw-hero-content">
          <span className="cw-eyebrow" style={{ color: "#f3e8ff" }}>
            YOUR NEXT OPPORTUNITY
          </span>

          <h2>
            Prepare today.
            <br />
            Perform with confidence.
          </h2>

          <p>
            Your interview journey starts with preparation. Review your
            upcoming sessions, practice common questions, and build
            confidence one step at a time.
          </p>

          {nextInterview && (
            <div style={{ marginTop: 20 }}>
              <span
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  color: "#f3e8ff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                YOUR NEXT INTERVIEW
              </span>

              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {getInterviewTitle(nextInterview)}
              </div>

              <div
                style={{
                  marginTop: 5,
                  color: "#eee5ff",
                  fontSize: 12,
                }}
              >
                {formatDate(nextInterview.scheduled_at)}
              </div>
            </div>
          )}
        </div>

        <div className="cw-hero-badge" aria-hidden="true">
          ✦
        </div>
      </section>

      {error && (
        <div className="cw-alert" role="alert">
          <strong>Unable to load interviews.</strong> {error}

          <button
            type="button"
            className="cw-button cw-button-secondary"
            style={{ marginLeft: 10 }}
            onClick={() => loadInterviews(true)}
          >
            Try again
          </button>
        </div>
      )}

      <section className="cw-stats" aria-label="Interview statistics">
        <article className="cw-stat">
          <div className="cw-stat-icon" aria-hidden="true">
            ▣
          </div>
          <span className="cw-stat-label">Total Interviews</span>
          <strong className="cw-stat-value">
            {loading ? "—" : stats.total}
          </strong>
          <span className="cw-stat-note">
            All your scheduled interview records
          </span>
        </article>

        <article className="cw-stat">
          <div className="cw-stat-icon" aria-hidden="true">
            ◷
          </div>
          <span className="cw-stat-label">Upcoming Interviews</span>
          <strong className="cw-stat-value">
            {loading ? "—" : stats.upcoming}
          </strong>
          <span className="cw-stat-note">
            Sessions still to attend
          </span>
        </article>

        <article className="cw-stat">
          <div className="cw-stat-icon" aria-hidden="true">
            ✓
          </div>
          <span className="cw-stat-label">Completed Interviews</span>
          <strong className="cw-stat-value">
            {loading ? "—" : stats.completed}
          </strong>
          <span className="cw-stat-note">
            Interviews marked as completed
          </span>
        </article>
      </section>

      <section className="cw-section">
        <div className="cw-section-header">
          <div>
            <h2 className="cw-section-title">My Interviews</h2>
            <p className="cw-section-description">
              View the details and joining information for your interviews.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="cw-empty">
            <span className="cw-spinner" />
            <p>Loading your interviews...</p>
          </div>
        ) : sortedInterviews.length > 0 ? (
          <div className="cw-interview-list">
            {sortedInterviews.map(renderInterviewCard)}
          </div>
        ) : (
          <div className="cw-empty">
            <div className="cw-empty-icon" aria-hidden="true">
              ◷
            </div>

            <h3>No interviews scheduled yet</h3>

            <p>
              When a recruiter schedules an interview for one of your
              applications, its date, time, and details will appear here.
            </p>
          </div>
        )}
      </section>

      <section
        className="cw-section"
        id="cw-preparation"
        style={{ scrollMarginTop: 25 }}
      >
        <div className="cw-section-header">
          <div>
            <h2 className="cw-section-title">
              Interview Preparation Studio
            </h2>
            <p className="cw-section-description">
              Practice common interview questions and work through your
              preparation checklist.
            </p>
          </div>

          <button
            type="button"
            className="cw-button cw-button-secondary"
            onClick={() => setShowPreparation((current) => !current)}
          >
            {showPreparation ? "Hide Preparation" : "Show Preparation"}
          </button>
        </div>

        {showPreparation && (
          <>
            <div className="cw-prep-grid">
              <article className="cw-prep-card">
                <div className="cw-prep-icon" aria-hidden="true">
                  ✓
                </div>

                <h3>Preparation Checklist</h3>

                <p>
                  Complete the essential tasks before your next interview.
                </p>

                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 9,
                      color: "#6d607d",
                      fontSize: 11,
                      fontWeight: 750,
                    }}
                  >
                    <span>Your progress</span>
                    <span>{checklistProgress}%</span>
                  </div>

                  <div
                    className="cw-progress"
                    role="progressbar"
                    aria-valuenow={checklistProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Preparation checklist progress"
                  >
                    <div
                      className="cw-progress-bar"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                </div>

                <div className="cw-checklist">
                  {PREPARATION_CHECKLIST.map((item, index) => (
                    <label className="cw-checklist-item" key={item}>
                      <input
                        type="checkbox"
                        checked={checkedItems.includes(index)}
                        onChange={() => toggleChecklist(index)}
                      />

                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </article>

              <article className="cw-prep-card">
                <div className="cw-prep-icon" aria-hidden="true">
                  ✦
                </div>

                <h3>Interview Success Tips</h3>

                <p>
                  Simple habits that help you communicate your skills
                  clearly and professionally.
                </p>

                <div className="cw-checklist">
                  {[
                    {
                      title: "Use real examples",
                      description:
                        "Explain how you solved a problem in a project.",
                    },
                    {
                      title: "Keep answers structured",
                      description:
                        "Use Situation, Task, Action, and Result for behavioral questions.",
                    },
                    {
                      title: "Think aloud",
                      description:
                        "Explain your reasoning when solving technical problems.",
                    },
                    {
                      title: "Ask thoughtful questions",
                      description:
                        "Learn about the role, team, and expectations.",
                    },
                    {
                      title: "Be honest",
                      description:
                        "If you do not know an answer, explain how you would learn it.",
                    },
                  ].map((tip) => (
                    <div className="cw-checklist-item" key={tip.title}>
                      <span
                        style={{
                          color: "#7c3aed",
                          fontWeight: 850,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>

                      <span>
                        <strong>{tip.title}.</strong> {tip.description}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <section className="cw-section">
              <div className="cw-section-header">
                <div>
                  <h2 className="cw-section-title">
                    Practice Interview Questions
                  </h2>

                  <p className="cw-section-description">
                    Select a category, write your answer, and practice
                    explaining your thinking.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                  marginBottom: 18,
                }}
              >
                {Object.keys(PRACTICE_QUESTIONS).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`cw-button ${
                      activeCategory === category
                        ? "cw-button-primary"
                        : "cw-button-secondary"
                    }`}
                    onClick={() => changeCategory(category)}
                    aria-pressed={activeCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <article className="cw-question-card">
                <span className="cw-question-label">
                  {activeCategory.toUpperCase()} · QUESTION{" "}
                  {activeQuestion + 1} OF {questions.length}
                </span>

                <h3>{currentQuestion.question}</h3>

                <p className="cw-section-description">
                  <strong>Tip:</strong> {currentQuestion.tip}
                </p>

                <label
                  htmlFor="cw-practice-answer"
                  className="cw-section-description"
                  style={{
                    display: "block",
                    marginTop: 19,
                    fontWeight: 750,
                  }}
                >
                  Your practice answer
                </label>

                <textarea
                  id="cw-practice-answer"
                  className="cw-answer"
                  value={answers[getAnswerKey()] || ""}
                  onChange={(event) => saveAnswer(event.target.value)}
                  placeholder="Write your answer here. Explain your thinking clearly and use examples where possible..."
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: 14,
                  }}
                >
                  <span className="cw-section-description">
                    Your answers remain in this page's current session.
                  </span>

                  <div className="cw-actions" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="cw-button cw-button-secondary"
                      onClick={previousQuestion}
                    >
                      ← Previous
                    </button>

                    <button
                      type="button"
                      className="cw-button cw-button-primary"
                      onClick={nextQuestion}
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
