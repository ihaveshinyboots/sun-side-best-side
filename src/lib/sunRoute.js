// Runs the sun-side algorithm (src/lib/sun/sunPosition.js) over a decoded
// route, producing the { coordinates, color } lines MapView renders. Handles
// transit itineraries and drive routes.
//   - Transit legs (transitLeg === true) get a left/right side; WALK legs are
//     grey and not tallied.
//   - Underground rail segments are grey and not tallied (no sun in a tunnel).
//   - Drive routes are one line, every segment gets a side.
import calculateSunPosition from "./sun/sunPosition";
import { isSegmentUnderground } from "./sun/underground";
import { decodePolyline } from "./polyline";

const LEFT_COLOR = "red";
const RIGHT_COLOR = "blue";
const WALK_COLOR = "grey";
const UNDERGROUND_COLOR = "grey"; // no sun side, like walk legs

// Rough metres between two lat/lng points (equirectangular, fine for the short
// hops between polyline points).
function segmentMeters(a, b) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
}

// Colour one segment by sun side and add its LENGTH to the { left, right }
// tally, so the percentages track distance (share of the ride), not raw
// segment count.
function segmentColor(a, b, time, tally) {
  const side = calculateSunPosition(
    {
      pointA: { latitude: a.lat, longitude: a.lng },
      pointB: { latitude: b.lat, longitude: b.lng },
    },
    time
  );
  const meters = segmentMeters(a, b);
  if (side === "left") {
    tally.left += meters;
    return LEFT_COLOR;
  }
  if (side === "right") {
    tally.right += meters;
    return RIGHT_COLOR;
  }
  return WALK_COLOR; // "on the line", rare, not tallied
}

function percentages(tally) {
  const total = tally.left + tally.right;
  return {
    leftPercentage: total > 0 ? (tally.left / total) * 100 : 0,
    rightPercentage: total > 0 ? (tally.right / total) * 100 : 0,
  };
}

/**
 * Public-transport itinerary → sun-coloured lines.
 * @param {Object} itinerary one entry of plan.itineraries
 * @returns {{lines, otterCoordinates, leftPercentage, rightPercentage, tripEndTime}}
 */
export function buildItinerarySunData(itinerary) {
  const lines = [];
  const otterCoordinates = [];
  const tally = { left: 0, right: 0 };

  const legs = itinerary?.legs || [];

  legs.forEach((leg, legIndex) => {
    const coords = decodePolyline(leg.legGeometry?.points);
    const isTransit = leg.transitLeg === true;

    if (leg.from && leg.from.lat != null && leg.from.lon != null) {
      otterCoordinates.push({ lat: leg.from.lat, lng: leg.from.lon });
    }
    if (
      legIndex === legs.length - 1 &&
      leg.to &&
      leg.to.lat != null &&
      leg.to.lon != null
    ) {
      otterCoordinates.push({ lat: leg.to.lat, lng: leg.to.lon });
    }

    const legStart = leg.startTime;
    const legEnd = leg.endTime;
    const nSeg = coords.length - 1;

    for (let i = 0; i < nSeg; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      let color = WALK_COLOR;
      if (isTransit && isSegmentUnderground(leg, a, b)) {
        // In a tunnel: no sun, so grey and left out of the tally.
        color = UNDERGROUND_COLOR;
      } else if (isTransit) {
        // Interpolate time across the leg so a long ride near sunset uses the
        // right azimuth per segment.
        const t = new Date(legStart + (legEnd - legStart) * (i / nSeg));
        color = segmentColor(a, b, t, tally);
      }
      lines.push({
        coordinates: [
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        ],
        color,
      });
    }
  });

  return {
    lines,
    otterCoordinates,
    ...percentages(tally),
    tripEndTime: itinerary?.endTime ? new Date(itinerary.endTime) : null,
  };
}

/**
 * Drive route (OneMap drive format) → sun-coloured lines.
 * Drive responses carry no absolute timestamps, so time is interpolated across
 * the whole geometry from `startMs` over route_summary.total_time.
 * @param {Object} driveRoute a route object with route_geometry + route_summary
 * @param {number} startMs epoch ms the drive is assumed to begin
 * @returns {{lines, startMarker, endMarker, leftPercentage, rightPercentage,
 *            tripEndTime, distanceM, timeSec}}
 */
export function buildDriveSunData(driveRoute, startMs) {
  const coords = decodePolyline(driveRoute?.route_geometry);
  const lines = [];
  const tally = { left: 0, right: 0 };

  const totalSec = driveRoute?.route_summary?.total_time || 0;
  const totalMs = totalSec * 1000;
  const nSeg = coords.length - 1;

  for (let i = 0; i < nSeg; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const t = new Date(startMs + totalMs * (nSeg > 0 ? i / nSeg : 0));
    const color = segmentColor(a, b, t, tally);
    lines.push({
      coordinates: [
        { lat: a.lat, lng: a.lng },
        { lat: b.lat, lng: b.lng },
      ],
      color,
    });
  }

  return {
    lines,
    startMarker: coords[0] || null,
    endMarker: coords[coords.length - 1] || null,
    ...percentages(tally),
    tripEndTime: totalMs ? new Date(startMs + totalMs) : null,
    distanceM: driveRoute?.route_summary?.total_distance || 0,
    timeSec: totalSec,
  };
}

export default buildItinerarySunData;
