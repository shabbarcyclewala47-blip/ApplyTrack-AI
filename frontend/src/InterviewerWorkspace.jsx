
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import "./InterviewerWorkspace.css";

function formatDateTime(value) {
    if (!value) return { date: "Not scheduled", time: "" };

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return { date: value, time: "" };
    }

    return {
        date: date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        time: date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}

function getStatusClass(status) {
    return String(status || "scheduled")
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function getInterviewRecords(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.interviews)) return response.interviews;
    return [];
}

function getInterviewTime(value) {
    if (!value) return NaN;
    return new Date(value).getTime();
}

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export default function InterviewerWorkspace() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedInterview, setSelectedInterview] = useState(null);

    const loadInterviews = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        setError("");

        try {
            const response = await apiRequest("interviewer/interviews/");
            const data = getInterviewRecords(response);

            setInterviews(data);

            setSelectedInterview((current) => {
                if (!current) return null;
                return data.find((item) => item.id === current.id) || null;
            });
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to load your interviews. Please check your login and try again."
            );
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInterviews();
    }, [loadInterviews]);

    const stats = useMemo(() => {
        const now = Date.now();

        const upcoming = interviews.filter((item) => {
            const scheduledTime = getInterviewTime(item.scheduled_at);

            return (
                item.status === "scheduled" &&
                Number.isFinite(scheduledTime) &&
                scheduledTime >= now
            );
        }).length;

        const completed = interviews.filter(
            (item) => item.status === "completed"
        ).length;

        const cancelled = interviews.filter(
            (item) => item.status === "cancelled"
        ).length;

        const feedbackPending = interviews.filter(
            (item) =>
                item.status === "completed" &&
                item.feedback_submitted !== true
        ).length;

        return {
            total: interviews.length,
            upcoming,
            completed,
            cancelled,
            feedbackPending,
        };
    }, [interviews]);

    const filteredInterviews = useMemo(() => {
        const query = search.trim().toLowerCase();

        return interviews.filter((item) => {
            const searchableText = [
                item.candidate_name,
                item.candidate_email,
                item.job_title,
                item.company_name,
                item.round_name,
                item.interview_type,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            const matchesFilter =
                filter === "all" || item.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [interviews, search, filter]);

    const nextInterview = useMemo(() => {
        const now = Date.now();

        return interviews
            .filter((item) => {
                const scheduledTime = getInterviewTime(item.scheduled_at);

                return (
                    item.status === "scheduled" &&
                    Number.isFinite(scheduledTime) &&
                    scheduledTime >= now
                );
            })
            .sort(
                (a, b) =>
                    getInterviewTime(a.scheduled_at) -
                    getInterviewTime(b.scheduled_at)
            )[0] || null;
    }, [interviews]);

    async function updateInterviewStatus(interview, status) {
        setUpdatingId(interview.id);
        setError("");
        setSuccess("");

        try {
            await apiRequest(
                `interviewer/interviews/${interview.id}/status/`,
                {
                    method: "PATCH",
                    body: { status },
                }
            );

            setInterviews((current) =>
                current.map((item) =>
                    item.id === interview.id
                        ? { ...item, status }
                        : item
                )
            );

            setSelectedInterview((current) =>
                current?.id === interview.id
                    ? { ...current, status }
                    : current
            );

            setSuccess(
                status === "completed"
                    ? "Interview marked as completed."
                    : "Interview cancelled successfully."
            );

            await loadInterviews(false);
        } catch (err) {
            setError(
                err?.message ||
                    "Could not update the interview status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    function scrollToSchedule() {
        document.getElementById("interviewer-schedule")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });

    return (
        <main className="interviewer-workspace">
            <section className="interviewer-hero">
                <div className="interviewer-hero-content">
                    <div className="interviewer-welcome-row">
                        <span className="interviewer-eyebrow">
                            <span className="interviewer-live-dot" />
                            INTERVIEWER WORKSPACE
                        </span>

                        <span className="interviewer-date-badge">
                            {today}
                        </span>
                    </div>

                    <h1>
                        {getGreeting()}, <span>interviewer.</span>
                    </h1>

                    <p>
                        Your interview schedule, assigned candidates, and
                        evaluation tasks—all in one place. Let’s make every
                        interview count.
                    </p>

                    <div className="interviewer-hero-actions">
                        <button
                            type="button"
                            className="interviewer-refresh-button"
                            onClick={scrollToSchedule}
                        >
                            View my interviews <span>→</span>
                        </button>

                        <button
                            type="button"
                            className="interviewer-hero-refresh"
                            onClick={() => loadInterviews()}
                            disabled={loading}
                            aria-label="Refresh interview data"
                            title="Refresh interview data"
                        >
                            <span aria-hidden="true">↻</span>
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="interviewer-hero-art" aria-hidden="true">
                    <div className="interviewer-art-orbit orbit-one" />
                    <div className="interviewer-art-orbit orbit-two" />

                    <div className="interviewer-art-circle">
                        <span>✓</span>
                    </div>

                    <div className="interviewer-art-card">
                        <span className="interviewer-art-dot" />
                        <div>
                            <small>YOUR WORKSPACE</small>
                            <strong>Stay focused.</strong>
                            <span>Find your next interview</span>
                        </div>
                    </div>

                    <div className="interviewer-art-floating">
                        <span>✦</span> Talent matters
                    </div>
                </div>
            </section>

            {error && (
                <div
                    className="interviewer-alert interviewer-alert-error"
                    role="alert"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div
                    className="interviewer-alert interviewer-alert-success"
                    role="status"
                >
                    <span>{success}</span>
                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="interviewer-stats">
                <article className="interviewer-stat-card stat-purple">
                    <div className="interviewer-stat-top">
                        <span className="interviewer-stat-icon icon-purple">
                            ▤
                        </span>
                        <span className="interviewer-stat-tag">
                            ASSIGNED
                        </span>
                    </div>

                    <div className="interviewer-stat-copy">
                        <span>Total assigned</span>
                        <strong>{loading ? "—" : stats.total}</strong>
                        <small>All your interviews</small>
                    </div>
                </article>

                <article className="interviewer-stat-card stat-blue">
                    <div className="interviewer-stat-top">
                        <span className="interviewer-stat-icon icon-blue">
                            ◷
                        </span>
                        <span className="interviewer-stat-tag">
                            SCHEDULE
                        </span>
                    </div>

                    <div className="interviewer-stat-copy">
                        <span>Upcoming interviews</span>
                        <strong>{loading ? "—" : stats.upcoming}</strong>
                        <small>Ready for your attention</small>
                    </div>
                </article>

                <article className="interviewer-stat-card stat-green">
                    <div className="interviewer-stat-top">
                        <span className="interviewer-stat-icon icon-green">
                            ✓
                        </span>
                        <span className="interviewer-stat-tag">
                            COMPLETED
                        </span>
                    </div>

                    <div className="interviewer-stat-copy">
                        <span>Completed interviews</span>
                        <strong>{loading ? "—" : stats.completed}</strong>
                        <small>Interviews finished</small>
                    </div>
                </article>

                <article className="interviewer-stat-card stat-orange">
                    <div className="interviewer-stat-top">
                        <span className="interviewer-stat-icon icon-orange">
                            ✎
                        </span>
                        <span className="interviewer-stat-tag">
                            EVALUATION
                        </span>
                    </div>

                    <div className="interviewer-stat-copy">
                        <span>Feedback pending</span>
                        <strong>
                            {loading ? "—" : stats.feedbackPending}
                        </strong>
                        <small>Completed interviews to review</small>
                    </div>
                </article>
            </section>

            <section className="interviewer-quick-grid">
                <button
                    type="button"
                    className="interviewer-quick-card"
                    onClick={scrollToSchedule}
                >
                    <span className="interviewer-quick-icon quick-purple">
                        ◷
                    </span>

                    <span className="interviewer-quick-copy">
                        <strong>Interview schedule</strong>
                        <small>
                            Browse assigned interviews and meeting details.
                        </small>
                        <span className="interviewer-quick-link">
                            View assigned interviews <b>→</b>
                        </span>
                    </span>
                </button>

                <button
                    type="button"
                    className="interviewer-quick-card"
                    onClick={() => {
                        setFilter("completed");
                        setSearch("");
                        document
                            .getElementById("interviewer-schedule")
                            ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            });
                    }}
                >
                    <span className="interviewer-quick-icon quick-green">
                        ✓
                    </span>

                    <span className="interviewer-quick-copy">
                        <strong>Candidate evaluations</strong>
                        <small>
                            Find completed interviews and review their details.
                        </small>
                        <span className="interviewer-quick-link">
                            Review completed interviews <b>→</b>
                        </span>
                    </span>
                </button>
            </section>

            {nextInterview && (
                <section className="interviewer-next-card">
                    <div className="interviewer-next-icon">◷</div>

                    <div className="interviewer-next-copy">
                        <span className="interviewer-section-label">
                            YOUR NEXT INTERVIEW
                        </span>

                        <h2>
                            {nextInterview.candidate_name || "Candidate"}
                        </h2>

                        <p>
                            {nextInterview.job_title ||
                                "Position not specified"}
                            {nextInterview.round_name
                                ? ` · ${nextInterview.round_name}`
                                : ""}
                        </p>

                        <span className="interviewer-next-time">
                            {formatDateTime(nextInterview.scheduled_at).date}
                            {" · "}
                            {formatDateTime(nextInterview.scheduled_at).time}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="interviewer-view-button"
                        onClick={() => setSelectedInterview(nextInterview)}
                    >
                        View details →
                    </button>
                </section>
            )}

            <section
                className="interviewer-panel"
                id="interviewer-schedule"
            >
                <div className="interviewer-panel-heading">
                    <div>
                        <span className="interviewer-section-label">
                            YOUR SCHEDULE
                        </span>

                        <h2>Assigned interviews</h2>

                        <p>
                            Review candidate details, interview times, and
                            recruiter instructions.
                        </p>
                    </div>

                    <span className="interviewer-count">
                        {filteredInterviews.length}{" "}
                        {filteredInterviews.length === 1
                            ? "interview"
                            : "interviews"}
                    </span>
                </div>

                <div className="interviewer-toolbar">
                    <label className="interviewer-search">
                        <span aria-hidden="true">⌕</span>

                        <input
                            type="search"
                            placeholder="Search candidate, role, or round..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            aria-label="Search interviews"
                        />
                    </label>

                    <select
                        className="interviewer-filter"
                        value={filter}
                        onChange={(event) =>
                            setFilter(event.target.value)
                        }
                        aria-label="Filter by interview status"
                    >
                        <option value="all">All statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="interviewer-state">
                        <div className="interviewer-spinner" />
                        <h3>Preparing your workspace</h3>
                        <p>
                            Loading your assigned interviews...
                        </p>
                    </div>
                ) : filteredInterviews.length === 0 ? (
                    <div className="interviewer-state">
                        <div className="interviewer-empty-icon">▤</div>

                        <h3>
                            {interviews.length === 0
                                ? "No interviews assigned yet"
                                : "No matching interviews"}
                        </h3>

                        <p>
                            {interviews.length === 0
                                ? "When a recruiter assigns an interview to you, it will appear here."
                                : "Try another search term or change the status filter."}
                        </p>

                        {(search || filter !== "all") && (
                            <button
                                type="button"
                                className="interviewer-secondary-button"
                                onClick={() => {
                                    setSearch("");
                                    setFilter("all");
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="interviewer-table-wrap">
                        <table className="interviewer-table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Interview details</th>
                                    <th>Date &amp; time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInterviews.map((interview) => {
                                    const when = formatDateTime(
                                        interview.scheduled_at
                                    );

                                    return (
                                        <tr key={interview.id}>
                                            <td>
                                                <div className="interviewer-candidate">
                                                    <div className="interviewer-avatar">
                                                        {(interview.candidate_name ||
                                                            "C")
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {interview.candidate_name ||
                                                                "Candidate"}
                                                        </strong>

                                                        <span>
                                                            {interview.candidate_email ||
                                                                "Email not available"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="interviewer-role">
                                                    <strong>
                                                        {interview.job_title ||
                                                            "Position not specified"}
                                                    </strong>

                                                    <span>
                                                        {interview.round_name ||
                                                            "Interview round"}
                                                        {interview.interview_type
                                                            ? ` · ${interview.interview_type.replace(
                                                                  /_/g,
                                                                  " "
                                                              )}`
                                                            : ""}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="interviewer-date">
                                                    <strong>{when.date}</strong>
                                                    <span>
                                                        {when.time ||
                                                            "Time not available"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`interviewer-status ${getStatusClass(
                                                        interview.status
                                                    )}`}
                                                >
                                                    {interview.status ||
                                                        "scheduled"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="interviewer-view-button"
                                                    onClick={() =>
                                                        setSelectedInterview(
                                                            interview
                                                        )
                                                    }
                                                >
                                                    View details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedInterview && (
                <div
                    className="interviewer-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedInterview(null);
                        }
                    }}
                >
                    <section
                        className="interviewer-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="interviewer-modal-title"
                    >
                        <header className="interviewer-modal-header">
                            <div>
                                <span className="interviewer-section-label">
                                    INTERVIEW DETAILS
                                </span>

                                <h2 id="interviewer-modal-title">
                                    {selectedInterview.candidate_name ||
                                        "Candidate"}
                                </h2>

                                <p>
                                    {selectedInterview.job_title ||
                                        "Position not specified"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="interviewer-close-button"
                                onClick={() => setSelectedInterview(null)}
                                aria-label="Close details"
                            >
                                ×
                            </button>
                        </header>

                        <div className="interviewer-modal-body">
                            <div className="interviewer-detail-grid">
                                <div className="interviewer-detail-item">
                                    <span>Email</span>
                                    <strong>
                                        {selectedInterview.candidate_email ||
                                            "Not available"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Company</span>
                                    <strong>
                                        {selectedInterview.company_name ||
                                            "Not specified"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Date</span>
                                    <strong>
                                        {
                                            formatDateTime(
                                                selectedInterview.scheduled_at
                                            ).date
                                        }
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Time</span>
                                    <strong>
                                        {formatDateTime(
                                            selectedInterview.scheduled_at
                                        ).time || "Not available"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Duration</span>
                                    <strong>
                                        {selectedInterview.duration_minutes
                                            ? `${selectedInterview.duration_minutes} minutes`
                                            : "Not specified"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Interview type</span>
                                    <strong>
                                        {selectedInterview.interview_type?.replace(
                                            /_/g,
                                            " "
                                        ) || "Not specified"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Round</span>
                                    <strong>
                                        {selectedInterview.round_name ||
                                            "Not specified"}
                                    </strong>
                                </div>

                                <div className="interviewer-detail-item">
                                    <span>Status</span>
                                    <strong
                                        className={`interviewer-status ${getStatusClass(
                                            selectedInterview.status
                                        )}`}
                                    >
                                        {selectedInterview.status ||
                                            "scheduled"}
                                    </strong>
                                </div>
                            </div>

                            {selectedInterview.instructions && (
                                <div className="interviewer-instructions">
                                    <h3>Recruiter instructions</h3>
                                    <p>{selectedInterview.instructions}</p>
                                </div>
                            )}

                            {selectedInterview.meeting_link && (
                                <a
                                    className="interviewer-meeting-link"
                                    href={selectedInterview.meeting_link}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Join meeting ↗
                                </a>
                            )}

                            {selectedInterview.interview_location && (
                                <div className="interviewer-instructions">
                                    <h3>Interview location</h3>
                                    <p>
                                        {selectedInterview.interview_location}
                                    </p>
                                </div>
                            )}
                        </div>

                        <footer className="interviewer-modal-footer">
                            <button
                                type="button"
                                className="interviewer-secondary-button"
                                onClick={() => setSelectedInterview(null)}
                            >
                                Close
                            </button>

                            {selectedInterview.status === "scheduled" && (
                                <>
                                    <button
                                        type="button"
                                        className="interviewer-cancel-button"
                                        disabled={
                                            updatingId === selectedInterview.id
                                        }
                                        onClick={() =>
                                            updateInterviewStatus(
                                                selectedInterview,
                                                "cancelled"
                                            )
                                        }
                                    >
                                        {updatingId === selectedInterview.id
                                            ? "Updating..."
                                            : "Cancel interview"}
                                    </button>

                                    <button
                                        type="button"
                                        className="interviewer-complete-button"
                                        disabled={
                                            updatingId === selectedInterview.id
                                        }
                                        onClick={() =>
                                            updateInterviewStatus(
                                                selectedInterview,
                                                "completed"
                                            )
                                        }
                                    >
                                        {updatingId === selectedInterview.id
                                            ? "Updating..."
                                            : "Mark completed"}
                                    </button>
                                </>
                            )}
                        </footer>
                    </section>
                </div>
            )}
        </main>
    );
}
