import { useEffect, useState } from "react";
import Auth from "./Auth";
import "./App.css";
import JobApplications from "./JobApplications";
import RecruiterApplications from "./RecruiterApplications";
import { apiRequest } from "./api";
import RecruiterJobs from "./RecruiterJobs";
import BrowseJobs from "./BrowseJobs";
import Notifications from "./Notifications";
import InterviewWorkspace from "./InterviewWorkspace";
import RecruiterWorkspace from "./RecruiterWorkspace";
import AICareerTools from "./AICareerTools";
import ProfileSettings from "./ProfileSettings";
import ResumeBuilder from "./ResumeBuilder";

const ROLE_MENUS = {
  candidate: [
    { name: "Overview", icon: "⌂" },
    { name: "Browse Jobs", icon: "⌕" },
    { name: "My Applications", icon: "▤" },
    { name: "Interviews", icon: "◷" },
    { name: "AI Career Tools", icon: "✦" },
    { name: "Interview Prep", icon: "◎" },
    { name: "Resume Builder", icon: "▧" },
    { name: "Profile", icon: "♙" },
    { name: "Settings", icon: "⚙" },
  ],

  recruiter: [
    { name: "Overview", icon: "⌂" },
    { name: "Job Openings", icon: "▣" },
    { name: "Applicants", icon: "♙" },
    { name: "Interview Management", icon: "◷" },
    { name: "Profile", icon: "♙" },
    { name: "Settings", icon: "⚙" },
  ],

  interviewer: [
    { name: "Overview", icon: "⌂" },
    { name: "My Interviews", icon: "◷" },
   
    { name: "Profile", icon: "♙" },
    { name: "Settings", icon: "⚙" },
  ],

  admin: [
    { name: "Overview", icon: "⌂" },
    { name: "Platform Management", icon: "▣" },
    { name: "Profile", icon: "♙" },
    { name: "Settings", icon: "⚙" },
  ],
};

const ROLE_LABELS = {
  candidate: "Candidate Workspace",
  recruiter: "Recruiter Workspace",
  interviewer: "Interviewer Workspace",
  admin: "Administration",
};

const ROLE_DESCRIPTIONS = {
  candidate:
    "Discover opportunities, manage applications, and prepare for your next career move.",
  recruiter:
    "Manage job openings, review applicants, and coordinate your hiring process.",
  interviewer:
    "Review your assigned interviews, evaluate candidates, and submit interview feedback.",
  admin:
    "Monitor and manage the ApplyTrack AI platform.",
};
function getRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.interviews)) return data.interviews;
  return [];
}

function getThemeStorageKey(user) {
  if (!user) return null;

  const accountId = user.id ?? user.username;

  if (accountId === undefined || accountId === null) return null;

  return `applytrack_dark_mode_${String(accountId)}`;
}

