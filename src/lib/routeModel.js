// Normalizes the two OneMap response shapes (transit OTP vs drive) into one
// array of route options for the UI.
import i18next from "i18next";
import { buildItinerarySunData, buildDriveSunData } from "./sunRoute";

/**
 * @param {Object} json   raw OneMap routing response
 * @param {'transit'|'drive'} mode
 * @param {{startMs?:number}} [opts]
 * @returns {Array<Object>} route options, each with { kind, label, minutes, sun, ... }
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
        label: r.subtitle || i18next.t("drive.via", { via }),
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
      label: `Route ${i + 1}`,
      minutes: Math.round((it.duration || 0) / 60),
      transfers: it.transfers || 0,
      legs: it.legs || [],
      sun,
      index: i,
    };
  });
}

export default buildRouteOptions;
