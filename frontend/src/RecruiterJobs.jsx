
import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import ApplicantsPanel from "./ApplicantsPanel";

const emptyJob = {
    company_name: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    employment_type: "full_time",
    salary_min: "",
    salary_max: "",
    application_deadline: "",
    status: "draft",
};

const employmentTypes = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contract" },
    { value: "remote", label: "Remote" },
];

const statusConfig = {
    draft: {
        label: "Draft",
        color: "#64748b",
        background: "#f1f5f9",
        dot: "#94a3b8",
    },
    published: {
        label: "Published",
        color: "#047857",
        background: "#d1fae5",
        dot: "#10b981",
    },
    closed: {
        label: "Closed",
        color: "#b45309",
        background: "#fef3c7",
        dot: "#f59e0b",
    },
};

function formatSalary(value) {
    if (value === null || value === undefined || value === "") return null;

    const amount = Number(value);

    if (!Number.isFinite(amount)) return null;

    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function RecruiterJobs() {
    const [jobs, setJobs] = useState([]);
    const [form, setForm] = useState(emptyJob);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);

    async function loadJobs() {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("recruiter/jobs/");
            setJobs(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError(err.message || "Unable to load recruiter jobs.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadJobs();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function resetForm() {
        setForm(emptyJob);
        setEditingId(null);
        setError("");
        setMessage("");
    }

    function startEditing(job) {
        setForm({
            company_name: job.company_name || "",
            title: job.title || "",
            description: job.description || "",
            requirements: job.requirements || "",
            location: job.location || "",
            employment_type: job.employment_type || "full_time",
            salary_min: job.salary_min ?? "",
            salary_max: job.salary_max ?? "",
            application_deadline: job.application_deadline || "",
            status: job.status || "draft",
        });

        setEditingId(job.id);
        setError("");
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setMessage("");

        if (
            form.salary_min !== "" &&
            form.salary_max !== "" &&
            Number(form.salary_min) > Number(form.salary_max)
        ) {
            setError("Minimum salary cannot exceed maximum salary.");
            setSaving(false);
            return;
        }

        const payload = {
            ...form,
            salary_min: form.salary_min === "" ? null : form.salary_min,
            salary_max: form.salary_max === "" ? null : form.salary_max,
            application_deadline: form.application_deadline || null,
        };

        try {
            if (editingId !== null) {
                await apiRequest(`recruiter/jobs/${editingId}/`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });

                setMessage("Job opening updated successfully.");
            } else {
                await apiRequest("recruiter/jobs/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setMessage("Your new job opening has been created.");
            }

            setForm(emptyJob);
            setEditingId(null);

            await loadJobs();
        } catch (err) {
            setError(
                err.message ||
                    "Could not save the job. Check the required fields and try again."
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(job, status) {
        setError("");
        setMessage("");

        try {
            await apiRequest(`recruiter/jobs/${job.id}/`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });

            setMessage(
                `"${job.title}" is now ${status}.`
            );

            await loadJobs();
        } catch (err) {
            setError(err.message || "Unable to update job status.");
        }
    }

    async function deleteJob(job) {
        const confirmed = window.confirm(
            `Delete "${job.title}" at ${job.company_name}? This cannot be undone.`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await apiRequest(`recruiter/jobs/${job.id}/`, {
                method: "DELETE",
            });

            setJobs((previous) =>
                previous.filter((item) => item.id !== job.id)
            );

            if (editingId === job.id) {
                setForm(emptyJob);
                setEditingId(null);
            }

            setMessage("Job opening deleted successfully.");
        } catch (err) {
            setError(err.message || "Unable to delete this job.");
        }
    }

    const query = search.trim().toLowerCase();

    const filteredJobs = jobs.filter((job) => {
        return (
            (job.title || "").toLowerCase().includes(query) ||
            (job.company_name || "").toLowerCase().includes(query) ||
            (job.location || "").toLowerCase().includes(query) ||
            (job.status || "").toLowerCase().includes(query)
        );
    });

    const publishedCount = jobs.filter(
        (job) => job.status === "published"
    ).length;

    const draftCount = jobs.filter(
        (job) => job.status === "draft"
    ).length;

    const closedCount = jobs.filter(
        (job) => job.status === "closed"
    ).length;

    const stats = [
        {
            label: "Total openings",
            value: jobs.length,
            icon: "▤",
            accent: "#4f46e5",
            background: "#eef2ff",
            description: "All your job listings",
        },
        {
            label: "Published",
            value: publishedCount,
            icon: "✓",
            accent: "#059669",
            background: "#d1fae5",
            description: "Visible job openings",
        },
        {
            label: "Drafts",
            value: draftCount,
            icon: "✎",
            accent: "#d97706",
            background: "#fef3c7",
            description: "Not yet published",
        },
        {
            label: "Closed",
            value: closedCount,
            icon: "◷",
            accent: "#64748b",
            background: "#f1f5f9",
            description: "No longer accepting",
        },
    ];

    const styles = `
        .rj-page {
            --rj-primary: #4f46e5;
            --rj-primary-dark: #3730a3;
            --rj-text: #172033;
            --rj-muted: #738096;
            --rj-border: #e6eaf1;
            --rj-surface: #ffffff;
            --rj-bg: #f6f8fc;

            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            padding: clamp(16px, 3vw, 32px);
            border-radius: 20px;
            background: var(--rj-bg);
            color: var(--rj-text);
            font-family: "DM Sans", "Segoe UI", sans-serif;
        }

        .rj-page *,
        .rj-page *::before,
        .rj-page *::after {
            box-sizing: border-box;
        }

        .rj-page button,
        .rj-page input,
        .rj-page select,
        .rj-page textarea {
            font: inherit;
        }

        .rj-page button {
            -webkit-tap-highlight-color: transparent;
        }

        .rj-page button:focus-visible,
        .rj-page input:focus-visible,
        .rj-page select:focus-visible,
        .rj-page textarea:focus-visible {
            outline: 3px solid rgba(79, 70, 229, 0.22);
            outline-offset: 3px;
        }

        .rj-hero {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 22px;
            overflow: hidden;
            padding: clamp(22px, 3vw, 34px);
            border: 1px solid #dfe5ff;
            border-radius: 22px;
            background:
                radial-gradient(circle at 90% 10%, rgba(99, 102, 241, .13), transparent 34%),
                linear-gradient(120deg, #ffffff, #f1f4ff);
            animation: rj-enter .4s ease both;
        }

        .rj-hero-content {
            position: relative;
            z-index: 1;
            min-width: 0;
        }

        .rj-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            color: #4f46e5;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.6px;
            text-transform: uppercase;
        }

        .rj-eyebrow-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, .12);
        }

        .rj-hero h1 {
            margin: 0 0 10px;
            color: #172033;
            font-family: Manrope, "Segoe UI", sans-serif;
            font-size: clamp(25px, 3vw, 36px);
            font-weight: 800;
            letter-spacing: -1.1px;
            line-height: 1.25;
        }

        .rj-hero p {
            max-width: 590px;
            margin: 0;
            color: #6b778c;
            font-size: 13px;
            line-height: 1.85;
        }

        .rj-hero-icon {
            display: grid;
            place-items: center;
            flex: 0 0 82px;
            width: 82px;
            height: 82px;
            border: 1px solid #dfe3ff;
            border-radius: 24px;
            background: linear-gradient(145deg, #fff, #e4e9ff);
            color: #4f46e5;
            font-size: 37px;
            box-shadow: 0 12px 28px rgba(79, 70, 229, .10);
            animation: rj-float 4s ease-in-out infinite;
        }

        .rj-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 15px;
            margin: 22px 0;
            animation: rj-enter .45s ease .04s both;
        }

        .rj-stat {
            position: relative;
            min-width: 0;
            overflow: hidden;
            padding: 19px;
            border: 1px solid var(--rj-border);
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 4px 15px rgba(26, 38, 68, .025);
            transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }

        .rj-stat:hover {
            transform: translateY(-3px);
            border-color: #d7ddf8;
            box-shadow: 0 10px 25px rgba(26, 38, 68, .06);
        }

        .rj-stat-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .rj-stat-icon {
            display: grid;
            place-items: center;
            width: 39px;
            height: 39px;
            flex: 0 0 39px;
            border-radius: 12px;
            font-size: 19px;
            font-weight: 800;
        }

        .rj-stat-label {
            margin: 0;
            color: #68758b;
            font-size: 11px;
            font-weight: 700;
        }

        .rj-stat-value {
            margin: 15px 0 5px;
            font-family: Manrope, "Segoe UI", sans-serif;
            font-size: 31px;
            font-weight: 800;
            letter-spacing: -1px;
            line-height: 1.1;
        }

        .rj-stat-description {
            margin: 0;
            color: #929caf;
            font-size: 10px;
            line-height: 1.6;
        }

        .rj-alert {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin: 0 0 17px;
            padding: 13px 15px;
            border: 1px solid;
            border-radius: 12px;
            font-size: 12px;
            line-height: 1.7;
            overflow-wrap: anywhere;
            animation: rj-enter .25s ease both;
        }

        .rj-alert-error {
            border-color: #fecaca;
            background: #fff1f2;
            color: #b91c1c;
        }

        .rj-alert-success {
            border-color: #a7f3d0;
            background: #ecfdf5;
            color: #065f46;
        }

        .rj-card {
            min-width: 0;
            margin-bottom: 21px;
            padding: clamp(18px, 2.4vw, 26px);
            border: 1px solid var(--rj-border);
            border-radius: 19px;
            background: var(--rj-surface);
            box-shadow: 0 5px 20px rgba(26, 38, 68, .025);
            animation: rj-enter .45s ease both;
        }

        .rj-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 23px;
        }

        .rj-card-heading {
            min-width: 0;
        }

        .rj-section-label {
            display: block;
            margin-bottom: 7px;
            color: #6366f1;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.4px;
            text-transform: uppercase;
        }

        .rj-card h2 {
            margin: 0 0 7px;
            color: #1e293b;
            font-family: Manrope, "Segoe UI", sans-serif;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -.45px;
            line-height: 1.4;
        }

        .rj-card-subtitle {
            margin: 0;
            color: var(--rj-muted);
            font-size: 12px;
            line-height: 1.8;
        }

        .rj-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 19px;
        }

        .rj-field {
            display: block;
            min-width: 0;
            color: #39465b;
            font-size: 11px;
            font-weight: 800;
        }

        .rj-required {
            color: #dc2626;
        }

        .rj-input {
            display: block;
            width: 100%;
            min-width: 0;
            min-height: 44px;
            margin-top: 8px;
            padding: 11px 13px;
            border: 1px solid #dfe5ef;
            border-radius: 11px;
            outline: none;
            background: #fff;
            color: #1e293b;
            font-size: 12px !important;
            font-weight: 500;
            transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }

        .rj-input::placeholder {
            color: #a0a9ba;
        }

        .rj-input:hover {
            border-color: #c4cce0;
        }

        .rj-input:focus {
            border-color: #818cf8;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, .09);
        }

        .rj-textarea {
            min-height: 120px;
            resize: vertical;
            line-height: 1.8;
        }

        .rj-field-full {
            margin-top: 20px;
        }

        .rj-form-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 13px;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #eef0f5;
        }

        .rj-form-hint {
            max-width: 350px;
            margin: 0;
            color: #8792a6;
            font-size: 10px;
            line-height: 1.8;
        }

        .rj-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 9px;
        }

        .rj-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 38px;
            padding: 10px 14px;
            border: 1px solid transparent;
            border-radius: 10px;
            cursor: pointer;
            font-size: 11px !important;
            font-weight: 800;
            line-height: 1.3;
            text-decoration: none;
            transition: transform .18s ease, background .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .rj-btn:hover:not(:disabled) {
            transform: translateY(-2px);
        }

        .rj-btn:active:not(:disabled) {
            transform: translateY(0);
        }

        .rj-btn:disabled {
            opacity: .6;
            cursor: not-allowed;
        }

        .rj-btn-primary {
            background: linear-gradient(115deg, #4f46e5, #4338ca);
            color: #fff;
            box-shadow: 0 5px 12px rgba(79, 70, 229, .15);
        }

        .rj-btn-primary:hover:not(:disabled) {
            box-shadow: 0 8px 18px rgba(79, 70, 229, .24);
        }

        .rj-btn-secondary {
            border-color: #e2e7f0;
            background: #f8fafc;
            color: #475569;
        }

        .rj-btn-secondary:hover:not(:disabled) {
            background: #eef2f7;
        }

        .rj-btn-success {
            background: #d1fae5;
            color: #047857;
        }

        .rj-btn-success:hover:not(:disabled) {
            background: #a7f3d0;
        }

        .rj-btn-warning {
            background: #fef3c7;
            color: #92400e;
        }

        .rj-btn-warning:hover:not(:disabled) {
            background: #fde68a;
        }

        .rj-btn-danger {
            border-color: #fee2e2;
            background: #fff1f2;
            color: #b91c1c;
        }

        .rj-btn-danger:hover:not(:disabled) {
            background: #ffe4e6;
        }

        .rj-btn-applicants {
            border-color: #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
        }

        .rj-btn-applicants:hover:not(:disabled) {
            background: #dbeafe;
        }

        .rj-jobs-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 17px;
        }

        .rj-jobs-toolbar .rj-card-heading {
            flex: 1 1 220px;
        }

        .rj-search-wrap {
            position: relative;
            flex: 0 1 280px;
            min-width: 180px;
        }

        .rj-search-icon {
            position: absolute;
            top: 50%;
            left: 13px;
            color: #8994a8;
            font-size: 17px;
            transform: translateY(-50%);
            pointer-events: none;
        }

        .rj-search {
            padding-left: 38px;
            margin-top: 0;
        }

        .rj-results-count {
            margin: 0 0 13px;
            color: #8994a8;
            font-size: 10px;
        }

        .rj-job-list {
            display: grid;
            gap: 13px;
        }

        .rj-job {
            min-width: 0;
            padding: 20px;
            border: 1px solid #e7ebf3;
            border-radius: 15px;
            background: linear-gradient(120deg, #fff, #fdfdff);
            transition: border-color .22s ease, box-shadow .22s ease, transform .22s ease;
        }

        .rj-job:hover {
            border-color: #d5dcf5;
            box-shadow: 0 8px 22px rgba(26, 38, 68, .045);
            transform: translateY(-2px);
        }

        .rj-job-main {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
        }

        .rj-job-info {
            flex: 1 1 300px;
            min-width: 0;
        }

        .rj-job-title-row {
            display: flex;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 7px;
        }

        .rj-job h3 {
            margin: 0;
            color: #1e293b;
            font-family: Manrope, "Segoe UI", sans-serif;
            font-size: 17px;
            font-weight: 800;
            line-height: 1.5;
            overflow-wrap: anywhere;
        }

        .rj-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 800;
        }

        .rj-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .rj-company {
            margin: 0 0 12px;
            color: #58657a;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.7;
            overflow-wrap: anywhere;
        }

        .rj-job-description {
            display: -webkit-box;
            overflow: hidden;
            margin: 12px 0;
            color: #758196;
            font-size: 11px;
            line-height: 1.9;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 4;
        }

        .rj-job-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
        }

        .rj-meta-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 9px;
            border: 1px solid #edf0f5;
            border-radius: 8px;
            background: #f8fafc;
            color: #657188;
            font-size: 10px;
            line-height: 1.5;
        }

        .rj-job-actions {
            display: flex;
            flex: 0 1 270px;
            align-items: flex-start;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 7px;
        }

        .rj-empty {
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;
            padding: 45px 15px;
            border: 1px dashed #dce2ed;
            border-radius: 14px;
            background: #fafbfe;
            text-align: center;
        }

        .rj-empty-icon {
            display: grid;
            place-items: center;
            width: 58px;
            height: 58px;
            margin-bottom: 13px;
            border-radius: 18px;
            background: #eef2ff;
            color: #4f46e5;
            font-size: 28px;
        }

        .rj-empty h3 {
            margin: 0 0 7px;
            color: #334155;
            font-size: 15px;
        }

        .rj-empty p {
            max-width: 350px;
            margin: 0;
            color: #8994a8;
            font-size: 11px;
            line-height: 1.8;
        }

        .rj-loading {
            padding: 38px 12px;
            color: #738096;
            text-align: center;
            font-size: 12px;
        }

        .rj-spinner {
            display: inline-block;
            width: 22px;
            height: 22px;
            margin-bottom: 10px;
            border: 2px solid #e0e7ff;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: rj-spin .7s linear infinite;
        }

        @keyframes rj-enter {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes rj-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }

        @keyframes rj-spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 1050px) {
            .rj-stats {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .rj-job-main {
                flex-direction: column;
            }

            .rj-job-actions {
                flex: 1 1 auto;
                justify-content: flex-start;
                width: 100%;
            }
        }

        @media (max-width: 650px) {
            .rj-page {
                padding: 13px;
                border-radius: 14px;
            }

            .rj-hero {
                padding: 22px 18px;
                border-radius: 17px;
            }

            .rj-hero h1 {
                font-size: 26px;
            }

            .rj-hero p {
                font-size: 11px;
            }

            .rj-hero-icon {
                flex-basis: 49px;
                width: 49px;
                height: 49px;
                border-radius: 15px;
                font-size: 24px;
            }

            .rj-stats {
                gap: 10px;
                margin: 14px 0;
            }

            .rj-stat {
                padding: 14px;
                border-radius: 14px;
            }

            .rj-stat-icon {
                width: 32px;
                height: 32px;
                flex-basis: 32px;
                border-radius: 10px;
                font-size: 15px;
            }

            .rj-stat-value {
                margin-top: 12px;
                font-size: 26px;
            }

            .rj-card {
                padding: 17px;
                border-radius: 15px;
            }

            .rj-card h2 {
                font-size: 18px;
            }

            .rj-form-grid {
                grid-template-columns: minmax(0, 1fr);
                gap: 15px;
            }

            .rj-field-full {
                margin-top: 16px;
            }

            .rj-form-footer {
                align-items: flex-start;
                flex-direction: column;
            }

            .rj-form-footer .rj-actions {
                width: 100%;
            }

            .rj-form-footer .rj-btn {
                flex: 1 1 auto;
            }

            .rj-jobs-toolbar {
                align-items: stretch;
                flex-direction: column;
            }

            .rj-search-wrap {
                flex: 1 1 auto;
                width: 100%;
            }

            .rj-job {
                padding: 15px;
            }

            .rj-job h3 {
                font-size: 15px;
            }

            .rj-job-actions {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .rj-job-actions .rj-btn {
                width: 100%;
                padding: 10px 7px;
                font-size: 10px !important;
            }
        }

        @media (max-width: 360px) {
            .rj-hero-icon {
                display: none;
            }

            .rj-stats {
                grid-template-columns: minmax(0, 1fr);
            }

            .rj-job-actions {
                grid-template-columns: minmax(0, 1fr);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .rj-page *,
            .rj-page *::before,
            .rj-page *::after {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: .01ms !important;
            }
        }
    `;

    if (selectedJob) {
        return (
            <>
                <style>{styles}</style>
                <ApplicantsPanel
                    job={selectedJob}
                    onBack={() => {
                        setSelectedJob(null);
                        loadJobs();
                    }}
                />
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>

            <div className="rj-page">
                <header className="rj-hero">
                    <div className="rj-hero-content">
                        <div className="rj-eyebrow">
                            <span className="rj-eyebrow-dot" />
                            ApplyTrack AI · Recruiter
                        </div>

                        <h1>Recruiter Workspace</h1>

                        <p>
                            Build your team with confidence. Create job openings,
                            manage listings, and review applicants from one organized
                            workspace.
                        </p>
                    </div>

                    <div className="rj-hero-icon" aria-hidden="true">
                        ▤
                    </div>
                </header>

                <section className="rj-stats" aria-label="Job statistics">
                    {stats.map((stat) => (
                        <article className="rj-stat" key={stat.label}>
                            <div className="rj-stat-top">
                                <p className="rj-stat-label">{stat.label}</p>

                                <div
                                    className="rj-stat-icon"
                                    style={{
                                        background: stat.background,
                                        color: stat.accent,
                                    }}
                                    aria-hidden="true"
                                >
                                    {stat.icon}
                                </div>
                            </div>

                            <div
                                className="rj-stat-value"
                                style={{ color: stat.accent }}
                            >
                                {stat.value}
                            </div>

                            <p className="rj-stat-description">
                                {stat.description}
                            </p>
                        </article>
                    ))}
                </section>

                {error && (
                    <div className="rj-alert rj-alert-error" role="alert">
                        <span aria-hidden="true">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="rj-alert rj-alert-success" role="status">
                        <span aria-hidden="true">✓</span>
                        <span>{message}</span>
                    </div>
                )}

                <section className="rj-card">
                    <div className="rj-card-header">
                        <div className="rj-card-heading">
                            <span className="rj-section-label">
                                {editingId !== null ? "Update listing" : "Hiring management"}
                            </span>

                            <h2>
                                {editingId !== null
                                    ? "Edit Job Opening"
                                    : "Create a Job Opening"}
                            </h2>

                            <p className="rj-card-subtitle">
                                Add clear details so candidates understand the role.
                                Fields marked * are required.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="rj-form-grid">
                            <label className="rj-field">
                                Company name <span className="rj-required">*</span>
                                <input
                                    className="rj-input"
                                    name="company_name"
                                    value={form.company_name}
                                    onChange={handleChange}
                                    required
                                    maxLength={200}
                                    placeholder="e.g. ApplyTrack Technologies"
                                />
                            </label>

                            <label className="rj-field">
                                Job title <span className="rj-required">*</span>
                                <input
                                    className="rj-input"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    maxLength={200}
                                    placeholder="e.g. Full Stack Developer"
                                />
                            </label>

                            <label className="rj-field">
                                Location
                                <input
                                    className="rj-input"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Mumbai, India or Remote"
                                />
                            </label>

                            <label className="rj-field">
                                Employment type
                                <select
                                    className="rj-input"
                                    name="employment_type"
                                    value={form.employment_type}
                                    onChange={handleChange}
                                >
                                    {employmentTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="rj-field">
                                Minimum annual salary
                                <input
                                    className="rj-input"
                                    type="number"
                                    name="salary_min"
                                    value={form.salary_min}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 300000"
                                />
                            </label>

                            <label className="rj-field">
                                Maximum annual salary
                                <input
                                    className="rj-input"
                                    type="number"
                                    name="salary_max"
                                    value={form.salary_max}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g. 600000"
                                />
                            </label>

                            <label className="rj-field">
                                Application deadline
                                <input
                                    className="rj-input"
                                    type="date"
                                    name="application_deadline"
                                    value={form.application_deadline}
                                    onChange={handleChange}
                                />
                            </label>

                            <label className="rj-field">
                                Listing status
                                <select
                                    className="rj-input"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </label>
                        </div>

                        <label className="rj-field rj-field-full">
                            Job description <span className="rj-required">*</span>
                            <textarea
                                className="rj-input rj-textarea"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                required
                                placeholder="Describe the role, responsibilities, team, and what the successful candidate will do..."
                            />
                        </label>

                        <label className="rj-field rj-field-full">
                            Requirements and qualifications
                            <textarea
                                className="rj-input rj-textarea"
                                style={{ minHeight: "95px" }}
                                name="requirements"
                                value={form.requirements}
                                onChange={handleChange}
                                placeholder="List the required skills, experience, education, and qualifications..."
                            />
                        </label>

                        <div className="rj-form-footer">
                            <p className="rj-form-hint">
                                Tip: Clear job descriptions and requirements help
                                candidates decide whether the role is right for them.
                            </p>

                            <div className="rj-actions">
                                {editingId !== null && (
                                    <button
                                        type="button"
                                        className="rj-btn rj-btn-secondary"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    className="rj-btn rj-btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !== null
                                          ? "✓ Save Changes"
                                          : "+ Create Job Opening"}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="rj-card">
                    <div className="rj-jobs-toolbar">
                        <div className="rj-card-heading">
                            <span className="rj-section-label">Your listings</span>
                            <h2>Your Job Openings</h2>
                            <p className="rj-card-subtitle">
                                Manage listings and review candidates for each role.
                            </p>
                        </div>

                        <label className="rj-search-wrap">
                            <span className="rj-search-icon" aria-hidden="true">
                                ⌕
                            </span>

                            <input
                                className="rj-input rj-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search job openings..."
                                aria-label="Search job openings"
                            />
                        </label>
                    </div>

                    {!loading && (
                        <p className="rj-results-count">
                            Showing {filteredJobs.length} of {jobs.length} job{" "}
                            {jobs.length === 1 ? "opening" : "openings"}
                        </p>
                    )}

                    {loading ? (
                        <div className="rj-loading" role="status">
                            <div className="rj-spinner" />
                            <div>Loading your job openings...</div>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="rj-empty">
                            <div className="rj-empty-icon" aria-hidden="true">
                                ▤
                            </div>

                            <h3>
                                {jobs.length === 0
                                    ? "Your next great hire starts here"
                                    : "No matching jobs found"}
                            </h3>

                            <p>
                                {jobs.length === 0
                                    ? "Create your first job opening using the form above. Your listings will appear here."
                                    : "Try another search term or clear the search field to see all your job openings."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    className="rj-btn rj-btn-secondary"
                                    style={{ marginTop: "16px" }}
                                    onClick={() => setSearch("")}
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="rj-job-list">
                            {filteredJobs.map((job) => {
                                const status =
                                    statusConfig[job.status] || statusConfig.draft;

                                const employmentLabel =
                                    employmentTypes.find(
                                        (type) => type.value === job.employment_type
                                    )?.label || job.employment_type || "Not specified";

                                const salaryMin = formatSalary(job.salary_min);
                                const salaryMax = formatSalary(job.salary_max);

                                let salaryText = "";

                                if (salaryMin && salaryMax) {
                                    salaryText = `₹${salaryMin} – ₹${salaryMax}`;
                                } else if (salaryMin) {
                                    salaryText = `From ₹${salaryMin}`;
                                } else if (salaryMax) {
                                    salaryText = `Up to ₹${salaryMax}`;
                                }

                                return (
                                    <article className="rj-job" key={job.id}>
                                        <div className="rj-job-main">
                                            <div className="rj-job-info">
                                                <div className="rj-job-title-row">
                                                    <h3>{job.title}</h3>

                                                    <span
                                                        className="rj-status"
                                                        style={{
                                                            color: status.color,
                                                            background: status.background,
                                                        }}
                                                    >
                                                        <span
                                                            className="rj-status-dot"
                                                            style={{
                                                                background: status.dot,
                                                            }}
                                                        />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <p className="rj-company">
                                                    {job.company_name}
                                                </p>

                                                {job.description && (
                                                    <p className="rj-job-description">
                                                        {job.description}
                                                    </p>
                                                )}

                                                <div className="rj-job-meta">
                                                    {job.location && (
                                                        <span className="rj-meta-pill">
                                                            ⌖ {job.location}
                                                        </span>
                                                    )}

                                                    <span className="rj-meta-pill">
                                                        ◷ {employmentLabel}
                                                    </span>

                                                    {salaryText && (
                                                        <span className="rj-meta-pill">
                                                            ₹ {salaryText}
                                                        </span>
                                                    )}

                                                    {job.application_deadline && (
                                                        <span className="rj-meta-pill">
                                                            Deadline:{" "}
                                                            {formatDate(
                                                                job.application_deadline
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rj-job-actions">
                                                <button
                                                    type="button"
                                                    className="rj-btn rj-btn-applicants"
                                                    onClick={() => setSelectedJob(job)}
                                                >
                                                    View Applicants →
                                                </button>

                                                <button
                                                    type="button"
                                                    className="rj-btn rj-btn-secondary"
                                                    onClick={() => startEditing(job)}
                                                >
                                                    Edit
                                                </button>

                                                {job.status !== "published" && (
                                                    <button
                                                        type="button"
                                                        className="rj-btn rj-btn-success"
                                                        onClick={() =>
                                                            changeStatus(job, "published")
                                                        }
                                                    >
                                                        Publish
                                                    </button>
                                                )}

                                                {job.status !== "closed" && (
                                                    <button
                                                        type="button"
                                                        className="rj-btn rj-btn-warning"
                                                        onClick={() =>
                                                            changeStatus(job, "closed")
                                                        }
                                                    >
                                                        Close
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="rj-btn rj-btn-danger"
                                                    onClick={() => deleteJob(job)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
