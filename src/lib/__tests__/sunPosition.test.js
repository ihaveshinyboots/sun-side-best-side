import calculateSunPosition, { getSunsetTime } from "../sun/sunPosition";

const seg = {
  pointA: { latitude: 1.3, longitude: 103.8 },
  pointB: { latitude: 1.31, longitude: 103.8 },
};

describe("sun position + night detection", () => {
  test("returns 'night' when the sun is below the horizon", () => {
    const night = new Date("2025-11-09T18:00:00Z"); // 02:00 SGT
    expect(calculateSunPosition(seg, night)).toBe("night");
  });

  test("returns a real side in daytime", () => {
    const noon = new Date("2025-11-10T04:00:00Z"); // 12:00 SGT
    expect(["left", "right", "on the line"]).toContain(
      calculateSunPosition(seg, noon)
    );
  });

  test("getSunsetTime returns a Date", () => {
    const sunset = getSunsetTime(new Date("2025-11-10T04:00:00Z"), 1.3, 103.8);
    expect(sunset instanceof Date).toBe(true);
    expect(Number.isNaN(sunset.getTime())).toBe(false);
  });
});
