const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

function buildUrl(path) {
  return `${apiBaseUrl}${path}`;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function assetUrl(path) {
  if (!path) {
    return "";
  }

  return buildUrl(path);
}

export async function fetchHealth() {
  const response = await fetch(buildUrl("/api/health"));
  return parseResponse(response);
}

export async function fetchDashboard() {
  const response = await fetch(buildUrl("/api/dashboard"));
  return parseResponse(response);
}

export async function registerUser(payload) {
  const response = await fetch(buildUrl("/api/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function loginUser(payload) {
  const response = await fetch(buildUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function fetchMe(token) {
  const response = await fetch(buildUrl("/api/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function createReport(token, formData) {
  const response = await fetch(buildUrl("/api/reports"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response);
}

export async function fetchReviewQueue(token) {
  const response = await fetch(buildUrl("/api/reports/review-queue"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}

export async function reviewReport(token, reportId, payload) {
  const response = await fetch(buildUrl(`/api/reports/${reportId}/review`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
