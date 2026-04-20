import path from "path";
import { seedReports } from "../data/seedReports.js";
import { getPreparedVerificationModel, verifyIncidentReport, verifyIncidentReportLocally } from "./aiVerificationService.js";
import { formatMinutesAgo } from "../utils/formatters.js";
import { geocodeZone, getDefaultMapCenter } from "./geocodingService.js";
import { countUsers } from "../repositories/userRepository.js";
import {
  countReports,
  createReport as createStoredReport,
  findReportById,
  insertManyReports,
  listReports,
  saveReport,
} from "../repositories/reportRepository.js";

const resourceConfig = {
  shelter: { color: "green", legendLabel: "Shelter", tag: "Shelter Active" },
  medical: { color: "orange", legendLabel: "Critical", tag: "Critical Medical" },
  food: { color: "yellow", legendLabel: "Food Aid", tag: "Food Distribution" },
  "water-rescue": { color: "blue", legendLabel: "Water Rescue", tag: "Water Rescue" },
  energy: { color: "orange", legendLabel: "Critical", tag: "Critical Alert" },
  infrastructure: { color: "orange", legendLabel: "Critical", tag: "Structural Risk" },
  general: { color: "green", legendLabel: "Shelter", tag: "Relief Resource" },
};

function getMinutesAgo(date) {
  return Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
}

function toFeedItem(report) {
  return {
    id: report._id.toString(),
    source: report.source,
    author: report.authorName,
    zone: report.zone,
    text: report.text,
    status: report.verificationStatus,
    confidence: report.confidence,
    coordinates: [report.coordinates.lat, report.coordinates.lng],
    resourceType: report.resourceType,
    minutesAgo: getMinutesAgo(report.createdAt),
    meta: `${report.zone} • ${formatMinutesAgo(getMinutesAgo(report.createdAt))}`,
    tag:
      report.verificationStatus === "rejected"
        ? "Rejected"
        : report.verificationStatus === "critical"
        ? "Critical"
        : report.verificationStatus === "verified"
          ? "Verified"
          : "Pending",
    signal:
      report.verificationStatus === "rejected"
        ? "Rejected by verifier"
        : report.verificationStatus === "critical"
        ? "AI + image verified"
        : report.hasMediaEvidence
          ? "Photo evidence matched"
          : "Cross-check underway",
    routeImpact: report.routeImpact,
    hasMediaEvidence: report.hasMediaEvidence,
    imageAnalysis: report.imageAnalysis,
    imageUrl: report.imageUrl,
    verificationProvider: report.verificationProvider,
    verificationNotes: report.imageAnalysis?.verificationNotes || "",
    moderation: report.moderation
      ? {
          reviewedBy: report.moderation.reviewedBy?.name || "",
          reviewedAt: report.moderation.reviewedAt,
          notes: report.moderation.notes || "",
          overriddenByHuman: Boolean(report.moderation.overriddenByHuman),
        }
      : {
          reviewedBy: "",
          reviewedAt: null,
          notes: "",
          overriddenByHuman: false,
        },
    reviewHistory: Array.isArray(report.reviewHistory)
      ? report.reviewHistory.map((entry) => ({
          reviewerName: entry.reviewerName || "",
          action: entry.action,
          notes: entry.notes || "",
          reviewedAt: entry.reviewedAt,
        }))
      : [],
  };
}

function toMapResource(report) {
  const config = resourceConfig[report.resourceType] || resourceConfig.general;
  return {
    id: report._id.toString(),
    coords: [report.coordinates.lat, report.coordinates.lng],
    title: report.zone,
    detail: report.text,
    tag: config.tag,
    color: config.color,
    legendLabel: config.legendLabel,
    verificationConfidence: report.confidence,
    imageUrl: report.imageUrl,
  };
}

export async function seedReportsIfEmpty() {
  const count = await countReports();
  if (count > 0) {
    return;
  }

  const seededDocuments = seedReports.map((report) => {
    const verification = verifyIncidentReportLocally({
      text: report.text,
      resourceType: report.resourceType,
      sourceReliability: report.sourceReliability,
      engagement: report.engagement,
      file: report.hasMediaEvidence ? { mimetype: "image/jpeg", size: 180000 } : null,
    });

    return {
      ...report,
      ...verification,
      seeded: true,
    };
  });

  await insertManyReports(seededDocuments);
}

export async function createIncidentReport({ body, file, user }) {
  let coordinates;

  if (body.lat && body.lng) {
    coordinates = {
      lat: Number(body.lat),
      lng: Number(body.lng),
    };
  } else {
    coordinates = await geocodeZone(body.zone);
  }

  const verification = await verifyIncidentReport({
    text: body.text,
    resourceType: body.resourceType,
    sourceReliability: Number(body.sourceReliability || 0.7),
    engagement: Number(body.engagement || 120),
    file,
  });

  const report = await createStoredReport({
    source: "field-upload",
    authorName: user.name,
    zone: body.zone,
    text: body.text,
    resourceType: body.resourceType || "general",
    coordinates,
    imageUrl: file ? `/uploads/${path.basename(file.path)}` : "",
    imageName: file?.originalname || "",
    imageMimeType: file?.mimetype || "",
    imageSize: file?.size || 0,
    sourceReliability: Number(body.sourceReliability || 0.7),
    engagement: Number(body.engagement || 120),
    submittedBy: user.id,
    verificationProvider: verification.verificationProvider,
    ...verification,
  });

  return toFeedItem(report);
}

