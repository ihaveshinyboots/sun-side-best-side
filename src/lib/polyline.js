// Google encoded-polyline decoder (precision 5), no deps. Returns { lat, lng }
// pairs to match the shape used in src/components/MapView.js.
//
// Always decode a value pulled from parsed JSON (e.g. leg.legGeometry.points),
// never a polyline hardcoded in a JS string: backslashes get eaten as escapes
// and corrupt the geometry.
export function decodePolyline(encoded, precision = 5) {
  if (!encoded) return [];

  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }

  return coordinates;
}

export default decodePolyline;
