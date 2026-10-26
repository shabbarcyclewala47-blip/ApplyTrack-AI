import { useState } from "react";
import { apiRequest } from "./api";

const SKILL_KEYWORDS = [
    "Python",
    "Django",
    "React",
    "JavaScript",
    "HTML",
    "CSS",
    "SQL",
    "REST API",
    "Machine Learning",
    "Data Analysis",
    "Git",
    "GitHub",
    "AWS",
    "Docker",
    "Node.js",
];

export default function AICareerTools() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [jobDescription, setJobDescription] = useState("");
    const [jobMatch, setJobMatch] = useState(null);

    function handleFileChange(event) {
        const selectedFile = event.target.files?.[0];

        setError("");
        setResult(null);
        setJobMatch(null);

        if (!selectedFile) {
            setFile(null);
            return;
        }

        if (selectedFile.type !== "application/pdf") {
            setFile(null);
            setError("Please upload your resume as a PDF file.");
            event.target.value = "";
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setFile(null);
            setError("Your PDF must be smaller than 5 MB.");
            event.target.value = "";
            return;
        }

        setFile(selectedFile);
    }

    async function analyzeResume() {
        if (!file) {
            setError("Please select your resume PDF first.");
            return;
        }

        setAnalyzing(true);
        setError("");
        setResult(null);
        setJobMatch(null);

        try {
            const formData = new FormData();
            formData.append("resume", file);

            const response = await apiRequest("../resume/analyze/", {
                method: "POST",
                body: formData,
            });

            const resumeText = response.extracted_text || "";

            if (!resumeText.trim()) {
                throw new Error(
                    "No readable text was found in your resume. Please try another text-based PDF."
                );
            }

            const detectedSkills = SKILL_KEYWORDS.filter((skill) =>
                new RegExp(
                    `(^|[^a-zA-Z0-9+#.])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-zA-Z0-9+#.])`,
                    "i"
                ).test(resumeText)
            );

            const suggestions = [];

            if (!/\b(projects?|portfolio)\b/i.test(resumeText)) {
                suggestions.push(
                    "Add a Projects or Portfolio section to demonstrate your practical experience."
                );
            }

            if (!/\b(internship|experience|employment)\b/i.test(resumeText)) {
                suggestions.push(
                    "Include relevant internships, work experience, or practical training if available."
                );
            }

            if (
                !/\b(education|degree|university|college|b\.?tech|bachelor)\b/i.test(
                    resumeText
                )
            ) {
                suggestions.push(
                    "Make your education and qualifications easy to identify."
                );
            }

            if (
                !/\b(achieved|improved|developed|built|implemented|increased|reduced)\b/i.test(
                    resumeText
                )
            ) {
                suggestions.push(
                    "Use action verbs and explain what you accomplished in your projects."
                );
            }

            if (detectedSkills.length === 0) {
                suggestions.push(
                    "Add a dedicated Skills section listing your relevant technical skills."
                );
            }

            if (suggestions.length === 0) {
                suggestions.push(
                    "Review your resume for measurable achievements, consistent formatting, and relevance to your target job."
                );
            }

            const sections = [
                {
                    name: "Contact details",
                    found: /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(resumeText),
                },
                {
                    name: "Education",
                    found: /\b(education|degree|university|college|b\.?tech|bachelor)\b/i.test(
                        resumeText
                    ),
                },
                {
                    name: "Skills",
                    found: detectedSkills.length > 0,
                },
                {
                    name: "Projects",
                    found: /\b(projects?|portfolio)\b/i.test(resumeText),
                },
                {
                    name: "Experience",
                    found: /\b(experience|internship|employment|work history)\b/i.test(
                        resumeText
                    ),
                },
            ];

            const foundSections = sections.filter(
                (section) => section.found
            ).length;

            const score = Math.round(
                (foundSections / sections.length) * 100
            );

            setResult({
                score,
                detectedSkills,
                suggestions,
                sections,
                wordCount: response.word_count,
                pageCount: response.page_count,
            });
        } catch (err) {
            setError(
                err.message ||
                    "We couldn't analyze this PDF. Please try another text-based PDF."
            );
        } finally {
            setAnalyzing(false);
        }
    }

    function analyzeJobMatch() {
        if (!result) {
            setError("Please analyze your resume first.");
            return;
        }

        if (!jobDescription.trim()) {
            setError("Please paste a job description first.");
            return;
        }

        function normalizeText(text) {
            return text
                .toLowerCase()
                .replace(/rest\s+apis\b/g, "rest api")
                .replace(/restful\s+apis?\b/g, "rest api")
                .replace(/node\s*\.?\s*js\b/g, "node.js")
                .replace(/\s+/g, " ")
                .trim();
        }

        function containsSkill(text, skill) {
            const normalizedText = normalizeText(text);
            const normalizedSkill = normalizeText(skill);

            const escapedSkill = normalizedSkill.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const pattern = new RegExp(
                `(^|[^a-z0-9+#.])${escapedSkill}(?=$|[^a-z0-9+#.])`,
                "i"
            );

            return pattern.test(normalizedText);
        }

        const requiredSkills = SKILL_KEYWORDS.filter((skill) =>
            containsSkill(jobDescription, skill)
        );

        if (requiredSkills.length === 0) {
            setJobMatch({
                matchPercentage: null,
                matchedSkills: [],
                missingSkills: [],
                requiredSkills: [],
                message:
                    "We couldn't find any supported technical skills in this job description. Paste the full description, including the required skills, and try again.",
            });

            setError("");
            return;
        }

        const matchedSkills = requiredSkills.filter((requiredSkill) =>
            result.detectedSkills.some((resumeSkill) =>
                containsSkill(resumeSkill, requiredSkill)
            )
        );

        const missingSkills = requiredSkills.filter(
            (skill) => !matchedSkills.includes(skill)
        );

        const matchPercentage = Math.round(
            (matchedSkills.length / requiredSkills.length) * 100
        );

        setJobMatch({
            matchPercentage,
            matchedSkills,
            missingSkills,
            requiredSkills,
            message: "",
        });

        setError("");
    }

    function clearJobMatch() {
        setJobMatch(null);
        setError("");
    }

    return (
        <div className="career-tools-page at-page-enter">
            {/* PAGE HEADER */}
            <div className="career-tools-header">
                <div>
                    <span className="career-tools-eyebrow">
                        ✦ YOUR AI CAREER ASSISTANT
                    </span>

                    <h1>Build a resume that opens doors.</h1>

                    <p>
                        Understand your resume, compare your skills with real job
                        requirements, and discover practical ways to improve your
                        career profile.
                    </p>
                </div>

                <div className="career-tools-header-icon">✧</div>
            </div>

            {/* STEP 01 AND STEP 02 */}
            <div className="career-tools-grid">
                {/* STEP 01: RESUME UPLOAD */}
                <section className="career-tools-upload panel">
                    <div className="career-tools-section-heading">
                        <div>
                            <span className="career-tools-step">
                                STEP 01 · GET STARTED
                            </span>

                            <h2>Upload your resume</h2>

                            <p>
                                Select your existing resume in PDF format. We'll
                                check its sections and identify supported technical
                                skills.
                            </p>
                        </div>

                        <span className="career-tools-heading-icon">↑</span>
                    </div>

                    <label className="career-tools-dropzone">
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                        />

                        <span className="career-tools-file-icon">PDF</span>

                        <strong>
                            {file ? file.name : "Choose your resume"}
                        </strong>

                        <span>
                            {file
                                ? `${(file.size / 1024).toFixed(0)} KB · PDF document`
                                : "Click here to browse your files"}
                        </span>

                        <span className="career-tools-file-hint">
                            PDF format · Maximum 5 MB
                        </span>
                    </label>

                    {error && (
                        <div className="career-tools-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        className="primary-button career-tools-analyze-button"
                        onClick={analyzeResume}
                        disabled={!file || analyzing}
                    >
                        {analyzing
                            ? "Analyzing your resume..."
                            : result
                              ? "↻ Analyze Resume Again"
                              : "✦ Analyze My Resume"}
                    </button>

                    <div className="career-tools-privacy">
                        <span>🔒</span>

                        <span>
                            Your PDF is sent to the Django backend for text
                            extraction. The current analyzer does not save the
                            uploaded PDF to the database or permanent file storage.
                        </span>
                    </div>
                </section>

                {/* STEP 02: JOB DESCRIPTION */}
                <section className="career-tools-upload panel">
                    <div className="career-tools-section-heading">
                        <div>
                            <span className="career-tools-step">
                                STEP 02 · COMPARE
                            </span>

                            <h2>Match your resume to a job</h2>

                            <p>
                                Copy a job description from LinkedIn or a job
                                website and paste it below. We'll compare its
                                supported technical skills with your resume.
                            </p>
                        </div>

                        <span className="career-tools-heading-icon">✦</span>
                    </div>

                    <label
                        htmlFor="career-job-description"
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: 600,
                            color: "var(--text-primary, #25213b)",
                        }}
                    >
                        Job description
                    </label>

                    <textarea
                        id="career-job-description"
                        className="career-tools-job-description"
                        value={jobDescription}
                        onChange={(event) => {
                            setJobDescription(event.target.value);
                            clearJobMatch();
                        }}
                        placeholder={
                            "Paste the complete job description here...\n\nExample:\nFull Stack Developer Intern\n\nRequired skills: Python, Django, React, JavaScript, SQL, Git and Docker.\n\nResponsibilities: Build web applications and REST APIs."
                        }
                        rows={8}
                        style={{
                            width: "100%",
                            padding: "16px",
                            borderRadius: "14px",
                            border: "1px solid #ddd6fe",
                            background: "#ffffff",
                            color: "#1f2937",
                            resize: "vertical",
                            font: "inherit",
                            lineHeight: 1.7,
                            boxSizing: "border-box",
                            outlineOffset: "2px",
                        }}
                    />

                    <p
                        style={{
                            fontSize: "13px",
                            lineHeight: 1.6,
                            marginTop: "10px",
                            color: "var(--text-secondary, #716b83)",
                        }}
                    >
                        💡 Tip: Include the job's required skills for a more
                        useful keyword comparison.
                    </p>

                    <button
                        type="button"
                        className="primary-button career-tools-analyze-button"
                        onClick={analyzeJobMatch}
                        disabled={!jobDescription.trim() || !result}
                        style={{ marginTop: "12px" }}
                    >
                        ✦ Analyze Job Match
                    </button>

                    {!result && (
                        <p
                            style={{
                                fontSize: "13px",
                                marginTop: "10px",
                                color: "var(--text-secondary, #716b83)",
                            }}
                        >
                            First upload and analyze your resume in Step 01.
                        </p>
                    )}
                </section>
            </div>

            {/* EXPLANATION CARDS */}
            <section
                className="career-tools-benefits"
                style={{ marginTop: "24px" }}
            >
                <div className="career-tools-benefit-card">
                    <span className="career-tools-benefit-icon">◎</span>

                    <div>
                        <h3>Resume overview</h3>

                        <p>
                            Check five basic resume sections and see which
                            supported skills appear in your PDF.
                        </p>
                    </div>
                </div>

                <div className="career-tools-benefit-card">
                    <span className="career-tools-benefit-icon">⌘</span>

                    <div>
                        <h3>Job skill comparison</h3>

                        <p>
                            See which supported job keywords were found in your
                            resume and which weren't detected.
                        </p>
                    </div>
                </div>

                <div className="career-tools-benefit-card">
                    <span className="career-tools-benefit-icon">↗</span>

                    <div>
                        <h3>Actionable next steps</h3>

                        <p>
                            Use the results to decide what to learn, practise,
                            or highlight in your resume.
                        </p>
                    </div>
                </div>
            </section>

            {/* JOB MATCH RESULTS */}
            {result && jobMatch && (
                <section
                    className="career-tools-results at-content-enter"
                    style={{ marginTop: "28px" }}
                >
                    <div className="career-tools-results-heading">
                        <div>
                            <span className="career-tools-eyebrow">
                                JOB MATCH REPORT
                            </span>

                            <h2>Your resume vs. the job</h2>

                            <p>
                                Here's how the supported technical keywords in
                                your resume compare with this job description.
                            </p>
                        </div>

                        <span className="career-tools-complete-badge">
                            ✓ Comparison complete
                        </span>
                    </div>

                    {jobMatch.message ? (
                        <div
                            className="career-tools-result-card"
                            style={{
                                padding: "24px",
                                marginTop: "20px",
                            }}
                        >
                            <h3>We need a little more information</h3>

                            <p style={{ lineHeight: 1.7 }}>
                                {jobMatch.message}
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={clearJobMatch}
                                style={{ marginTop: "16px" }}
                            >
                                Edit Job Description
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="career-tools-result-grid">
                                {/* MATCH SCORE */}
                                <div className="career-tools-score-card">
                                    <span className="career-tools-result-label">
                                        KEYWORD MATCH
                                    </span>

                                    <div
                                        className="career-tools-score-circle"
                                        style={{
                                            "--score-angle": `${
                                                jobMatch.matchPercentage * 3.6
                                            }deg`,
                                        }}
                                    >
                                        <div>
                                            <strong>
                                                {jobMatch.matchPercentage}
                                            </strong>

                                            <span>/100</span>
                                        </div>
                                    </div>

                                    <p>Supported keyword overlap</p>

                                    <small>
                                        {jobMatch.matchPercentage === 100
                                            ? "All supported keywords in this description were detected in your resume."
                                            : jobMatch.matchPercentage >= 70
                                              ? "Many of the supported job keywords were detected in your resume."
                                              : jobMatch.matchPercentage >= 40
                                                ? "Some supported job keywords were detected. Review the missing skills below."
                                                : "Few supported job keywords were detected. Check the requirements and your resume."}
                                    </small>
                                </div>

                                {/* MATCHED SKILLS */}
                                <div className="career-tools-result-card">
                                    <span className="career-tools-result-label">
                                        SKILLS FOUND IN BOTH
                                    </span>

                                    <p
                                        style={{
                                            fontSize: "13px",
                                            marginTop: "8px",
                                            marginBottom: "14px",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        These supported skills appear in both
                                        your resume and the job description.
                                    </p>

                                    <div className="career-tools-skill-list">
                                        {jobMatch.matchedSkills.length > 0 ? (
                                            jobMatch.matchedSkills.map(
                                                (skill) => (
                                                    <span
                                                        key={skill}
                                                        className="career-tools-skill-tag"
                                                    >
                                                        ✓ {skill}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <p>
                                                No supported skills were found
                                                in both texts.
                                            </p>
                                        )}
                                    </div>

                                    <div className="career-tools-mini-stats">
                                        <div>
                                            <strong>
                                                {jobMatch.requiredSkills.length}
                                            </strong>

                                            <span>
                                                Supported job keywords
                                            </span>
                                        </div>

                                        <div>
                                            <strong>
                                                {jobMatch.matchedSkills.length}
                                            </strong>

                                            <span>Detected matches</span>
                                        </div>

                                        <div>
                                            <strong>
                                                {jobMatch.missingSkills.length}
                                            </strong>

                                            <span>Not detected</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MISSING SKILLS */}
                            <div
                                className="career-tools-result-card"
                                style={{ marginTop: "18px" }}
                            >
                                <h3>Skills to review</h3>

                                <p
                                    style={{
                                        fontSize: "14px",
                                        lineHeight: 1.7,
                                        marginTop: "8px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    These skills are mentioned in the job
                                    description but were not detected in your
                                    resume. If you already know them, consider
                                    making them clearer in your resume.
                                </p>

                                {jobMatch.missingSkills.length > 0 ? (
                                    jobMatch.missingSkills.map((skill) => (
                                        <div
                                            className="career-tools-suggestion"
                                            key={skill}
                                        >
                                            <span>↗</span>

                                            <p>
                                                <strong>{skill}</strong>
                                                <br />
                                                {`Review the job requirement for ${skill}. If you have this skill, consider highlighting a relevant project or experience.`}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p>
                                        All supported technical keywords in
                                        this job description were detected in
                                        your resume. You should still review
                                        the complete job requirements.
                                    </p>
                                )}
                            </div>

                            <div
                                className="career-tools-result-card"
                                style={{ marginTop: "18px" }}
                            >
                                <h3>What should you do next?</h3>

                                <div className="career-tools-suggestion">
                                    <span>01</span>

                                    <p>
                                        <strong>Review the requirements.</strong>
                                        <br />
                                        Read the full job description to
                                        identify important qualifications
                                        beyond technical keywords.
                                    </p>
                                </div>

                                <div className="career-tools-suggestion">
                                    <span>02</span>

                                    <p>
                                        <strong>Improve your resume.</strong>
                                        <br />
                                        If you have a listed skill, make sure
                                        your resume clearly demonstrates it
                                        through projects or experience.
                                    </p>
                                </div>

                                <div className="career-tools-suggestion">
                                    <span>03</span>

                                    <p>
                                        <strong>Build practical skills.</strong>
                                        <br />
                                        If a required skill is genuinely new
                                        to you, consider learning it and
                                        practising through a project.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <p className="career-tools-disclaimer">
                        This is a predefined-keyword comparison, not a real AI
                        assessment. It does not verify your proficiency, measure
                        all job requirements, or predict hiring success. A
                        skill marked as missing may simply not have been
                        mentioned clearly in your resume.
                    </p>
                </section>
            )}

            {/* RESUME ANALYSIS RESULTS */}
            {result && (
                <section
                    className="career-tools-results at-content-enter"
                    style={{ marginTop: "28px" }}
                >
                    <div className="career-tools-results-heading">
                        <div>
                            <span className="career-tools-eyebrow">
                                RESUME REVIEW COMPLETE
                            </span>

                            <h2>Your resume overview</h2>

                            <p>
                                Understand what our basic text analyzer found
                                in your uploaded PDF.
                            </p>
                        </div>

                        <span className="career-tools-complete-badge">
                            ✓ Analysis complete
                        </span>
                    </div>

                    <div className="career-tools-result-grid">
                        {/* SECTION CHECK SCORE */}
                        <div className="career-tools-score-card">
                            <span className="career-tools-result-label">
                                SECTION CHECK SCORE
                            </span>

                            <div
                                className="career-tools-score-circle"
                                style={{
                                    "--score-angle": `${result.score * 3.6}deg`,
                                }}
                            >
                                <div>
                                    <strong>{result.score}</strong>
                                    <span>/100</span>
                                </div>
                            </div>

                            <p>Resume section completeness</p>

                            <small>
                                This checks for five basic sections. It is
                                not an industry-standard resume rating.
                            </small>
                        </div>

                        {/* DETECTED SKILLS */}
                        <div className="career-tools-result-card">
                            <span className="career-tools-result-label">
                                DETECTED TECHNICAL SKILLS
                            </span>

                            <p
                                style={{
                                    fontSize: "13px",
                                    marginTop: "8px",
                                    marginBottom: "14px",
                                }}
                            >
                                Supported technical skills found in the text
                                extracted from your PDF.
                            </p>

                            <div className="career-tools-skill-list">
                                {result.detectedSkills.length > 0 ? (
                                    result.detectedSkills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="career-tools-skill-tag"
                                        >
                                            ✓ {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p>
                                        No supported skills were detected.
                                        Check whether your resume lists
                                        technical skills as readable text.
                                    </p>
                                )}
                            </div>

                            <div className="career-tools-mini-stats">
                                <div>
                                    <strong>{result.pageCount}</strong>
                                    <span>Pages</span>
                                </div>

                                <div>
                                    <strong>{result.wordCount}</strong>
                                    <span>Words</span>
                                </div>

                                <div>
                                    <strong>
                                        {result.detectedSkills.length}
                                    </strong>
                                    <span>Detected skills</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RESUME CHECKLIST */}
                    <div
                        className="career-tools-result-card career-tools-sections-card"
                        style={{ marginTop: "18px" }}
                    >
                        <h3>Resume section checklist</h3>

                        <p
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                marginTop: "8px",
                                marginBottom: "14px",
                            }}
                        >
                            These are simple text checks. A section may be
                            present even if it uses a different heading.
                        </p>

                        <div className="career-tools-section-list">
                            {result.sections.map((section) => (
                                <div
                                    className="career-tools-section-row"
                                    key={section.name}
                                >
                                    <span>{section.name}</span>

                                    <span
                                        className={
                                            section.found
                                                ? "career-tools-section-status found"
                                                : "career-tools-section-status missing"
                                        }
                                    >
                                        {section.found
                                            ? "✓ Found"
                                            : "○ Not detected"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RESUME RECOMMENDATIONS */}
                    <div
                        className="career-tools-result-card career-tools-suggestions-card"
                        style={{ marginTop: "18px" }}
                    >
                        <h3>✦ Recommendations for improvement</h3>

                        <p
                            style={{
                                fontSize: "13px",
                                lineHeight: 1.7,
                                marginTop: "8px",
                                marginBottom: "14px",
                            }}
                        >
                            Use these suggestions as a starting point. Review
                            your resume yourself before making changes.
                        </p>

                        {result.suggestions.map((suggestion, index) => (
                            <div
                                className="career-tools-suggestion"
                                key={suggestion}
                            >
                                <span>
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <p>{suggestion}</p>
                            </div>
                        ))}
                    </div>

                    <p className="career-tools-disclaimer">
                        The resume analyzer uses basic text and keyword checks.
                        It does not assess writing quality, verify experience,
                        or provide an AI-generated resume score.
                    </p>
                </section>
            )}
        </div>
    );
}