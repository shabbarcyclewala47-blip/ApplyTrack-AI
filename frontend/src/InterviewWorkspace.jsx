import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";

/* =========================================================
   APPLYTRACK AI — INTERVIEW WORKSPACE
   Supports: Candidate and Interviewer
   ========================================================= */

/* -------------------- Preparation Content -------------------- */

const preparationContent = {
  candidate: {
    title: "Interview Preparation Studio",
    subtitle:
      "Build confidence, practise common questions, and prepare for your next career opportunity.",
    checklistTitle: "Your Preparation Checklist",
    checklistDescription:
      "Complete these steps before attending your interview.",
    checklist: [
      "Research the company and its products.",
      "Review the job description and required skills.",
      "Practise introducing yourself.",
      "Prepare examples of your projects and achievements.",
      "Test your internet connection and microphone.",
      "Keep your resume and necessary documents ready.",
    ],
    tips: [
      {
        title: "Understand the role",
        description:
          "Review the job description and identify the skills the employer values most.",
      },
      {
        title: "Practise your introduction",
        description:
          "Prepare a concise introduction covering your education, skills, projects, and goals.",
      },
      {
        title: "Explain your projects",
        description:
          "Describe the problem, your approach, the technologies used, and the final result.",
      },
      {
        title: "Ask thoughtful questions",
        description:
          "Prepare a few questions about the team, responsibilities, and expectations.",
      },
    ],
  },

  interviewer: {
    title: "Interview Preparation & Evaluation",
    subtitle:
      "Plan structured interviews, assess candidate skills fairly, and make evidence-based evaluations.",
    checklistTitle: "Interviewer's Checklist",
    checklistDescription:
      "Use this checklist to conduct a consistent and professional interview.",
    checklist: [
      "Review the candidate's resume and application.",
      "Understand the job requirements and expected skills.",
      "Prepare role-relevant questions before the interview.",
      "Test your microphone, camera, and meeting link.",
      "Explain the interview structure to the candidate.",
      "Record evidence-based feedback after the interview.",
    ],
    tips: [
      {
        title: "Review the candidate's background",
        description:
          "Read the candidate's resume, projects, experience, and application before the meeting.",
      },
      {
        title: "Ask consistent questions",
        description:
          "Use job-related questions and comparable evaluation criteria for candidates applying to the same role.",
      },
      {
        title: "Evaluate reasoning",
        description:
          "Ask candidates to explain their approach, assumptions, trade-offs, and problem-solving process.",
      },
      {
        title: "Give fair consideration",
        description:
          "Evaluate job-related evidence rather than personal assumptions or irrelevant characteristics.",
      },
    ],
  },
};

/* -------------------- Practice Questions -------------------- */

