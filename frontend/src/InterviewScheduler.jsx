
import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./InterviewScheduler.css";

const INITIAL_FORM = {
  job: "",
  application: "",
  interviewer: "",
  scheduled_at: "",
  duration_minutes: "30",
  interview_type: "online",
  round_name: "Technical Interview",
  meeting_link: "",
  interview_location: "",
  instructions: "",
};

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

export default function InterviewScheduler({
  interview = null,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [interviewers, setInterviewers] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(interview?.id);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [jobsResponse, interviewersResponse] = await Promise.all([
          apiRequest("recruiter/jobs/"),
          apiRequest("recruiter/interviewers/"),
        ]);

        if (!active) return;

        const jobList = Array.isArray(jobsResponse)
          ? jobsResponse
          : jobsResponse?.results || jobsResponse?.jobs || [];

        const interviewerList = Array.isArray(interviewersResponse)
          ? interviewersResponse
          : interviewersResponse?.results ||
            interviewersResponse?.interviewers ||
            [];

        setJobs(jobList);
        setInterviewers(interviewerList);

        if (interview) {
          setForm({
            job: String(interview.job || interview.job_id || ""),
            application: String(interview.application || ""),
            interviewer: String(interview.interviewer || ""),
            scheduled_at: toLocalDateTime(interview.scheduled_at),
            duration_minutes: String(interview.duration_minutes || 30),
            interview_type: interview.interview_type || "online",
            round_name: interview.round_name || "Technical Interview",
            meeting_link: interview.meeting_link || "",
            interview_location: interview.interview_location || "",
            instructions: interview.instructions || "",
          });
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Could not load jobs and interviewers. Please try again."
          );
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [interview]);

  useEffect(() => {
    let active = true;

    async function loadApplicants() {
      if (!form.job) {
        setApplicants([]);
        return;
      }

      setLoadingApplicants(true);
      setError("");

      try {
        const response = await apiRequest(
          `recruiter/jobs/${form.job}/applicants/`
        );

        if (!active) return;

        const list = Array.isArray(response)
          ? response
          : response?.results || response?.applicants || [];

        setApplicants(list);
      } catch (err) {
        if (active) {
          setApplicants([]);
          setError(
            err?.message ||
              "Could not load applicants for this job."
          );
        }
      } finally {
        if (active) setLoadingApplicants(false);
      }
    }

    loadApplicants();

    return () => {
      active = false;
    };
  }, [form.job]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "job" ? { application: "" } : {}),
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.job) {
      setError("Please select a job opening.");
      return;
    }

    if (!form.application) {
      setError("Please select a candidate.");
      return;
    }

    if (!form.interviewer) {
      setError("Please assign an interviewer.");
      return;
    }

    const scheduledDate = new Date(form.scheduled_at);

    if (
      !form.scheduled_at ||
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate <= new Date()
    ) {
      setError("Please choose a valid future date and time.");
      return;
    }

    if (
      form.interview_type === "online" &&
      !form.meeting_link.trim()
    ) {
      setError("Please provide the online meeting link.");
      return;
    }

    if (
      form.interview_type === "in_person" &&
      !form.interview_location.trim()
    ) {
      setError("Please provide the interview location.");
      return;
    }

    const payload = {
      application: Number(form.application),
      interviewer: Number(form.interviewer),
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: Number(form.duration_minutes),
      interview_type: form.interview_type,
      round_name: form.round_name.trim(),
      meeting_link:
        form.interview_type === "online"
          ? form.meeting_link.trim()
          : "",
      interview_location:
        form.interview_type === "in_person"
          ? form.interview_location.trim()
          : "",
      instructions: form.instructions.trim(),
    };

    setSaving(true);

    try {
      const endpoint = isEditing
        ? `recruiter/interviews/${interview.id}/`
        : "recruiter/interviews/";

      await apiRequest(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        body: payload,
      });

      setSuccess(
        isEditing
          ? "Interview updated successfully."
          : "Interview scheduled successfully."
      );

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save the interview. Please check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="scheduler-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <section
        className="scheduler-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduler-title"
      >
        <header className="scheduler-header">
          <div>
            <span className="scheduler-eyebrow">
              RECRUITER WORKSPACE
            </span>

            <h2 id="scheduler-title">
              {isEditing ? "Edit interview" : "Schedule an interview"}
            </h2>

            <p>
              Set up the interview and share the details with your team.
            </p>
          </div>

          <button
            type="button"
            className="scheduler-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close scheduler"
          >
            ×
          </button>
        </header>

        <form className="scheduler-form" onSubmit={handleSubmit}>
          {error && (
            <div className="scheduler-message scheduler-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div
              className="scheduler-message scheduler-success"
              role="status"
            >
              {success}
            </div>
          )}

          {loadingOptions ? (
            <div className="scheduler-loading">
              Loading jobs and interviewers...
            </div>
          ) : (
            <>
              <div className="scheduler-section-title">
                <span>01</span>
                <div>
                  <h3>Candidate & interviewer</h3>
                  <p>Choose who will participate.</p>
                </div>
              </div>

              <div className="scheduler-grid">
                <label className="scheduler-field">
                  <span>Job opening *</span>

                  <select
                    name="job"
                    value={form.job}
                    onChange={updateField}
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select a job</option>

                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title || job.job_title || job.name}
                        {job.company_name
                          ? ` — ${job.company_name}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="scheduler-field">
                  <span>Candidate *</span>

                  <select
                    name="application"
                    value={form.application}
                    onChange={updateField}
                    required
                    disabled={!form.job || loadingApplicants || isEditing}
                  >
                    <option value="">
                      {loadingApplicants
                        ? "Loading candidates..."
                        : "Select a candidate"}
                    </option>

                    {applicants.map((applicant) => (
                      <option
                        key={applicant.id}
                        value={applicant.id}
                      >
                        {applicant.candidate_username ||
                          applicant.candidate_name ||
                          applicant.full_name ||
                          applicant.user?.username ||
                          `Application #${applicant.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="scheduler-field scheduler-full">
                  <span>Assign interviewer *</span>

                  <select
                    name="interviewer"
                    value={form.interviewer}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select an interviewer</option>

                    {interviewers.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.username || person.name || person.email}
                        {person.email && person.username
                          ? ` (${person.email})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="scheduler-section-title">
                <span>02</span>
                <div>
                  <h3>Date & format</h3>
                  <p>Choose a suitable time and interview format.</p>
                </div>
              </div>

              <div className="scheduler-grid">
                <label className="scheduler-field">
                  <span>Date & time *</span>

                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    value={form.scheduled_at}
                    onChange={updateField}
                    required
                  />
                </label>

                <label className="scheduler-field">
                  <span>Duration *</span>

                  <select
                    name="duration_minutes"
                    value={form.duration_minutes}
                    onChange={updateField}
                    required
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                    <option value="180">180 minutes</option>
                    <option value="240">240 minutes</option>
                  </select>
                </label>

                <label className="scheduler-field">
                  <span>Interview type *</span>

                  <select
                    name="interview_type"
                    value={form.interview_type}
                    onChange={updateField}
                    required
                  >
                    <option value="online">Online</option>
                    <option value="in_person">In person</option>
                    <option value="phone">Phone</option>
                  </select>
                </label>

                <label className="scheduler-field">
                  <span>Interview round *</span>

                  <select
                    name="round_name"
                    value={form.round_name}
                    onChange={updateField}
                    required
                  >
                    <option value="HR Interview">HR Interview</option>
                    <option value="Technical Interview">
                      Technical Interview
                    </option>
                    <option value="Coding Round">Coding Round</option>
                    <option value="System Design">System Design</option>
                    <option value="Managerial Round">
                      Managerial Round
                    </option>
                    <option value="Final Interview">Final Interview</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                {form.interview_type === "online" && (
                  <label className="scheduler-field scheduler-full">
                    <span>Meeting link *</span>

                    <input
                      type="url"
                      name="meeting_link"
                      value={form.meeting_link}
                      onChange={updateField}
                      placeholder="https://meet.example.com/..."
                      required
                    />
                  </label>
                )}

                {form.interview_type === "in_person" && (
                  <label className="scheduler-field scheduler-full">
                    <span>Interview location *</span>

                    <input
                      type="text"
                      name="interview_location"
                      value={form.interview_location}
                      onChange={updateField}
                      placeholder="Office address or meeting room"
                      required
                    />
                  </label>
                )}
              </div>

              <div className="scheduler-section-title">
                <span>03</span>
                <div>
                  <h3>Additional instructions</h3>
                  <p>Give the interviewer any useful context.</p>
                </div>
              </div>

              <label className="scheduler-field">
                <span>Instructions (optional)</span>

                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={updateField}
                  rows="4"
                  placeholder="Topics to cover, preparation requirements, or other notes..."
                />
              </label>
            </>
          )}

          <footer className="scheduler-footer">
            <button
              type="button"
              className="scheduler-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="scheduler-submit"
              disabled={saving || loadingOptions}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Schedule interview"}
              {!saving && <span aria-hidden="true">→</span>}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
