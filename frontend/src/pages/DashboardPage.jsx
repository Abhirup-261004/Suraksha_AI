import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { assetUrl, createReport, fetchDashboard, fetchHealth, fetchReviewQueue, reviewReport as submitReviewDecision } from "../api";
import Navbar from "../components/Navbar";

const emptyDashboard = {
  hero: {
    eyebrow: "Climate-Ready Crisis Intelligence",
    titlePrefix: "Protect communities with ",
    titleHighlight: "greener, smarter relief operations",
    description: "Loading live response data...",
    fieldConditions: {
      title: "Connecting...",
      summary: "Preparing dashboard services.",
    },
    ecosystemSignals: [],
  },
  stats: [],
  feed: [],
  resources: [],
  mapCenter: {
    lat: 22.5726,
    lng: 88.3639,
    label: "Kolkata, West Bengal",
  },
};

const initialReportForm = {
  zone: "",
  text: "",
  resourceType: "medical",
  lat: "",
  lng: "",
  sourceReliability: "0.8",
};

function statusTone(status) {
  if (status === "rejected") {
    return "rejected";
  }

  return status === "critical" ? "critical" : status === "verified" ? "verified" : "pending";
}

function statusIcon(status) {
  if (status === "rejected") {
    return "fas fa-ban";
  }

  return status === "critical"
    ? "fas fa-triangle-exclamation"
    : status === "verified"
      ? "fas fa-circle-check"
      : "fas fa-hourglass-half";
}

function StatCard({ icon, trend, target, label, shouldShrink }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const increment = Math.max(1, Math.ceil(target / 90));
    const timer = window.setInterval(() => {
      setValue((current) => {
        if (current >= target) {
          window.clearInterval(timer);
          return target;
        }

        return Math.min(target, current + increment);
      });
    }, 18);

    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <div className={`card${shouldShrink ? " card-shrink" : ""}`}>
      <div className="card-header">
        <div className="card-icon">
          <i className={icon} />
        </div>
        <div className="card-trend">{trend}</div>
      </div>
      <h2>{value}</h2>
      <p>{label}</p>
    </div>
  );
}

