
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

const STATUS_OPTIONS = [
    { value: "applied", label: "Applied" },
    { value: "under_review", label: "Under Review" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "interview", label: "Interview" },
    { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS = {
    applied: { background: "#dbeafe", color: "#1d4ed8" },
    under_review: { background: "#fef3c7", color: "#92400e" },
    shortlisted: { background: "#ede9fe", color: "#6d28d9" },
    interview: { background: "#cffafe", color: "#155e75" },
   
    rejected: { background: "#fee2e2", color: "#991b1b" },
};

const styles = {
    page: {
        padding: "clamp(16px, 3vw, 32px)",
        color: "#172033",
        background:
            "linear-gradient(145deg, #f6f5ff 0%, #f8fbff 48%, #fdf7ff 100%)",
        minHeight: "100%",
        borderRadius: "24px",
        fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    muted: {
        color: "#778198",
        fontSize: "13px",
        lineHeight: 1.55,
    },
    panel: {
        background: "rgba(255,255,255,0.94)",
        border: "1px solid #e8eaf4",
        borderRadius: "20px",
        padding: "clamp(16px, 2.5vw, 26px)",
        marginTop: "22px",
        boxShadow: "0 12px 35px rgba(31, 41, 85, 0.055)",
    },
    stat: {
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(145deg, #ffffff 0%, #fbfaff 100%)",
        border: "1px solid #e8eaf4",
        borderRadius: "18px",
        padding: "21px",
        boxShadow: "0 8px 24px rgba(31, 41, 85, 0.045)",
    },
    button: {
        border: 0,
        borderRadius: "11px",
        padding: "11px 16px",
        background: "linear-gradient(135deg, #6957e8, #8b5cf6)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 750,
        fontSize: "13px",
        boxShadow: "0 5px 14px rgba(105, 87, 232, 0.18)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
    },
    input: {
        boxSizing: "border-box",
        width: "100%",
        padding: "12px 13px",
        border: "1px solid #dfe3ef",
        borderRadius: "11px",
        fontSize: "14px",
        marginTop: "7px",
        background: "#fff",
        color: "#202940",
        outlineColor: "#8b7cf6",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: 750,
        color: "#414b63",
        marginTop: "14px",
    },
};

function getRecords(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function getStatusLabel(status) {
    const option = STATUS_OPTIONS.find((item) => item.value === status);

    return (
        option?.label ||
        String(status || "applied")
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
}

function formatAppliedDate(value) {
    if (!value || typeof value !== "string") {
        return "Date unavailable";
    }

    const normalized = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(normalized)) {
        return "Date unavailable";
    }

    const date = new Date(
        normalized.length === 10
            ? `${normalized}T00:00:00`
            : normalized
    );

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getLocalDateTimeMinimum() {
    const date = new Date(Date.now() + 60_000);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

function getInitialInterviewForm() {
    return {
        application: "",
        interviewer: "",
        scheduled_at: "",
        duration_minutes: 60,
        interview_type: "online",
        round_name: "Technical Interview",
        meeting_link: "",
        interview_location: "",
        instructions: "",
    };
}

export default function RecruiterApplications() {
    const [applications, setApplications] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [interviews, setInterviews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const [showInterviewForm, setShowInterviewForm] = useState(false);
    const [savingInterview, setSavingInterview] = useState(false);
    const [interviewError, setInterviewError] = useState("");
    const [interviewSuccess, setInterviewSuccess] = useState("");

    const [interviewForm, setInterviewForm] = useState(
        getInitialInterviewForm
    );

    const loadApplications = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");
        setNotice("");

        try {
            const jobs = getRecords(
                await apiRequest("recruiter/jobs/")
            );

            const results = await Promise.all(
                jobs.map(async (job) => {
                    const records = getRecords(
                        await apiRequest(
                            `recruiter/jobs/${job.id}/applicants/`
                        )
                    );

                    return records.map((applicant) => ({
                        ...applicant,

                        id: applicant.id,
                        job_id: job.id,

                        full_name:
                            applicant.full_name ||
                            applicant.candidate_username ||
                            applicant.username ||
                            "Candidate",

                        candidate_username:
                            applicant.candidate_username ||
                            applicant.username ||
                            "",

                        candidate_email:
                            applicant.candidate_email ||
                            applicant.email ||
                            "",

                        phone: applicant.phone || "",

                        candidate_location:
                            applicant.candidate_location ||
                            applicant.location ||
                            "",

                        job_title:
                            applicant.job_title ||
                            job.title ||
                            "Untitled job",

                        company_name:
                            applicant.company_name ||
                            job.company_name ||
                            "Company",

                        job_location:
                            applicant.location ||
                            job.location ||
                            "",

                        status: applicant.status || "applied",

                        status_display:
                            applicant.status_display ||
                            applicant.status ||
                            "Applied",

                        applied_date:
                            applicant.applied_date || null,
                    }));
                })
            );

            setApplications(results.flat());
        } catch (err) {
            setError(
                err.message ||
                    "Could not load applications for your job openings."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadInterviewData = useCallback(async () => {
        try {
            const [usersResult, interviewsResult] =
                await Promise.all([
                    apiRequest("interviewers/"),
                    apiRequest("recruiter/interviews/"),
                ]);

            setInterviewers(getRecords(usersResult));
            setInterviews(getRecords(interviewsResult));
        } catch (err) {
            setInterviewers([]);
            setInterviews([]);
            console.error(
                "Could not load interview scheduling data:",
                err
            );
        }
    }, []);

    useEffect(() => {
        loadApplications();
        loadInterviewData();
    }, [loadApplications, loadInterviewData]);

    async function updateStatus(applicationId, status) {
        setUpdatingId(applicationId);
        setError("");
        setNotice("");

        try {
            const updated = await apiRequest(
                `recruiter/applicants/${applicationId}/status/`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                }
            );

            setApplications((current) =>
                current.map((application) =>
                    application.id === applicationId
                        ? { ...application, ...updated }
                        : application
                )
            );
        } catch (err) {
            setError(
                err.message || "Could not update application status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    function updateInterviewField(event) {
        const { name, value } = event.target;

        setInterviewForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function openInterviewForm(application = null) {
        setInterviewError("");
        setInterviewSuccess("");

        if (application) {
            setInterviewForm((current) => ({
                ...current,
                application: String(application.id),
            }));
        }

        setShowInterviewForm(true);

        // Scroll to the form immediately after it appears.
        setTimeout(() => {
            document
                .getElementById("schedule-interview-form")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        }, 100);

        try {
            const [usersResult, interviewsResult] =
                await Promise.all([
                    apiRequest("interviewers/"),
                    apiRequest("recruiter/interviews/"),
                ]);

            setInterviewers(getRecords(usersResult));
            setInterviews(getRecords(interviewsResult));
        } catch (err) {
            setInterviewError(
                `Could not load scheduling information: ${err.message}`
            );
        }
    }

    async function scheduleInterview(event) {
        event.preventDefault();

        setSavingInterview(true);
        setInterviewError("");
        setInterviewSuccess("");

        try {
            if (!interviewForm.application) {
                throw new Error(
                    "Please select a candidate application."
                );
            }

            if (!interviewForm.scheduled_at) {
                throw new Error(
                    "Please select the interview date and time."
                );
            }

            if (
                interviewForm.interview_type === "online" &&
                !interviewForm.meeting_link.trim()
            ) {
                throw new Error(
                    "Please enter the online meeting link."
                );
            }

            if (
                interviewForm.interview_type === "in_person" &&
                !interviewForm.interview_location.trim()
            ) {
                throw new Error(
                    "Please enter the interview location."
                );
            }

            const payload = {
                application: Number(interviewForm.application),

                interviewer: interviewForm.interviewer
                    ? Number(interviewForm.interviewer)
                    : null,

                scheduled_at: new Date(
                    interviewForm.scheduled_at
                ).toISOString(),

                duration_minutes: Number(
                    interviewForm.duration_minutes
                ),

                interview_type: interviewForm.interview_type,
                round_name: interviewForm.round_name.trim(),
                meeting_link: interviewForm.meeting_link.trim(),
                interview_location:
                    interviewForm.interview_location.trim(),
                instructions: interviewForm.instructions.trim(),
            };

            const created = await apiRequest(
                "recruiter/interviews/",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                }
            );

            setInterviews((current) => [
                created,
                ...current,
            ]);

            setApplications((current) =>
                current.map((application) =>
                    application.id ===
                    Number(interviewForm.application)
                        ? {
                              ...application,
                              status: "interview",
                          }
                        : application
                )
            );

            setInterviewSuccess(
                `Interview scheduled successfully${
                    created.interviewer_username
                        ? ` with ${created.interviewer_username}`
                        : ""
                }!`
            );

            setInterviewForm(getInitialInterviewForm());

            await loadApplications(true);
            await loadInterviewData();
        } catch (err) {
            setInterviewError(
                err.message || "Could not schedule the interview."
            );
        } finally {
            setSavingInterview(false);
        }
    }

    const query = search.trim().toLowerCase();

    const filteredApplications = applications.filter(
        (application) =>
            [
                application.candidate_username,
                application.username,
                application.candidate_email,
                application.email,
                application.full_name,
                application.job_title,
                application.company_name,
                application.status,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(query)
            )
    );

    const shortlistedCount = applications.filter(
        (item) => item.status === "shortlisted"
    ).length;

    const interviewCount = applications.filter(
        (item) => item.status === "interview"
    ).length;

    // Retained so the existing Offers statistic remains available.
    
    return (
        <main style={styles.page}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: 800,
                            marginBottom: "8px",
                        }}
                    >
                        Applications
                    </h1>

                    <p style={{ ...styles.muted, marginTop: 0 }}>
                        Review candidates and schedule interviews with
                        your interviewers.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => openInterviewForm()}
                        style={styles.button}
                    >
                        + Schedule Interview
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            loadApplications(true);
                            loadInterviewData();
                        }}
                        disabled={loading || refreshing}
                        style={{
                            ...styles.button,
                            background: "#334155",
                            opacity:
                                loading || refreshing ? 0.7 : 1,
                        }}
                    >
                        {refreshing ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </div>
            </header>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "14px",
                    marginTop: "22px",
                }}
            >
                {[
                    [
                        "Total Applications",
                        applications.length,
                        "#635bdb",
                    ],
                    ["Shortlisted", shortlistedCount, "#7c3aed"],
                    ["Interviews", interviewCount, "#0891b2"],
                   
                    
                ].map(([label, count, color]) => (
                    <section key={label} style={styles.stat}>
                        <p style={{ ...styles.muted, margin: 0 }}>
                            {label}
                        </p>

                        <div
                            style={{
                                fontSize: "30px",
                                fontWeight: 800,
                                color,
                                marginTop: "10px",
                            }}
                        >
                            {count}
                        </div>
                    </section>
                ))}
            </div>

            {showInterviewForm && (
                <section
                    id="schedule-interview-form"
                    style={{
                        ...styles.panel,
                        scrollMarginTop: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: "0 0 6px",
                                    fontSize: "21px",
                                }}
                            >
                                Schedule an Interview
                            </h2>

                            <p
                                style={{
                                    ...styles.muted,
                                    margin: 0,
                                }}
                            >
                                Choose an application, interviewer,
                                and future time.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setShowInterviewForm(false)
                            }
                            style={{
                                ...styles.button,
                                background: "#64748b",
                            }}
                        >
                            Close
                        </button>
                    </div>

                    {interviewError && (
                        <div
                            role="alert"
                            style={{
                                marginTop: "16px",
                                padding: "12px",
                                borderRadius: "9px",
                                background: "#fee2e2",
                                color: "#991b1b",
                            }}
                        >
                            {interviewError}
                        </div>
                    )}

                    {interviewSuccess && (
                        <div
                            role="status"
                            style={{
                                marginTop: "16px",
                                padding: "12px",
                                borderRadius: "9px",
                                background: "#d1fae5",
                                color: "#065f46",
                            }}
                        >
                            {interviewSuccess}
                        </div>
                    )}

                    <form onSubmit={scheduleInterview}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(230px, 1fr))",
                                gap: "8px 18px",
                                marginTop: "12px",
                            }}
                        >
                            <label style={styles.label}>
                                Candidate Application *
                                <select
                                    name="application"
                                    value={interviewForm.application}
                                    onChange={updateInterviewField}
                                    required
                                    style={styles.input}
                                >
                                    <option value="">
                                        Select an application
                                    </option>

                                    {applications.map(
                                        (application, index) => (
                                            <option
                                                key={`${application.id}-${application.job_id}-${index}`}
                                                value={application.id}
                                            >
                                                {application.full_name ||
                                                    application.candidate_username ||
                                                    application.username ||
                                                    "Candidate"}{" "}
                                                —{" "}
                                                {application.job_title ||
                                                    "Job"}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label style={styles.label}>
                                Interviewer
                                <select
                                    name="interviewer"
                                    value={interviewForm.interviewer}
                                    onChange={updateInterviewField}
                                    style={styles.input}
                                >
                                    <option value="">
                                        No interviewer assigned
                                    </option>

                                    {interviewers.map((person) => (
                                        <option
                                            key={person.id}
                                            value={person.id}
                                        >
                                            {person.username}
                                            {person.email
                                                ? ` (${person.email})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={styles.label}>
                                Date and Time *
                                <input
                                    type="datetime-local"
                                    name="scheduled_at"
                                    value={interviewForm.scheduled_at}
                                    min={getLocalDateTimeMinimum()}
                                    onChange={updateInterviewField}
                                    required
                                    style={styles.input}
                                />
                            </label>

                            <label style={styles.label}>
                                Duration
                                <select
                                    name="duration_minutes"
                                    value={
                                        interviewForm.duration_minutes
                                    }
                                    onChange={updateInterviewField}
                                    style={styles.input}
                                >
                                    <option value={15}>
                                        15 minutes
                                    </option>
                                    <option value={30}>
                                        30 minutes
                                    </option>
                                    <option value={45}>
                                        45 minutes
                                    </option>
                                    <option value={60}>
                                        60 minutes
                                    </option>
                                    <option value={90}>
                                        90 minutes
                                    </option>
                                    <option value={120}>
                                        120 minutes
                                    </option>
                                    <option value={180}>
                                        180 minutes
                                    </option>
                                    <option value={240}>
                                        240 minutes
                                    </option>
                                </select>
                            </label>

                            <label style={styles.label}>
                                Interview Type *
                                <select
                                    name="interview_type"
                                    value={interviewForm.interview_type}
                                    onChange={updateInterviewField}
                                    style={styles.input}
                                >
                                    <option value="online">
                                        Online
                                    </option>
                                    <option value="in_person">
                                        In person
                                    </option>
                                    <option value="phone">
                                        Phone
                                    </option>
                                </select>
                            </label>

                            <label style={styles.label}>
                                Interview Round *
                                <input
                                    name="round_name"
                                    value={interviewForm.round_name}
                                    onChange={updateInterviewField}
                                    required
                                    maxLength={100}
                                    placeholder="Technical Interview"
                                    style={styles.input}
                                />
                            </label>

                            {interviewForm.interview_type ===
                                "online" && (
                                <label style={styles.label}>
                                    Meeting Link *
                                    <input
                                        type="url"
                                        name="meeting_link"
                                        value={
                                            interviewForm.meeting_link
                                        }
                                        onChange={updateInterviewField}
                                        required
                                        placeholder="https://meet.google.com/..."
                                        style={styles.input}
                                    />
                                </label>
                            )}

                            {interviewForm.interview_type ===
                                "in_person" && (
                                <label style={styles.label}>
                                    Interview Location *
                                    <input
                                        name="interview_location"
                                        value={
                                            interviewForm.interview_location
                                        }
                                        onChange={updateInterviewField}
                                        required
                                        placeholder="Office address"
                                        style={styles.input}
                                    />
                                </label>
                            )}

                            <label style={styles.label}>
                                Instructions (optional)
                                <input
                                    name="instructions"
                                    value={interviewForm.instructions}
                                    onChange={updateInterviewField}
                                    placeholder="Bring your portfolio or ID"
                                    style={styles.input}
                                />
                            </label>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                marginTop: "22px",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="submit"
                                disabled={
                                    savingInterview ||
                                    applications.length === 0
                                }
                                style={{
                                    ...styles.button,
                                    opacity:
                                        savingInterview ||
                                        applications.length === 0
                                            ? 0.65
                                            : 1,
                                }}
                            >
                                {savingInterview
                                    ? "Scheduling..."
                                    : "Schedule Interview"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setInterviewForm(
                                        getInitialInterviewForm()
                                    );
                                    setInterviewError("");
                                    setInterviewSuccess("");
                                }}
                                style={{
                                    ...styles.button,
                                    background: "#64748b",
                                }}
                            >
                                Clear Form
                            </button>
                        </div>

                        {applications.length === 0 && (
                            <p style={styles.muted}>
                                You need at least one application before
                                scheduling an interview.
                            </p>
                        )}
                    </form>
                </section>
            )}

            {/* Scheduled Interviews section removed */}

            <section style={styles.panel}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: "0 0 6px",
                                fontSize: "20px",
                            }}
                        >
                            Candidate Applications
                        </h2>

                        <p style={{ ...styles.muted, margin: 0 }}>
                            {applications.length} application
                            {applications.length === 1 ? "" : "s"}{" "}
                            across your jobs
                        </p>
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search candidates or jobs..."
                        aria-label="Search candidates or jobs"
                        style={{
                            boxSizing: "border-box",
                            width: "min(100%, 300px)",
                            padding: "11px 13px",
                            border: "1px solid #dce1eb",
                            borderRadius: "10px",
                            fontSize: "14px",
                        }}
                    />
                </div>

                {error && (
                    <div
                        role="alert"
                        style={{
                            marginTop: "18px",
                            padding: "13px",
                            borderRadius: "10px",
                            background: "#fee2e2",
                            color: "#991b1b",
                        }}
                    >
                        {error}

                        <button
                            type="button"
                            onClick={() => loadApplications(true)}
                            style={{
                                ...styles.button,
                                marginLeft: "12px",
                            }}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {notice && (
                    <p
                        style={{
                            ...styles.muted,
                            marginTop: "14px",
                        }}
                    >
                        {notice}
                    </p>
                )}

                {loading ? (
                    <p style={styles.muted}>
                        Loading candidate applications...
                    </p>
                ) : filteredApplications.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "38px 12px",
                        }}
                    >
                        <div style={{ fontSize: "38px" }}>📋</div>

                        <h3>
                            {applications.length === 0
                                ? "No applications yet"
                                : "No matching applications"}
                        </h3>

                        <p style={styles.muted}>
                            {applications.length === 0
                                ? "Applications to your job openings will appear here."
                                : "Try another candidate name, email, job title, or status."}
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            overflowX: "auto",
                            marginTop: "22px",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                minWidth: "760px",
                                borderCollapse: "separate",
                                borderSpacing: 0,
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        textAlign: "left",
                                        background: "#f8f9fe",
                                        borderBottom:
                                            "1px solid #e7eaf1",
                                    }}
                                >
                                    {[
                                        "CANDIDATE",
                                        "JOB OPENING",
                                        "DATE APPLIED",
                                        "STATUS",
                                        "INTERVIEW",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            style={{
                                                padding: "14px 13px",
                                                fontSize: "10px",
                                                letterSpacing: "0.08em",
                                                fontWeight: 800,
                                                color: "#7a849a",
                                                whiteSpace: "nowrap",
                                                background: "#f8f9fe",
                                            }}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {filteredApplications.map(
                                    (application, index) => {
                                        const status =
                                            application.status ||
                                            "applied";

                                        const statusStyle =
                                            STATUS_COLORS[status] ||
                                            STATUS_COLORS.applied;

                                        const candidateName =
                                            application.full_name ||
                                            application.candidate_username ||
                                            application.username ||
                                            "Candidate";

                                        const email =
                                            application.candidate_email ||
                                            application.email ||
                                            "";

                                        return (
                                            <tr
                                                key={`${application.id}-${application.job_id}-${index}`}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #edf0f7",
                                                    background:
                                                        index % 2 === 0
                                                            ? "#ffffff"
                                                            : "#fcfcff",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding:
                                                            "18px 13px",
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            display:
                                                                "block",
                                                            color: "#252d43",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {candidateName}
                                                    </strong>

                                                    <div
                                                        style={{
                                                            ...styles.muted,
                                                            marginTop: "4px",
                                                        }}
                                                    >
                                                        {email ||
                                                            "Email not provided"}
                                                    </div>

                                                    {application.phone && (
                                                        <div
                                                            style={{
                                                                ...styles.muted,
                                                                marginTop:
                                                                    "3px",
                                                            }}
                                                        >
                                                            {
                                                                application.phone
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "18px 13px",
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            display:
                                                                "block",
                                                            color: "#252d43",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {
                                                            application.job_title
                                                        }
                                                    </strong>

                                                    <div
                                                        style={{
                                                            ...styles.muted,
                                                            marginTop: "4px",
                                                        }}
                                                    >
                                                        {
                                                            application.company_name
                                                        }
                                                    </div>
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "18px 13px",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {formatAppliedDate(
                                                        application.applied_date
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "18px 13px",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            ...statusStyle,
                                                            display:
                                                                "inline-block",
                                                            padding:
                                                                "5px 9px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight: 800,
                                                            marginBottom:
                                                                "8px",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {getStatusLabel(
                                                            status
                                                        )}
                                                    </span>

                                                    <br />

                                                    <select
                                                        aria-label={`Update status for ${candidateName}`}
                                                        value={status}
                                                        disabled={
                                                            updatingId ===
                                                            application.id
                                                        }
                                                        onChange={(event) =>
                                                            updateStatus(
                                                                application.id,
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        style={{
                                                            padding: "8px",
                                                            borderRadius:
                                                                "8px",
                                                            border:
                                                                "1px solid #d7dce5",
                                                            maxWidth:
                                                                "170px",
                                                        }}
                                                    >
                                                        {STATUS_OPTIONS.map(
                                                            (option) => (
                                                                <option
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>

                                                    {updatingId ===
                                                        application.id && (
                                                        <div
                                                            style={{
                                                                ...styles.muted,
                                                                marginTop:
                                                                    "4px",
                                                            }}
                                                        >
                                                            Saving...
                                                        </div>
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "18px 13px",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openInterviewForm(
                                                                application
                                                            )
                                                        }
                                                        style={{
                                                            ...styles.button,
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        + Schedule
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
