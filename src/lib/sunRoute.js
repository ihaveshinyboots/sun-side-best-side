// Runs the sun-side algorithm (src/lib/sun/sunPosition.js) over a decoded
// route, producing the { coordinates, color } lines MapView renders. Handles
// transit itineraries and drive routes.
//
// Scoring is per SEGMENT: N decoded points make N-1 segments (the lines between
// consecutive points). Each segment is coloured left/right from its travel
// bearing and the sun's position at that segment's interpolated clock time
// (t = legStart + (legEnd - legStart) * i/nSeg), and its length in metres is
// added to the tally so the percentages track distance, not segment count.
//   - Transit legs (transitLeg === true) get a left/right side; WALK legs are
//     grey and not tallied.
//   - Underground rail segments are grey and not tallied (no sun in a tunnel).
//   - Drive routes are one line, every segment gets a side.
import calculateSunPosition, { getSunsetTime } from "./sun/sunPosition";
import { isSegmentUnderground } from "./sun/underground";
import { decodePolyline } from "./polyline";

const LEFT_COLOR = "red";
const RIGHT_COLOR = "blue";
const WALK_COLOR = "grey";
const UNDERGROUND_COLOR = "grey"; // no sun side, like walk legs
const NIGHT_COLOR = "grey"; // sun below the horizon, no side to pick

// Rough metres between two lat/lng points (equirectangular, fine for the short
// hops between polyline points).
function segmentMeters(a, b) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
}

// Colour one segment by sun side and add its LENGTH to each given { left,
// right, night } tally (the trip total and, optionally, the current leg), so
// the percentages track distance (share of the ride), not raw segment count.
function segmentColor(a, b, time, ...tallies) {
  const side = calculateSunPosition(
    {
      pointA: { latitude: a.lat, longitude: a.lng },
      pointB: { latitude: b.lat, longitude: b.lng },
    },
    time
  );
  const meters = segmentMeters(a, b);
  const bump = (key) => tallies.forEach((tl) => tl && (tl[key] += meters));
  if (side === "left") {
    bump("left");
    return LEFT_COLOR;
  }
  if (side === "right") {
    bump("right");
    return RIGHT_COLOR;
  }
  if (side === "night") {
    bump("night");
    return NIGHT_COLOR;
  }
  return WALK_COLOR; // "on the line", rare, not tallied
}

// Reduce one leg's tally to a display side for the breakdown.
function legSide(isTransit, legTally, undergroundMeters) {
  if (!isTransit) return { kind: "walk", side: null };
  const day = legTally.left + legTally.right;
  if (day === 0) {
    if (undergroundMeters > 0) return { kind: "transit", side: "underground" };
    if (legTally.night > 0) return { kind: "transit", side: "night" };
    return { kind: "transit", side: null };
  }
  const leftPct = Math.round((legTally.left / day) * 100);
  return {
    kind: "transit",
    side: legTally.left >= legTally.right ? "left" : "right",
    leftPct,
    rightPct: 100 - leftPct,
  };
}

function percentages(tally) {
  const total = tally.left + tally.right;
  return {
    leftPercentage: total > 0 ? (tally.left / total) * 100 : 0,
    rightPercentage: total > 0 ? (tally.right / total) * 100 : 0,
    // Night only when there was travel to evaluate but no daytime sun side.
    isNight: total === 0 && tally.night > 0,
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
  const legSides = [];
  const tally = { left: 0, right: 0, night: 0 };

  const legs = itinerary?.legs || [];

  legs.forEach((leg, legIndex) => {
    const coords = decodePolyline(leg.legGeometry?.points);
    const isTransit = leg.transitLeg === true;
    const legTally = { left: 0, right: 0, night: 0 };
    let undergroundMeters = 0;

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
        undergroundMeters += segmentMeters(a, b);
      } else if (isTransit) {
        // Move the clock across the leg so each point is scored at its own time
        // as the journey progresses (11:00 at the start, later points later).
        const t = new Date(legStart + (legEnd - legStart) * (i / nSeg));
        color = segmentColor(a, b, t, tally, legTally);
      }
      lines.push({
        coordinates: [
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        ],
        color,
        legIndex,
      });
    }

    legSides.push(legSide(isTransit, legTally, undergroundMeters));
  });

  const firstLeg = legs[0];
  const tripStart = itinerary?.startTime ?? firstLeg?.startTime;
  const sunsetTime =
    firstLeg?.from?.lat != null && firstLeg?.from?.lon != null && tripStart
      ? getSunsetTime(new Date(tripStart), firstLeg.from.lat, firstLeg.from.lon)
      : null;

  return {
    lines,
    otterCoordinates,
    legSides,
    ...percentages(tally),
    tripEndTime: itinerary?.endTime ? new Date(itinerary.endTime) : null,
    sunsetTime,
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
  const tally = { left: 0, right: 0, night: 0 };

  const totalSec = driveRoute?.route_summary?.total_time || 0;
  const totalMs = totalSec * 1000;
  const nSeg = coords.length - 1;

  for (let i = 0; i < nSeg; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    // Each point scored at its own time as the drive progresses.
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

  const sunsetTime = coords[0]
    ? getSunsetTime(new Date(startMs), coords[0].lat, coords[0].lng)
    : null;

  return {
    lines,
    startMarker: coords[0] || null,
    endMarker: coords[coords.length - 1] || null,
    ...percentages(tally),
    tripEndTime: totalMs ? new Date(startMs + totalMs) : null,
    sunsetTime,
    distanceM: driveRoute?.route_summary?.total_distance || 0,
    timeSec: totalSec,
  };
}

export default buildItinerarySunData;
