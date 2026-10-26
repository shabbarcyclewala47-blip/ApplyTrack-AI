
import { useState } from "react";
import { apiRequest } from "./api";
import "./Auth.css";

export default function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [role, setRole] = useState("candidate");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegister) {
                if (password !== password2) {
                    throw new Error("Passwords do not match.");
                }

                await apiRequest("register/", {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        password2,
                        role,
                    }),
                });

                setIsRegister(false);
                setPassword("");
                setPassword2("");
                setRole("candidate");
                setError("Account created! Please sign in.");
            } else {
                await apiRequest("login/", {
                    method: "POST",
                    body: JSON.stringify({ username, password }),
                });

                await apiRequest("me/");
                onLogin();
            }
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-visual">
                <div className="auth-brand">
                    <span className="auth-logo">A</span>
                    <span>ApplyTrack <b>AI</b></span>
                </div>

                <div className="auth-message">
                    <span className="auth-eyebrow">YOUR CAREER, REIMAGINED</span>
                    <h1>Your next big opportunity starts with a single step.</h1>
                    <p>
                        Organize applications, prepare for interviews, and move closer
                        to the career you want.
                    </p>

                    <div className="auth-feature">
                        <span>✓</span>
                        <div>
                            <strong>Every application in one place</strong>
                            <p>Stay organized throughout your job search.</p>
                        </div>
                    </div>

                    <div className="auth-feature">
                        <span>✦</span>
                        <div>
                            <strong>Smarter career preparation</strong>
                            <p>Build better habits and prepare with confidence.</p>
                        </div>
                    </div>
                </div>

                <p className="auth-footer">
                    A little progress every day adds up.
                </p>
            </section>

            <section className="auth-form-side">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-mobile-brand">
                        ApplyTrack <b>AI</b>
                    </div>

                    <span className="auth-eyebrow">
                        {isRegister ? "GET STARTED" : "WELCOME BACK"}
                    </span>

                    <h2>
                        {isRegister ? "Create your account" : "Welcome back."}
                    </h2>

                    <p className="auth-description">
                        {isRegister
                            ? "Create an account to start tracking your career."
                            : "Sign in to continue your career journey."}
                    </p>

                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        autoComplete="username"
                        required
                    />

                    {isRegister && (
                        <>
                            <label htmlFor="email">Email address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />

                            <label htmlFor="role">I am registering as</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="candidate">Candidate</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="interviewer">Interviewer</option>
                            </select>
                        </>
                    )}

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete={
                            isRegister ? "new-password" : "current-password"
                        }
                        required
                    />

                    {isRegister && (
                        <>
                            <label htmlFor="password2">Confirm password</label>
                            <input
                                id="password2"
                                type="password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                required
                            />
                        </>
                    )}

                    {error && (
                        <div
                            className={
                                error.startsWith("Account created")
                                    ? "auth-success"
                                    : "auth-error"
                            }
                        >
                            {error}
                        </div>
                    )}

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : isRegister
                                ? "Create account →"
                                : "Sign in →"}
                    </button>

                    <p className="auth-switch">
                        {isRegister
                            ? "Already have an account?"
                            : "New to ApplyTrack AI?"}{" "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError("");
                            }}
                        >
                            {isRegister ? "Sign in" : "Create an account"}
                        </button>
                    </p>

                    <p className="auth-privacy">
                        Your career journey, organized in one place.
                    </p>
                </form>
            </section>
        </main>
    );
}
