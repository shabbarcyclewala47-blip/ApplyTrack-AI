import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

const employmentLabels = {
    full_time: "Full-time",
    part_time: "Part-time",
    internship: "Internship",
    contract: "Contract",
    remote: "Remote",
};

const styles = {
    page: {
        position: "relative",
        isolation: "isolate",
        padding: "clamp(16px, 3vw, 32px)",
        background:
            "radial-gradient(ellipse at 0% 0%, rgba(139,92,246,.13), transparent 40%), radial-gradient(ellipse at 100% 20%, rgba(6,182,212,.10), transparent 38%), linear-gradient(135deg,#f8f7ff 0%,#f5f8ff 48%,#f9f5ff 100%)",
        color: "#172033",
        minHeight: "100%",
        borderRadius: "22px",
        fontFamily:
            "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
        boxSizing: "border-box",
    },
    muted: {
        color: "#718096",
        fontSize: "14px",
        lineHeight: 1.7,
    },
    field: {
        boxSizing: "border-box",
        width: "100%",
        padding: "13px 15px",
        border: "1px solid rgba(148,163,184,.30)",
        borderRadius: "12px",
        background: "rgba(255,255,255,.88)",
        fontSize: "14px",
        color: "#172033",
        outline: "none",
        transition: "all .25s ease",
        boxShadow: "0 2px 8px rgba(15,23,42,.025)",
        fontFamily: "inherit",
    },
    button: {
        border: "1px solid transparent",
        borderRadius: "11px",
        padding: "11px 17px",
        background: "linear-gradient(135deg,#7c3aed,#5b5bd6)",
        color: "#fff",
        fontWeight: 700,
        fontSize: "13px",
        cursor: "pointer",
        transition:
            "transform .25s ease, box-shadow .25s ease, background .25s ease",
        boxShadow: "0 5px 14px rgba(99,91,219,.20)",
        fontFamily: "inherit",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: 700,
        marginBottom: "8px",
        color: "#374151",
    },
    fieldGroup: {
        marginBottom: "17px",
    },
};

