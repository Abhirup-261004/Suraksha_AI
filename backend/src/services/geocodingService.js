import { config } from "../config/env.js";

function buildLocationQuery(zone) {
  return `${zone}, Kolkata, West Bengal, India`;
}

export function getDefaultMapCenter() {
  return {
    lat: config.defaultMapLat,
    lng: config.defaultMapLng,
    label: "Kolkata, West Bengal",
  };
}

export async function geocodeZone(zone) {
  const query = buildLocationQuery(zone);
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "suraksha-ai-disaster-map/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to geocode the selected place.");
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("No map location was found for that place in Kolkata, West Bengal.");
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    label: results[0].display_name,
  };
}