export async function getFeed({ status } = {}) {
  const query = status ? { verificationStatus: status } : {};
  const reports = await listReports(query, { limit: 20 });
  return reports.map(toFeedItem);
}

export async function getReviewQueue() {
  const reports = await listReports({
    verificationStatus: { $in: ["pending", "rejected"] },
  }, { limit: 20 });

  return reports.map(toFeedItem);
}

export async function reviewIncidentReport({ reportId, status, notes, reviewer }) {
  const allowedStatuses = ["verified", "critical", "rejected", "pending"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid review status.");
  }

  const report = await findReportById(reportId);
  if (!report) {
    throw new Error("Report not found.");
  }

  const nextRouteImpact =
    status === "critical" || report.resourceType === "infrastructure"
      ? "High"
      : status === "rejected"
        ? "Low"
        : "Medium";

  report.verificationStatus = status;
  report.routeImpact = nextRouteImpact;
  report.moderation = {
    reviewedBy: reviewer.id,
    reviewedAt: new Date(),
    notes: notes || "",
    overriddenByHuman: true,
  };
  report.reviewHistory.push({
    reviewerId: reviewer.id,
    reviewerName: reviewer.name,
    action: status,
    notes: notes || "",
    reviewedAt: new Date(),
  });

  const savedReport = await saveReport(report);

  return toFeedItem(savedReport);
}

export async function getMapResources() {
  const reports = await listReports({
    verificationStatus: { $in: ["verified", "critical"] },
  });

  return reports.map(toMapResource);
}

export async function getDashboardSnapshot() {
  const feed = await getFeed();
  const resources = await getMapResources();
  const reports = await listReports();
  const verifiedReports = reports.filter((report) => ["verified", "critical"].includes(report.verificationStatus));
  const rejectedReports = reports.filter((report) => report.verificationStatus === "rejected");
  const averageConfidence = verifiedReports.length
    ? Math.round(verifiedReports.reduce((sum, report) => sum + report.confidence, 0) / verifiedReports.length)
    : 0;
  const verificationModel = getPreparedVerificationModel();
  const mapCenter = getDefaultMapCenter();

  return {
    hero: {
      eyebrow: "Climate-Ready Crisis Intelligence",
      titlePrefix: "Protect communities with ",
      titleHighlight: "greener, smarter relief operations",
      description:
        "Aggregate social signals and field uploads, verify incident photos with AI-assisted scanning, and route support to verified coordinates in real time.",
      fieldConditions: {
        title: "Response Network Live",
        summary: `${verificationModel.configured ? `${verificationModel.provider}/${verificationModel.model}` : "Fallback verifier"} is preparing incident evidence for map publication.`,
      },
      ecosystemSignals: [
        {
          title: "Verified Photo Evidence",
          detail: "Uploaded disaster images are scanned against report context before appearing on the map",
          scoreLabel: `${reports.filter((report) => report.hasMediaEvidence).length} reports`,
        },
        {
          title: "Protected Responder Access",
          detail: "JWT-authenticated users can submit and track incidents securely",
          scoreLabel: `${await countUsers()} users`,
        },
        {
          title: "Prepared AI Model",
          detail: verificationModel.configured
            ? "OpenAI vision model is configured for structured incident verification"
            : "OpenAI key is missing, so the local fallback verifier is active",
          scoreLabel: verificationModel.configured ? verificationModel.model : "fallback",
        },
        {
          title: "Rejected Inputs",
          detail: "Submissions that do not match the described scenario are kept out of the live map",
          scoreLabel: `${rejectedReports.length} rejected`,
        },
      ],
    },
    stats: [
      {
        id: "posts-scanned",
        icon: "fas fa-satellite-dish",
        trend: `${reports.length} stored`,
        target: reports.reduce((sum, report) => sum + report.engagement, 0) + 10000,
        label: "Posts Scanned",
      },
      {
        id: "verified-alerts",
        icon: "fas fa-shield-alt",
        trend: "AI confidence rising",
        target: verifiedReports.length,
        label: "AI Verified Alerts",
      },
      {
        id: "resources-mapped",
        icon: "fas fa-map-location-dot",
        trend: "Map auto-updated",
        target: resources.length,
        label: "Resources Mapped",
      },
      {
        id: "verification-accuracy",
        icon: "fas fa-chart-line",
        trend: `${rejectedReports.length} rejected`,
        target: averageConfidence,
        label: "Verification Accuracy",
      },
    ],
    feed: feed.slice(0, 8),
    resources,
    verificationModel,
    mapCenter,
    moderation: {
      pendingCount: reports.filter((report) => report.verificationStatus === "pending").length,
      rejectedCount: rejectedReports.length,
      criticalCount: reports.filter((report) => report.verificationStatus === "critical").length,
    },
  };
}