const globalCSS = `
    @keyframes bjFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes bjFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(3deg); }
    }

    @keyframes bjShimmer {
        0% { background-position: 180% 0; }
        100% { background-position: -180% 0; }
    }

    @keyframes bjModalIn {
        from { opacity: 0; transform: translateY(18px) scale(.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes bjPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,.12); }
        50% { box-shadow: 0 0 0 7px rgba(124,58,237,0); }
    }

    .bj-page * {
        box-sizing: border-box;
    }

    .bj-heading {
        animation: bjFadeUp .55s ease both;
        letter-spacing: -1.2px;
        background: linear-gradient(100deg,#312e81 0%,#7c3aed 48%,#0891b2 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .bj-hero {
        position: relative;
        overflow: hidden;
        padding: clamp(22px, 4vw, 34px);
        border-radius: 22px;
        background:
            radial-gradient(circle at 90% 10%,rgba(255,255,255,.20),transparent 30%),
            linear-gradient(125deg,#312e81 0%,#6d28d9 52%,#0891b2 120%);
        color: white;
        box-shadow: 0 15px 38px rgba(91,33,182,.17);
        animation: bjFadeUp .5s ease both;
    }

    .bj-hero::before {
        content: "";
        position: absolute;
        width: 220px;
        height: 220px;
        right: -55px;
        top: -95px;
        border: 1px solid rgba(255,255,255,.20);
        border-radius: 50%;
        box-shadow:
            0 0 0 25px rgba(255,255,255,.045),
            0 0 0 55px rgba(255,255,255,.035);
        animation: bjFloat 8s ease-in-out infinite;
        pointer-events: none;
    }

    .bj-hero::after {
        content: "";
        position: absolute;
        width: 90px;
        height: 90px;
        bottom: -55px;
        left: 45%;
        border-radius: 50%;
        background: rgba(255,255,255,.10);
        filter: blur(2px);
        pointer-events: none;
    }

    .bj-hero-content {
        position: relative;
        z-index: 1;
    }

    .bj-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 11px;
        border-radius: 30px;
        border: 1px solid rgba(255,255,255,.25);
        background: rgba(255,255,255,.10);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        backdrop-filter: blur(10px);
    }

    .bj-live-dot {
        width: 7px;
        height: 7px;
        background: #6ee7b7;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(110,231,183,.15);
        animation: bjPulse 2s infinite;
    }

    .bj-hero-title {
        font-size: clamp(27px, 4vw, 39px);
        font-weight: 850;
        letter-spacing: -1.4px;
        line-height: 1.15;
        margin: 17px 0 11px;
    }

    .bj-hero-description {
        color: rgba(255,255,255,.80);
        max-width: 580px;
        line-height: 1.8;
        font-size: 14px;
        margin: 0;
    }

    .bj-search-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(190px, .42fr);
        gap: 12px;
        margin: 22px 0;
        padding: 13px;
        border-radius: 17px;
        border: 1px solid rgba(255,255,255,.9);
        background: rgba(255,255,255,.68);
        box-shadow: 0 9px 28px rgba(30,41,59,.045);
        backdrop-filter: blur(15px);
        animation: bjFadeUp .6s ease both;
    }

    .bj-search-wrap {
        position: relative;
    }

    .bj-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #8b5cf6;
        font-size: 17px;
        pointer-events: none;
    }

    .bj-search-field {
        padding-left: 42px !important;
    }

    .bj-field:focus {
        border-color: #8b5cf6 !important;
        box-shadow: 0 0 0 4px rgba(139,92,246,.10) !important;
        background: #fff !important;
    }

    .bj-section-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin: 25px 0 15px;
    }

    .bj-section-title {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -.5px;
        margin: 0;
        color: #202442;
    }

    .bj-result-count {
        display: inline-flex;
        align-items: center;
        padding: 6px 11px;
        border-radius: 30px;
        background: #ede9fe;
        color: #6d28d9;
        font-size: 12px;
        font-weight: 800;
    }

    .bj-job-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit,minmax(min(100%,290px),1fr));
        gap: 17px;
        align-items: stretch;
    }

    .bj-job-card {
        position: relative;
        min-width: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 21px;
        border-radius: 18px;
        border: 1px solid rgba(226,232,240,.85);
        background: linear-gradient(155deg,rgba(255,255,255,.97),rgba(250,249,255,.92));
        box-shadow: 0 5px 18px rgba(30,41,59,.035);
        animation: bjFadeUp .5s ease both;
        transition:
            transform .3s ease,
            box-shadow .3s ease,
            border-color .3s ease,
            background .3s ease;
    }

    .bj-job-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(90deg,#8b5cf6,#06b6d4,#ec4899);
        background-size: 200% auto;
        opacity: .65;
        transition: opacity .25s ease;
    }

    .bj-job-card:hover {
        transform: translateY(-6px);
        border-color: rgba(139,92,246,.34);
        background: #fff;
        box-shadow: 0 18px 40px rgba(76,29,149,.10);
    }

    .bj-job-card:hover::before {
        opacity: 1;
        animation: bjShimmer 2.5s linear infinite;
    }

    .bj-company-avatar {
        display: grid;
        place-items: center;
        flex-shrink: 0;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        color: #fff;
        font-size: 20px;
        font-weight: 850;
        text-transform: uppercase;
        background: linear-gradient(135deg,#7c3aed,#0891b2);
        box-shadow: 0 5px 12px rgba(124,58,237,.18);
        transition: transform .3s ease;
    }

    .bj-job-card:hover .bj-company-avatar {
        transform: rotate(-5deg) scale(1.06);
    }

    .bj-job-title {
        font-size: 18px;
        line-height: 1.4;
        font-weight: 800;
        letter-spacing: -.4px;
        color: #202442;
        margin: 0 0 5px;
        overflow-wrap: anywhere;
    }

    .bj-company-name {
        font-size: 13px;
        font-weight: 700;
        color: #596579;
        overflow-wrap: anywhere;
    }

    .bj-location {
        font-size: 12px;
        color: #818ba0;
        margin-top: 5px;
        overflow-wrap: anywhere;
    }

    .bj-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        width: fit-content;
        max-width: 100%;
        padding: 6px 10px;
        border-radius: 30px;
        font-size: 11px;
        font-weight: 800;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    .bj-job-description {
        color: #657087;
        font-size: 13px;
        line-height: 1.8;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0;
    }

    .bj-salary {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #047857;
        font-size: 14px;
        font-weight: 800;
        background: linear-gradient(90deg,#ecfdf5,#f0fdf4);
        padding: 10px 12px;
        border: 1px solid #d1fae5;
        border-radius: 11px;
        width: fit-content;
        max-width: 100%;
        overflow-wrap: anywhere;
    }

    .bj-button {
        border: 1px solid transparent;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
        transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
    }

    .bj-button:not(:disabled):hover {
        transform: translateY(-2px);
        filter: brightness(1.04);
    }

    .bj-button:not(:disabled):active {
        transform: translateY(0) scale(.98);
    }

    .bj-button:disabled {
        cursor: not-allowed;
        box-shadow: none;
    }

    .bj-button-primary {
        color: #fff;
        background: linear-gradient(135deg,#7c3aed,#5b5bd6);
        box-shadow: 0 5px 13px rgba(124,58,237,.20);
    }

    .bj-button-primary:not(:disabled):hover {
        box-shadow: 0 9px 20px rgba(124,58,237,.30);
    }

    .bj-button-success {
        color: #fff;
        background: linear-gradient(135deg,#059669,#0d9488);
        box-shadow: 0 5px 13px rgba(5,150,105,.17);
    }

    .bj-button-success:not(:disabled):hover {
        box-shadow: 0 9px 20px rgba(5,150,105,.24);
    }

    .bj-button-muted {
        color: #4b5563;
        background: #f1f5f9;
        border-color: #e2e8f0;
    }

    .bj-alert {
        padding: 14px 16px;
        border-radius: 13px;
        margin: 16px 0;
        font-size: 13px;
        line-height: 1.7;
        animation: bjFadeUp .3s ease both;
    }

    .bj-empty {
        padding: 48px 22px;
        text-align: center;
        border-radius: 19px;
        border: 1px dashed #c4b5fd;
        background: rgba(255,255,255,.78);
        box-shadow: 0 8px 28px rgba(76,29,149,.04);
        animation: bjFadeUp .45s ease both;
    }

    .bj-empty-icon {
        width: 65px;
        height: 65px;
        display: grid;
        place-items: center;
        margin: 0 auto 16px;
        border-radius: 21px;
        background: linear-gradient(135deg,#ede9fe,#cffafe);
        font-size: 30px;
        animation: bjFloat 4s ease-in-out infinite;
    }

    .bj-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99998;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(15,23,42,.65);
        backdrop-filter: blur(8px);
        animation: bjFadeUp .2s ease both;
    }

    .bj-modal {
        position: relative;
        width: min(100%,680px);
        max-height: calc(100dvh - 36px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: clamp(19px,4vw,32px);
        border: 1px solid rgba(255,255,255,.85);
        border-radius: 23px;
        background: linear-gradient(145deg,#fff 0%,#faf9ff 100%);
        box-shadow: 0 30px 100px rgba(15,23,42,.30);
        animation: bjModalIn .28s ease both;
    }

    .bj-modal-heading {
        font-size: clamp(22px,3vw,29px);
        line-height: 1.25;
        letter-spacing: -.8px;
        font-weight: 850;
        color: #27204f;
        margin: 0 0 12px;
        overflow-wrap: anywhere;
    }

    .bj-form-divider {
        height: 1px;
        margin: 21px 0;
        background: linear-gradient(90deg,#ddd6fe,rgba(226,232,240,.25));
    }

    .bj-upload-box {
        padding: 15px;
        border: 1px dashed #a78bfa;
        border-radius: 13px;
        background: linear-gradient(135deg,#faf5ff,#f0f9ff);
        transition: border-color .25s ease, background .25s ease;
    }

    .bj-upload-box:focus-within {
        border-color: #7c3aed;
        background: #faf5ff;
    }

    @media (max-width: 650px) {
        .bj-search-panel {
            grid-template-columns: minmax(0,1fr);
        }

        .bj-hero-title {
            letter-spacing: -.8px;
        }

        .bj-job-card {
            padding: 17px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .bj-page *,
        .bj-page *::before,
        .bj-modal-backdrop,
        .bj-modal {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
        }
    }
`;

