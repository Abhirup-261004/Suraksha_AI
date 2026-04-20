import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import { clearSession, readSession, writeSession } from "./auth";
import { fetchMe } from "./api";

function ProtectedRoute({ session, children }) {
  const location = useLocation();

  if (!session?.token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      if (!session?.token) {
        setAuthReady(true);
        return;
      }

      try {
        const response = await fetchMe(session.token);
        const nextSession = {
          ...session,
          user: response.data,
        };
        setSession(nextSession);
        writeSession(nextSession);
      } catch (error) {
        clearSession();
        setSession(null);
      } finally {
        setAuthReady(true);
      }
    }

    restoreSession();
  }, []);

  function handleAuthenticated(nextSession) {
    writeSession(nextSession);
    setSession(nextSession);
    navigate("/dashboard");
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    navigate("/auth");
  }

  if (!authReady) {
    return <div className="app-loading">Restoring secure responder session...</div>;
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          session?.token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage onAuthenticated={handleAuthenticated} session={session} onLogout={handleLogout} />
          )
        }
      />
      <Route path="/" element={<LandingPage session={session} onLogout={handleLogout} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <DashboardPage session={session} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
