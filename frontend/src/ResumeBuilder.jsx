
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import "./ResumeBuilder.css";

const RESUME_API = "http://localhost:8000/api/resume/resumes/";

const createResume = () => ({
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
  },
  summary: "",
  experience: [
    {
      id: makeId(),
      role: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      id: makeId(),
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      grade: "",
    },
  ],
  skills: "",
  projects: [
    {
      id: makeId(),
      name: "",
      technologies: "",
      link: "",
      description: "",
    },
  ],
  certifications: [
    {
      id: makeId(),
      name: "",
      issuer: "",
      year: "",
    },
  ],
});

const templates = [
  { id: "professional", name: "Professional", label: "Classic", icon: "▤" },
  { id: "modern", name: "Modern", label: "Contemporary", icon: "◫" },
  { id: "minimal", name: "Minimal", label: "Simple", icon: "☰" },
];

const sections = [
  { id: "personal", label: "Personal details", icon: "◉" },
  { id: "summary", label: "Professional summary", icon: "✦" },
  { id: "experience", label: "Experience", icon: "▣" },
  { id: "education", label: "Education", icon: "▤" },
  { id: "projects", label: "Projects", icon: "⌘" },
  { id: "skills", label: "Skills", icon: "✧" },
  { id: "certifications", label: "Certifications", icon: "♧" },
];

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function getStorageKey(user) {
  const identity = user?.id ?? user?.username ?? "guest";
  return `applytrack_resume_builder_${identity}`;
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="rb-field">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder || label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="rb-field">
      <span>{label}</span>
      <textarea
        value={value ?? ""}
        placeholder={placeholder || label}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SectionHeading({ number, title, subtitle }) {
  return (
    <div className="rb-section-heading">
      <div className="rb-section-number">{number}</div>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function normalizeResume(saved) {
  const defaults = createResume();

  return {
    ...defaults,
    personal: {
      ...defaults.personal,
      ...(saved.personal_info || {}),
    },
    summary: saved.summary || "",
    experience: Array.isArray(saved.experience)
      ? saved.experience
      : defaults.experience,
    education: Array.isArray(saved.education)
      ? saved.education
      : defaults.education,
    skills: Array.isArray(saved.skills)
      ? saved.skills.join(", ")
      : saved.skills || "",
    projects: Array.isArray(saved.projects)
      ? saved.projects
      : defaults.projects,
    certifications: Array.isArray(saved.certifications)
      ? saved.certifications
      : defaults.certifications,
  };
}

export default function ResumeBuilder({ user }) {
  const storageKey = useMemo(() => getStorageKey(user), [user]);

  const [resume, setResume] = useState(createResume);
  const [activeSection, setActiveSection] = useState("personal");
  const [template, setTemplate] = useState("professional");
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Loading resume...");
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Load the current user's saved resume from Django.
  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      setIsLoading(true);
      setLoadError("");
      setSaveStatus("Loading resume...");

      try {
        // apiRequest uses /api/auth/ as its base, so use the full
        // resume endpoint with fetch-compatible credentials and CSRF.
        const csrfResponse = await fetch(
          "http://localhost:8000/api/auth/csrf/",
          { credentials: "include" }
        );

        const csrfData = await csrfResponse.json().catch(() => ({}));

        if (!csrfResponse.ok || !csrfData.csrfToken) {
          throw new Error("Could not verify your session. Refresh and log in again.");
        }

        const response = await fetch(RESUME_API, {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfData.csrfToken,
          },
        });

        const savedResumes = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            savedResumes.detail ||
              "Could not load resumes. Please check that you are logged in."
          );
        }

        if (cancelled) return;

        if (Array.isArray(savedResumes) && savedResumes.length > 0) {
          const saved = savedResumes[0];

          setResumeId(saved.id);
          setResume(normalizeResume(saved));
          setTemplate(saved.template || "professional");
          setSaveStatus("Resume loaded");
        } else {
          // If the user has old browser data, use it as the initial content.
          const localData = localStorage.getItem(storageKey);

          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              setResume(normalizeResume({
                personal_info: parsed.personal,
                summary: parsed.summary,
                experience: parsed.experience,
                education: parsed.education,
                skills: parsed.skills,
                projects: parsed.projects,
                certifications: parsed.certifications,
              }));
              setTemplate(parsed.template || "professional");
            } catch {
              setResume(createResume());
            }
          } else {
            setResume(createResume());
          }

          setResumeId(null);
          setSaveStatus("New resume");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message);
          setSaveStatus("Not connected");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadResume();

    return () => {
      cancelled = true;
    };
  }, [storageKey, user, retryCount]);

  // Keep a local recovery copy and automatically save changes to Django.
  useEffect(() => {
    if (isLoading || loadError) return undefined;

    const localTimeout = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...resume, template })
        );
      } catch {
        // The database save below remains the main persistence mechanism.
      }
    }, 300);

    const databaseTimeout = setTimeout(async () => {
      setSaveStatus("Saving...");

      const payload = {
        title: resume.personal.fullName
          ? `${resume.personal.fullName}'s Resume`
          : "My Resume",
        template,
        personal_info: resume.personal,
        summary: resume.summary,
        experience: resume.experience,
        education: resume.education,
        skills: resume.skills
          .split(/[,;\n]/)
          .map((skill) => skill.trim())
          .filter(Boolean),
        projects: resume.projects,
        certifications: resume.certifications,
      };

      try {
        let response;

        if (resumeId) {
          response = await fetch(`${RESUME_API}${resumeId}/`, {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": await getCsrfForSave(),
            },
            body: JSON.stringify(payload),
          });
        } else {
          response = await fetch(RESUME_API, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": await getCsrfForSave(),
            },
            body: JSON.stringify(payload),
          });
        }

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.detail ||
              Object.entries(result)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join("; ") ||
              `Save failed (${response.status})`
          );
        }

        setResumeId(result.id);
        setSaveStatus("Saved to database");
      } catch (error) {
        setSaveStatus("Save failed");
        setNotice(`Could not save resume: ${error.message}`);
      }
    }, 1000);

    return () => {
      clearTimeout(localTimeout);
      clearTimeout(databaseTimeout);
    };
  }, [resume, template, resumeId, isLoading, loadError, storageKey]);

  async function getCsrfForSave() {
    const response = await fetch("http://localhost:8000/api/auth/csrf/", {
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.csrfToken) {
      throw new Error("Could not get security token. Please refresh and log in again.");
    }

    return data.csrfToken;
  }

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function updatePersonal(field, value) {
    setResume((current) => ({
      ...current,
      personal: { ...current.personal, [field]: value },
    }));
  }

  function updateValue(field, value) {
    setResume((current) => ({ ...current, [field]: value }));
  }

  function updateItem(section, id, field, value) {
    setResume((current) => ({
      ...current,
      [section]: current[section].map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem(section) {
    const blankItems = {
      experience: {
        id: makeId(),
        role: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
      education: {
        id: makeId(),
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        grade: "",
      },
      projects: {
        id: makeId(),
        name: "",
        technologies: "",
        link: "",
        description: "",
      },
      certifications: {
        id: makeId(),
        name: "",
        issuer: "",
        year: "",
      },
    };

    setResume((current) => ({
      ...current,
      [section]: [...current[section], blankItems[section]],
    }));
  }

  function removeItem(section, id) {
    setResume((current) => ({
      ...current,
      [section]: current[section].filter((item) => item.id !== id),
    }));
  }

  function clearResume() {
    const confirmed = window.confirm(
      "Start a new resume? This will replace your current resume."
    );

    if (!confirmed) return;

    setResume(createResume());
    setTemplate("professional");
    setActiveSection("personal");
    setNotice("New resume started. Your changes will be saved automatically.");
  }

  function exportPDF() {
    setShowPreview(true);
    window.setTimeout(() => window.print(), 300);
  }

  function renderEditor() {
    if (activeSection === "personal") {
      const personal = resume.personal;

      return (
        <>
          <SectionHeading
            number="01"
            title="Personal details"
            subtitle="Start with the details recruiters need to contact you."
          />

          <div className="rb-form-grid">
            <Field label="Full name" value={personal.fullName} placeholder="e.g. Shabbar Cyclewala" onChange={(value) => updatePersonal("fullName", value)} />
            <Field label="Target job title" value={personal.jobTitle} placeholder="e.g. Full Stack Developer" onChange={(value) => updatePersonal("jobTitle", value)} />
            <Field label="Email address" type="email" value={personal.email} placeholder="you@example.com" onChange={(value) => updatePersonal("email", value)} />
            <Field label="Phone number" value={personal.phone} placeholder="+91 XXXXX XXXXX" onChange={(value) => updatePersonal("phone", value)} />
            <Field label="City / Location" value={personal.location} placeholder="e.g. Thane, Maharashtra" onChange={(value) => updatePersonal("location", value)} />
            <Field label="LinkedIn URL" value={personal.linkedin} placeholder="linkedin.com/in/yourprofile" onChange={(value) => updatePersonal("linkedin", value)} />
            <Field label="GitHub URL" value={personal.github} placeholder="github.com/yourusername" onChange={(value) => updatePersonal("github", value)} />
            <Field label="Portfolio website" value={personal.website} placeholder="yourportfolio.com" onChange={(value) => updatePersonal("website", value)} />
          </div>
        </>
      );
    }

    if (activeSection === "summary") {
      return (
        <>
          <SectionHeading number="02" title="Professional summary" subtitle="Introduce your strengths and the value you can bring to a team." />
          <TextField label="About you" value={resume.summary} placeholder="Write 2–4 sentences about your technical skills, projects, and career goals." rows={8} onChange={(value) => updateValue("summary", value)} />
          <div className="rb-tip"><span>✦</span><p><strong>Tip:</strong> Mention relevant technologies, practical projects, and the type of role you want. Keep it factual and specific.</p></div>
        </>
      );
    }

    if (activeSection === "experience") {
      return (
        <>
          <SectionHeading number="03" title="Work experience" subtitle="Add internships, jobs, freelance work, or relevant practical experience." />
          {resume.experience.map((item, index) => (
            <div className="rb-entry-card" key={item.id}>
              <div className="rb-entry-top"><span className="rb-entry-label">Experience {index + 1}</span><button type="button" className="rb-remove" onClick={() => removeItem("experience", item.id)}>Remove</button></div>
              <div className="rb-form-grid">
                <Field label="Job title" value={item.role} placeholder="e.g. Full Stack Intern" onChange={(value) => updateItem("experience", item.id, "role", value)} />
                <Field label="Company" value={item.company} onChange={(value) => updateItem("experience", item.id, "company", value)} />
                <Field label="Location" value={item.location} onChange={(value) => updateItem("experience", item.id, "location", value)} />
                <Field label="Start date" value={item.startDate} placeholder="e.g. Jan 2026" onChange={(value) => updateItem("experience", item.id, "startDate", value)} />
                <Field label="End date" value={item.endDate} placeholder="e.g. Present" onChange={(value) => updateItem("experience", item.id, "endDate", value)} />
              </div>
              <div className="rb-entry-description"><TextField label="Responsibilities and achievements" value={item.description} placeholder="Describe your work and results. Use a new line for each point." rows={4} onChange={(value) => updateItem("experience", item.id, "description", value)} /></div>
            </div>
          ))}
          <button type="button" className="rb-add-button" onClick={() => addItem("experience")}>+ Add experience</button>
        </>
      );
    }

    if (activeSection === "education") {
      return (
        <>
          <SectionHeading number="04" title="Education" subtitle="Show your degree, institution, and academic achievements." />
          {resume.education.map((item, index) => (
            <div className="rb-entry-card" key={item.id}>
              <div className="rb-entry-top"><span className="rb-entry-label">Education {index + 1}</span><button type="button" className="rb-remove" onClick={() => removeItem("education", item.id)}>Remove</button></div>
              <div className="rb-form-grid">
                <Field label="Degree / Qualification" value={item.degree} placeholder="e.g. B.Tech Computer Science" onChange={(value) => updateItem("education", item.id, "degree", value)} />
                <Field label="College / Institution" value={item.institution} onChange={(value) => updateItem("education", item.id, "institution", value)} />
                <Field label="Location" value={item.location} onChange={(value) => updateItem("education", item.id, "location", value)} />
                <Field label="Start year" value={item.startDate} placeholder="e.g. 2023" onChange={(value) => updateItem("education", item.id, "startDate", value)} />
                <Field label="End year" value={item.endDate} placeholder="e.g. 2027" onChange={(value) => updateItem("education", item.id, "endDate", value)} />
                <Field label="Grade / CGPA" value={item.grade} placeholder="e.g. 8.2 CGPA" onChange={(value) => updateItem("education", item.id, "grade", value)} />
              </div>
            </div>
          ))}
          <button type="button" className="rb-add-button" onClick={() => addItem("education")}>+ Add education</button>
        </>
      );
    }

    if (activeSection === "projects") {
      return (
        <>
          <SectionHeading number="05" title="Projects" subtitle="Highlight projects that demonstrate your practical skills." />
          {resume.projects.map((item, index) => (
            <div className="rb-entry-card" key={item.id}>
              <div className="rb-entry-top"><span className="rb-entry-label">Project {index + 1}</span><button type="button" className="rb-remove" onClick={() => removeItem("projects", item.id)}>Remove</button></div>
              <div className="rb-form-grid">
                <Field label="Project name" value={item.name} placeholder="e.g. ApplyTrack AI" onChange={(value) => updateItem("projects", item.id, "name", value)} />
                <Field label="Technologies" value={item.technologies} placeholder="Django, React, PostgreSQL" onChange={(value) => updateItem("projects", item.id, "technologies", value)} />
                <div className="rb-full-width"><Field label="Project URL" value={item.link} placeholder="GitHub or live project link" onChange={(value) => updateItem("projects", item.id, "link", value)} /></div>
              </div>
              <div className="rb-entry-description"><TextField label="Project description" value={item.description} placeholder="Explain what the project does, the features you built, and the problems it solves." rows={4} onChange={(value) => updateItem("projects", item.id, "description", value)} /></div>
            </div>
          ))}
          <button type="button" className="rb-add-button" onClick={() => addItem("projects")}>+ Add project</button>
        </>
      );
    }

    if (activeSection === "skills") {
      return (
        <>
          <SectionHeading number="06" title="Technical skills" subtitle="List relevant skills that match the roles you want." />
          <TextField label="Your skills" value={resume.skills} placeholder="Python, Django, React, JavaScript, HTML, CSS, REST APIs, SQL, Git, GitHub" rows={6} onChange={(value) => updateValue("skills", value)} />
          <div className="rb-tip"><span>✦</span><p>Separate skills with commas or put each skill on a new line. Include only technologies you can confidently discuss in an interview.</p></div>
        </>
      );
    }

    if (activeSection === "certifications") {
      return (
        <>
          <SectionHeading number="07" title="Certifications" subtitle="Add relevant courses, certificates, and professional training." />
          {resume.certifications.map((item, index) => (
            <div className="rb-entry-card" key={item.id}>
              <div className="rb-entry-top"><span className="rb-entry-label">Certification {index + 1}</span><button type="button" className="rb-remove" onClick={() => removeItem("certifications", item.id)}>Remove</button></div>
              <div className="rb-form-grid">
                <Field label="Certification name" value={item.name} onChange={(value) => updateItem("certifications", item.id, "name", value)} />
                <Field label="Issuing organization" value={item.issuer} onChange={(value) => updateItem("certifications", item.id, "issuer", value)} />
                <Field label="Year" value={item.year} placeholder="e.g. 2026" onChange={(value) => updateItem("certifications", item.id, "year", value)} />
              </div>
            </div>
          ))}
          <button type="button" className="rb-add-button" onClick={() => addItem("certifications")}>+ Add certification</button>
        </>
      );
    }

    return null;
  }

  const skills = resume.skills.split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean);
  const visibleExperience = resume.experience.filter((item) => item.role || item.company || item.description || item.startDate || item.endDate);
  const visibleEducation = resume.education.filter((item) => item.degree || item.institution || item.grade);
  const visibleProjects = resume.projects.filter((item) => item.name || item.description || item.technologies || item.link);
  const visibleCertifications = resume.certifications.filter((item) => item.name || item.issuer || item.year);

  const contactDetails = [resume.personal.email, resume.personal.phone, resume.personal.location].filter(Boolean);

  function renderResumePreview() {
    const personal = resume.personal;

    return (
      <article className={`rb-resume-paper rb-template-${template}`}>
        <header className="rb-resume-header">
          <h1>{personal.fullName || "Your Name"}</h1>
          {personal.jobTitle && <div className="rb-resume-job-title">{personal.jobTitle}</div>}
          {contactDetails.length > 0 && <div className="rb-resume-contact">{contactDetails.join(" • ")}</div>}
          {(personal.linkedin || personal.github || personal.website) && (
            <div className="rb-resume-links">
              {[personal.linkedin, personal.github, personal.website].filter(Boolean).map((link, index) => (
                <span key={`${link}-${index}`}>{link}</span>
              ))}
            </div>
          )}
        </header>

        {resume.summary.trim() && <section className="rb-resume-section"><h2>Professional Summary</h2><p className="rb-resume-paragraph">{resume.summary}</p></section>}

        {visibleExperience.length > 0 && (
          <section className="rb-resume-section">
            <h2>Experience</h2>
            {visibleExperience.map((item) => (
              <div className="rb-resume-item" key={item.id}>
                <div className="rb-resume-item-heading"><strong>{item.role || "Job title"}</strong><span>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</span></div>
                <div className="rb-resume-item-subheading">{[item.company, item.location].filter(Boolean).join(" • ")}</div>
                {item.description && <ul className="rb-resume-bullets">{item.description.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => <li key={`${item.id}-${index}`}>{line.replace(/^[•\-*]\s*/, "")}</li>)}</ul>}
              </div>
            ))}
          </section>
        )}

        {visibleProjects.length > 0 && (
          <section className="rb-resume-section">
            <h2>Projects</h2>
            {visibleProjects.map((item) => (
              <div className="rb-resume-item" key={item.id}>
                <div className="rb-resume-item-heading"><strong>{item.name || "Project name"}</strong>{item.link && <span>{item.link}</span>}</div>
                {item.technologies && <div className="rb-resume-item-subheading">{item.technologies}</div>}
                {item.description && <p className="rb-resume-paragraph">{item.description}</p>}
              </div>
            ))}
          </section>
        )}

        {visibleEducation.length > 0 && (
          <section className="rb-resume-section">
            <h2>Education</h2>
            {visibleEducation.map((item) => (
              <div className="rb-resume-item" key={item.id}>
                <div className="rb-resume-item-heading"><strong>{item.degree || "Degree"}</strong><span>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</span></div>
                <div className="rb-resume-item-subheading">{[item.institution, item.location].filter(Boolean).join(" • ")}</div>
                {item.grade && <p className="rb-resume-paragraph">{item.grade}</p>}
              </div>
            ))}
          </section>
        )}

        {skills.length > 0 && <section className="rb-resume-section"><h2>Technical Skills</h2><p className="rb-resume-paragraph">{skills.join(" • ")}</p></section>}

        {visibleCertifications.length > 0 && (
          <section className="rb-resume-section">
            <h2>Certifications</h2>
            {visibleCertifications.map((item) => (
              <div className="rb-resume-item" key={item.id}>
                <div className="rb-resume-item-heading"><strong>{item.name || "Certification"}</strong><span>{item.year}</span></div>
                {item.issuer && <div className="rb-resume-item-subheading">{item.issuer}</div>}
              </div>
            ))}
          </section>
        )}

        <footer className="rb-resume-footer">Created with ApplyTrack AI Resume Builder</footer>
      </article>
    );
  }

  return (
    <div className="rb-page">
      <div className="rb-topbar">
        <div className="rb-brand">
          <div className="rb-brand-icon">A</div>
          <div><div className="rb-brand-name">ApplyTrack <span>AI</span></div><div className="rb-brand-subtitle">RESUME STUDIO</div></div>
        </div>

        <div className="rb-topbar-actions">
          <span className="rb-save-indicator">
            <span className="rb-save-dot" />
            {isLoading ? "Loading..." : saveStatus}
          </span>
          <button type="button" className="rb-button rb-button-light" onClick={clearResume}>New resume</button>
          <button type="button" className="rb-button rb-button-primary" onClick={exportPDF}>↓ Export PDF</button>
        </div>
      </div>

      <div className="rb-hero">
        <div>
          <div className="rb-eyebrow"><span>✦</span> YOUR CAREER, PRESENTED BETTER</div>
          <h1>Build a resume that <span>opens doors.</span></h1>
          <p>Tell your professional story with clarity. Edit your details, explore templates, and preview your resume as you build.</p>
        </div>
        <div className="rb-hero-badge"><div className="rb-hero-badge-icon">✧</div><div><strong>Resume Studio</strong><span>Designed for your next opportunity</span></div></div>
      </div>

      {notice && <div className="rb-notice">{notice}</div>}

      {loadError && (
        <div className="rb-notice">
          {loadError}
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Retry
          </button>
        </div>
      )}

      <div className="rb-template-bar">
        <div><span className="rb-small-label">CHOOSE YOUR STYLE</span><h2>Resume templates</h2></div>
        <div className="rb-template-options">
          {templates.map((item) => (
            <button type="button" key={item.id} className={`rb-template-option ${template === item.id ? "is-selected" : ""}`} onClick={() => setTemplate(item.id)}>
              <span className="rb-template-icon">{item.icon}</span><span className="rb-template-name">{item.name}</span><span className="rb-template-label">{item.label}</span>{template === item.id && <span className="rb-template-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="rb-workspace">
        <aside className="rb-editor">
          <div className="rb-editor-heading"><div><span className="rb-small-label">YOUR INFORMATION</span><h2>Build your resume</h2></div><span className="rb-editor-count">7 sections</span></div>
          <nav className="rb-section-nav" aria-label="Resume sections">
            {sections.map((section, index) => (
              <button type="button" key={section.id} className={`rb-section-nav-item ${activeSection === section.id ? "is-active" : ""}`} onClick={() => setActiveSection(section.id)}>
                <span className="rb-section-nav-icon">{section.icon}</span><span className="rb-section-nav-text"><strong>{section.label}</strong><small>Section {String(index + 1).padStart(2, "0")}</small></span><span className="rb-section-nav-arrow">›</span>
              </button>
            ))}
          </nav>
          <div className="rb-editor-tip"><span>✦</span><div><strong>Make every word count</strong><p>Focus on relevant skills, projects, and measurable results.</p></div></div>
        </aside>

        <section className="rb-editor-content">
          <div className="rb-editor-content-top"><span className="rb-small-label">RESUME EDITOR</span><span className="rb-live-tag"><span /> LIVE PREVIEW</span></div>
          {renderEditor()}
          <div className="rb-editor-footer">
            <button type="button" className="rb-button rb-button-light" onClick={() => setActiveSection(sections[Math.max(0, sections.findIndex((section) => section.id === activeSection) - 1)].id)} disabled={activeSection === sections[0].id}>← Previous</button>
            <span>Section {sections.findIndex((section) => section.id === activeSection) + 1} of {sections.length}</span>
            <button type="button" className="rb-button rb-button-primary" onClick={() => setActiveSection(sections[Math.min(sections.length - 1, sections.findIndex((section) => section.id === activeSection) + 1)].id)} disabled={activeSection === sections[sections.length - 1].id}>Next section →</button>
          </div>
        </section>

        <aside className="rb-preview-panel">
          <div className="rb-preview-heading"><div><span className="rb-small-label">YOUR DOCUMENT</span><h2>Live preview</h2></div><span className="rb-preview-live"><span /> Live</span></div>
          <div className="rb-paper-wrap">{renderResumePreview()}</div>
          <div className="rb-preview-bottom"><div><span className="rb-preview-bottom-icon">✓</span><span>Changes appear automatically</span></div><button type="button" onClick={exportPDF} className="rb-preview-export">Export PDF ↗</button></div>
        </aside>
      </div>

      <div className="rb-bottom-note"><span>✦</span>Your resume is saved to your ApplyTrack AI account when the database connection is active.</div>

      <div className="rb-mobile-preview-button"><button type="button" className="rb-button rb-button-primary" onClick={() => setShowPreview((current) => !current)}>{showPreview ? "Hide preview" : "Show resume preview"}</button></div>

      {showPreview && (
        <div className="rb-mobile-preview-overlay">
          <div className="rb-mobile-preview-header"><strong>Resume preview</strong><button type="button" onClick={() => setShowPreview(false)} aria-label="Close preview">✕</button></div>
          <div className="rb-mobile-preview-document">{renderResumePreview()}</div>
        </div>
      )}
    </div>
  );
}
