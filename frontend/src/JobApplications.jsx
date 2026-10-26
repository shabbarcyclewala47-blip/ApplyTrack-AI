
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
const STATUS_LABELS = {
    applied: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview Scheduled",
    interview_completed: "Interview Completed",
    offer: "Offer Received",

    rejected: "Rejected",
};

const STATUS_COLORS = {
    applied: "blue",
    under_review: "amber",
    shortlisted: "purple",
    interview: "cyan",
    interview_completed: "green",
    offer: "green",

    rejected: "red",
};
const STATUS_STEPS = [
    "applied",
    "under_review",
    "shortlisted",
    "interview",
    "interview_completed",
    "offer"
];

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.ja-page {
    --ja-text: #19233b;
    --ja-muted: #7b849c;
    --ja-border: rgba(222, 227, 242, .85);
    --ja-primary: #6759e8;
    --ja-surface: rgba(255, 255, 255, .88);
    position: relative;
    isolation: isolate;
    min-height: 100%;
    padding: clamp(18px, 3vw, 34px);
    box-sizing: border-box;
    overflow: hidden;
    border-radius: 22px;
    color: var(--ja-text);
    background:
        radial-gradient(ellipse at 8% 0%, rgba(181, 168, 255, .25), transparent 34%),
        radial-gradient(ellipse at 96% 16%, rgba(125, 211, 252, .20), transparent 31%),
        linear-gradient(145deg, #f8f8ff 0%, #f4f7ff 48%, #faf7ff 100%);
    font-family: 'DM Sans', sans-serif;
}

.ja-page, .ja-page * {
    box-sizing: border-box;
}

.ja-page button, .ja-page input, .ja-page select {
    font: inherit;
}

.ja-page button:focus-visible,
.ja-page input:focus-visible,
.ja-page select:focus-visible {
    outline: 3px solid rgba(103, 89, 232, .25);
    outline-offset: 3px;
}

.ja-page h1, .ja-page h2, .ja-page h3 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    letter-spacing: -.035em;
}

.ja-orb {
    position: absolute;
    z-index: -1;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    filter: blur(65px);
    opacity: .32;
    pointer-events: none;
    animation: ja-float 12s ease-in-out infinite alternate;
}

.ja-orb-one {
    background: #b5a5ff;
    top: 130px;
    right: -130px;
}

.ja-orb-two {
    background: #9be7ed;
    top: 520px;
    left: -170px;
    animation-delay: -5s;
}

.ja-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 22px;
    flex-wrap: wrap;
    margin-bottom: 28px;
    animation: ja-enter .55s ease both;
}

.ja-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #6759d9;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
    margin-bottom: 13px;
}

.ja-eyebrow-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7869ed;
    box-shadow: 0 0 0 4px rgba(120, 105, 237, .12);
}

.ja-title {
    margin: 0;
    font-size: clamp(27px, 4vw, 36px);
    line-height: 1.2;
    font-weight: 800;
    color: #19233b;
}

.ja-gradient-text {
    background: linear-gradient(100deg, #6759e8, #a04be8 65%, #408de9);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.ja-subtitle {
    max-width: 570px;
    color: #7b849c;
    font-size: 14px;
    line-height: 1.8;
    margin: 12px 0 0;
}

.ja-header-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    border: 1px solid rgba(222, 227, 242, .9);
    background: rgba(255,255,255,.72);
    backdrop-filter: blur(14px);
    border-radius: 14px;
    box-shadow: 0 7px 25px rgba(44, 54, 100, .04);
    color: #4b5670;
    font-size: 12px;
    font-weight: 700;
}

.ja-live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 4px rgba(16,185,129,.12);
}

.ja-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
    margin-bottom: 26px;
}

.ja-stat {
    position: relative;
    overflow: hidden;
    min-width: 0;
    padding: 21px;
    border-radius: 18px;
    border: 1px solid rgba(225, 229, 243, .9);
    background: var(--ja-surface);
    box-shadow: 0 8px 26px rgba(35, 48, 95, .035);
    backdrop-filter: blur(15px);
    animation: ja-enter .5s ease both;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}

.ja-stat:nth-child(2) { animation-delay: .05s; }
.ja-stat:nth-child(3) { animation-delay: .1s; }
.ja-stat:nth-child(4) { animation-delay: .15s; }
.ja-stat:nth-child(5) { animation-delay: .2s; }
.ja-stat:nth-child(6) { animation-delay: .25s; }