export default function DashboardPage({ session, onLogout }) {
  const isAdmin = session?.user?.role === "admin";
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [statusPulse, setStatusPulse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitState, setSubmitState] = useState({ loading: false, message: "", error: "" });
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [reviewState, setReviewState] = useState({ loading: false, reportId: "", error: "", message: "" });

  const legendItems = useMemo(
    () => [
      { color: "#149a69", label: "Shelter" },
      { color: "#f17c45", label: "Critical" },
      { color: "#e4b93b", label: "Food Aid" },
      { color: "#3096d8", label: "Water Rescue" },
    ],
    []
  );

  async function loadDashboard() {
    try {
      setIsLoading(true);
      const [healthPayload, dashboardPayload, reviewQueuePayload] = await Promise.all([
        fetchHealth(),
        fetchDashboard(),
        isAdmin ? fetchReviewQueue(session.token) : Promise.resolve({ data: [] }),
      ]);
      setBackendStatus(healthPayload.success ? "online" : "offline");
      setDashboard(dashboardPayload.data);
      setReviewQueue(reviewQueuePayload.data);
      setErrorMessage("");
    } catch (error) {
      setBackendStatus("offline");
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 12000);
    return () => window.clearInterval(intervalId);
  }, [isAdmin, session.token]);

  useEffect(() => {
    const pulseTimer = window.setInterval(() => {
      setStatusPulse((current) => !current);
    }, 1400);
    return () => window.clearInterval(pulseTimer);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return undefined;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([22.5726, 88.3639], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    mapInstanceRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!dashboard.resources.length) {
      map.setView([dashboard.mapCenter.lat, dashboard.mapCenter.lng], 12);
      return;
    }

    markersRef.current = dashboard.resources.map((resource) => {
      const marker = L.marker(resource.coords, {
        icon: L.divIcon({
          className: "",
          html: `<div class="relief-marker ${resource.color}"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <div class="popup-title">${resource.title}</div>
        <div class="popup-meta">${resource.detail}</div>
        <div class="popup-tag"><i class="fas fa-leaf"></i> ${resource.tag}</div>
      `);

      return marker;
    });

    map.fitBounds(L.latLngBounds(dashboard.resources.map((resource) => resource.coords)).pad(0.12));
  }, [dashboard.resources]);

  async function handleReportSubmit(event) {
    event.preventDefault();
    setSubmitState({ loading: true, message: "", error: "" });

    try {
      const formData = new FormData();
      Object.entries(reportForm).forEach(([key, value]) => formData.append(key, value));
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await createReport(session.token, formData);

      setSubmitState({
        loading: false,
        message:
          response.data.status === "rejected"
            ? `Report for ${response.data.zone} was rejected because the evidence did not match the described scenario.`
            : `Report for ${response.data.zone} was verified as ${response.data.status} and placed on the Kolkata map.`,
        error: "",
      });
      setReportForm(initialReportForm);
      setPhotoFile(null);
      await loadDashboard();
    } catch (error) {
      setSubmitState({
        loading: false,
        message: "",
        error: error.message,
      });
    }
  }

  async function handleReviewAction(reportId, status) {
    try {
      setReviewState({ loading: true, reportId, error: "", message: "" });
      await submitReviewDecision(session.token, reportId, {
        status,
        notes: reviewNotes[reportId] || "",
      });
      setReviewState({
        loading: false,
        reportId: "",
        error: "",
        message: `Report ${status === "critical" ? "escalated to critical" : `marked as ${status}`}.`,
      });
      setReviewNotes((current) => ({ ...current, [reportId]: "" }));
      await loadDashboard();
    } catch (error) {
      setReviewState({
        loading: false,
        reportId,
        error: error.message,
        message: "",
      });
    }
  }

  return (
    <div className="container">
      <Navbar session={session} onLogout={onLogout} />

      <div className="dashboard-toolbar">
        <div className="eco-badge">
          <i className="fas fa-location-crosshairs" /> Kolkata operations grid
        </div>
        <div className={`status${statusPulse ? " status-shrink" : ""}`}>
          <i className="fas fa-circle" /> {backendStatus === "online" ? "Backend Connected" : "Monitoring Offline"}
        </div>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <i className="fas fa-earth-americas" /> {dashboard.hero.eyebrow}
          </div>
          <h1>
            {dashboard.hero.titlePrefix}
            <span className="gradient">{dashboard.hero.titleHighlight}</span>
          </h1>
          <p>{dashboard.hero.description}</p>
        </div>

        <div className="hero-panel">
          <div className="weather-card">
            <div>
              <div className="weather-label">Field Conditions</div>
              <div className="weather-main">
                {dashboard.hero.fieldConditions.title}
                <span>{dashboard.hero.fieldConditions.summary}</span>
              </div>
            </div>
            <div className="weather-icon">
              <i className="fas fa-camera-retro" />
            </div>
          </div>

          <div className="impact-card">
            <h3>Operational Signals</h3>
            <div className="impact-list">
              {dashboard.hero.ecosystemSignals.map((signal) => (
                <div className="impact-item" key={signal.title}>
                  <div>
                    <strong>{signal.title}</strong>
                    <span>{signal.detail}</span>
                  </div>
                  <div className="impact-score">{signal.scoreLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isLoading ? <div className="banner">Loading MongoDB-backed response intelligence...</div> : null}
      {errorMessage ? <div className="banner banner-error">{errorMessage}</div> : null}

      <section className="grid">
        {dashboard.stats.map((stat, index) => (
          <StatCard
            key={stat.id}
            icon={stat.icon}
            trend={stat.trend}
            target={stat.target}
            label={stat.label}
            shouldShrink={statusPulse && index === 0}
          />
        ))}
      </section>

      {isAdmin ? (
        <section className="review-board">
          <div className="box-head">
            <div className="section-title">
              <i className="fas fa-user-shield" /> Admin Review Queue
            </div>
            <div className="section-chip">
              {dashboard.moderation?.pendingCount || 0} pending • {dashboard.moderation?.rejectedCount || 0} rejected
            </div>
          </div>

          {reviewState.message ? <div className="banner compact">{reviewState.message}</div> : null}
          {reviewState.error ? <div className="banner banner-error compact">{reviewState.error}</div> : null}

          <div className="review-grid">
            {reviewQueue.length ? (
              reviewQueue.map((report) => (
                <article className="review-card" key={report.id}>
                  <div className="review-top">
                    <span className={`tag ${statusTone(report.status)}`}>
                      <i className={statusIcon(report.status)} /> {report.tag}
                    </span>
                    <span className="meta">{report.meta}</span>
                  </div>

                  <div className="review-headline">
                    <strong>{report.zone}</strong>
                    <span>{report.resourceType.replace("-", " ")}</span>
                  </div>

                  <p>{report.text}</p>

                  {report.imageUrl ? (
                    <img className="review-image" src={assetUrl(report.imageUrl)} alt={`${report.zone} review evidence`} />
                  ) : (
                    <div className="review-no-image">No uploaded photo was provided for this report.</div>
                  )}

                  <div className="analysis-card">
                    <strong>Verifier context</strong>
                    <span>{report.imageAnalysis?.summary}</span>
                    <small>
                      Confidence: {report.confidence}% | Image confidence: {report.imageAnalysis?.imageConfidence ?? 0}% |
                      Signal: {report.signal}
                    </small>
                  </div>

                  {report.reviewHistory?.length ? (
                    <div className="review-history">
                      Latest audit: {report.reviewHistory[report.reviewHistory.length - 1].reviewerName || "System"} •{" "}
                      {report.reviewHistory[report.reviewHistory.length - 1].action}
                    </div>
                  ) : null}

                  <label className="field field-full">
                    <span>Moderator Note</span>
                    <textarea
                      rows="3"
                      value={reviewNotes[report.id] || ""}
                      onChange={(event) =>
                        setReviewNotes((current) => ({ ...current, [report.id]: event.target.value }))
                      }
                      placeholder="Explain why you are approving, rejecting, or escalating this report..."
                    />
                  </label>

                  <div className="review-actions">
                    <button
                      className="review-button approve"
                      type="button"
                      onClick={() => handleReviewAction(report.id, "verified")}
                      disabled={reviewState.loading && reviewState.reportId === report.id}
                    >
                      Approve
                    </button>
                    <button
                      className="review-button critical"
                      type="button"
                      onClick={() => handleReviewAction(report.id, "critical")}
                      disabled={reviewState.loading && reviewState.reportId === report.id}
                    >
                      Mark Critical
                    </button>
                    <button
                      className="review-button reject"
                      type="button"
                      onClick={() => handleReviewAction(report.id, "rejected")}
                      disabled={reviewState.loading && reviewState.reportId === report.id}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="review-empty">The moderation queue is clear right now. New pending or rejected reports will appear here.</div>
            )}
          </div>
        </section>
      ) : null}

      <section className="workspace">
        <div className="report-box">
          <div className="box-head">
            <div className="section-title">
              <i className="fas fa-camera" /> Upload Incident Evidence
            </div>
          </div>

          <form className="report-form" onSubmit={handleReportSubmit}>
            <label className="field">
              <span>Zone</span>
              <input
                value={reportForm.zone}
                onChange={(event) => setReportForm((current) => ({ ...current, zone: event.target.value }))}
                placeholder="Bagbazar Ghat"
                required
              />
            </label>

            <label className="field">
              <span>Resource Type</span>
              <select
                value={reportForm.resourceType}
                onChange={(event) =>
                  setReportForm((current) => ({ ...current, resourceType: event.target.value }))
                }
              >
                <option value="medical">Medical</option>
                <option value="food">Food</option>
                <option value="water-rescue">Water Rescue</option>
                <option value="shelter">Shelter</option>
                <option value="energy">Energy</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="field field-full">
              <span>Situation Description</span>
              <textarea
                value={reportForm.text}
                onChange={(event) => setReportForm((current) => ({ ...current, text: event.target.value }))}
                placeholder="Describe what the team is seeing on the ground..."
                rows="5"
                required
              />
            </label>

            <label className="field">
              <span>Latitude Override</span>
              <input
                type="number"
                step="0.0001"
                value={reportForm.lat}
                onChange={(event) => setReportForm((current) => ({ ...current, lat: event.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>Longitude Override</span>
              <input
                type="number"
                step="0.0001"
                value={reportForm.lng}
                onChange={(event) => setReportForm((current) => ({ ...current, lng: event.target.value }))}
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>Source Reliability</span>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                value={reportForm.sourceReliability}
                onChange={(event) =>
                  setReportForm((current) => ({ ...current, sourceReliability: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} />
            </label>

            {submitState.message ? <div className="banner compact">{submitState.message}</div> : null}
            {submitState.error ? <div className="banner banner-error compact">{submitState.error}</div> : null}

            <button className="primary field-full submit-report" type="submit" disabled={submitState.loading}>
              <i className="fas fa-cloud-arrow-up" />
              {submitState.loading ? "Scanning and verifying..." : "Upload, Scan, and Verify"}
            </button>
          </form>
        </div>

        <div className="dashboard">
          <div className="map-box">
            <div className="box-head">
              <div className="section-title">
                <i className="fas fa-map" /> Live Relief Map
              </div>
              <div className="section-chip">Verified resources only</div>
            </div>

            <div className="map">
              <div className="map-canvas" ref={mapRef} />
              <div className="map-legend">
                {legendItems.map((item) => (
                  <div className="legend-item" key={item.label}>
                    <span className="legend-dot" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="feed-box">
            <div className="box-head">
              <div className="section-title">
                <i className="fas fa-bullhorn" /> Verified Incident Feed
              </div>
              <div className="section-chip">MongoDB live feed</div>
            </div>

            <div className="feed">
              {dashboard.feed.map((post) => (
                <div className="post" key={post.id}>
                  <div className="post-top">
                    <span className={`tag ${statusTone(post.status)}`}>
                      <i className={statusIcon(post.status)} /> {post.tag}
                    </span>
                    <span className="meta">{post.meta}</span>
                  </div>
                  <p>{post.text}</p>
                  {post.imageUrl ? (
                    <img className="post-image" src={assetUrl(post.imageUrl)} alt={`${post.zone} evidence`} />
                  ) : null}
                  <div className="analysis-card">
                    <strong>AI scan summary</strong>
                    <span>{post.imageAnalysis?.summary}</span>
                    <small>
                      Labels: {(post.imageAnalysis?.labels || []).join(", ")} | Image confidence:{" "}
                      {post.imageAnalysis?.imageConfidence ?? 0}%
                    </small>
                  </div>
                <div className="post-footer">
                  <span className="signal">
                    <i className="fas fa-camera" /> {post.signal}
                  </span>
                  <span>Route impact: {post.routeImpact}</span>
                </div>
                <div className="provider-row">
                  <span className="provider-chip">
                    <i className="fas fa-microchip" /> {post.verificationProvider === "openai" ? "OpenAI reviewed" : "Fallback reviewed"}
                  </span>
                  {post.verificationNotes ? <span className="provider-note">{post.verificationNotes}</span> : null}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <i className="fas fa-shield-alt" />
        Authenticated response operations with photo-backed verification
      </footer>
    </div>
  );
}
