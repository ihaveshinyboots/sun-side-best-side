import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { otterStart, otterEnd } from "../assets/otterIcons";

// Size keeps the otter SVG's 1.45:1 aspect ratio (a square would squash it).
// Anchor at the otter's centre (not its feet) so the marker stays planted on
// the source/destination at every zoom instead of appearing to drift.
const iconOpts = {
  iconSize: [72, 50],
  iconAnchor: [36, 26],
  popupAnchor: [0, -26],
};

const startIcon = L.icon({ iconUrl: otterStart, ...iconOpts });
const endIcon = L.icon({ iconUrl: otterEnd, ...iconOpts });

const FitToBounds = ({ lines }) => {
  const map = useMap();
  useEffect(() => {
    if (lines.length > 0) {
      const bounds = lines
        .flatMap((line) => line.coordinates)
        .map((coord) => [coord.lat, coord.lng]);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [lines, map]);
  return null;
};

const MapView = ({ lines, startMarker, endMarker, style }) => {
  return (
    <MapContainer
      center={[1.3521, 103.8198]} // Singapore
      zoom={12}
      style={style || { height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <FitToBounds lines={lines} />

      {lines.map((line, index) => (
        <Polyline key={index} positions={line.coordinates} color={line.color} weight={5} />
      ))}

      {startMarker && (
        <Marker position={[startMarker.lat, startMarker.lng]} icon={startIcon} />
      )}
      {endMarker && (
        <Marker position={[endMarker.lat, endMarker.lng]} icon={endIcon} />
      )}
    </MapContainer>
  );
};

export default MapView;
