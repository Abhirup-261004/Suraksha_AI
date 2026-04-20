import { useMemo, useState } from "react";
import { loginUser, registerUser } from "../api";
import Navbar from "../components/Navbar";

const initialRegisterForm = {
  name: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

export default function AuthPage({ onAuthenticated, session, onLogout }) {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const title = useMemo(
    () =>
      mode === "login"
        ? "Responder Login"
        : "Create secure access for responders, coordinators, and field teams",
    [mode]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = mode === "login" ? loginForm : registerForm;
      const response = mode === "login" ? await loginUser(payload) : await registerUser(payload);
      onAuthenticated(response.data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <Navbar session={session} onLogout={onLogout} />
      <section className="auth-panel hero-glass">
        <div className="auth-copy">
          <div className="eyebrow">
            <i className="fas fa-user-shield" /> JWT Secured Emergency Network
          </div>
          <h1>{title}</h1>
          <p>
            Upload disaster photos, let the AI-assisted verifier cross-check image evidence with
            report text, and push confirmed locations onto the live response map.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature">
              <strong>MongoDB report history</strong>
              <span>Persistent incident storage for operational continuity</span>
            </div>
            <div className="auth-feature">
              <strong>Photo-backed verification</strong>
              <span>Uploaded images influence confidence, risk level, and map visibility</span>
            </div>
            <div className="auth-feature">
              <strong>Protected responder workflows</strong>
              <span>Only authenticated users can submit and track sensitive reports</span>
            </div>
            <div className="auth-feature">
              <strong>Bootstrap admin moderation</strong>
              <span>The first registered account becomes the admin who can review and override queued reports</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`auth-tab${mode === "register" ? " active" : ""}`}
              onClick={() => setMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Relief coordinator"
                  required
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={mode === "login" ? loginForm.email : registerForm.email}
                onChange={(event) =>
                  mode === "login"
                    ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                    : setRegisterForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="team@suraksha.ai"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={mode === "login" ? loginForm.password : registerForm.password}
                onChange={(event) =>
                  mode === "login"
                    ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                    : setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter a secure password"
                required
              />
            </label>

            {errorMessage ? <div className="banner banner-error compact">{errorMessage}</div> : null}

            <button className="primary auth-submit" type="submit" disabled={isSubmitting}>
              <i className="fas fa-right-to-bracket" />
              {isSubmitting ? "Authenticating..." : mode === "login" ? "Login Securely" : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
