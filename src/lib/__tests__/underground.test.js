// Control the tunnel dataset so the test doesn't depend on the bundled file.
jest.mock("../../services/undergroundData", () => ({
  getTunnels: () => [
    { mode: "SUBWAY", route: "NE", wholeLine: true },
    { mode: "SUBWAY", route: "EW", path: [[1.2861264, 103.8270314]] }, // Tiong Bahru
    { mode: "BUS", route: "190", path: [[1.29, 103.84]] },
  ],
}));

import { isSegmentUnderground } from "../sun/underground";

// Zero-length segment centred on a point, so the midpoint is that point.
const at = (lat, lng) => [{ lat, lng }, { lat, lng }];

describe("isSegmentUnderground", () => {
  test("wholeLine rail route is always underground", () => {
    expect(isSegmentUnderground({ mode: "SUBWAY", route: "NE" }, ...at(1.3, 103.8))).toBe(true);
  });

  test("rail path: near the tunnel path is underground", () => {
    expect(
      isSegmentUnderground({ mode: "SUBWAY", route: "EW" }, ...at(1.2861264, 103.8270314))
    ).toBe(true);
  });

  test("rail path: far from the tunnel path is not underground", () => {
    // Pasir Ris, an above-ground EW stretch far from the tunnel path.
    expect(
      isSegmentUnderground({ mode: "SUBWAY", route: "EW" }, ...at(1.3731912, 103.9493534))
    ).toBe(false);
  });

  test("bus path: near a community bus tunnel is underground", () => {
    expect(isSegmentUnderground({ mode: "BUS", route: "190" }, ...at(1.29, 103.84))).toBe(true);
  });

  test("bus far from its tunnel path is not underground", () => {
    expect(isSegmentUnderground({ mode: "BUS", route: "190" }, ...at(1.35, 103.9))).toBe(false);
  });

  test("a route with no tunnel entry is not underground", () => {
    expect(isSegmentUnderground({ mode: "BUS", route: "9" }, ...at(1.29, 103.84))).toBe(false);
  });

  test("walk legs are never underground", () => {
    expect(isSegmentUnderground({ mode: "WALK", route: "" }, ...at(1.29, 103.84))).toBe(false);
  });
});
