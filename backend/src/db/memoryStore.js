import crypto from "crypto";

const users = [];
const reports = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId() {
  return crypto.randomUUID();
}

function matchesFilter(document, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = document[key];

    if (expected && typeof expected === "object" && "$in" in expected) {
      return expected.$in.includes(actual);
    }

    return actual === expected;
  });
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function countUsers() {
  return users.length;
}

export function findUserByEmail(email) {
  return clone(users.find((user) => user.email === email) || null);
}

export function findUserById(id) {
  return clone(users.find((user) => user._id === id) || null);
}

export function createUser(user) {
  const now = new Date().toISOString();
  const createdUser = {
    _id: createId(),
    ...clone(user),
    createdAt: now,
    updatedAt: now,
  };

  users.push(createdUser);
  return clone(createdUser);
}

export function countReports() {
  return reports.length;
}

export function insertManyReports(entries) {
  const now = Date.now();
  const createdReports = entries.map((entry, index) => ({
    _id: createId(),
    reviewHistory: [],
    moderation: {
      reviewedBy: null,
      reviewedAt: null,
      notes: "",
      overriddenByHuman: false,
    },
    createdAt: new Date(now - index * 60000).toISOString(),
    updatedAt: new Date(now - index * 60000).toISOString(),
    ...clone(entry),
  }));

  reports.push(...createdReports);
  return clone(createdReports);
}

export function createReport(report) {
  const now = new Date().toISOString();
  const createdReport = {
    _id: createId(),
    reviewHistory: [],
    moderation: {
      reviewedBy: null,
      reviewedAt: null,
      notes: "",
      overriddenByHuman: false,
    },
    createdAt: now,
    updatedAt: now,
    ...clone(report),
  };

  reports.push(createdReport);
  return clone(createdReport);
}

export function listReports(filter = {}, { limit } = {}) {
  const matched = sortByCreatedAtDesc(reports).filter((report) => matchesFilter(report, filter));
  const limited = typeof limit === "number" ? matched.slice(0, limit) : matched;
  return clone(limited);
}

export function findReportById(id) {
  return clone(reports.find((report) => report._id === id) || null);
}

export function saveReport(report) {
  const index = reports.findIndex((entry) => entry._id === report._id);
  if (index === -1) {
    return null;
  }

  const nextReport = {
    ...clone(report),
    updatedAt: new Date().toISOString(),
  };

  reports[index] = nextReport;
  return clone(nextReport);
}
