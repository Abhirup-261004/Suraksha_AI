import { Link, NavLink } from "react-router-dom";

function getNavClassName({ isActive }) {
  return `site-nav-link${isActive ? " active" : ""}`;
}

export default function Navbar({ session, onLogout }) {
  return (
    <header className="site-navbar">
      <Link className="site-brand" to="/">
        <div className="site-brand-mark">
          <i className="fas fa-seedling" />
        </div>
        <div>
          <strong>SurakshaAI</strong>
          <span>Disaster intelligence for response teams</span>
        </div>
      </Link>

      <nav className="site-nav">
        <NavLink className={getNavClassName} to="/">
          Home
        </NavLink>
        <NavLink className={getNavClassName} to="/auth">
          {session?.token ? "Account" : "Login"}
        </NavLink>
        <NavLink className={getNavClassName} to="/dashboard">
          Dashboard
        </NavLink>
      </nav>

      <div className="site-nav-actions">
        {session?.user?.name ? (
          <div className="site-user-chip">
            <i className="fas fa-id-badge" /> {session.user.name}
          </div>
        ) : null}

        {session?.token ? (
          <button className="site-nav-button" type="button" onClick={onLogout}>
            <i className="fas fa-right-from-bracket" /> Logout
          </button>
        ) : (
          <Link className="site-nav-button" to="/auth">
            <i className="fas fa-shield-heart" /> Secure Access
          </Link>
        )}
      </div>
    </header>
  );
}