export default function BrowseJobs() {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState("");
    const [employmentType, setEmploymentType] = useState("all");
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicationJob, setApplicationJob] = useState(null);
    const [account, setAccount] = useState({});

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        candidate_location: "",
        cover_letter: "",
        notes: "",
    });

    const [resume, setResume] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [jobData, applicationData] = await Promise.all([
                apiRequest("jobs/"),
                apiRequest("applications/"),
            ]);

            setJobs(Array.isArray(jobData) ? jobData : jobData.results || []);
            setApplications(
                Array.isArray(applicationData)
                    ? applicationData
                    : applicationData.results || []
            );
        } catch (err) {
            setError(err.message || "Unable to load jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        apiRequest("me/")
            .then((data) => {
                setAccount(data);
                setForm((previous) => ({
                    ...previous,
                    full_name: data.full_name || data.username || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    candidate_location: data.location || "",
                }));
            })
            .catch(() => {
                // Keep application fields editable if account details cannot be loaded.
            });
    }, [loadData]);

    const appliedJobIds = new Set(
        applications
            .filter((application) => application.job != null)
            .map((application) => Number(application.job))
    );

    const filteredJobs = jobs.filter((job) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            !query ||
            (job.title || "").toLowerCase().includes(query) ||
            (job.company_name || "").toLowerCase().includes(query) ||
            (job.location || "").toLowerCase().includes(query) ||
            (job.requirements || "").toLowerCase().includes(query) ||
            (job.description || "").toLowerCase().includes(query);

        const matchesType =
            employmentType === "all" ||
            job.employment_type === employmentType;

        return matchesSearch && matchesType;
    });

    function formatSalary(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        const number = Number(value);

        if (!Number.isFinite(number)) return null;

        return number.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        });
    }

    function formatDate(value) {
        if (!value) return null;

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    }

    function openApplication(job) {
        if (appliedJobIds.has(Number(job.id))) {
            setMessage("You have already applied for this job.");
            setSelectedJob(null);
            return;
        }

        setError("");
        setMessage("");
        setResume(null);
        setApplicationJob(job);
        setSelectedJob(null);
    }

    function closeApplication() {
        if (applyingId !== null) return;

        setApplicationJob(null);
        setResume(null);
        setError("");
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleResumeChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            setResume(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setResume(null);
            event.target.value = "";
            setError("Please select a PDF resume.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setResume(null);
            event.target.value = "";
            setError("Your resume must be 5 MB or smaller.");
            return;
        }

        setError("");
        setResume(file);
    }

    async function submitApplication(event) {
        event.preventDefault();

        if (!applicationJob) return;

        if (appliedJobIds.has(Number(applicationJob.id))) {
            setError("You have already applied for this job.");
            return;
        }

        if (!resume) {
            setError("Please upload your resume in PDF format.");
            return;
        }

        setApplyingId(applicationJob.id);
        setError("");
        setMessage("");

        try {
            const formData = new FormData();

            formData.append("job_id", String(applicationJob.id));
            formData.append("full_name", form.full_name.trim());
            formData.append("phone", form.phone.trim());
            formData.append(
                "candidate_location",
                form.candidate_location.trim()
            );
            formData.append("cover_letter", form.cover_letter.trim());
            formData.append("notes", form.notes.trim());
            formData.append("resume", resume);

            await apiRequest("applications/", {
                method: "POST",
                body: formData,
            });

            setMessage(
                `Your application for ${applicationJob.title} was submitted successfully.`
            );

            setApplicationJob(null);
            setResume(null);

            await loadData();
        } catch (err) {
            setError(err.message || "Could not submit your application.");
        } finally {
            setApplyingId(null);
        }
    }

    const totalJobs = jobs.length;
    const matchingJobs = filteredJobs.length;
    const internshipJobs = filteredJobs.filter(
        (job) => job.employment_type === "internship"
    ).length;

    const jobModal = selectedJob && (
        <div
            className="bj-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-title"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    setSelectedJob(null);
                }
            }}
        >
            <section className="bj-modal">
                <div className="bj-eyebrow" style={{
                    color: "#6d28d9",
                    borderColor: "#ddd6fe",
                    background: "#f5f3ff",
                }}>
                    JOB DETAILS
                </div>

                <h2
                    id="job-details-title"
                    className="bj-modal-heading"
                    style={{ marginTop: 17 }}
                >
                    {selectedJob.title}
                </h2>

                <p style={{ fontWeight: 750, color: "#596579" }}>
                    {selectedJob.company_name}
                </p>

                <p style={styles.muted}>
                    📍 {selectedJob.location || "Location not specified"}{" "}
                    ·{" "}
                    {employmentLabels[selectedJob.employment_type] ||
                        selectedJob.employment_type}
                </p>

                {(selectedJob.salary_min || selectedJob.salary_max) && (
                    <div className="bj-salary">
                        ₹{formatSalary(selectedJob.salary_min) || "—"}
                        {" – "}
                        ₹{formatSalary(selectedJob.salary_max) || "—"}
                    </div>
                )}

                <div className="bj-form-divider" />

                <h3 style={{ color: "#30245c", fontSize: 15 }}>
                    Job Description
                </h3>
                <p style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.85,
                    color: "#5b6478",
                    fontSize: 14,
                    overflowWrap: "anywhere",
                }}>
                    {selectedJob.description || "No description provided."}
                </p>

                <h3 style={{ color: "#30245c", fontSize: 15 }}>
                    Requirements
                </h3>
                <p style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.85,
                    color: "#5b6478",
                    fontSize: 14,
                    overflowWrap: "anywhere",
                }}>
                    {selectedJob.requirements ||
                        "No additional requirements listed."}
                </p>

                {selectedJob.application_deadline && (
                    <div
                        style={{
                            padding: "12px 14px",
                            background: "#fff7ed",
                            border: "1px solid #fed7aa",
                            color: "#9a3412",
                            borderRadius: 11,
                            fontSize: 13,
                            margin: "18px 0",
                        }}
                    >
                        <strong>Application deadline:</strong>{" "}
                        {formatDate(selectedJob.application_deadline)}
                    </div>
                )}

                <div className="bj-form-divider" />

                <div style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                }}>
                    <button
                        type="button"
                        className="bj-button bj-button-muted"
                        onClick={() => setSelectedJob(null)}
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        className="bj-button bj-button-success"
                        disabled={appliedJobIds.has(Number(selectedJob.id))}
                        onClick={() => openApplication(selectedJob)}
                    >
                        {appliedJobIds.has(Number(selectedJob.id))
                            ? "✓ Already Applied"
                            : "Apply for This Job →"}
                    </button>
                </div>
            </section>
        </div>
    );

    const applicationModal = applicationJob && (
        <div
            className="bj-modal-backdrop"
            style={{ zIndex: 99999 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-title"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    closeApplication();
                }
            }}
        >
            <section className="bj-modal">
                <div className="bj-eyebrow" style={{
                    color: "#047857",
                    borderColor: "#a7f3d0",
                    background: "#ecfdf5",
                }}>
                    APPLICATION FORM
                </div>

                <h2
                    id="application-title"
                    className="bj-modal-heading"
                    style={{ marginTop: 17 }}
                >
                    Apply for {applicationJob.title}
                </h2>

                <p style={{
                    color: "#64748b",
                    fontWeight: 650,
                    fontSize: 14,
                }}>
                    {applicationJob.company_name} ·{" "}
                    {applicationJob.location || "Location not specified"}
                </p>

                <p style={styles.muted}>
                    Complete your details and upload your resume to send your
                    application to the recruiter.
                </p>

                <div className="bj-form-divider" />

                {error && (
                    <div
                        className="bj-alert"
                        role="alert"
                        style={{
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            color: "#9f1239",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={submitApplication}>
                    <div style={styles.fieldGroup}>
                        <label
                            style={styles.label}
                            htmlFor="application-name"
                        >
                            Full name *
                        </label>

                        <input
                            id="application-name"
                            name="full_name"
                            className="bj-field"
                            style={styles.field}
                            value={form.full_name}
                            onChange={updateField}
                            required
                            maxLength={150}
                            placeholder="Enter your full name"
                            autoComplete="name"
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label
                            style={styles.label}
                            htmlFor="application-email"
                        >
                            Account email
                        </label>

                        <input
                            id="application-email"
                            className="bj-field"
                            style={{
                                ...styles.field,
                                background: "#f1f5f9",
                                color: "#64748b",
                            }}
                            value={form.email || account.email || ""}
                            readOnly
                            placeholder="Email from your account"
                        />

                        <p style={{
                            ...styles.muted,
                            margin: "6px 0 0",
                            fontSize: 12,
                        }}>
                            This email is taken from your signed-in account.
                        </p>
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
                        gap: 14,
                    }}>
                        <div style={styles.fieldGroup}>
                            <label
                                style={styles.label}
                                htmlFor="application-phone"
                            >
                                Phone number *
                            </label>

                            <input
                                id="application-phone"
                                name="phone"
                                className="bj-field"
                                style={styles.field}
                                value={form.phone}
                                onChange={updateField}
                                required
                                maxLength={30}
                                type="tel"
                                autoComplete="tel"
                                placeholder="Your phone number"
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label
                                style={styles.label}
                                htmlFor="application-location"
                            >
                                Current location *
                            </label>

                            <input
                                id="application-location"
                                name="candidate_location"
                                className="bj-field"
                                style={styles.field}
                                value={form.candidate_location}
                                onChange={updateField}
                                required
                                maxLength={150}
                                placeholder="City, state"
                                autoComplete="address-level2"
                            />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label
                            style={styles.label}
                            htmlFor="application-resume"
                        >
                            Resume (PDF, maximum 5 MB) *
                        </label>

                        <div className="bj-upload-box">
                            <input
                                id="application-resume"
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleResumeChange}
                                required
                                className="bj-field"
                                style={{
                                    ...styles.field,
                                    padding: 9,
                                    background: "rgba(255,255,255,.9)",
                                }}
                            />

                            {resume && (
                                <p style={{
                                    color: "#047857",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    margin: "9px 0 0",
                                    overflowWrap: "anywhere",
                                }}>
                                    ✓ Selected: {resume.name}
                                </p>
                            )}

                            <p style={{
                                ...styles.muted,
                                fontSize: 12,
                                margin: "8px 0 0",
                            }}>
                                PDF format only · Maximum file size 5 MB
                            </p>
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label
                            style={styles.label}
                            htmlFor="application-cover-letter"
                        >
                            Cover letter
                        </label>

                        <textarea
                            id="application-cover-letter"
                            name="cover_letter"
                            className="bj-field"
                            style={{
                                ...styles.field,
                                minHeight: 115,
                                resize: "vertical",
                                lineHeight: 1.7,
                            }}
                            value={form.cover_letter}
                            onChange={updateField}
                            maxLength={10000}
                            placeholder="Explain why you are suitable for this role..."
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label
                            style={styles.label}
                            htmlFor="application-notes"
                        >
                            Additional notes
                        </label>

                        <textarea
                            id="application-notes"
                            name="notes"
                            className="bj-field"
                            style={{
                                ...styles.field,
                                minHeight: 85,
                                resize: "vertical",
                                lineHeight: 1.7,
                            }}
                            value={form.notes}
                            onChange={updateField}
                            maxLength={5000}
                            placeholder="Anything else you want the recruiter to know?"
                        />
                    </div>

                    <div className="bj-form-divider" />

                    <div style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                    }}>
                        <button
                            type="button"
                            className="bj-button bj-button-muted"
                            disabled={applyingId !== null}
                            onClick={closeApplication}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bj-button bj-button-success"
                            disabled={applyingId !== null}
                            style={{
                                opacity: applyingId !== null ? .7 : 1,
                                minWidth: 170,
                            }}
                        >
                            {applyingId === applicationJob.id
                                ? "Submitting..."
                                : "Submit Application →"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );

    return (
        <main className="bj-page" style={styles.page}>
            <style>{globalCSS}</style>

            <header className="bj-hero">
                <div className="bj-hero-content">
                    <div className="bj-eyebrow">
                        <span className="bj-live-dot" />
                        YOUR NEXT OPPORTUNITY
                    </div>

                    <h1 className="bj-hero-title">
                        Find work that moves<br />
                        your career forward.
                    </h1>

                    <p className="bj-hero-description">
                        Discover exciting opportunities, explore companies,
                        and take the next step in your professional journey.
                        Your next chapter starts here.
                    </p>
                </div>
            </header>

            <div className="bj-section-heading">
                <div>
                    <h2 className="bj-section-title">
                        Explore Opportunities
                    </h2>
                    <p style={{
                        ...styles.muted,
                        margin: "5px 0 0",
                        fontSize: 13,
                    }}>
                        Find the role that matches your ambitions.
                    </p>
                </div>

                <span className="bj-result-count">
                    {matchingJobs} {matchingJobs === 1 ? "JOB" : "JOBS"} FOUND
                </span>
            </div>

            <div className="bj-search-panel">
                <div className="bj-search-wrap">
                    <span className="bj-search-icon" aria-hidden="true">
                        ⌕
                    </span>

                    <input
                        className="bj-field bj-search-field"
                        style={styles.field}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search jobs, companies, skills..."
                        aria-label="Search jobs"
                    />
                </div>

                <select
                    className="bj-field"
                    style={styles.field}
                    value={employmentType}
                    onChange={(event) => setEmploymentType(event.target.value)}
                    aria-label="Filter by employment type"
                >
                    <option value="all">All employment types</option>

                    {Object.entries(employmentLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            {error && !applicationJob && (
                <div
                    className="bj-alert"
                    role="alert"
                    style={{
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#9f1239",
                    }}
                >
                    <strong>Something went wrong.</strong>
                    <div>{error}</div>

                    <div style={{
                        display: "flex",
                        gap: 9,
                        flexWrap: "wrap",
                        marginTop: 10,
                    }}>
                        <button
                            type="button"
                            className="bj-button bj-button-primary"
                            onClick={loadData}
                        >
                            Try Again
                        </button>

                        <button
                            type="button"
                            className="bj-button bj-button-muted"
                            onClick={() => setError("")}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <div
                    className="bj-alert"
                    role="status"
                    style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#065f46",
                    }}
                >
                    <strong>✓ </strong>
                    {message}

                    <button
                        type="button"
                        className="bj-button bj-button-muted"
                        style={{
                            marginLeft: 12,
                            padding: "6px 10px",
                        }}
                        onClick={() => setMessage("")}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="bj-section-heading">
                <h2 className="bj-section-title">
                    {search || employmentType !== "all"
                        ? "Matching Jobs"
                        : "Latest Opportunities"}
                </h2>

                <span style={{
                    color: "#8b93a7",
                    fontSize: 12,
                    fontWeight: 650,
                }}>
                    {loading
                        ? "Loading opportunities..."
                        : `${totalJobs} published ${totalJobs === 1 ? "position" : "positions"}`}
                </span>
            </div>

            {loading ? (
                <section className="bj-empty" aria-live="polite">
                    <div className="bj-empty-icon">✨</div>
                    <h3 style={{
                        color: "#30245c",
                        fontSize: 18,
                    }}>
                        Finding opportunities for you
                    </h3>
                    <p style={styles.muted}>
                        Please wait while we load the latest jobs.
                    </p>
                </section>
            ) : filteredJobs.length === 0 ? (
                <section className="bj-empty">
                    <div className="bj-empty-icon">🔎</div>

                    <h3 style={{
                        color: "#30245c",
                        fontSize: 19,
                        margin: "0 0 8px",
                    }}>
                        No matching jobs found
                    </h3>

                    <p style={{
                        ...styles.muted,
                        maxWidth: 410,
                        margin: "0 auto 20px",
                    }}>
                        {jobs.length === 0
                            ? "There are no published jobs yet. Check back when recruiters add new opportunities."
                            : "Try a different keyword or employment type to discover more opportunities."}
                    </p>

                    {(search || employmentType !== "all") && (
                        <button
                            type="button"
                            className="bj-button bj-button-primary"
                            onClick={() => {
                                setSearch("");
                                setEmploymentType("all");
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </section>
            ) : (
                <div className="bj-job-grid">
                    {filteredJobs.map((job, index) => {
                        const alreadyApplied = appliedJobIds.has(Number(job.id));
                        const minimum = formatSalary(job.salary_min);
                        const maximum = formatSalary(job.salary_max);

                        return (
                            <article
                                key={job.id}
                                className="bj-job-card"
                                style={{
                                    animationDelay: `${Math.min(index * 65, 390)}ms`,
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 13,
                                }}>
                                    <div className="bj-company-avatar">
                                        {(job.company_name || job.title || "J")
                                            .trim()
                                            .charAt(0)}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <h3 className="bj-job-title">
                                            {job.title}
                                        </h3>

                                        <div className="bj-company-name">
                                            {job.company_name}
                                        </div>

                                        <div className="bj-location">
                                            📍 {job.location || "Location not specified"}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: "flex",
                                    gap: 7,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}>
                                    <span
                                        className="bj-chip"
                                        style={{
                                            color: "#6d28d9",
                                            background: "linear-gradient(135deg,#f3e8ff,#ede9fe)",
                                            border: "1px solid #ddd6fe",
                                        }}
                                    >
                                        ✦{" "}
                                        {employmentLabels[job.employment_type] ||
                                            job.employment_type ||
                                            "Employment type not specified"}
                                    </span>

                                    {alreadyApplied && (
                                        <span
                                            className="bj-chip"
                                            style={{
                                                background: "#ecfdf5",
                                                color: "#047857",
                                                border: "1px solid #a7f3d0",
                                            }}
                                        >
                                            ✓ Applied
                                        </span>
                                    )}
                                </div>

                                {job.application_deadline && (
                                    <div style={{
                                        fontSize: 12,
                                        color: "#a16207",
                                        background: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        padding: "8px 10px",
                                        borderRadius: 10,
                                    }}>
                                        ◷ Deadline:{" "}
                                        {formatDate(job.application_deadline)}
                                    </div>
                                )}

                                {(minimum || maximum) && (
                                    <div className="bj-salary">
                                        <span>↗</span>
                                        <span>
                                            {minimum && maximum
                                                ? `₹${minimum} – ₹${maximum}`
                                                : minimum
                                                    ? `From ₹${minimum}`
                                                    : `Up to ₹${maximum}`}
                                        </span>
                                    </div>
                                )}

                                <p className="bj-job-description">
                                    {job.description ||
                                        "Explore this opportunity and learn more about the role."}
                                </p>

                                <div style={{
                                    display: "flex",
                                    gap: 9,
                                    marginTop: "auto",
                                    paddingTop: 3,
                                    flexWrap: "wrap",
                                }}>
                                    <button
                                        type="button"
                                        className="bj-button bj-button-primary"
                                        style={{ flex: "1 1 110px" }}
                                        onClick={() => {
                                            setError("");
                                            setSelectedJob(job);
                                        }}
                                    >
                                        View Details
                                    </button>

                                    <button
                                        type="button"
                                        disabled={alreadyApplied}
                                        className="bj-button bj-button-success"
                                        style={{
                                            flex: "1 1 110px",
                                            opacity: alreadyApplied ? .7 : 1,
                                        }}
                                        onClick={() => openApplication(job)}
                                    >
                                        {alreadyApplied
                                            ? "✓ Applied"
                                            : "Apply Now →"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedJob &&
                createPortal(jobModal, document.body)}

            {applicationJob &&
                createPortal(applicationModal, document.body)}
        </main>
    );
}