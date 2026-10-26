import { useEffect, useState } from "react";
import "./ProfileSettings.css";

const ROLE_DETAILS = {
    candidate: {
        title: "Candidate Profile",
        description: "Manage your professional profile and career information.",
        fields: [
            { name: "full_name", label: "Full name", placeholder: "Enter your full name" },
            { name: "email", label: "Email address", placeholder: "Enter your email", type: "email" },
            { name: "phone", label: "Phone number", placeholder: "Enter your phone number" },
            { name: "location", label: "Location", placeholder: "City, State, Country" },
            { name: "education", label: "Education", placeholder: "Your degree and college" },
            { name: "skills", label: "Skills", placeholder: "Python, Django, React..." },
            { name: "resume_url", label: "Resume link", placeholder: "Paste your resume link" },
            { name: "linkedin_url", label: "LinkedIn profile", placeholder: "Paste your LinkedIn URL" },
        ],
    },

    recruiter: {
        title: "Recruiter Profile",
        description: "Manage your professional information and hiring details.",
        fields: [
            { name: "full_name", label: "Full name", placeholder: "Enter your full name" },
            { name: "email", label: "Work email", placeholder: "Enter your work email", type: "email" },
            { name: "phone", label: "Phone number", placeholder: "Enter your phone number" },
            { name: "company_name", label: "Company name", placeholder: "Enter your company name" },
            { name: "job_title", label: "Job title", placeholder: "Recruiter, HR Manager..." },
            { name: "location", label: "Company location", placeholder: "City, State, Country" },
            { name: "linkedin_url", label: "LinkedIn profile", placeholder: "Paste your LinkedIn URL" },
            { name: "website", label: "Company website", placeholder: "https://example.com" },
        ],
    },

    interviewer: {
        title: "Interviewer Profile",
        description: "Manage your professional information and interview preferences.",
        fields: [
            { name: "full_name", label: "Full name", placeholder: "Enter your full name" },
            { name: "email", label: "Work email", placeholder: "Enter your work email", type: "email" },
            { name: "phone", label: "Phone number", placeholder: "Enter your phone number" },
            { name: "job_title", label: "Professional title", placeholder: "Senior Developer, Technical Lead..." },
            { name: "company_name", label: "Company name", placeholder: "Enter your company name" },
            { name: "expertise", label: "Areas of expertise", placeholder: "Python, React, System Design..." },
            { name: "experience", label: "Years of experience", placeholder: "Enter years of experience" },
            { name: "linkedin_url", label: "LinkedIn profile", placeholder: "Paste your LinkedIn URL" },
        ],
    },

    admin: {
        title: "Administrator Profile",
        description: "Manage your administrator contact and professional information.",
        fields: [
            { name: "full_name", label: "Full name", placeholder: "Enter your full name" },
            { name: "email", label: "Email address", placeholder: "Enter your email", type: "email" },
            { name: "phone", label: "Phone number", placeholder: "Enter your phone number" },
            { name: "job_title", label: "Administrator title", placeholder: "Platform Administrator" },
            { name: "location", label: "Location", placeholder: "City, State, Country" },
            { name: "linkedin_url", label: "LinkedIn profile", placeholder: "Paste your LinkedIn URL" },
        ],
    },
};
function applyDarkMode(enabled) {
    document.documentElement.classList.toggle("dark-mode", Boolean(enabled));
    document.body.classList.toggle("dark-mode", Boolean(enabled));
    localStorage.setItem("applytrack_dark_mode", String(Boolean(enabled)));
}

const DEFAULT_SETTINGS = {
    email_notifications: true,
    application_updates: true,
    interview_reminders: true,
    marketing_emails: false,
    dark_mode: false,
    profile_visibility: "registered",
};

function getInitialProfile(user) {
    return {
        full_name: user?.full_name || user?.username || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: user?.location || "",
        education: user?.education || "",
        skills: user?.skills || "",
        resume_url: user?.resume_url || "",
        linkedin_url: user?.linkedin_url || "",
        company_name: user?.company_name || "",
        job_title: user?.job_title || "",
        website: user?.website || "",
        expertise: user?.expertise || "",
        experience: user?.experience || "",
    };
}

