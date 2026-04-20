import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const capabilityCards = [
  {
    icon: "fas fa-tower-broadcast",
    title: "Live Crisis Intake",
    description:
      "Capture field reports, photos, and location details as disaster conditions evolve across Kolkata.",
  },
  {
    icon: "fas fa-camera-retro",
    title: "AI Evidence Verification",
    description:
      "Cross-check uploaded images against the described scenario so weak or fake submissions can be rejected.",
  },
  {
    icon: "fas fa-map-location-dot",
    title: "Dynamic Resource Mapping",
    description:
      "Plot verified shelters, rescue points, and support infrastructure directly onto a live operational map.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Collect",
    description: "Responders upload ground-level updates with location names, descriptions, and optional photo evidence.",
  },
  {
    step: "02",
    title: "Verify",
    description: "The backend validates text-photo consistency, assigns confidence, and rejects false or mismatched reports.",
  },
  {
    step: "03",
    title: "Deploy",
    description: "Only trusted reports appear on the live Kolkata map so response teams can route resources faster.",
  },
];

const signalMetrics = [
  { value: "24/7", label: "Incident monitoring" },
  { value: "JWT", label: "Secured access" },
  { value: "AI", label: "Photo review engine" },
  { value: "Kolkata", label: "Dynamic map focus" },
];

export default function LandingPage({ session, onLogout }) {
  const primaryTarget = session?.token ? "/dashboard" : "/auth";
  const primaryLabel = session?.token ? "Open Response Dashboard" : "Secure Responder Access";

  return (
    <div className="landing-shell">
      <Navbar session={session} onLogout={onLogout} />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-kicker">
              <i className="fas fa-wave-square" /> Scenario Intelligence 004
            </div>
            <h1>Coordinate disaster response with verified field evidence and a live Kolkata map.</h1>
            <p>
              SurakshaAI aggregates incident inputs, checks whether photo evidence actually matches the reported
              scenario, and turns trusted updates into actionable resource visibility for teams on the ground.
            </p>

            <div className="landing-actions">
              <Link className="landing-primary" to={primaryTarget}>
                <i className="fas fa-shield-heart" /> {primaryLabel}
              </Link>
              <Link className="landing-secondary" to={session?.token ? "/dashboard" : "/auth"}>
                <i className="fas fa-arrow-up-right-from-square" /> {session?.token ? "View Live Operations" : "Launch Platform"}
              </Link>
            </div>

            <div className="landing-metrics">
              {signalMetrics.map((metric) => (
                <div className="landing-metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-visual" aria-hidden="true">
            <div className="landing-map-card">
              <div className="landing-map-header">
                <span className="status-pill">
                  <i className="fas fa-circle" /> Kolkata live grid
                </span>
                <span className="map-badge">Verified resources only</span>
              </div>

              <div className="landing-map-stage">
                <div className="map-radar" />
                <div className="map-grid" />
                <div className="map-node node-a">
                  <span>Medical camp</span>
                </div>
                <div className="map-node node-b">
                  <span>Shelter</span>
                </div>
                <div className="map-node node-c">
                  <span>Water rescue</span>
                </div>
                <div className="map-route route-a" />
                <div className="map-route route-b" />
                <div className="map-overlay-card">
                  <strong>AI review signal</strong>
                  <span>Mismatched or fake submissions are blocked before map publication.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="capabilities">
          <div className="landing-section-head">
            <span>Core capabilities</span>
            <h2>Built for high-trust response operations, not generic reporting.</h2>
          </div>

          <div className="capability-grid">
            {capabilityCards.map((card) => (
              <article className="capability-card" key={card.title}>
                <div className="capability-icon">
                  <i className={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="workflow">
          <div className="landing-section-head">
            <span>How it works</span>
            <h2>From raw upload to map-ready operational intelligence.</h2>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((item) => (
              <article className="workflow-card" key={item.step}>
                <div className="workflow-step">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="coverage">
          <div className="coverage-panel">
            <div className="coverage-copy">
              <span>Operational focus</span>
              <h2>Dynamic mapping centered on Kolkata, West Bengal.</h2>
              <p>
                Every accepted place entry can be geocoded and surfaced on the live map, giving dispatch teams a
                current view of verified aid points, disrupted infrastructure, and responder priorities.
              </p>
            </div>

            <div className="coverage-notes">
              <div>
                <strong>Accurate place plotting</strong>
                <span>Zone names are resolved against Kolkata geography for practical field visibility.</span>
              </div>
              <div>
                <strong>Evidence-gated publishing</strong>
                <span>Rejected reports stay in the audit feed and never enter the public resource layer.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span>Ready to activate</span>
            <h2>Start verifying reports and directing relief with confidence.</h2>
          </div>
          <Link className="landing-primary" to={primaryTarget}>
            <i className="fas fa-bolt" /> {primaryLabel}
          </Link>
        </section>
      </main>
    </div>
  );
}
