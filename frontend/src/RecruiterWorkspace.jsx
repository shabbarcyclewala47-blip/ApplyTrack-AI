import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import InterviewScheduler from "./InterviewScheduler";
import "./RecruiterWorkspace.css";

const icon = {
  briefcase: "💼",
  calendar: "📅",
  clock: "⏳",
  check: "✓",
};

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
}

export default function RecruiterWorkspace() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [notice, setNotice] = useState("");

  async function loadInterviews() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("recruiter/interviews/");
      const data = Array.isArray(response)
        ? response
        : response?.results || response?.interviews || [];

      setInterviews(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const matchesSearch = [
        interview.candidate_name,
        interview.candidate_email,
        interview.job_title,
        interview.company_name,
        interview.interviewer_username,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, search, statusFilter]);

  const now = new Date();

  const upcoming = interviews.filter(
    (item) =>
      item.status === "scheduled" &&
      item.scheduled_at &&
      new Date(item.scheduled_at) >= now
  ).length;

  const completed = interviews.filter(
    (item) => item.status === "completed"
  ).length;

  const cancelled = interviews.filter(
    (item) => item.status === "cancelled"
  ).length;

  function openCreateForm() {
    setEditingInterview(null);
    setShowScheduler(true);
    setNotice("");
  }

  function openEditForm(interview) {
    setEditingInterview(interview);
    setShowScheduler(true);
    setNotice("");
  }

  async function cancelInterview(interview) {
    const confirmed = window.confirm(
      `Cancel the interview for ${interview.candidate_name || "this candidate"}?`
    );

    if (!confirmed) return;

    setActionId(interview.id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`recruiter/interviews/${interview.id}/`, {
        method: "PATCH",
        body: { status: "cancelled" },
      });

      setNotice("Interview cancelled successfully.");
      await loadInterviews();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  function handleSaved() {
    setShowScheduler(false);
    setEditingInterview(null);
    setNotice("Interview details saved successfully.");
    loadInterviews();
  }

  return (
    <section className="recruiter-workspace">
      <div className="recruiter-hero">
        <div className="recruiter-hero-content">
          <span className="recruiter-eyebrow">RECRUITER COMMAND CENTER</span>
          <h1>Interview Management</h1>
          <p>
            Schedule interviews, coordinate with interviewers, and keep every
            candidate moving through your hiring process.
          </p>

          <button className="recruiter-primary-btn" onClick={openCreateForm}>
            <span>＋</span> Schedule Interview
          </button>
        </div>

        <div className="recruiter-hero-art" aria-hidden="true">
          <div className="recruiter-orbit recruiter-orbit-one" />
          <div className="recruiter-orbit recruiter-orbit-two" />
          <div className="recruiter-hero-icon">📅</div>
          <div className="recruiter-floating-card recruiter-float-top">
            <span>✓</span> Interview ready
          </div>
          <div className="recruiter-floating-card recruiter-float-bottom">
            <span>✦</span> Better hiring
          </div>
        </div>
      </div>

      <div className="recruiter-section-heading">
        <div>
          <span className="recruiter-eyebrow">YOUR HIRING OVERVIEW</span>
          <h2>Interview activity</h2>
          <p>A quick look at your interview pipeline.</p>
        </div>
        <button
          className="recruiter-secondary-btn"
          onClick={loadInterviews}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="recruiter-stats-grid">
        <article className="recruiter-stat-card">
          <div className="recruiter-stat-icon recruiter-icon-purple">📋</div>
          <div className="recruiter-stat-label">Total interviews</div>
          <div className="recruiter-stat-value">{interviews.length}</div>
          <div className="recruiter-stat-foot">All scheduled records</div>
        </article>

        <article className="recruiter-stat-card">
          <div className="recruiter-stat-icon recruiter-icon-pink">🗓️</div>
          <div className="recruiter-stat-label">Upcoming</div>
          <div className="recruiter-stat-value">{upcoming}</div>
          <div className="recruiter-stat-foot">Still to take place</div>
        </article>

        <article className="recruiter-stat-card">
          <div className="recruiter-stat-icon recruiter-icon-green">✓</div>
          <div className="recruiter-stat-label">Completed</div>
          <div className="recruiter-stat-value">{completed}</div>
          <div className="recruiter-stat-foot">Interviews finished</div>
        </article>

        <article className="recruiter-stat-card">
          <div className="recruiter-stat-icon recruiter-icon-orange">↗</div>
          <div className="recruiter-stat-label">Cancelled</div>
          <div className="recruiter-stat-value">{cancelled}</div>
          <div className="recruiter-stat-foot">Cancelled interviews</div>
        </article>
      </div>

      {notice && (
        <div className="recruiter-notice" role="status">
          <span>✓</span> {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="recruiter-error" role="alert">
          <strong>Unable to complete the request.</strong>
          <p>{error}</p>
          <button className="recruiter-secondary-btn" onClick={loadInterviews}>
            Try again
          </button>
        </div>
      )}

      <div className="recruiter-interviews-panel">
        <div className="recruiter-panel-header">
          <div>
            <h2>Interview schedule</h2>
            <p>Manage candidate interviews in one place.</p>
          </div>
          <span className="recruiter-record-count">
            {filteredInterviews.length} records
          </span>
        </div>

        <div className="recruiter-toolbar">
          <label className="recruiter-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search candidate, job, or interviewer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            className="recruiter-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by interview status"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="recruiter-loading">
            <span className="recruiter-spinner" />
            <p>Loading your interviews...</p>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="recruiter-empty-state">
            <div className="recruiter-empty-icon">🗓️</div>
            <h3>
              {interviews.length === 0
                ? "Your interview schedule starts here"
                : "No matching interviews"}
            </h3>
            <p>
              {interviews.length === 0
                ? "Schedule your first interview to start coordinating with candidates and interviewers."
                : "Try a different search or change the status filter."}
            </p>
            {interviews.length === 0 && (
              <button className="recruiter-primary-btn" onClick={openCreateForm}>
                ＋ Schedule your first interview
              </button>
            )}
          </div>
        ) : (
          <div className="recruiter-table-wrap">
            <table className="recruiter-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Date & time</th>
                  <th>Interviewer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      <div className="recruiter-candidate-cell">
                        <div className="recruiter-avatar">
                          {(interview.candidate_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>
                            {interview.candidate_name || "Candidate"}
                          </strong>
                          <span>{interview.candidate_email || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{interview.job_title || "Position"}</strong>
                      <span className="recruiter-table-subtitle">
                        {interview.company_name || ""}
                      </span>
                    </td>
                    <td>
                      <strong>{formatDate(interview.scheduled_at)}</strong>
                      <span className="recruiter-table-subtitle">
                        {interview.duration_minutes || 30} minutes
                      </span>
                    </td>
                    <td>{interview.interviewer_username || "Not assigned"}</td>
                    <td>
                      <span
                        className={`recruiter-status-badge recruiter-status-${interview.status || "scheduled"}`}
                      >
                        {(interview.status || "scheduled").replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="recruiter-action-group">
                        <button
                          className="recruiter-action-btn"
                          onClick={() => openEditForm(interview)}
                          title="Edit interview"
                        >
                          Edit
                        </button>
                        {interview.status === "scheduled" && (
                          <button
                            className="recruiter-action-btn recruiter-cancel-btn"
                            onClick={() => cancelInterview(interview)}
                            disabled={actionId === interview.id}
                            title="Cancel interview"
                          >
                            {actionId === interview.id ? "..." : "Cancel"}
                          </button>
                        )}
                        {interview.meeting_link && (
                          <a
                            className="recruiter-action-btn recruiter-link-btn"
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="recruiter-bottom-tip">
        <span>✦</span>
        <div>
          <strong>Hiring tip</strong>
          <p>
            Include clear interview instructions and share the meeting details
            with candidates ahead of time.
          </p>
        </div>
      </div>

      {showScheduler && (
        <InterviewScheduler
          interview={editingInterview}
          onClose={() => {
            setShowScheduler(false);
            setEditingInterview(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}