function ProfileSettings({
    role = "candidate",
    user = {},
    initialSection = "profile",
}) {
    const roleKey = String(role || "candidate").toLowerCase();
    const roleDetails = ROLE_DETAILS[roleKey] || ROLE_DETAILS.candidate;
    const [activeSection, setActiveSection] = useState(initialSection);


    const [profile, setProfile] = useState(() => getInitialProfile(user));
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setProfile(getInitialProfile(user));
    }, [user]);

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem(
                `applytrack_profile_${roleKey}_${user?.id || user?.username || "user"}`
            );

            if (savedProfile) {
                setProfile((current) => ({
                    ...current,
                    ...JSON.parse(savedProfile),
                }));
            }

            const savedSettings = localStorage.getItem(
                `applytrack_settings_${roleKey}_${user?.id || user?.username || "user"}`
            );
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);

                setSettings((current) => ({
                    ...current,
                    ...parsedSettings,
                }));

                applyDarkMode(parsedSettings.dark_mode ?? false);
            } else {
                applyDarkMode(
                    localStorage.getItem("applytrack_dark_mode") === "true"
                );
            }
        } catch {
            setError("Some saved preferences could not be loaded.");
        }
    }, [roleKey, user?.id, user?.username]);

    function updateProfile(event) {
        const { name, value } = event.target;

        setProfile((current) => ({
            ...current,
            [name]: value,
        }));

        setSuccess("");
        setError("");
    }
    function updateSetting(event) {
        const { name, checked, value, type } = event.target;

        const newValue = type === "checkbox" ? checked : value;

        setSettings((current) => ({
            ...current,
            [name]: newValue,
        }));

        if (name === "dark_mode") {
            applyDarkMode(checked);
        }

        setSuccess("");
        setError("");
    }

    function saveProfile(event) {
        event.preventDefault();
        setSuccess("");
        setError("");

        try {
            const key = `applytrack_profile_${roleKey}_${user?.id || user?.username || "user"}`;

            localStorage.setItem(key, JSON.stringify(profile));

            setSuccess("Your profile has been saved on this browser.");
        } catch {
            setError("Could not save your profile. Please try again.");
        }
    }

    function saveSettings(event) {
        event.preventDefault();
        setSuccess("");
        setError("");

        try {
            const key = `applytrack_settings_${roleKey}_${user?.id || user?.username || "user"}`;

            localStorage.setItem(key, JSON.stringify(settings));

            setSuccess("Your preferences have been saved on this browser.");
        } catch {
            setError("Could not save your settings. Please try again.");
        }
    }

    const displayName =
        profile.full_name ||
        user?.username ||
        "Your profile";

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    return (
        <div className="ps-page">
            <div className="ps-heading">
                <div>
                    <span className="ps-eyebrow">ACCOUNT CENTER</span>
                    <h1>Profile & Settings</h1>
                    <p>Keep your information accurate and personalize your workspace.</p>
                </div>

                <div className="ps-role-badge">
                    <span className="ps-status-dot" />
                    {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)} account
                </div>
            </div>

            <div className="ps-layout">
                <aside className="ps-card ps-navigation">
                    <div className="ps-user-summary">
                        <div className="ps-avatar">{initials || "U"}</div>

                        <div className="ps-user-text">
                            <strong>{displayName}</strong>
                            <span>{user?.email || "Add your email address"}</span>
                        </div>
                    </div>

                    <div className="ps-divider" />

                    <p className="ps-menu-label">ACCOUNT</p>

                    <button
                        type="button"
                        className={`ps-menu-item ${activeSection === "profile" ? "active" : ""}`}
                        onClick={() => {
                            setActiveSection("profile");
                            setSuccess("");
                            setError("");
                        }}
                    >
                        <span className="ps-menu-icon">♙</span>
                        My Profile
                        <span className="ps-menu-arrow">›</span>
                    </button>

                    <button
                        type="button"
                        className={`ps-menu-item ${activeSection === "settings" ? "active" : ""}`}
                        onClick={() => {
                            setActiveSection("settings");
                            setSuccess("");
                            setError("");
                        }}
                    >
                        <span className="ps-menu-icon">⚙</span>
                        Preferences
                        <span className="ps-menu-arrow">›</span>
                    </button>

                    <div className="ps-help-card">
                        <span className="ps-help-icon">✦</span>
                        <strong>Your account, your way.</strong>
                        <p>Keep your details updated for a better ApplyTrack experience.</p>
                    </div>
                </aside>

                <section className="ps-card ps-content">
                    {success && (
                        <div className="ps-message ps-success" role="status">
                            ✓ {success}
                        </div>
                    )}

                    {error && (
                        <div className="ps-message ps-error" role="alert">
                            {error}
                        </div>
                    )}

                    {activeSection === "profile" ? (
                        <>
                            <div className="ps-section-heading">
                                <div>
                                    <span className="ps-section-icon">♙</span>
                                    <h2>{roleDetails.title}</h2>
                                    <p>{roleDetails.description}</p>
                                </div>

                                <span className="ps-edit-label">PERSONAL DETAILS</span>
                            </div>

                            <form onSubmit={saveProfile}>
                                <div className="ps-form-grid">
                                    {roleDetails.fields.map((field) => (
                                        <label className="ps-field" key={field.name}>
                                            <span>{field.label}</span>

                                            <input
                                                type={field.type || "text"}
                                                name={field.name}
                                                value={profile[field.name] || ""}
                                                onChange={updateProfile}
                                                placeholder={field.placeholder}
                                            />
                                        </label>
                                    ))}
                                </div>

                                <div className="ps-form-footer">
                                    <p>Your information helps personalize your workspace.</p>

                                    <button type="submit" className="ps-save-button">
                                        Save Profile <span>→</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="ps-section-heading">
                                <div>
                                    <span className="ps-section-icon">⚙</span>
                                    <h2>Account Preferences</h2>
                                    <p>Choose how you want to use ApplyTrack AI.</p>
                                </div>

                                <span className="ps-edit-label">PREFERENCES</span>
                            </div>

                            <form onSubmit={saveSettings}>
                                <div className="ps-setting-group">
                                    <div className="ps-setting-group-heading">
                                        <span className="ps-setting-symbol">♧</span>
                                        <div>
                                            <h3>Notifications</h3>
                                            <p>Choose which updates you want to receive.</p>
                                        </div>
                                    </div>

                                    {[
                                        {
                                            name: "email_notifications",
                                            title: "Email notifications",
                                            description: "Receive important updates by email.",
                                        },
                                        {
                                            name: "application_updates",
                                            title: "Application updates",
                                            description: "Stay informed about application activity.",
                                        },
                                        {
                                            name: "interview_reminders",
                                            title: "Interview reminders",
                                            description: "Keep track of upcoming interviews.",
                                        },
                                        {
                                            name: "marketing_emails",
                                            title: "Product announcements",
                                            description: "Receive news about features and improvements.",
                                        },
                                    ].map((item) => (
                                        <label className="ps-toggle-row" key={item.name}>
                                            <span className="ps-toggle-copy">
                                                <strong>{item.title}</strong>
                                                <small>{item.description}</small>
                                            </span>

                                            <input
                                                type="checkbox"
                                                name={item.name}
                                                checked={Boolean(settings[item.name])}
                                                onChange={updateSetting}
                                            />

                                            <span className="ps-toggle" />
                                        </label>
                                    ))}
                                </div>

                                <div className="ps-setting-group">
                                    <div className="ps-setting-group-heading">
                                        <span className="ps-setting-symbol">◉</span>
                                        <div>
                                            <h3>Privacy</h3>
                                            <p>Choose your preferred profile visibility.</p>
                                        </div>
                                    </div>

                                    <label className="ps-field">
                                        <span>Profile visibility preference</span>

                                        <select
                                            name="profile_visibility"
                                            value={settings.profile_visibility}
                                            onChange={updateSetting}
                                        >
                                            <option value="registered">
                                                Registered users
                                            </option>
                                            <option value="private">
                                                Private
                                            </option>
                                            <option value="public">
                                                Public
                                            </option>
                                        </select>
                                    </label>

                                    <p className="ps-note">
                                        This preference is saved locally. It does not change
                                        server-side access permissions or make your profile
                                        private on the backend.
                                    </p>
                                </div>

                                <div className="ps-setting-group">
                                    <div className="ps-setting-group-heading">
                                        <span className="ps-setting-symbol">☼</span>
                                        <div>
                                            <h3>Appearance</h3>
                                            <p>Save your preferred appearance setting.</p>
                                        </div>
                                    </div>

                                    <label className="ps-toggle-row">
                                        <span className="ps-toggle-copy">
                                            <strong>Dark mode preference</strong>
                                            <small>
                                                Remember that you prefer a darker interface.
                                            </small>
                                        </span>

                                        <input
                                            type="checkbox"
                                            name="dark_mode"
                                            checked={Boolean(settings.dark_mode)}
                                            onChange={updateSetting}
                                        />

                                        <span className="ps-toggle" />
                                    </label>

                                    <p className="ps-note">
                                        Saving this preference does not automatically change
                                        the appearance of the rest of the application.
                                    </p>
                                </div>

                                <div className="ps-form-footer">
                                    <p>Your preferences are stored in this browser.</p>

                                    <button type="submit" className="ps-save-button">
                                        Save Settings <span>→</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

export default ProfileSettings;
