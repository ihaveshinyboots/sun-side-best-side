import SunCalc from "suncalc";

// Helper functions
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
  return (azimuth + 360) % 360; // Normalize to 0-360 degrees
};

const calculateSunPosition = ({ pointA, pointB }, time) => {
  // Calculate azimuth of the line A to B
  const azimuthAB = calculateAzimuth(pointA, pointB);

  // Get sun position
  const sunPosition = SunCalc.getPosition(
    time,
    pointA.latitude,
    pointA.longitude
  );
  const azimuthSun = toDegrees(sunPosition.azimuth);

  // Vector method to determine the side
  const vectorAB = {
    x: Math.cos(toRadians(azimuthAB)),
    y: Math.sin(toRadians(azimuthAB)),
  };

  const vectorASun = {
    x: Math.cos(toRadians(azimuthSun)),
    y: Math.sin(toRadians(azimuthSun)),
  };

  // Calculate the cross product
  const crossProduct = vectorAB.x * vectorASun.y - vectorAB.y * vectorASun.x;

  if (crossProduct > 0) {
    return "left";
  } else if (crossProduct < 0) {
    return "right";
  } else {
    return "on the line";
  }
};

export default calculateSunPosition;
