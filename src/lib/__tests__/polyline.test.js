import { decodePolyline } from "../polyline";
import sampleRoute from "../__fixtures__/sampleRoute.json";

describe("decodePolyline", () => {
  test("returns [] for empty/undefined input", () => {
    expect(decodePolyline("")).toEqual([]);
    expect(decodePolyline(undefined)).toEqual([]);
  });

  test("decodes a transit leg to its declared length, endpoints at from/to", () => {
    const leg = sampleRoute.plan.itineraries[0].legs.find(
      (l) => l.transitLeg === true
    );
    const coords = decodePolyline(leg.legGeometry.points);

    // OneMap reports the vertex count in legGeometry.length.
    expect(coords).toHaveLength(leg.legGeometry.length);

    // First/last decoded vertices should match the leg's from/to stops
    // within a few metres (~1e-3 deg).
    expect(coords[0].lat).toBeCloseTo(leg.from.lat, 3);
    expect(coords[0].lng).toBeCloseTo(leg.from.lon, 3);
    expect(coords[coords.length - 1].lat).toBeCloseTo(leg.to.lat, 3);
    expect(coords[coords.length - 1].lng).toBeCloseTo(leg.to.lon, 3);
  });
});
