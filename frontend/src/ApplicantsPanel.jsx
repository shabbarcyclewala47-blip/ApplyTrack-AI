import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

const STATUS_OPTIONS = [
    { value: "applied", label: "Applied" },
    { value: "under_review", label: "Under Review" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Rejected" },
];

function ApplicantsPanel({ job, onBack }) {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const loadApplicants = useCallback(async (isRefresh = false) => {
        if (!job?.id) {
            setLoading(false);
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const data = await apiRequest(
                `recruiter/jobs/${job.id}/applicants/`
            );

            const records = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : [];

            setApplicants(records);
        } catch (err) {
            setError(
                err.message || "Could not load applicants."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [job?.id]);

    useEffect(() => {
        loadApplicants();
    }, [loadApplicants]);

    async function updateStatus(applicationId, status) {
        setUpdatingId(applicationId);
        setError("");

        try {
            const updated = await apiRequest(
                `recruiter/applicants/${applicationId}/status/`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ status }),
                }
            );

            setApplicants((current) =>
                current.map((applicant) =>
                    applicant.id === applicationId
                        ? { ...applicant, ...updated }
                        : applicant
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

    return (
        <section
            className="panel"
            style={{
                marginTop: "24px",
                padding: "24px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                }}
            >
                <div>
                    <h2 style={{ margin: "0 0 6px" }}>
                        Applicants
                    </h2>

                    <p style={{ margin: 0 }}>
                        {job?.title} at {job?.company_name}
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
                        className="text-button"
                        onClick={() => loadApplicants(true)}
                        disabled={loading || refreshing}
                        style={{
                            padding: "10px 16px",
                            borderRadius: "10px",
                            border: "1px solid #d7dce5",
                            cursor:
                                loading || refreshing
                                    ? "not-allowed"
                                    : "pointer",
                            opacity:
                                loading || refreshing ? 0.7 : 1,
                        }}
                    >
                        {refreshing ? "Refreshing..." : "↻ Refresh Applicants"}
                    </button>

                    <button
                        type="button"
                        className="text-button"
                        onClick={onBack}
                    >
                        ← Back to jobs
                    </button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: "12px",
                        marginBottom: "16px",
                        borderRadius: "10px",
                        background: "#fff0f0",
                        color: "#b42318",
                    }}
                >
                    {error}

                    <button
                        type="button"
                        onClick={() => loadApplicants(true)}
                        disabled={refreshing}
                        style={{
                            marginLeft: "12px",
                            border: "none",
                            background: "transparent",
                            color: "inherit",
                            textDecoration: "underline",
                            cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                </div>
            )}

            {loading ? (
                <p>Loading applicants...</p>
            ) : applicants.length === 0 ? (
                <div style={{ padding: "24px 0" }}>
                    <h3>No applicants yet</h3>
                    <p>
                        Candidates who apply to this job will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <p>
                        <strong>{applicants.length}</strong>{" "}
                        applicant{applicants.length === 1 ? "" : "s"}
                    </p>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>CANDIDATE</th>
                                    <th>DATE APPLIED</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {applicants.map((applicant) => (
                                    <tr key={applicant.id}>
                                        <td>
                                            <div>
                                                <strong>
                                                    {applicant.candidate_username ||
                                                        applicant.username ||
                                                        "Candidate"}
                                                </strong>

                                                <div
                                                    style={{
                                                        fontSize: "13px",
                                                        opacity: 0.75,
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    {applicant.candidate_email ||
                                                        applicant.email ||
                                                        "Email not provided"}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {applicant.applied_date
                                                ? new Date(
                                                    `${applicant.applied_date}T00:00:00`
                                                ).toLocaleDateString("en-IN")
                                                : "Not specified"}
                                        </td>

                                        <td>
                                            <select
                                                aria-label={`Update status for ${
                                                    applicant.candidate_username ||
                                                    applicant.username ||
                                                    "candidate"
                                                }`}
                                                value={
                                                    applicant.status || "applied"
                                                }
                                                disabled={
                                                    updatingId === applicant.id
                                                }
                                                onChange={(event) =>
                                                    updateStatus(
                                                        applicant.id,
                                                        event.target.value
                                                    )
                                                }
                                                style={{
                                                    padding: "9px 12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #d7dce5",
                                                    maxWidth: "180px",
                                                }}
                                            >
                                                {STATUS_OPTIONS.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {updatingId === applicant.id && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        marginTop: "5px",
                                                    }}
                                                >
                                                    Saving...
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}

export default ApplicantsPanel;