function applyDarkMode(enabled) {
  const isDark = Boolean(enabled);

  document.documentElement.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("dark-mode", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function formatStatus(status) {
  const value = String(status || "pending").replaceAll("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getApplicationDate(application) {
  const value = application.applied_date || application.created_at;

  return value
    ? new Date(value).toLocaleDateString("en-IN")
    : "Not specified";
}

function StatCard({ icon, label, value, description }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
      </div>

      <p>{label}</p>

      <div className="stat-bottom">
        <strong>{value}</strong>
      </div>

      {description && (
        <small style={{ display: "block", marginTop: 8, opacity: 0.7 }}>
          {description}
        </small>
      )}
    </article>
  );
}

function EmptyState({
  icon = "✦",
  title,
  description,
  action,
}) {
  return (
    <div
      style={{
        padding: "32px 16px",
        textAlign: "center",
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 12 }}>{icon}</div>

      <h3>{title}</h3>

      <p
        style={{
          opacity: 0.75,
          maxWidth: 500,
          margin: "8px auto 18px",
        }}
      >
        {description}
      </p>

      {action}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [dashboardApplications, setDashboardApplications] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [recruiterDashboardJobs, setRecruiterDashboardJobs] = useState([]);
  const [recruiterDashboardLoading, setRecruiterDashboardLoading] =
    useState(false);
  const [recruiterDashboardError, setRecruiterDashboardError] = useState("");
  const [recruiterApplicationCount, setRecruiterApplicationCount] =
    useState(0);

  const [
    interviewerDashboardInterviews,
    setInterviewerDashboardInterviews,
  ] = useState([]);
  const [
    interviewerDashboardLoading,
    setInterviewerDashboardLoading,
  ] = useState(false);
  const [
    interviewerDashboardError,
    setInterviewerDashboardError,
  ] = useState("");
 async function loadInterviewerDashboard() {
  setInterviewerDashboardLoading(true);
  setInterviewerDashboardError("");

  try {
    const data = await apiRequest("interviewer/interviews/");
    setInterviewerDashboardInterviews(getRecords(data));
  } catch (error) {
    setInterviewerDashboardError(
      error.message || "Could not load your interviews."
    );
  } finally {
    setInterviewerDashboardLoading(false);
  }
}

  const role = user?.role || "candidate";
  const menu = ROLE_MENUS[role] || ROLE_MENUS.candidate;

  // Restore the user's saved theme.
  useEffect(() => {
    if (!user) {
      setDarkMode(false);
      applyDarkMode(false);
      return;
    }

    const storageKey = getThemeStorageKey(user);
    const savedTheme = storageKey
      ? localStorage.getItem(storageKey)
      : null;

    let initialDarkMode = savedTheme === "true";

    if (savedTheme === null) {
      const settingsKey =
        `applytrack_settings_${user.role || "candidate"}_` +
        `${user.id ?? user.username ?? "user"}`;

      try {
        const savedSettings = localStorage.getItem(settingsKey);

        if (savedSettings) {
          initialDarkMode =
            JSON.parse(savedSettings).dark_mode === true;
        }
      } catch {
        initialDarkMode = false;
      }
    }

    setDarkMode(initialDarkMode);
    applyDarkMode(initialDarkMode);
  }, [user]);

  // Apply and persist dark mode.
  useEffect(() => {
    applyDarkMode(darkMode);

    const storageKey = getThemeStorageKey(user);

    if (storageKey && isLoggedIn) {
      localStorage.setItem(storageKey, String(darkMode));
    }
  }, [darkMode, user, isLoggedIn]);

  function handleDarkModeChange(enabled) {
    setDarkMode(Boolean(enabled));
  }

  async function loadCurrentUser() {
    const data = await apiRequest("me/");

    setUser(data);
    setIsLoggedIn(true);

    const allowedMenu = ROLE_MENUS[data.role] || ROLE_MENUS.candidate;

    setActiveTab((current) =>
      allowedMenu.some((item) => item.name === current)
        ? current
        : "Overview"
    );
  }

  // Check the current login session.
  useEffect(() => {
    let active = true;

    apiRequest("me/")
      .then((data) => {
        if (active) {
          setUser(data);
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        if (active) {
          setIsLoggedIn(false);
          setUser(null);
          setDarkMode(false);
          applyDarkMode(false);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function loadDashboardApplications() {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const data = await apiRequest("applications/");
      setDashboardApplications(getRecords(data));
    } catch (error) {
      setDashboardError(
        error.message || "Could not load applications."
      );
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadRecruiterDashboard() {
    setRecruiterDashboardLoading(true);
    setRecruiterDashboardError("");

    try {
      const data = await apiRequest("recruiter/jobs/");
      setRecruiterDashboardJobs(getRecords(data));
    } catch (error) {
      setRecruiterDashboardError(
        error.message || "Could not load job openings."
      );
    } finally {
      setRecruiterDashboardLoading(false);
    }
  }

  async function loadRecruiterApplicationCount() {
    try {
      const jobsData = await apiRequest("recruiter/jobs/");
      const jobs = getRecords(jobsData);

      const applicantLists = await Promise.all(
        jobs.map(async (job) => {
          try {
            const data = await apiRequest(
              `recruiter/jobs/${job.id}/applicants/`
            );

            return getRecords(data);
          } catch {
            return [];
          }
        })
      );

      setRecruiterApplicationCount(
        applicantLists.reduce(
          (total, applicants) => total + applicants.length,
          0
        )
      );
    } catch {
      // Keep the most recent successful count.
    }
  }

  // Refresh the recruiter applicant count periodically.
  useEffect(() => {
    if (!isLoggedIn || role !== "recruiter") {
      setRecruiterApplicationCount(0);
      return undefined;
    }

    let active = true;

    const refresh = async () => {
      if (active) {
        await loadRecruiterApplicationCount();
      }
    };

    refresh();

    const intervalId = setInterval(refresh, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [isLoggedIn, role]);

  // Load candidate dashboard data.
  useEffect(() => {
    if (
      isLoggedIn &&
      role === "candidate" &&
      activeTab === "Overview"
    ) {
      loadDashboardApplications();
    }
  }, [isLoggedIn, role, activeTab]);

  // Load recruiter dashboard data.
  useEffect(() => {
    if (
      isLoggedIn &&
      role === "recruiter" &&
      activeTab === "Overview"
    ) {
      loadRecruiterDashboard();
    }
  }, [isLoggedIn, role, activeTab]);

  async function handleLogout() {
    try {
      await apiRequest("logout/", { method: "POST" });

      setIsLoggedIn(false);
      setUser(null);
      setActiveTab("Overview");

      setDashboardApplications([]);
      setDashboardError("");

      setRecruiterDashboardJobs([]);
      setRecruiterDashboardError("");
      setRecruiterApplicationCount(0);

      setDarkMode(false);
      applyDarkMode(false);
    } catch (error) {
      alert("Could not sign out: " + error.message);
    }
  }

  async function handleLogin() {
    try {
      await loadCurrentUser();
      setActiveTab("Overview");
    } catch (error) {
      setDashboardError(
        error.message || "Could not load your account."
      );
    }
  }
// Load interviewer dashboard data when Overview is open.
useEffect(() => {
  if (
    !isLoggedIn ||
    role !== "interviewer" ||
    activeTab !== "Overview"
  ) {
    return undefined;
  }

  loadInterviewerDashboard();

  const intervalId = setInterval(() => {
    loadInterviewerDashboard();
  }, 30000);

  return () => clearInterval(intervalId);
}, [isLoggedIn, role, activeTab]);
  const totalApplications = dashboardApplications.length;

  const interviewCount = dashboardApplications.filter((application) =>
    ["interview", "interview_completed"].includes(
      application.status?.toLowerCase()
    )
  ).length;

  const offerCount = dashboardApplications.filter((application) =>
    ["offer", "selected"].includes(
      application.status?.toLowerCase()
    )
  ).length;

  const rejectedCount = dashboardApplications.filter(
    (application) =>
      application.status?.toLowerCase() === "rejected"
  ).length;

  const responseCount =
    interviewCount + offerCount + rejectedCount;

  const responseRate = totalApplications
    ? Math.round((responseCount / totalApplications) * 100)
    : 0;

  const recentApplications = [...dashboardApplications]
    .sort((a, b) => {
      const dateA = a.applied_date || a.created_at || "";
      const dateB = b.applied_date || b.created_at || "";

      return String(dateB).localeCompare(String(dateA));
    })
    .slice(0, 5);

  const recruiterTotalJobs = recruiterDashboardJobs.length;

  const recruiterPublishedJobs = recruiterDashboardJobs.filter(
    (job) => job.status === "published"
  ).length;

  const recruiterDraftJobs = recruiterDashboardJobs.filter(
    (job) => job.status === "draft"
  ).length;

  const recruiterClosedJobs = recruiterDashboardJobs.filter(
    (job) => ["closed", "expired"].includes(job.status)
  ).length;

  const recruiterRecentJobs = [...recruiterDashboardJobs]
    .sort((a, b) =>
      String(b.created_at || "").localeCompare(
        String(a.created_at || "")
      )
    )
    .slice(0, 5);
    const interviewerTotal = interviewerDashboardInterviews.length;

const interviewerUpcoming = interviewerDashboardInterviews.filter(
  (interview) => {
    const scheduledTime = new Date(
      interview.scheduled_at
    ).getTime();

    return (
      interview.status === "scheduled" &&
      Number.isFinite(scheduledTime) &&
      scheduledTime >= Date.now()
    );
  }
).length;

const interviewerCompleted = interviewerDashboardInterviews.filter(
  (interview) => interview.status === "completed"
).length;

const interviewerCancelled = interviewerDashboardInterviews.filter(
  (interview) => interview.status === "cancelled"
).length;


  if (checkingSession) {
    return (
      <div className="loading-screen">
        Loading ApplyTrack AI...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} />;
  }

  function renderSidebar() {
    return (
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>

          <div>
            <h2>
              ApplyTrack<span>AI</span>
            </h2>
            <p>YOUR CAREER, SIMPLIFIED</p>
          </div>
        </div>

        <div className="workspace-label">YOUR WORKSPACE</div>

        <nav className="nav-menu">
          {menu.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${activeTab === item.name ? "active" : ""
                }`}
              onClick={() => setActiveTab(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
<span>{item.name}</span>

{role === "candidate" &&
  item.name === "Interviews" &&
  unreadNotificationCount > 0 && (
    <span
      style={{
        marginLeft: "auto",
        minWidth: 22,
        height: 22,
        padding: "0 6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        background: "#dc2626",
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {unreadNotificationCount > 99
        ? "99+"
        : unreadNotificationCount}
    </span>
  )}

              {role === "recruiter" &&
                item.name === "Applicants" && (
                  <span
                    style={{
                      marginLeft: "auto",
                      minWidth: 24,
                      height: 24,
                      padding: "0 7px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 999,
                      background:
                        recruiterApplicationCount > 0
                          ? "#0f766e"
                          : "#e5e7eb",
                      color:
                        recruiterApplicationCount > 0
                          ? "#ffffff"
                          : "#6b7280",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {recruiterApplicationCount}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>

            <h3>
              {role === "interviewer"
                ? "Make every interview count."
                : role === "recruiter"
                  ? "Build your next great team."
                  : "Move forward with confidence."}
            </h3>

            <p>{ROLE_DESCRIPTIONS[role]}</p>

            <button
              type="button"
              onClick={() => setActiveTab("Overview")}
            >
              Go to Overview →
            </button>
          </div>

          <div className="profile">
            <div className="avatar">
              {(user?.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{user?.username || "My Account"}</strong>
              <span>
                {ROLE_LABELS[role] || "Workspace"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={handleLogout}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            ↪ Sign Out
          </button>
        </div>
      </aside>
    );
  }

  function renderTopbar() {
    return (
      <header className="topbar">
        <div className="breadcrumb">
          {ROLE_LABELS[role] || "Workspace"}
          <span>/</span>
          {activeTab}
        </div>

        <div className="topbar-actions">
          <span className="today-label">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>

          <Notifications />

          <div className="avatar small">
            {(user?.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>
      </header>
    );
  }

  function renderWelcome(title, description, action) {
    return (
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            {ROLE_LABELS[role] || "YOUR WORKSPACE"}
          </div>

          <h1>{title}</h1>
          <p className="subtitle">{description}</p>
        </div>

        {action}
      </section>
    );
  }

  function renderCandidateOverview() {
    return (
      <>
        {renderWelcome(
          `Welcome back, ${user?.username || "there"}.`,
          "Your career progress, applications, and next steps in one place.",
          <button
            type="button"
            className="primary-button"
            onClick={() => setActiveTab("Browse Jobs")}
          >
            Browse jobs →
          </button>
        )}

        <section className="stats-grid">
          <StatCard
            icon="▤"
            label="Applications"
            value={totalApplications}
          />

          <StatCard
            icon="◷"
            label="Interview Stage"
            value={interviewCount}
          />

          <StatCard
            icon="✦"
            label="Offers / Selected"
            value={offerCount}
          />

          <StatCard
            icon="↗"
            label="Response Rate"
            value={`${responseRate}%`}
          />
        </section>

        <section
          className="panel applications-panel"
          style={{ marginTop: 24 }}
        >
          <div className="panel-header">
            <div>
              <h2>Recent applications</h2>
              <p>
                Track the latest progress on your applications.
              </p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => setActiveTab("My Applications")}
            >
              View all →
            </button>
          </div>

          {dashboardLoading ? (
            <p>Loading applications...</p>
          ) : dashboardError ? (
            <p role="alert">{dashboardError}</p>
          ) : recentApplications.length === 0 ? (
            <EmptyState
              icon="⌕"
              title="Your journey starts here"
              description="Browse available jobs and submit your first application to start tracking your progress."
              action={
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveTab("Browse Jobs")}
                >
                  Find jobs →
                </button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>COMPANY & ROLE</th>
                    <th>DATE APPLIED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {recentApplications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <div className="company-cell">
                          <div className="company-logo blue">
                            {(application.company_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {application.company_name}
                            </strong>
                            <span>{application.job_title}</span>
                          </div>
                        </div>
                      </td>

                      <td>{getApplicationDate(application)}</td>

                      <td>
                        <span
                          className={`status ${["offer", "selected"].includes(
                            application.status
                          )
                              ? "status-green"
                              : application.status === "interview"
                                ? "status-purple"
                                : application.status === "rejected"
                                  ? "status-orange"
                                  : "status-blue"
                            }`}
                        >
                          {formatStatus(application.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="panel"
          style={{ marginTop: 24, padding: 24 }}
        >
          <div className="panel-header">
            <div>
              <h2>Your next steps</h2>
              <p>Keep your career search moving forward.</p>
            </div>
          </div>

          <div className="stats-grid">
            <button
              type="button"
              className="stat-card"
              onClick={() => setActiveTab("Browse Jobs")}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <span className="stat-icon">⌕</span>
              <p>Explore opportunities</p>
              <strong>Browse jobs →</strong>
            </button>

            <button
              type="button"
              className="stat-card"
              onClick={() => setActiveTab("Interviews")}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <span className="stat-icon">◷</span>
              <p>Interview center</p>
              <strong>View interviews →</strong>
            </button>

            <button
              type="button"
              className="stat-card"
              onClick={() => setActiveTab("AI Career Tools")}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <span className="stat-icon">✦</span>
              <p>Improve your profile</p>
              <strong>Open AI tools →</strong>
            </button>
          </div>
        </section>
      </>
    );
  }

  function renderRecruiterOverview() {
    return (
      <>
        {renderWelcome(
          `Welcome back, ${user?.username || "there"}.`,
          "Manage your vacancies, candidates, and hiring pipeline.",
          <button
            type="button"
            className="primary-button"
            onClick={() => setActiveTab("Job Openings")}
          >
            + Manage job openings
          </button>
        )}

        <section className="stats-grid">
          <StatCard
            icon="▣"
            label="Total Job Openings"
            value={recruiterTotalJobs}
          />

          <StatCard
            icon="✓"
            label="Published Jobs"
            value={recruiterPublishedJobs}
          />

          <StatCard
            icon="✎"
            label="Draft Jobs"
            value={recruiterDraftJobs}
          />

          <StatCard
            icon="◷"
            label="Closed / Expired"
            value={recruiterClosedJobs}
          />
        </section>

        <section
          className="panel applications-panel"
          style={{ marginTop: 24 }}
        >
          <div className="panel-header">
            <div>
              <h2>Recent job openings</h2>
              <p>
                Review the status of your latest vacancies.
              </p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => setActiveTab("Job Openings")}
            >
              Manage all jobs →
            </button>
          </div>

          {recruiterDashboardLoading ? (
            <p>Loading your job openings...</p>
          ) : recruiterDashboardError ? (
            <div>
              <p role="alert">{recruiterDashboardError}</p>

              <button
                type="button"
                className="primary-button"
                onClick={loadRecruiterDashboard}
              >
                Try again
              </button>
            </div>
          ) : recruiterRecentJobs.length === 0 ? (
            <EmptyState
              icon="▣"
              title="Your hiring journey starts here"
              description="Create your first job opening to begin receiving applications."
              action={
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActiveTab("Job Openings")}
                >
                  Manage job openings →
                </button>
              }
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>JOB TITLE</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {recruiterRecentJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="company-cell">
                          <div className="company-logo blue">
                            {(job.company_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{job.title}</strong>
                            <span>{job.company_name}</span>
                          </div>
                        </div>
                      </td>

                      <td>{job.location || "Not specified"}</td>

                      <td>
                        <span
                          className={`status ${job.status === "published"
                              ? "status-green"
                              : ["closed", "expired"].includes(
                                job.status
                              )
                                ? "status-orange"
                                : "status-blue"
                            }`}
                        >
                          {formatStatus(job.status)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setActiveTab("Job Openings")}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="stats-grid" style={{ marginTop: 24 }}>
          <button
            type="button"
            className="stat-card"
            onClick={() => setActiveTab("Applicants")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <span className="stat-icon">♙</span>
            <p>Candidate pipeline</p>
            <strong>{recruiterApplicationCount} applications</strong>
            <span>Review applicants →</span>
          </button>

          <button
            type="button"
            className="stat-card"
            onClick={() => setActiveTab("Interview Management")}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <span className="stat-icon">◷</span>
            <p>Interview coordination</p>
            <strong>Manage interviews</strong>
            <span>Open interview management →</span>
          </button>
        </section>
      </>
    );
  }
function renderInterviewerOverview() {
  const isInitialLoading =
    interviewerDashboardLoading &&
    interviewerDashboardInterviews.length === 0;

  return (
    <>
      {renderWelcome(
        `Welcome back, ${user?.username || "there"}.`,
        "Your interview schedule, assigned candidates, and evaluation tasks.",
        <button
          type="button"
          className="primary-button"
          onClick={loadInterviewerDashboard}
          disabled={interviewerDashboardLoading}
        >
          {interviewerDashboardLoading
            ? "Refreshing..."
            : "↻ Refresh statistics"}
        </button>
      )}

      {interviewerDashboardError && (
        <section
          className="panel"
          style={{ marginTop: 20, padding: 20 }}
        >
          <p role="alert">
            {interviewerDashboardError}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={loadInterviewerDashboard}
          >
            Try again
          </button>
        </section>
      )}

      <section className="stats-grid">
        <StatCard
          icon="◷"
          label="Assigned Interviews"
          value={isInitialLoading ? "..." : interviewerTotal}
          description="All interviews assigned to you"
        />

        <StatCard
          icon="▦"
          label="Upcoming Interviews"
          value={isInitialLoading ? "..." : interviewerUpcoming}
          description="Scheduled interviews in the future"
        />

        <StatCard
          icon="✓"
          label="Completed Interviews"
          value={isInitialLoading ? "..." : interviewerCompleted}
          description="Interviews marked as completed"
        />

      </section>

      <section
        className="panel"
        style={{ marginTop: 24, padding: 24 }}
      >
        <div className="panel-header">
          <div>
            <h2>Your interview workspace</h2>
            <p>
              Monitor your assigned interviews and keep your
              evaluations up to date.
            </p>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={loadInterviewerDashboard}
            disabled={interviewerDashboardLoading}
          >
            Refresh →
          </button>
        </div>

        {isInitialLoading ? (
          <EmptyState
            icon="◷"
            title="Loading your interviews"
            description="Retrieving your assigned interviews and calculating your statistics."
          />
        ) : interviewerDashboardError &&
          interviewerDashboardInterviews.length === 0 ? (
          <EmptyState
            icon="!"
            title="Unable to load interviews"
            description="Please check your connection and try again."
            action={
              <button
                type="button"
                className="primary-button"
                onClick={loadInterviewerDashboard}
              >
                Try again
              </button>
            }
          />
        ) : interviewerTotal === 0 ? (
          <EmptyState
            icon="◷"
            title="No interviews assigned yet"
            description="When a recruiter assigns interviews to you, your schedule and statistics will appear here."
          />
        ) : (
          <>
            
             

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 24,
                opacity: 0.75,
                fontSize: 14,
              }}
            >
              <span>
                Total assigned:{" "}
                <strong>{interviewerTotal}</strong>
              </span>

              <span>•</span>

              <span>
                Cancelled:{" "}
                <strong>{interviewerCancelled}</strong>
              </span>
            </div>
          </>
        )}
      </section>
    </>
  );
}
  function renderAdminOverview() {
    return (
      <>
        {renderWelcome(
          `Welcome back, ${user?.username || "there"}.`,
          ROLE_DESCRIPTIONS.admin,
          <button
            type="button"
            className="primary-button"
            onClick={() => setActiveTab("Platform Management")}
          >
            Open platform management →
          </button>
        )}

        <section
          className="panel"
          style={{ padding: 28, marginTop: 24 }}
        >
          <h2>Platform workspace</h2>
          <p>
            Use platform management to maintain the application and
            oversee platform operations.
          </p>
        </section>
      </>
    );
  }

  function renderOverview() {
    if (role === "candidate") {
      return renderCandidateOverview();
    }

    if (role === "recruiter") {
      return renderRecruiterOverview();
    }

    if (role === "interviewer") {
      return renderInterviewerOverview();
    }

    return renderAdminOverview();
  }

  function renderPlaceholder(title, description) {
    return (
      <section
        className="panel"
        style={{ padding: 32, marginTop: 24 }}
      >
        <div className="tip-icon">✦</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </section>
    );
  }

  function renderActiveWorkspace() {
    // Shared profile and settings.
    if (activeTab === "Profile" || activeTab === "Settings") {
      return (
        <ProfileSettings
          key={`${role}-${activeTab}`}
          role={role}
          user={user}
          initialSection={
            activeTab === "Settings" ? "settings" : "profile"
          }
          onDarkModeChange={handleDarkModeChange}
        />
      );
    }

    // Candidate workspace.
    if (role === "candidate" && activeTab === "Browse Jobs") {
      return <BrowseJobs />;
    }

    if (role === "candidate" && activeTab === "My Applications") {
      return <JobApplications />;
    }

    if (role === "candidate" && activeTab === "AI Career Tools") {
      return <AICareerTools />;
    }

    if (role === "candidate" && activeTab === "Resume Builder") {
      return <ResumeBuilder user={user} />;
    }

    if (role === "candidate" && activeTab === "Interviews") {
      return (
        <InterviewWorkspace
          role="candidate"
          mode="candidate"
        />
      );
    }

    if (role === "candidate" && activeTab === "Interview Prep") {
      return (
        <InterviewWorkspace
          role="candidate"
          mode="preparation"
        />
      );
    }

    // Recruiter workspace.
    if (role === "recruiter" && activeTab === "Job Openings") {
      return <RecruiterJobs />;
    }

    if (role === "recruiter" && activeTab === "Applicants") {
      return <RecruiterApplications />;
    }

    // UPDATED: Use the new RecruiterWorkspace component.
    if (
      role === "recruiter" &&
      activeTab === "Interview Management"
    ) {
      return <RecruiterWorkspace />;
    }

    // Interviewer workspace remains unchanged.
    if (role === "interviewer" && activeTab === "My Interviews") {
      return (
        <InterviewWorkspace
          role="interviewer"
          mode="interviewer"
        />
      );
    }

    if (
      role === "interviewer" &&
      activeTab === "Candidate Evaluations"
    ) {
      return (
        <InterviewWorkspace
          role="interviewer"
          mode="evaluations"
        />
      );
    }

    // Admin workspace.
    if (
      role === "admin" &&
      activeTab === "Platform Management"
    ) {
      return renderPlaceholder(
        "Platform Management",
        "Manage platform users, job listings, and permissions."
      );
    }

    return renderOverview();
  }

  return (
    <div className={`app-shell ${darkMode ? "app-dark-mode" : ""}`}>
      {renderSidebar()}

      <main className="main-content">
        {renderTopbar()}

        <div key={`${role}-${activeTab}`}>
          {renderActiveWorkspace()}
        </div>

        <footer>
          © 2026 ApplyTrack AI
          <span>One clear step at a time.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;