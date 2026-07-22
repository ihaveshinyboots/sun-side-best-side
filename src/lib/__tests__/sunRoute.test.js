import { buildItinerarySunData } from "../sunRoute";
import sampleRoute from "../__fixtures__/sampleRoute.json";

describe("buildItinerarySunData", () => {
  const itinerary = sampleRoute.plan.itineraries[0];
  const result = buildItinerarySunData(itinerary);

  test("produces a line segment for every decoded polyline segment", () => {
    expect(result.lines.length).toBeGreaterThan(0);
    result.lines.forEach((l) => {
      expect(l.coordinates).toHaveLength(2);
      expect(["red", "blue", "grey"]).toContain(l.color);
    });
  });

  test("walk legs are grey and excluded; transit legs drive the percentages", () => {
    // itinerary 0 legs: WALK, SUBWAY, SUBWAY, WALK
    const hasGrey = result.lines.some((l) => l.color === "grey");
    const hasColored = result.lines.some((l) => l.color !== "grey");
    expect(hasGrey).toBe(true);
    expect(hasColored).toBe(true);
  });

  test("left + right percentages sum to ~100 when there is transit", () => {
    expect(result.leftPercentage + result.rightPercentage).toBeCloseTo(100, 5);
  });

  test("otter markers include every leg start plus the final destination", () => {
    // 4 legs -> 4 starts + 1 final destination
    expect(result.otterCoordinates).toHaveLength(itinerary.legs.length + 1);
  });

  test("tripEndTime matches the itinerary end", () => {
    expect(result.tripEndTime.getTime()).toBe(itinerary.endTime);
  });

  test("legSides: one per leg; walk has no side, transit legs get a side", () => {
    expect(result.legSides).toHaveLength(itinerary.legs.length);
    itinerary.legs.forEach((leg, i) => {
      const s = result.legSides[i];
      if (leg.transitLeg) {
        expect(["left", "right", "underground", "night", null]).toContain(s.side);
      } else {
        expect(s.side).toBeNull();
      }
    });
    // daytime fixture: at least one transit leg has a real left/right side
    expect(
      result.legSides.some((s) => s.side === "left" || s.side === "right")
    ).toBe(true);
  });
});
