// Routing client. Two modes picked by env (see apiConfig.js): Worker proxy by
// default, or direct OneMap with an Authorization token when
// REACT_APP_ONEMAP_TOKEN is set. Token mode is dev only, never deploy with it.

import {
  ONEMAP_TOKEN,
  WORKER_BASE,
  useWorker,
  workerHeaders,
} from "./apiConfig";

const ONEMAP_ROUTE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route";

const toLatLng = (v) => (typeof v === "string" ? v : `${v.lat},${v.lng}`);

/**
 * Fetch a route from OneMap. Supports public transport and driving.
 *
 * @param {Object} opts
 * @param {string|{lat,lng}} opts.start
 * @param {string|{lat,lng}} opts.end
 * @param {'transit'|'drive'} [opts.mode="transit"]
 * @param {string} [opts.date]  "MM-DD-YYYY" (transit only)
 * @param {string} [opts.time]  "HH:MM:SS" (transit only)
 * @param {number} [opts.maxWalkDistance=1000] (transit only)
 * @param {number} [opts.numItineraries=3] (transit only)
 * @returns {Promise<Object>} OTP-style JSON (transit) or OneMap drive JSON
 */
export async function fetchRoute({
  start,
  end,
  mode = "transit",
  date,
  time,
  maxWalkDistance = 1000,
  numItineraries = 3,
}) {
  let params;
  if (mode === "drive") {
    params = new URLSearchParams({
      start: toLatLng(start),
      end: toLatLng(end),
      routeType: "drive",
    });
  } else {
    params = new URLSearchParams({
      start: toLatLng(start),
      end: toLatLng(end),
      routeType: "pt",
      date,
      time,
      mode: "TRANSIT",
      maxWalkDistance: String(maxWalkDistance),
      numItineraries: String(numItineraries),
    });
  }

  let url;
  let headers;
  if (!useWorker) {
    // Dev: OneMap direct.
    url = `${ONEMAP_ROUTE_URL}?${params.toString()}`;
    headers = { Authorization: ONEMAP_TOKEN };
  } else {
    // Prod: Worker proxy.
    if (!WORKER_BASE) {
      throw new Error(
        "No routing target: set REACT_APP_ROUTING_API_URL (prod) or REACT_APP_ONEMAP_TOKEN (dev)."
      );
    }
    url = `${WORKER_BASE}/route?${params.toString()}`;
    headers = workerHeaders();
  }

  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    if (res.status === 401)
      throw new Error(
        !useWorker
          ? "OneMap rejected the token (401) — it may have expired (~3 days)."
          : "Routing proxy rejected the app key (401)."
      );
    if (res.status === 429)
      throw new Error("Rate limit hit (429). Try again shortly.");
    throw new Error(`Routing error (${res.status}).`);
  }
  return res.json();
}

export default fetchRoute;
