// Decides whether a rail or bus segment runs underground, so the sun-side calc
// can skip it (no sun in a tunnel). Reads the community-editable tunnel dataset
// (fetched at runtime with a bundled fallback) via undergroundData.
//
// A tunnel entry is matched by mode + route and is either:
//   - wholeLine: true            -> the entire route is underground, or
//   - path: [[lat,lng], ...]     -> a segment near this polyline is underground.
import { getTunnels } from "../../services/undergroundData";

// Match tolerance as squared degrees (~250 m; 1 deg latitude ~= 111 km, and at
// Singapore's latitude a longitude degree is almost the same length).
const MAX_DIST_SQ = (250 / 111000) ** 2;

// Is (lat,lng) within tolerance of any point on the path?
function nearPath(path, lat, lng) {
  for (let i = 0; i < path.length; i++) {
    const dLat = path[i][0] - lat;
    const dLng = path[i][1] - lng;
    if (dLat * dLat + dLng * dLng <= MAX_DIST_SQ) return true;
  }
  return false;
}

// Is the transit segment between a and b underground? Rail and bus only.
export function isSegmentUnderground(leg, a, b) {
  const mode = String(leg?.mode || "").toUpperCase();
  if (mode !== "SUBWAY" && mode !== "BUS") return false;
  const route = String(leg.route || leg.routeShortName || "").toUpperCase();
  if (!route) return false;

  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;

  for (const entry of getTunnels()) {
    if (String(entry.mode || "").toUpperCase() !== mode) continue;
    if (String(entry.route || "").toUpperCase() !== route) continue;
    if (entry.wholeLine) return true;
    if (entry.path && nearPath(entry.path, midLat, midLng)) return true;
  }
  return false;
}

export default isSegmentUnderground;
