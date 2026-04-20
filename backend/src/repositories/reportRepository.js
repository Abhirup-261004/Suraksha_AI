import { IncidentReport } from "../models/IncidentReport.js";
import { databaseState } from "../db/state.js";
import {
  countReports as countMemoryReports,
  createReport as createMemoryReport,
  findReportById as findMemoryReportById,
  insertManyReports as insertMemoryReports,
  listReports as listMemoryReports,
  saveReport as saveMemoryReport,
} from "../db/memoryStore.js";
import { findUserById } from "./userRepository.js";

async function decorateReport(report) {
  if (!report) {
    return null;
  }

  if (databaseState.connected) {
    return report;
  }

  if (report.moderation?.reviewedBy) {
    const reviewer = await findUserById(report.moderation.reviewedBy);
    return {
      ...report,
      moderation: {
        ...report.moderation,
        reviewedBy: reviewer ? { _id: reviewer._id, name: reviewer.name } : null,
      },
    };
  }

  return report;
}

export async function countReports() {
  if (databaseState.connected) {
    return IncidentReport.countDocuments();
  }

  return countMemoryReports();
}

export async function insertManyReports(reports) {
  if (databaseState.connected) {
    return IncidentReport.insertMany(reports);
  }

  return insertMemoryReports(reports);
}

export async function createReport(report) {
  if (databaseState.connected) {
    return IncidentReport.create(report);
  }

  return createMemoryReport(report);
}

export async function listReports(filter = {}, { limit } = {}) {
  if (databaseState.connected) {
    let query = IncidentReport.find(filter).populate("moderation.reviewedBy", "name").sort({ createdAt: -1 });
    if (typeof limit === "number") {
      query = query.limit(limit);
    }
    return query;
  }

  const reports = listMemoryReports(filter, { limit });
  return Promise.all(reports.map((report) => decorateReport(report)));
}

export async function findReportById(id) {
  if (databaseState.connected) {
    return IncidentReport.findById(id).populate("moderation.reviewedBy", "name");
  }

  const report = findMemoryReportById(id);
  return decorateReport(report);
}

export async function saveReport(report) {
  if (databaseState.connected) {
    await report.save();
    await report.populate("moderation.reviewedBy", "name");
    return report;
  }

  return decorateReport(saveMemoryReport(report));
}
