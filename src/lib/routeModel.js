// Normalizes the two OneMap response shapes (transit OTP vs drive) into one
// array of route options for the UI.
import { buildItinerarySunData, buildDriveSunData } from "./sunRoute";

// OneMap returns a fixed set of drive subtitles; map them to translation keys
// so the card label localizes. Anything else falls back to the raw subtitle.
const DRIVE_SUBTITLE_KEYS = {
  "Fastest route, assuming usual traffic": "drive.fastest",
  "Alternative suggestion": "drive.alternative",
  "Shortest distance": "drive.shortest",
};

/**
 * @param {Object} json   raw OneMap routing response
 * @param {'transit'|'drive'} mode
 * @param {{startMs?:number}} [opts]
 * @returns {Array<Object>} route options, each with { kind, minutes, sun, ... }.
 *   Drive options carry labelKey (a translation key) or label (raw subtitle);
 *   transit options are labelled by index in the UI.
 */
export function buildRouteOptions(json, mode, { startMs = 0 } = {}) {
  if (!json) return [];

  if (mode === "drive") {
    // main route + alternatives + shortest-distance phyroute
    const routes = [
      json,
      ...(json.alternativeroute || []),
      ...(json.phyroute ? [json.phyroute] : []),
    ].filter((r) => r && r.route_geometry);

    return routes.map((r, i) => {
      const sun = buildDriveSunData(r, startMs);
      const via = r.viaRoute || (r.route_name || []).join(" · ") || "route";
      return {
        kind: "drive",
        labelKey: DRIVE_SUBTITLE_KEYS[r.subtitle] || null,
        label: r.subtitle || null,
        via,
        minutes: Math.round((r.route_summary?.total_time || 0) / 60),
        km: ((r.route_summary?.total_distance || 0) / 1000).toFixed(1),
        instructions: r.route_instructions || [],
        sun,
        index: i,
      };
    });
  }

  const itineraries = json?.plan?.itineraries || [];
  return itineraries.map((it, i) => {
    const sun = buildItinerarySunData(it);
    return {
      kind: "transit",
      minutes: Math.round((it.duration || 0) / 60),
      transfers: it.transfers || 0,
      legs: it.legs || [],
      sun,
      index: i,
    };
  });
}

export default buildRouteOptions;
