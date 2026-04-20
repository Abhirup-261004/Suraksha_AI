export function formatMinutesAgo(minutesAgo) {
  return `${minutesAgo} min ago`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function absoluteUrl(req, pathValue) {
  if (!pathValue) {
    return "";
  }

  return `${req.protocol}://${req.get("host")}${pathValue}`;
}