const practiceQuestions = {
  Technical: [
    {
      question: "Tell me about a technical project you have developed.",
      guidance:
        "Explain the problem, architecture, technologies, your contribution, and the result.",
    },
    {
      question: "How do you troubleshoot a bug in an application?",
      guidance:
        "Describe how you reproduce the issue, inspect logs, isolate the cause, and verify the fix.",
    },
    {
      question: "What is the difference between frontend and backend development?",
      guidance:
        "Explain the user interface, server-side logic, APIs, and how they communicate.",
    },
    {
      question: "How would you design a REST API for a job application system?",
      guidance:
        "Discuss endpoints, HTTP methods, authentication, validation, permissions, and error handling.",
    },
    {
      question: "How do you protect sensitive information in a web application?",
      guidance:
        "Discuss authentication, authorization, secure password handling, input validation, and HTTPS.",
    },
  ],

  HR: [
    {
      question: "Tell me about yourself.",
      guidance:
        "Introduce your background, relevant skills, projects, and professional goals.",
    },
    {
      question: "Why should we hire you?",
      guidance:
        "Connect your skills, learning ability, projects, and strengths to the role.",
    },
    {
      question: "What are your strengths?",
      guidance:
        "Choose relevant strengths and support them with a real example.",
    },
    {
      question: "How do you handle feedback?",
      guidance:
        "Explain how you listen, clarify expectations, make improvements, and learn.",
    },
    {
      question: "Where do you see yourself in the next few years?",
      guidance:
        "Describe realistic professional goals and how you intend to develop your skills.",
    },
  ],

  Behavioral: [
    {
      question: "Describe a difficult problem you solved.",
      guidance:
        "Use the STAR method: Situation, Task, Action, and Result.",
    },
    {
      question: "Tell me about a time you worked in a team.",
      guidance:
        "Explain your responsibilities, collaboration, communication, and contribution.",
    },
    {
      question: "How do you manage multiple deadlines?",
      guidance:
        "Describe how you prioritize tasks, break down work, and track progress.",
    },
    {
      question: "Tell me about a mistake you made and what you learned.",
      guidance:
        "Focus on accountability, corrective action, and the lesson you applied.",
    },
    {
      question: "How do you learn a new technology?",
      guidance:
        "Explain your learning process, documentation research, practical exercises, and project work.",
    },
  ],

  Situational: [
    {
      question: "What would you do if you could not solve a technical issue?",
      guidance:
        "Explain how you investigate, document findings, research solutions, and ask for help when needed.",
    },
    {
      question: "How would you handle a disagreement with a teammate?",
      guidance:
        "Focus on respectful communication, evidence, shared goals, and a practical resolution.",
    },
    {
      question: "What would you do if requirements changed near a deadline?",
      guidance:
        "Discuss impact assessment, communication, prioritization, and agreement on scope.",
    },
    {
      question: "How would you respond to an unhappy stakeholder?",
      guidance:
        "Explain how you listen, clarify the issue, communicate options, and follow through.",
    },
    {
      question: "What would you do if you noticed a security vulnerability?",
      guidance:
        "Explain responsible reporting, risk assessment, and following the organization's security process.",
    },
  ],
};

/* -------------------- Helper Functions -------------------- */

function formatDate(dateValue) {
  if (!dateValue) return "Date not specified";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");

  if (["scheduled", "upcoming"].includes(normalizedStatus)) {
    return "iw-status iw-status-scheduled";
  }

  if (["completed"].includes(normalizedStatus)) {
    return "iw-status iw-status-completed";
  }

  if (["cancelled", "canceled"].includes(normalizedStatus)) {
    return "iw-status iw-status-cancelled";
  }

  return "iw-status iw-status-default";
}

function getInterviewTitle(interview) {
  const application = interview?.application;

  const job =
    application?.job_title ||
    application?.job?.title ||
    application?.job?.job_title;

  return job || interview?.round_name || "Interview";
}

function getCandidateName(interview) {
  const application = interview?.application;

  return (
    application?.full_name ||
    application?.user?.full_name ||
    application?.user?.username ||
    application?.user?.email ||
    "Candidate"
  );
}

function getCompanyName(interview) {
  const application = interview?.application;

  return (
    application?.company_name ||
    application?.job?.company_name ||
    application?.job?.company ||
    "Company"
  );
}

function getInterviewStatus(interview) {
  return String(interview?.status || "scheduled").toLowerCase();
}

function isUpcoming(interview) {
  const status = getInterviewStatus(interview);
  const scheduledDate = new Date(interview?.scheduled_at);

  return (
    status === "scheduled" &&
    !Number.isNaN(scheduledDate.getTime()) &&
    scheduledDate >= new Date()
  );
}

function isCompleted(interview) {
  return getInterviewStatus(interview) === "completed";
}

function getInterviewId(interview) {
  return interview?.id ?? interview?.pk;
}

/* -------------------- Main Component -------------------- */

