import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import otterIcon from "./otter.png"; // Adjust the path as necessary

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

const LeafletMapComponent = ({ lines, otterCoordinates }) => {
  const otterMarkerIcon = L.icon({
    iconUrl: otterIcon,
    iconSize: [32, 32], // Adjust the size of the icon
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
  });

  return (
    <div>
      <MapContainer
        center={[1.3521, 103.8198]} // Default center to Singapore
        zoom={16} // Default zoom level
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Fit map bounds to lines */}
        <FitToBounds lines={lines} />

        {/* Render polylines based on lines */}
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            <Polyline positions={line.coordinates} color={line.color} />
          </React.Fragment>
        ))}

        {otterCoordinates.map((coord, index) => {
          return (
            <Marker
              key={`otter-${index}`}
              position={[coord.lat, coord.lng]}
              icon={otterMarkerIcon}
            >
              <Popup>{`Otter Marker ${index + 1}`}</Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMapComponent;
