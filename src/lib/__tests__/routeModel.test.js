import { buildRouteOptions } from "../routeModel";
import { buildDriveSunData } from "../sunRoute";
import transitRoute from "../__fixtures__/sampleRoute.json";
import driveRoute from "../__fixtures__/sampleDriveRoute.json";

const START_MS = 1762744991000; // fixed epoch (no Date.now in tests)

describe("buildDriveSunData", () => {
  const result = buildDriveSunData(driveRoute, START_MS);

  test("decodes the drive geometry into colored segments", () => {
    expect(result.lines.length).toBeGreaterThan(0);
    result.lines.forEach((l) => {
      expect(l.coordinates).toHaveLength(2);
      expect(["red", "blue", "grey"]).toContain(l.color);
    });
  });

  test("left + right percentages sum to ~100", () => {
    expect(result.leftPercentage + result.rightPercentage).toBeCloseTo(100, 5);
  });

  test("carries distance/time and start/end markers", () => {
    expect(result.distanceM).toBe(driveRoute.route_summary.total_distance);
    expect(result.timeSec).toBe(driveRoute.route_summary.total_time);
    expect(result.startMarker).toHaveProperty("lat");
    expect(result.endMarker).toHaveProperty("lng");
  });
});

describe("buildRouteOptions", () => {
  test("drive → main + alternatives + phyroute options", () => {
    const opts = buildRouteOptions(driveRoute, "drive", { startMs: START_MS });
    // main (1) + alternativeroute (1) + phyroute (1) = 3
    expect(opts).toHaveLength(3);
    opts.forEach((o) => {
      expect(o.kind).toBe("drive");
      expect(o.sun.lines.length).toBeGreaterThan(0);
      expect(Number(o.km)).toBeGreaterThan(0);
    });
  });

  test("transit → one option per itinerary with legs + chips data", () => {
    const opts = buildRouteOptions(transitRoute, "transit", { startMs: START_MS });
    expect(opts.length).toBe(transitRoute.plan.itineraries.length);
    expect(opts[0].kind).toBe("transit");
    expect(opts[0].legs.length).toBeGreaterThan(0);
  });

  test("null response → empty", () => {
    expect(buildRouteOptions(null, "drive")).toEqual([]);
  });
});