export default function InterviewWorkspace({ role = "candidate" }) {
  const normalizedRole = String(role).toLowerCase();

  const isInterviewer = normalizedRole === "interviewer";
  const isCandidate = !isInterviewer;

  const roleKey = isInterviewer ? "interviewer" : "candidate";
  const content = preparationContent[roleKey];

  /* Interview data */
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  /* Preparation Studio */
  const [category, setCategory] = useState("Technical");
  const [selectedInterviewId, setSelectedInterviewId] = useState("");
  const [answers, setAnswers] = useState({});
  const [completedChecklist, setCompletedChecklist] = useState([]);

  const [notice, setNotice] = useState("");

  /* -------------------- Load Interviews -------------------- */

  async function loadInterviews() {
    setLoading(true);
    setError("");

    try {
      const endpoint = isInterviewer
        ? "interviewer/interviews/"
        : "candidate/interviews/";

      const response = await apiRequest(endpoint);

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
          ? response.results
          : Array.isArray(response?.interviews)
            ? response.interviews
            : [];

      setInterviews(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load interviews. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
    // Role changes require loading the corresponding role's interview list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleKey]);

  /* -------------------- Dashboard Statistics -------------------- */

  const stats = useMemo(() => {
    return {
      total: interviews.length,
      upcoming: interviews.filter(isUpcoming).length,
      completed: interviews.filter(isCompleted).length,
    };
  }, [interviews]);

  /* -------------------- Selected Interview -------------------- */

  const selectedInterview = useMemo(() => {
    if (!selectedInterviewId) return null;

    return (
      interviews.find(
        (interview) =>
          String(getInterviewId(interview)) === String(selectedInterviewId)
      ) || null
    );
  }, [interviews, selectedInterviewId]);

  /* -------------------- Update Interview Status -------------------- */

  async function updateInterview(interview, newStatus) {
    const interviewId = getInterviewId(interview);

    if (!interviewId) {
      setNotice("This interview does not have a valid ID.");
      return;
    }

    if (!["completed", "cancelled"].includes(newStatus)) {
      setNotice("This interview status is not supported.");
      return;
    }

    

    setActionLoading(interviewId);
    setNotice("");

    try {
      await apiRequest(
        `interviewer/interviews/${interviewId}/status/`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      setInterviews((previous) =>
        previous.map((item) =>
          String(getInterviewId(item)) === String(interviewId)
            ? { ...item, status: newStatus }
            : item
        )
      );

      setNotice(
        newStatus === "completed"
          ? "Interview marked as completed."
          : "Interview cancelled."
      );
    } catch (err) {
      setNotice(
        err?.message ||
          "Unable to update the interview. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* -------------------- Preparation Helpers -------------------- */

  function updateAnswer(question, value) {
    setAnswers((previous) => ({
      ...previous,
      [question]: value,
    }));
  }

  function toggleChecklist(index) {
    setCompletedChecklist((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  }

  function scrollToPreparation() {
    document
      .getElementById("iw-preparation")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getMeetingLink(interview) {
    return interview?.meeting_link || "";
  }

  /* -------------------- Render -------------------- */

  return (
    <div className="iw-root">
      <style>{`
        .iw-root {
          --iw-text: #24213b;
          --iw-muted: #77758c;
          --iw-border: #e9e7f2;
          --iw-primary: #7654e8;
          --iw-primary-dark: #5f3fd0;
          --iw-surface: #ffffff;
          --iw-background: #f7f6fc;
          color: var(--iw-text);
          background: var(--iw-background);
          min-height: 100vh;
          padding: 28px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .iw-root * {
          box-sizing: border-box;
        }

        .iw-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        .iw-hero {
          position: relative;
          overflow: hidden;
          padding: 34px;
          border-radius: 25px;
          background: linear-gradient(120deg, #30235e, #6948c8 55%, #a05de2);
          color: #fff;
          margin-bottom: 24px;
          box-shadow: 0 15px 40px rgba(89, 59, 164, 0.16);
        }

        .iw-hero::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,0.09);
          right: -70px;
          top: -120px;
          pointer-events: none;
        }

        .iw-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #e5dbff;
          margin-bottom: 12px;
        }

        .iw-hero h1 {
          position: relative;
          z-index: 1;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.2;
          letter-spacing: -1px;
          margin: 0 0 12px;
          font-weight: 800;
        }

        .iw-hero p {
          position: relative;
          z-index: 1;
          max-width: 720px;
          color: #eee9ff;
          font-size: 15px;
          line-height: 1.75;
          margin: 0;
        }

        .iw-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 26px;
        }

        .iw-stat {
          padding: 22px;
          border: 1px solid var(--iw-border);
          background: var(--iw-surface);
          border-radius: 19px;
          box-shadow: 0 5px 18px rgba(38, 27, 82, 0.035);
        }

        .iw-stat-label {
          color: var(--iw-muted);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .iw-stat-value {
          font-size: 30px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -1px;
        }

        .iw-stat-note {
          margin-top: 9px;
          font-size: 12px;
          color: var(--iw-muted);
        }

        .iw-section {
          margin-bottom: 28px;
        }

        .iw-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .iw-section-heading h2 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 6px;
        }

        .iw-section-heading p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--iw-muted);
          margin: 0;
        }

        .iw-count {
          border-radius: 999px;
          background: #eee9ff;
          color: #6443ca;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .iw-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .iw-card {
          background: var(--iw-surface);
          border: 1px solid var(--iw-border);
          border-radius: 20px;
          padding: 23px;
          min-width: 0;
          box-shadow: 0 5px 18px rgba(38, 27, 82, 0.035);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .iw-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(38, 27, 82, 0.07);
        }

        .iw-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .iw-card-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eee8ff, #f7eaff);
          color: #6744d4;
          font-size: 21px;
          flex-shrink: 0;
        }

        .iw-card h3 {
          font-size: 17px;
          font-weight: 800;
          line-height: 1.4;
          margin: 0 0 5px;
          overflow-wrap: anywhere;
        }

        .iw-company {
          color: var(--iw-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .iw-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 800;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .iw-status-scheduled {
          color: #7250d8;
          background: #f0eaff;
        }

        .iw-status-completed {
          color: #16845b;
          background: #e3f8ed;
        }

        .iw-status-cancelled {
          color: #c14454;
          background: #ffeaed;
        }

        .iw-status-default {
          color: #6b687c;
          background: #f0eff5;
        }

        .iw-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 16px 0;
          border-top: 1px solid #f0eef6;
          border-bottom: 1px solid #f0eef6;
        }

        .iw-detail-label {
          color: var(--iw-muted);
          font-size: 11px;
          margin-bottom: 5px;
        }

        .iw-detail-value {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .iw-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 17px;
        }

        .iw-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid transparent;
          border-radius: 11px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          text-decoration: none;
          transition: 0.2s ease;
          font-family: inherit;
        }

        .iw-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .iw-btn-primary {
          background: var(--iw-primary);
          color: #fff;
        }

        .iw-btn-primary:hover {
          background: var(--iw-primary-dark);
          color: #fff;
        }

        .iw-btn-secondary {
          color: #5f4a9d;
          background: #f2eeff;
          border-color: #e7e0ff;
        }

        .iw-btn-secondary:hover {
          background: #e9e2ff;
        }

        .iw-btn-success {
          color: #16754f;
          background: #e5f8ed;
          border-color: #c9efda;
        }

        .iw-btn-danger {
          color: #b83d4c;
          background: #fff0f1;
          border-color: #ffd9de;
        }

        .iw-panel {
          background: var(--iw-surface);
          border: 1px solid var(--iw-border);
          border-radius: 22px;
          padding: 25px;
          box-shadow: 0 5px 18px rgba(38, 27, 82, 0.035);
        }

        .iw-prep-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .iw-prep-top h2 {
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0 0 8px;
        }

        .iw-prep-top p {
          color: var(--iw-muted);
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
          max-width: 680px;
        }

        .iw-role-label {
          flex-shrink: 0;
          padding: 9px 13px;
          background: #f0ebff;
          color: #6746cb;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .iw-prep-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
          gap: 22px;
        }

        .iw-subpanel {
          border: 1px solid #eeebf6;
          background: #fdfcff;
          border-radius: 17px;
          padding: 20px;
          min-width: 0;
        }

        .iw-subpanel h3 {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 7px;
        }

        .iw-subtitle {
          color: var(--iw-muted);
          font-size: 12px;
          line-height: 1.6;
          margin: 0 0 17px;
        }

        .iw-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }

        .iw-field label {
          font-size: 12px;
          font-weight: 800;
        }

        .iw-input,
        .iw-select,
        .iw-textarea {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          color: var(--iw-text);
          background: #fff;
          border: 1px solid #e4e0f0;
          border-radius: 11px;
          font: inherit;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .iw-input:focus,
        .iw-select:focus,
        .iw-textarea:focus {
          border-color: #967ce9;
          box-shadow: 0 0 0 3px rgba(118, 84, 232, 0.1);
        }

        .iw-textarea {
          resize: vertical;
          min-height: 105px;
          line-height: 1.65;
        }

        .iw-question {
          border: 1px solid #eae6f5;
          background: #fff;
          border-radius: 14px;
          padding: 16px;
          margin-top: 12px;
        }

        .iw-question-number {
          color: #7654e8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 8px;
        }

        .iw-question h4 {
          font-size: 14px;
          line-height: 1.55;
          margin: 0 0 10px;
          font-weight: 800;
        }

        .iw-guidance {
          background: #f7f4ff;
          border-radius: 10px;
          padding: 11px;
          color: #625a7e;
          font-size: 12px;
          line-height: 1.65;
          margin-bottom: 12px;
        }

        .iw-guidance strong {
          color: #6246bd;
        }

        .iw-checklist {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .iw-check-item {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 12px;
          border: 1px solid #eeebf6;
          background: #fff;
          border-radius: 12px;
          cursor: pointer;
        }

        .iw-check-item input {
          accent-color: #7654e8;
          width: 16px;
          height: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .iw-check-text {
          font-size: 12px;
          line-height: 1.6;
          font-weight: 600;
        }

        .iw-check-item.is-checked {
          background: #f3fff8;
          border-color: #cceedd;
        }

        .iw-check-item.is-checked .iw-check-text {
          color: #6d7f74;
          text-decoration: line-through;
        }

        .iw-progress {
          height: 7px;
          width: 100%;
          border-radius: 99px;
          background: #eae6f5;
          overflow: hidden;
          margin: 14px 0 7px;
        }

        .iw-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7654e8, #bb71e9);
          transition: width 0.2s ease;
        }

        .iw-progress-text {
          color: var(--iw-muted);
          font-size: 11px;
        }

        .iw-tip {
          padding: 15px 0;
          border-bottom: 1px solid #efedf5;
        }

        .iw-tip:first-of-type {
          padding-top: 2px;
        }

        .iw-tip:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .iw-tip h4 {
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 6px;
        }

        .iw-tip p {
          font-size: 12px;
          line-height: 1.7;
          color: var(--iw-muted);
          margin: 0;
        }

        .iw-notice {
          padding: 13px 15px;
          border-radius: 12px;
          background: #f0ebff;
          color: #5d42b5;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .iw-error {
          padding: 15px;
          border-radius: 12px;
          background: #fff0f1;
          color: #b83d4c;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .iw-empty {
          text-align: center;
          padding: 42px 20px;
          border: 1px dashed #dcd6ed;
          border-radius: 18px;
          background: #fff;
        }

        .iw-empty-icon {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          border-radius: 18px;
          background: #f0ebff;
          font-size: 25px;
        }

        .iw-empty h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
        }

        .iw-empty p {
          color: var(--iw-muted);
          font-size: 13px;
          line-height: 1.7;
          max-width: 450px;
          margin: 0 auto;
        }

        .iw-loading {
          padding: 28px;
          text-align: center;
          color: var(--iw-muted);
          font-size: 13px;
        }

        .iw-footnote {
          margin-top: 16px;
          color: var(--iw-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        @media (max-width: 1000px) {
          .iw-prep-layout {
            grid-template-columns: 1fr;
          }

          .iw-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .iw-root {
            padding: 14px;
          }

          .iw-hero {
            padding: 24px;
            border-radius: 19px;
          }

          .iw-stats {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .iw-stat {
            padding: 18px;
          }

          .iw-stat-value {
            font-size: 26px;
          }

          .iw-panel {
            padding: 16px;
          }

          .iw-prep-top {
            flex-direction: column;
          }

          .iw-details {
            grid-template-columns: 1fr 1fr;
          }

          .iw-section-heading {
            align-items: flex-start;
          }

          .iw-card {
            padding: 17px;
          }

          .iw-card-actions .iw-btn {
            flex: 1 1 auto;
          }
        }
      `}</style>

      <div className="iw-container">
        {/* ==================== HERO ==================== */}

        <section className="iw-hero">
          <div className="iw-eyebrow">
            <span>✦</span>
            ApplyTrack AI · Interview Center
          </div>

          <h1>
            {isInterviewer
              ? "Manage Your Interviews"
              : "Prepare for Your Next Opportunity"}
          </h1>

          <p>
            {isInterviewer
              ? "Review assigned interviews, prepare structured questions, and conduct professional candidate evaluations."
              : "Manage your interview schedule, practise common interview questions, and build confidence before meeting employers."}
          </p>
        </section>

        {/* ==================== NOTICES ==================== */}

        {notice && (
          <div className="iw-notice" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="iw-error" role="alert">
            <strong>Unable to load interviews.</strong>
            <br />
            {error}
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="iw-btn iw-btn-primary"
                onClick={loadInterviews}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ==================== STATISTICS ==================== */}

        <section className="iw-stats" aria-label="Interview statistics">
          <div className="iw-stat">
            <div className="iw-stat-label">
              {isInterviewer ? "Assigned Interviews" : "My Interviews"}
            </div>
            <div className="iw-stat-value">{stats.total}</div>
            <div className="iw-stat-note">
              Interviews available in your workspace
            </div>
          </div>

          <div className="iw-stat">
            <div className="iw-stat-label">Upcoming</div>
            <div className="iw-stat-value">{stats.upcoming}</div>
            <div className="iw-stat-note">
              Scheduled and awaiting their interview time
            </div>
          </div>

          <div className="iw-stat">
            <div className="iw-stat-label">Completed</div>
            <div className="iw-stat-value">{stats.completed}</div>
            <div className="iw-stat-note">
              Interviews marked as completed
            </div>
          </div>
        </section>

        {/* ==================== INTERVIEW SCHEDULE ==================== */}

        <section className="iw-section">
          <div className="iw-section-heading">
            <div>
              <h2>
                {isInterviewer ? "Your Interview Schedule" : "My Interviews"}
              </h2>
              <p>
                {isInterviewer
                  ? "Review candidate details and manage your assigned interviews."
                  : "Check interview dates, meeting details, and preparation options."}
              </p>
            </div>

            <span className="iw-count">
              {interviews.length}{" "}
              {interviews.length === 1 ? "interview" : "interviews"}
            </span>
          </div>

          {loading ? (
            <div className="iw-panel iw-loading">
              Loading your interview schedule...
            </div>
          ) : interviews.length === 0 ? (
            <div className="iw-empty">
              <div className="iw-empty-icon">📅</div>
              <h3>No interviews scheduled yet</h3>
              <p>
                {isInterviewer
                  ? "When an interview is assigned to you, it will appear here with its schedule and candidate information."
                  : "When a recruiter schedules an interview for one of your applications, the details will appear here."}
              </p>
            </div>
          ) : (
            <div className="iw-grid">
              {interviews.map((interview) => {
                const interviewId = getInterviewId(interview);
                const meetingLink = getMeetingLink(interview);
                const status = getInterviewStatus(interview);
                const isUpdating = actionLoading === interviewId;

                return (
                  <article
                    className="iw-card"
                    key={interviewId ?? `${interview.scheduled_at}-${getInterviewTitle(interview)}`}
                  >
                    <div className="iw-card-top">
                      <div style={{ display: "flex", gap: 13, minWidth: 0 }}>
                        <div className="iw-card-icon" aria-hidden="true">
                          ▣
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3>{getInterviewTitle(interview)}</h3>
                          <div className="iw-company">
                            {getCompanyName(interview)}
                          </div>
                        </div>
                      </div>

                      <span className={getStatusClass(status)}>
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="iw-details">
                      <div>
                        <div className="iw-detail-label">
                          {isInterviewer ? "Candidate" : "Interview Round"}
                        </div>
                        <div className="iw-detail-value">
                          {isInterviewer
                            ? getCandidateName(interview)
                            : interview?.round_name || "General Interview"}
                        </div>
                      </div>

                      <div>
                        <div className="iw-detail-label">Date & Time</div>
                        <div className="iw-detail-value">
                          {formatDate(interview?.scheduled_at)}
                        </div>
                      </div>

                      <div>
                        <div className="iw-detail-label">Interview Type</div>
                        <div className="iw-detail-value">
                          {String(interview?.interview_type || interview?.type || "Online")
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                        </div>
                      </div>

                      <div>
                        <div className="iw-detail-label">Duration</div>
                        <div className="iw-detail-value">
                          {interview?.duration_minutes
                            ? `${interview.duration_minutes} minutes`
                            : "Not specified"}
                        </div>
                      </div>
                    </div>

                    {interview?.instructions && (
                      <div
                        style={{
                          marginTop: 14,
                          color: "var(--iw-muted)",
                          fontSize: 12,
                          lineHeight: 1.7,
                        }}
                      >
                        <strong style={{ color: "var(--iw-text)" }}>
                          Instructions:{" "}
                        </strong>
                        {interview.instructions}
                      </div>
                    )}

                    {interview?.interview_location && (
                      <div
                        style={{
                          marginTop: 10,
                          color: "var(--iw-muted)",
                          fontSize: 12,
                        }}
                      >
                        <strong style={{ color: "var(--iw-text)" }}>
                          Location:{" "}
                        </strong>
                        {interview.interview_location}
                      </div>
                    )}

                    <div className="iw-card-actions">
                      {meetingLink && status === "scheduled" && (
                        <a
                          className="iw-btn iw-btn-primary"
                          href={meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ↗ Join Interview
                        </a>
                      )}

                      <button
                        type="button"
                        className="iw-btn iw-btn-secondary"
                        onClick={() => {
                          setSelectedInterviewId(String(interviewId ?? ""));
                          scrollToPreparation();
                        }}
                      >
                        ✦ Prepare
                      </button>

                      {isInterviewer && status === "scheduled" && (
                        <>
                          <button
                            type="button"
                            className="iw-btn iw-btn-success"
                            disabled={isUpdating}
                            onClick={() =>
                              updateInterview(interview, "completed")
                            }
                          >
                            {isUpdating ? "Updating..." : "✓ Complete"}
                          </button>

                          <button
                            type="button"
                            className="iw-btn iw-btn-danger"
                            disabled={isUpdating}
                            onClick={() =>
                              updateInterview(interview, "cancelled")
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>

                    {status === "scheduled" && !meetingLink && (
                      <div className="iw-footnote">
                        The meeting link has not been provided. Check the
                        interview details or contact the recruiter.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ==================== PREPARATION STUDIO ==================== */}

        {/* ==================== PREPARATION STUDIO ==================== */}

{isCandidate && (
  <section className="iw-section" id="iw-preparation">
    <div className="iw-section-heading">
      <div>
        <h2>Interview Preparation Studio</h2>
        <p>
          Practise questions, write your answers, and get ready for your interview.
        </p>
      </div>

      <span className="iw-count">Candidate Tools</span>
    </div>

    <div className="iw-panel">
      <div className="iw-prep-top">
        <div>
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>
        </div>

        <div className="iw-role-label">✦ Candidate</div>
      </div>

      <div className="iw-prep-layout">
        <div className="iw-subpanel">
          <h3>Practice Questions</h3>

          <p className="iw-subtitle">
            Choose a category, practise your answers, and review the guidance below each question.
          </p>

          <div className="iw-field">
            <label htmlFor="iw-interview-select">
              Interview to Prepare For
            </label>

            <select
              id="iw-interview-select"
              className="iw-select"
              value={selectedInterviewId}
              onChange={(event) => setSelectedInterviewId(event.target.value)}
            >
              <option value="">General interview preparation</option>

              {interviews.map((interview) => (
                <option
                  key={getInterviewId(interview)}
                  value={String(getInterviewId(interview))}
                >
                  {getInterviewTitle(interview)} — {getCompanyName(interview)}
                </option>
              ))}
            </select>
          </div>

          {selectedInterview && (
            <div className="iw-guidance">
              <strong>Selected interview:</strong>{" "}
              {getInterviewTitle(selectedInterview)} at{" "}
              {getCompanyName(selectedInterview)}.
            </div>
          )}

          <div className="iw-field">
            <label htmlFor="iw-category">Question Category</label>

            <select
              id="iw-category"
              className="iw-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {Object.keys(practiceQuestions).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {practiceQuestions[category].map((item, index) => (
            <div className="iw-question" key={item.question}>
              <div className="iw-question-number">
                Question {index + 1}
              </div>

              <h4>{item.question}</h4>

              <div className="iw-guidance">
                <strong>Answer tip:</strong> {item.guidance}
              </div>

              <div className="iw-field" style={{ marginBottom: 0 }}>
                <label htmlFor={`iw-answer-${category}-${index}`}>
                  Your Practice Answer
                </label>

                <textarea
                  id={`iw-answer-${category}-${index}`}
                  className="iw-textarea"
                  placeholder="Write your answer here and practise explaining it aloud..."
                  value={answers[item.question] || ""}
                  onChange={(event) =>
                    updateAnswer(item.question, event.target.value)
                  }
                />
              </div>
            </div>
          ))}

          <div className="iw-footnote">
            Your practice answers are held in this page's current session only.
            They are not automatically saved to your account or evaluated by AI.
          </div>
        </div>

        <div>
          <div className="iw-subpanel" style={{ marginBottom: 18 }}>
            <h3>{content.checklistTitle}</h3>
            <p className="iw-subtitle">{content.checklistDescription}</p>

            <div className="iw-checklist">
              {content.checklist.map((item, index) => {
                const checked = completedChecklist.includes(index);

                return (
                  <label
                    key={item}
                    className={`iw-check-item ${checked ? "is-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChecklist(index)}
                    />

                    <span className="iw-check-text">{item}</span>
                  </label>
                );
              })}
            </div>

            <div className="iw-progress">
              <div
                className="iw-progress-fill"
                style={{
                  width: `${
                    (completedChecklist.length / content.checklist.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="iw-progress-text">
              {completedChecklist.length} of {content.checklist.length} tasks completed
            </div>
          </div>

          <div className="iw-subpanel">
            <h3>Preparation Tips</h3>
            <p className="iw-subtitle">
              Simple ways to improve your interview readiness.
            </p>

            {content.tips.map((tip) => (
              <div className="iw-tip" key={tip.title}>
                <h4>{tip.title}</h4>
                <p>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
)}

        {/* ==================== FOOTER NOTE ==================== */}

        <div className="iw-footnote">
          ApplyTrack AI Interview Workspace · Interview actions depend on your
          account permissions and the backend API. Preparation questions and
          checklists are currently static learning tools, not AI-generated
          assessments.
        </div>
      </div>
    </div>
  );
}