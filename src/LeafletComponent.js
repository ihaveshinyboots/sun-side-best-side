import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const FitToBounds = ({ lines }) => {
  const map = useMap();

  useEffect(() => {
    if (lines.length > 0) {
      const allCoordinates = lines.flatMap((line) => line.coordinates);
      const bounds = allCoordinates.map((coord) => [coord.lat, coord.lng]);
      map.fitBounds(bounds);
    }
  }, [lines, map]);

  return null;
};

const LeafletMapComponent = ({ lines, onClose }) => {
  return (
    <div>
      <button onClick={onClose}>Close</button>
      <MapContainer
        center={[1.3521, 103.8198]} // Default center to Singapore
        zoom={12} // Default zoom level
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Fit map bounds to lines */}
        <FitToBounds lines={lines} />

        {/* Render polylines based on lines */}
        {lines.map((line, index) => (
          <Polyline
            key={index}
            positions={line.coordinates}
            color={line.color}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;