.ja-stat:hover {
    transform: translateY(-5px);
    box-shadow: 0 17px 36px rgba(54, 61, 120, .09);
    border-color: rgba(170, 161, 245, .8);
}

.ja-stat::after {
    content: "";
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    right: -45px;
    top: -48px;
    background: var(--ja-stat-glow, rgba(103,89,232,.10));
    pointer-events: none;
}

.ja-stat-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.ja-stat-label {
    color: #77819a;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
}

.ja-stat-icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 18px;
    background: var(--ja-stat-icon-bg, #efedff);
}

.ja-stat-value {
    margin-top: 15px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(27px, 3vw, 34px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -.045em;
    color: var(--ja-stat-color, #6759e8);
}

.ja-stat-caption {
    color: #9aa2b5;
    font-size: 11px;
    margin-top: 9px;
}

.ja-panel {
    border: 1px solid rgba(225, 229, 243, .92);
    background: rgba(255,255,255,.88);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(35, 48, 95, .045);
    overflow: hidden;
    animation: ja-enter .6s ease both;
}

.ja-panel-header {
    padding: 23px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    border-bottom: 1px solid #edf0f7;
}

.ja-section-title {
    margin: 0;
    color: #202a43;
    font-size: 18px;
    font-weight: 800;
}

.ja-section-caption {
    margin: 7px 0 0;
    color: #8992a8;
    font-size: 12px;
    line-height: 1.6;
}

.ja-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.ja-search-wrap {
    position: relative;
    min-width: 210px;
}

.ja-search-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #929bb0;
    font-size: 16px;
    pointer-events: none;
}

.ja-input {
    width: 100%;
    min-height: 43px;
    padding: 10px 13px;
    color: #34405a;
    background: #fafbff;
    border: 1px solid #e5e9f3;
    border-radius: 11px;
    font-size: 12px;
    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.ja-search-wrap .ja-input {
    padding-left: 38px;
}

.ja-input::placeholder {
    color: #a0a8ba;
}

.ja-input:focus {
    border-color: #a69bf4;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(103,89,232,.08);
    outline: none;
}

.ja-filter {
    min-width: 150px;
    cursor: pointer;
}

.ja-list {
    padding: 18px;
    display: grid;
    gap: 13px;
}

.ja-application {
    position: relative;
    min-width: 0;
    padding: 20px;
    border: 1px solid #e9ecf5;
    border-radius: 16px;
    background: linear-gradient(125deg, #fff 0%, #fdfdff 100%);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    animation: ja-enter .45s ease both;
}

.ja-application:hover {
    transform: translateY(-3px);
    border-color: #d8d1ff;
    box-shadow: 0 12px 28px rgba(51, 55, 112, .065);
}

.ja-app-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
}

.ja-app-info {
    min-width: 0;
}

.ja-company-mark {
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    width: 43px;
    height: 43px;
    border-radius: 13px;
    margin-right: 12px;
    color: #6355db;
    background: linear-gradient(140deg, #f0edff, #e8f1ff);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 17px;
    font-weight: 800;
}

.ja-app-heading {
    display: flex;
    align-items: center;
    min-width: 0;
}

.ja-job-title {
    margin: 0;
    color: #26314c;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.55;
    overflow-wrap: anywhere;
}

.ja-company-name {
    margin: 5px 0 0;
    color: #65718a;
    font-size: 12px;
    font-weight: 600;
    overflow-wrap: anywhere;
}

.ja-location {
    margin: 10px 0 0;
    color: #929bb0;
    font-size: 12px;
}

.ja-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 7px 10px;
    border-radius: 30px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .015em;
    white-space: nowrap;
}

.ja-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.ja-status-blue { color: #2859c5; background: #eaf1ff; }
.ja-status-amber { color: #a76508; background: #fff4d9; }
.ja-status-purple { color: #7040c5; background: #f0e9ff; }
.ja-status-cyan { color: #087f97; background: #e1faff; }
.ja-status-green {
    color: #087b53;
    background: #def8eb;
}
.ja-status-red { color: #c03c4d; background: #ffeaed; }

.ja-app-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
    padding-top: 15px;
    border-top: 1px solid #f0f2f8;
}

.ja-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 15px;
    color: #8992a7;
    font-size: 11px;
}

.ja-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.ja-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.ja-btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 7px;
    min-height: 37px;
    padding: 9px 13px;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 11px;
    font-weight: 800;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
}

.ja-btn:hover {
    transform: translateY(-1px);
}

.ja-btn-primary {
    color: #fff;
    background: linear-gradient(110deg, #7061e9, #8c61e8);
    box-shadow: 0 5px 12px rgba(103,89,232,.16);
}

.ja-btn-primary:hover {
    background: linear-gradient(110deg, #5f50d9, #7d50d8);
    box-shadow: 0 8px 18px rgba(103,89,232,.24);
}

.ja-btn-secondary {
    color: #56617a;
    background: #fff;
    border-color: #e5e9f3;
}

.ja-btn-secondary:hover {
    background: #f7f6ff;
    border-color: #d6ceff;
}

.ja-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
    transform: none;
}

.ja-progress {
    display: flex;
    align-items: flex-start;
    margin-top: 20px;
    padding: 15px 13px 2px;
    border-radius: 12px;
    background: #fafaff;
}

.ja-progress-step {
    flex: 1;
    min-width: 0;
    position: relative;
    text-align: center;
    color: #a4acc0;
    font-size: 9px;
    line-height: 1.5;
}

.ja-progress-step:not(:last-child)::after {
    content: "";
    position: absolute;
    top: 6px;
    left: calc(50% + 9px);
    width: calc(100% - 18px);
    height: 2px;
    background: #e5e8f2;
}

.ja-progress-step.done:not(:last-child)::after {
    background: linear-gradient(90deg, #8b7bf0, #c1b8ff);
}

.ja-progress-dot {
    position: relative;
    z-index: 1;
    display: block;
    width: 13px;
    height: 13px;
    margin: 0 auto 8px;
    border: 3px solid #e4e8f2;
    border-radius: 50%;
    background: #fff;
}

.ja-progress-step.done .ja-progress-dot {
    border-color: #8070eb;
    background: #8070eb;
    box-shadow: 0 0 0 3px rgba(128,112,235,.10);
}

.ja-progress-step.current {
    color: #6655d8;
    font-weight: 800;
}

.ja-progress-step.current .ja-progress-dot {
    border-color: #fff;
    background: #6759e8;
    box-shadow: 0 0 0 3px rgba(103,89,232,.25);
}

.ja-progress-step.rejected {
    color: #c03c4d;
    font-weight: 800;
}

.ja-progress-step.rejected .ja-progress-dot {
    border-color: #e36c7b;
    background: #e36c7b;
}

.ja-alert {
    margin: 18px 22px 0;
    padding: 13px 15px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.6;
}

.ja-alert-error {
    background: #fff0f1;
    color: #ad3444;
    border: 1px solid #ffdadd;
}

.ja-empty {
    padding: 52px 20px;
    text-align: center;
}

.ja-empty-icon {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    margin: 0 auto 17px;
    border-radius: 22px;
    color: #6d5ce8;
    background: linear-gradient(140deg, #f0edff, #e8f5ff);
    font-size: 28px;
}

.ja-empty h3 {
    margin: 0;
    color: #2b3550;
    font-size: 17px;
}

.ja-empty p {
    max-width: 370px;
    margin: 10px auto 20px;
    color: #8992a8;
    font-size: 12px;
    line-height: 1.8;
}

.ja-skeleton {
    height: 130px;
    border-radius: 15px;
    background: linear-gradient(100deg, #f0f1f8 25%, #fafaff 40%, #f0f1f8 60%);
    background-size: 200% 100%;
    animation: ja-shimmer 1.5s infinite linear;
}

.ja-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 17px 22px;
    border-top: 1px solid #edf0f7;
    color: #98a0b3;
    font-size: 11px;
}

.ja-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 18px;
    background: rgba(22, 27, 53, .55);
    backdrop-filter: blur(7px);
    animation: ja-fade .2s ease both;
}

.ja-modal {
    width: min(100%, 650px);
    max-height: 88vh;
    overflow-y: auto;
    border: 1px solid rgba(255,255,255,.8);
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 30px 100px rgba(20, 25, 60, .25);
    animation: ja-modal-in .28s ease both;
}

.ja-modal-header {
    padding: 24px;
    border-bottom: 1px solid #edf0f7;
    background:
        radial-gradient(ellipse at 100% 0%, rgba(186,173,255,.22), transparent 48%),
        #fcfcff;
}

.ja-modal-body {
    padding: 24px;
}

.ja-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 20px 0;
}

.ja-detail {
    min-width: 0;
    padding: 14px;
    border: 1px solid #edf0f7;
    border-radius: 12px;
    background: #fbfcff;
}

.ja-detail-label {
    color: #8a93a9;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
}

.ja-detail-value {
    margin-top: 7px;
    color: #34405a;
    font-size: 13px;
    font-weight: 700;
    overflow-wrap: anywhere;
}

.ja-description {
    color: #69748c;
    font-size: 12px;
    line-height: 1.9;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.ja-link {
    color: #6759d9;
    font-weight: 700;
    text-decoration: none;
}

.ja-link:hover {
    text-decoration: underline;
}

.ja-spinner {
    display: inline-block;
    width: 17px;
    height: 17px;
    border: 2px solid #e1ddff;
    border-top-color: #6759e8;
    border-radius: 50%;
    animation: ja-spin .7s linear infinite;
    vertical-align: middle;
}

@keyframes ja-enter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes ja-float {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(-22px, 25px) scale(1.12); }
}

@keyframes ja-shimmer {
    to { background-position: -200% 0; }
}

@keyframes ja-spin {
    to { transform: rotate(360deg); }
}

@keyframes ja-fade {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes ja-modal-in {
    from { opacity: 0; transform: translateY(12px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 850px) {
    .ja-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ja-panel-header { padding: 20px; }
    .ja-controls { width: 100%; }
    .ja-search-wrap { flex: 1; }
    .ja-filter { flex: 1; }
}

@media (max-width: 560px) {
    .ja-page { padding: 15px; border-radius: 15px; }
    .ja-header { margin-bottom: 21px; }
    .ja-stats { gap: 10px; }
    .ja-stat { padding: 14px; border-radius: 14px; }
    .ja-stat-icon { width: 32px; height: 32px; font-size: 15px; }
    .ja-stat-value { margin-top: 12px; font-size: 27px; }
    .ja-stat-label { font-size: 10px; }
    .ja-stat-caption { font-size: 10px; }
    .ja-panel { border-radius: 15px; }
    .ja-panel-header { padding: 17px; }
    .ja-controls { flex-direction: column; }
    .ja-search-wrap, .ja-filter { width: 100%; }
    .ja-list { padding: 11px; gap: 11px; }
    .ja-application { padding: 15px; }
    .ja-app-main { flex-direction: column; }
    .ja-status { align-self: flex-start; }
    .ja-app-heading { align-items: flex-start; }
    .ja-company-mark { width: 37px; height: 37px; margin-right: 9px; }
    .ja-job-title { font-size: 13px; }
    .ja-app-footer { align-items: flex-start; }
    .ja-actions { width: 100%; }
    .ja-actions .ja-btn { flex: 1; }
    .ja-progress { padding: 13px 5px 3px; }
    .ja-progress-step { font-size: 8px; }
    .ja-modal-backdrop { padding: 10px; }
    .ja-modal { border-radius: 17px; max-height: 92vh; }
    .ja-modal-header, .ja-modal-body { padding: 18px; }
    .ja-detail-grid { gap: 8px; }
    .ja-detail { padding: 11px; }
}

@media (prefers-reduced-motion: reduce) {
    .ja-page *, .ja-page *::before, .ja-page *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
    }
}
`;

function getStatusLabel(status) {
    return (
        STATUS_LABELS[status] ||
        String(status || "applied")
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
}

function formatDate(value) {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getCompanyInitials(company) {
    return String(company || "Company")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}
function getProgressIndex(status) {
    if (status === "rejected") return -1;
    if (status === "offer") return 5;

    const index = STATUS_STEPS.indexOf(status);

    return index < 0 ? 0 : index;
}
function ApplicationProgress({ status }) {
    if (status === "rejected") {
        return (
            <div className="ja-progress" aria-label="Application rejected">
                <div className="ja-progress-step rejected">
                    <span className="ja-progress-dot" />
                    Application Rejected
                </div>
            </div>
        );
    }
    const currentIndex = Math.min(
        getProgressIndex(status),
        STATUS_STEPS.length - 1
    );


    return (
        <div
            className="ja-progress"
            aria-label={`Application status: ${getStatusLabel(status)}`}
        >
            {STATUS_STEPS.map((step, index) => {
                const done = index < currentIndex;
                const current = index === currentIndex;

                return (
                    <div
                        key={step}
                        className={[
                            "ja-progress-step",
                            done ? "done" : "",
                            current ? "current" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <span className="ja-progress-dot" />
                        {getStatusLabel(step)}
                    </div>
                );
            })}
        </div>
    );
}

function DetailItem({ label, children }) {
    return (
        <div className="ja-detail">
            <div className="ja-detail-label">{label}</div>
            <div className="ja-detail-value">{children || "Not provided"}</div>
        </div>
    );
}

export default function JobApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApplication, setSelectedApplication] = useState(null);

    const loadApplications = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const data = await apiRequest("applications/");
            const records = Array.isArray(data)
                ? data
                : data.results || [];

            setApplications(records);
        } catch (err) {
            setError(err.message || "Could not load your applications.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const stats = useMemo(() => {
        const count = (status) =>
            applications.filter((item) => item.status === status).length;

        return [
            {
                label: "Total Applications",
                value: applications.length,
                icon: "▤",
                color: "#6759e8",
                iconBg: "#efedff",
                glow: "rgba(103,89,232,.13)",
                caption: "All submitted applications",
            },
            {
                label: "Under Review",
                value: count("under_review"),
                icon: "◷",
                color: "#c08318",
                iconBg: "#fff4d9",
                glow: "rgba(234,179,8,.13)",
                caption: "Being reviewed by recruiters",
            },
            {
                label: "Shortlisted",
                value: count("shortlisted"),
                icon: "✦",
                color: "#8653d4",
                iconBg: "#f0e9ff",
                glow: "rgba(139,92,246,.13)",
                caption: "Applications progressing",
            },
            {
                label: "Interviews",
                value: applications.filter((item) =>
                    ["interview", "interview_completed"].includes(item.status)
                ).length,
                icon: "▣",
                color: "#07869c",
                iconBg: "#e1faff",
                glow: "rgba(6,182,212,.13)",
                caption: "Interview-stage applications",
            },
            {
                label: "Offers",
                value: count("offer"),
                icon: "✓",
                color: "#07865c",
                iconBg: "#def8eb",
                glow: "rgba(16,185,129,.13)",
                caption: "Offers received",
            },
            {
                label: "Rejected",
                value: count("rejected"),
                icon: "↗",
                color: "#d04b5a",
                iconBg: "#ffeaed",
                glow: "rgba(239,68,68,.11)",
                caption: "Applications not progressing",
            },
        ];
    }, [applications]);

    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();

        return applications.filter((application) => {
            const matchesSearch =
                !query ||
                (application.job_title || "").toLowerCase().includes(query) ||
                (application.company_name || "").toLowerCase().includes(query) ||
                (application.location || "").toLowerCase().includes(query) ||
                getStatusLabel(application.status).toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "all" ||
                application.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [applications, search, statusFilter]);

    return (
        <main className="ja-page">
            <style>{styles}</style>

            <div className="ja-orb ja-orb-one" />
            <div className="ja-orb ja-orb-two" />

            <header className="ja-header">
                <div>
                    <div className="ja-eyebrow">
                        <span className="ja-eyebrow-dot" />
                        YOUR CAREER COMMAND CENTER
                    </div>

                    <h1 className="ja-title">
                        My <span className="ja-gradient-text">Applications</span>
                    </h1>

                    <p className="ja-subtitle">
                        Every opportunity brings you closer to your next chapter.
                        Keep track of your applications and follow your recruitment
                        journey in one place.
                    </p>
                </div>

                <div className="ja-header-badge">
                    <span className="ja-live-dot" />
                    Application tracker
                </div>
            </header>

            <section className="ja-stats" aria-label="Application statistics">
                {stats.map((stat) => (
                    <article
                        key={stat.label}
                        className="ja-stat"
                        style={{
                            "--ja-stat-color": stat.color,
                            "--ja-stat-icon-bg": stat.iconBg,
                            "--ja-stat-glow": stat.glow,
                        }}
                    >
                        <div className="ja-stat-top">
                            <span className="ja-stat-label">{stat.label}</span>

                            <span className="ja-stat-icon" aria-hidden="true">
                                {stat.icon}
                            </span>
                        </div>

                        <div className="ja-stat-value">
                            {loading ? "—" : stat.value}
                        </div>

                        <div className="ja-stat-caption">{stat.caption}</div>
                    </article>
                ))}
            </section>

            <section className="ja-panel">
                <header className="ja-panel-header">
                    <div>
                        <h2 className="ja-section-title">
                            Application History
                        </h2>

                        <p className="ja-section-caption">
                            Review your applications, statuses, and recruitment
                            progress.
                        </p>
                    </div>

                    <div className="ja-controls">
                        <div className="ja-search-wrap">
                            <span className="ja-search-icon" aria-hidden="true">
                                ⌕
                            </span>

                            <input
                                className="ja-input"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search applications..."
                                aria-label="Search applications"
                            />
                        </div>

                        <select
                            className="ja-input ja-filter"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label="Filter applications by status"
                        >
                            <option value="all">All statuses</option>

                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {error && (
                    <div className="ja-alert ja-alert-error" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="ja-btn ja-btn-secondary"
                            onClick={() => loadApplications()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="ja-list" aria-label="Loading applications">
                        <div className="ja-skeleton" />
                        <div className="ja-skeleton" />
                        <div className="ja-skeleton" />
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="ja-empty">
                        <div className="ja-empty-icon" aria-hidden="true">
                            {applications.length === 0 ? "▤" : "⌕"}
                        </div>

                        <h3>
                            {applications.length === 0
                                ? "Your next opportunity starts here"
                                : "No matching applications"}
                        </h3>

                        <p>
                            {applications.length === 0
                                ? "You haven't applied for any jobs yet. Explore Browse Jobs, find a role that fits your goals, and your applications will appear here."
                                : "Try another search term or change the status filter to find your applications."}
                        </p>

                        {(search || statusFilter !== "all") && (
                            <button
                                type="button"
                                className="ja-btn ja-btn-primary"
                                onClick={() => {
                                    setSearch("");
                                    setStatusFilter("all");
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="ja-list">
                        {filteredApplications.map((application, index) => {
                            const status = application.status || "applied";
                            const color = STATUS_COLORS[status] || "blue";

                            return (
                                <article
                                    key={application.id}
                                    className="ja-application"
                                    style={{
                                        animationDelay: `${Math.min(index * 45, 270)}ms`,
                                    }}
                                >
                                    <div className="ja-app-main">
                                        <div className="ja-app-info">
                                            <div className="ja-app-heading">
                                                <span
                                                    className="ja-company-mark"
                                                    aria-hidden="true"
                                                >
                                                    {getCompanyInitials(
                                                        application.company_name
                                                    )}
                                                </span>

                                                <div style={{ minWidth: 0 }}>
                                                    <h3 className="ja-job-title">
                                                        {application.job_title ||
                                                            "Untitled position"}
                                                    </h3>

                                                    <p className="ja-company-name">
                                                        {application.company_name ||
                                                            "Company not specified"}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="ja-location">
                                                <span aria-hidden="true">⌖</span>{" "}
                                                {application.location ||
                                                    "Location not specified"}
                                            </p>
                                        </div>

                                        <span
                                            className={`ja-status ja-status-${color}`}
                                        >
                                            <span className="ja-status-dot" />
                                            {getStatusLabel(status)}
                                        </span>
                                    </div>

                                    <ApplicationProgress status={status} />

                                    <footer className="ja-app-footer">
                                        <div className="ja-meta">
                                            <span className="ja-meta-item">
                                                <span aria-hidden="true">▦</span>
                                                Applied{" "}
                                                {formatDate(application.applied_date)}
                                            </span>

                                            {application.job_match_score > 0 && (
                                                <span className="ja-meta-item">
                                                    <span aria-hidden="true">✦</span>
                                                    {application.job_match_score}% match
                                                </span>
                                            )}
                                        </div>

                                        <div className="ja-actions">
                                            <button
                                                type="button"
                                                className="ja-btn ja-btn-primary"
                                                onClick={() =>
                                                    setSelectedApplication(application)
                                                }
                                            >
                                                View Details <span aria-hidden="true">→</span>
                                            </button>

                                            {application.job_url && (
                                                <a
                                                    className="ja-btn ja-btn-secondary"
                                                    href={application.job_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Job Posting ↗
                                                </a>
                                            )}
                                        </div>
                                    </footer>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && applications.length > 0 && (
                    <footer className="ja-footer">
                        <span>
                            Showing {filteredApplications.length} of{" "}
                            {applications.length} applications
                        </span>

                        <button
                            type="button"
                            className="ja-btn ja-btn-secondary"
                            onClick={() => loadApplications(true)}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <>
                                    <span className="ja-spinner" />
                                    Refreshing...
                                </>
                            ) : (
                                <>↻ Refresh applications</>
                            )}
                        </button>
                    </footer>
                )}
            </section>

            {selectedApplication &&
                typeof document !== "undefined" &&
                createPortalSafeModal(
                    selectedApplication,
                    () => setSelectedApplication(null)
                )}
        </main>
    );
}

function createPortalSafeModal(application, onClose) {
    if (typeof document === "undefined") return null;

    const status = application.status || "applied";
    const color = STATUS_COLORS[status] || "blue";

    return (
        <div
            className="ja-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                className="ja-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ja-detail-title"
            >
                <header className="ja-modal-header">
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <div className="ja-eyebrow">
                                APPLICATION DETAILS
                            </div>

                            <h2
                                id="ja-detail-title"
                                style={{
                                    margin: 0,
                                    fontSize: "23px",
                                    color: "#202a43",
                                }}
                            >
                                {application.job_title || "Job application"}
                            </h2>

                            <p className="ja-section-caption">
                                {application.company_name || "Company not specified"}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="ja-btn ja-btn-secondary"
                            onClick={onClose}
                            aria-label="Close application details"
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <span className={`ja-status ja-status-${color}`}>
                            <span className="ja-status-dot" />
                            {getStatusLabel(status)}
                        </span>
                    </div>
                </header>

                <div className="ja-modal-body">
                    <h3 style={{ fontSize: "14px", color: "#34405a" }}>
                        Application overview
                    </h3>

                    <div className="ja-detail-grid">
                        <DetailItem label="Company">
                            {application.company_name}
                        </DetailItem>

                        <DetailItem label="Job title">
                            {application.job_title}
                        </DetailItem>

                        <DetailItem label="Location">
                            {application.location}
                        </DetailItem>

                        <DetailItem label="Applied on">
                            {formatDate(application.applied_date)}
                        </DetailItem>

                        <DetailItem label="Candidate">
                            {application.full_name}
                        </DetailItem>

                        <DetailItem label="Phone">
                            {application.phone}
                        </DetailItem>

                        <DetailItem label="Resume match">
                            {application.job_match_score > 0
                                ? `${application.job_match_score}%`
                                : "Not available"}
                        </DetailItem>

                        <DetailItem label="Current status">
                            {getStatusLabel(status)}
                        </DetailItem>
                    </div>

                    {application.matched_skills?.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ fontSize: "13px", color: "#34405a" }}>
                                Matched skills
                            </h3>

                            <p className="ja-description">
                                {application.matched_skills.join(", ")}
                            </p>
                        </div>
                    )}

                    {application.missing_skills?.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ fontSize: "13px", color: "#34405a" }}>
                                Skills to improve
                            </h3>

                            <p className="ja-description">
                                {application.missing_skills.join(", ")}
                            </p>
                        </div>
                    )}

                    {application.cover_letter && (
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ fontSize: "13px", color: "#34405a" }}>
                                Cover letter
                            </h3>

                            <p className="ja-description">
                                {application.cover_letter}
                            </p>
                        </div>
                    )}

                    {application.notes && (
                        <div style={{ marginTop: "20px" }}>
                            <h3 style={{ fontSize: "13px", color: "#34405a" }}>
                                Additional notes
                            </h3>

                            <p className="ja-description">
                                {application.notes}
                            </p>
                        </div>
                    )}

                    {application.resume && (
                        <div style={{ marginTop: "20px" }}>
                            <a
                                className="ja-link"
                                href={application.resume}
                                target="_blank"
                                rel="noreferrer"
                            >
                                View uploaded resume ↗
                            </a>
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "26px",
                        }}
                    >
                        <button
                            type="button"
                            className="ja-btn ja-btn-primary"
                            onClick={onClose}
                        >
                            Close details
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
