// Maps a leg to a display badge: rail line code (EW, NS, ...) or bus number,
// plus the official Singapore line colour.
import i18next from "i18next";

// MRT/LRT line colours, keyed by line letter prefix.
const LINE_COLORS = {
  NS: "#d42e12", // North South, red
  EW: "#009645", // East West, green
  CG: "#009645", // Changi Airport branch, green
  NE: "#9900aa", // North East, purple
  CC: "#fa9e0d", // Circle, orange
  CE: "#fa9e0d", // Circle extension, orange
  DT: "#005ec4", // Downtown, blue
  TE: "#9d5b25", // Thomson-East Coast, brown
  JS: "#0099aa", // Jurong Region, teal
  JW: "#0099aa",
  JE: "#0099aa",
  // LRT feeders, grey
  BP: "#718477",
  SW: "#718477",
  SE: "#718477",
  STC: "#718477",
  PW: "#718477",
  PE: "#718477",
  PTC: "#718477",
};

const BUS_COLOR = "#4a5a6a"; // slate, buses have no per-route colour
const WALK_COLOR = "#9e9e9e";
const DEFAULT_LINE_COLOR = "#555";

// Black or white text for legibility on a given background.
export function readableText(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 160 ? "#000" : "#fff";
}

/**
 * @param {Object} leg
 * @returns {{kind:'walk'|'bus'|'rail', badge:string|null, color:string,
 *            title:string, subtitle:string}}
 */
export function getLegPresentation(leg) {
  const mode = String(leg.mode || "").toUpperCase();

  if (mode === "WALK") {
    return {
      kind: "walk",
      badge: "🚶",
      color: WALK_COLOR,
      title: i18next.t("leg.walk"),
      subtitle: leg.to?.name ? i18next.t("leg.to", { place: leg.to.name }) : "",
    };
  }

  const code = String(leg.route || leg.routeShortName || "").toUpperCase();
  const fromTo = `${leg.from?.name || "?"} → ${leg.to?.name || "?"}`;

  if (mode === "BUS") {
    return {
      kind: "bus",
      badge: code,
      color: BUS_COLOR,
      title: i18next.t("leg.bus", { code }),
      subtitle: fromTo,
    };
  }

  // SUBWAY / RAIL / TRAM, incl. LRT
  const prefix = (code.match(/^[A-Z]+/) || [code])[0];
  const color = LINE_COLORS[prefix] || DEFAULT_LINE_COLOR;
  return {
    kind: "rail",
    badge: code || prefix,
    color,
    title: leg.routeLongName || i18next.t("leg.line", { name: prefix }),
    subtitle: fromTo,
  };
}

export default getLegPresentation;
