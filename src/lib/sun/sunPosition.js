import SunCalc from "suncalc";

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

const calculateAzimuth = (pointA, pointB) => {
  const lat1 = toRadians(pointA.latitude);
  const lon1 = toRadians(pointA.longitude);
  const lat2 = toRadians(pointB.latitude);
  const lon2 = toRadians(pointB.longitude);

  const dLon = lon2 - lon1;

  const x = Math.sin(dLon) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let azimuth = Math.atan2(x, y);
  azimuth = toDegrees(azimuth);
  return (azimuth + 360) % 360; // 0-360
};

const calculateSunPosition = ({ pointA, pointB }, time) => {
  // suncalc azimuth is radians from SOUTH, positive westward. altitude < 0
  // means the sun is below the horizon, i.e. night — no side to pick.
  const sunPosition = SunCalc.getPosition(
    time,
    pointA.latitude,
    pointA.longitude
  );
  if (sunPosition.altitude < 0) return "night";

  const azimuthAB = calculateAzimuth(pointA, pointB);
  const azimuthSun = toDegrees(sunPosition.azimuth);

  // Cross product of the two direction vectors gives which side the sun is on.
  const vectorAB = {
    x: Math.cos(toRadians(azimuthAB)),
    y: Math.sin(toRadians(azimuthAB)),
  };
  const vectorASun = {
    x: Math.cos(toRadians(azimuthSun)),
    y: Math.sin(toRadians(azimuthSun)),
  };
  const crossProduct = vectorAB.x * vectorASun.y - vectorAB.y * vectorASun.x;

  if (crossProduct > 0) return "left";
  if (crossProduct < 0) return "right";
  return "on the line";
};

// Sunset time (a Date) at a location on the day of `time`. suncalc access lives
// in this file so its conventions stay in one place.
export function getSunsetTime(time, lat, lng) {
  return SunCalc.getTimes(time, lat, lng).sunset;
}

export default calculateSunPosition;
