import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { useTranslation } from "react-i18next";
import MapView from "./components/MapView";
import RouteLegend from "./components/RouteLegend";
import PlaceSearch from "./components/PlaceSearch";
import RouteBreakdown, { RouteChips, DriveBreakdown } from "./components/RouteBreakdown";
import logo from "./assets/logo.svg";
import { LANGUAGES } from "./i18n";
import { loadTunnels } from "./services/undergroundData";
import { fetchRoute } from "./services/routing";
import { buildRouteOptions } from "./lib/routeModel";
import {
  getCurrentTime,
  formatTime,
  formatOneMapDate,
  formatOneMapTime,
} from "./lib/time";

import "./styles/theme.css";
import "./styles/app.css";
import "./styles/mobile.css";

Modal.setAppElement("#root");

function App() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState("transit");
  const [startPlace, setStartPlace] = useState(null);
  const [destPlace, setDestPlace] = useState(null);
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Pull the latest community tunnel data once at startup (falls back to the
  // bundled snapshot until it arrives).
  useEffect(() => {
    loadTunnels();
  }, []);

  const selected = routeOptions[selectedIndex] || null;
  const sun = selected?.sun || null;
  const lines = sun?.lines || [];
  const left = sun?.leftPercentage || 0;
  const right = sun?.rightPercentage || 0;
  const tripEndTime = sun?.tripEndTime || null;
  const sunsetTime = sun?.sunsetTime || null;
  const isNight = sun?.isNight || false;

  const startMarker = startPlace
    ? { lat: startPlace.lat, lng: startPlace.lng }
    : sun?.startMarker || null;
  const endMarker = destPlace
    ? { lat: destPlace.lat, lng: destPlace.lng }
    : sun?.endMarker || null;

  const runSearch = async (searchMode) => {
    if (!startPlace || !destPlace) return;
    setIsLoading(true);
    try {
      const now = getCurrentTime();
      const data = await fetchRoute({
        start: { lat: startPlace.lat, lng: startPlace.lng },
        end: { lat: destPlace.lat, lng: destPlace.lng },
        mode: searchMode,
        date: formatOneMapDate(now),
        time: formatOneMapTime(now),
      });
      const opts = buildRouteOptions(data, searchMode, { startMs: now.getTime() });
      setRouteOptions(opts);
      setSelectedIndex(0);
      if (opts.length === 0) alert(t("errors.noRoutes"));
    } catch (error) {
      console.error("Error loading route:", error);
      alert(t("errors.loadFailed", { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => runSearch(mode);

  // Re-fetch on mode switch so an already-entered trip flips between transit and drive.
  const changeMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (startPlace && destPlace) runSearch(newMode);
  };

  const ModeToggle = () => (
    <div className="mode-toggle">
      <button
        className={mode === "transit" ? "active" : ""}
        onClick={() => changeMode("transit")}
      >
        🚆 {t("mode.transit")}
      </button>
      <button
        className={mode === "drive" ? "active" : ""}
        onClick={() => changeMode("drive")}
      >
        🚗 {t("mode.drive")}
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="map-area">
        <MapView
          lines={lines}
          startMarker={startMarker}
          endMarker={endMarker}
        />
      </div>

      <div className="search-panel">
        <select
          className="lang-select"
          value={(i18n.language || "en").split("-")[0]}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t("lang.label")}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <img src={logo} alt="Sun Side Best Side" className="app-logo" />
        <div className="search-fields">
          <PlaceSearch label={t("search.start")} onSelect={setStartPlace} />
          <PlaceSearch label={t("search.destination")} onSelect={setDestPlace} />
        </div>
        <button
          className="search-cta"
          onClick={handleSearch}
          disabled={!startPlace || !destPlace || isLoading}
        >
          {isLoading ? t("search.searching") : t("search.button")}
        </button>
      </div>

      {routeOptions.length > 0 && (
        <div className="info-sheet">
          <ModeToggle />
          <div className="route-options">
            {routeOptions.map((opt, idx) => (
              <div
                key={idx}
                className={`route-card ${idx === selectedIndex ? "selected" : ""}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <div className="route-card-head">
                  <strong>
                    {opt.kind === "drive"
                      ? `🚗 ${
                          opt.labelKey
                            ? t(opt.labelKey)
                            : opt.label || t("drive.via", { via: opt.via })
                        }`
                      : t("route.label", { n: opt.index + 1 })}
                  </strong>
                  <span className="muted">
                    {" · "}
                    {t("route.minutes", { count: opt.minutes })}
                    {opt.kind === "drive"
                      ? ` · ${t("units.km", { km: opt.km })}`
                      : ` · ${t("route.transfers", { count: opt.transfers })}`}
                  </span>
                </div>
                {opt.kind === "transit" && <RouteChips legs={opt.legs} />}
              </div>
            ))}
          </div>

          <div className="sun-summary">
            {isNight
              ? `🌙 ${t("sun.night")}`
              : left > right
              ? `☀️ ${t("sun.left")}`
              : `☀️ ${t("sun.right")}`}
            {tripEndTime && (
              <span className="muted">
                {" · "}
                {t("sun.arrives", { time: formatTime(tripEndTime) })}
              </span>
            )}
            {sunsetTime && (
              <span className="muted">
                {" · "}
                {t("sun.sunset", { time: formatTime(sunsetTime) })}
              </span>
            )}
          </div>

          {selected &&
            (selected.kind === "transit" ? (
              <RouteBreakdown legs={selected.legs} />
            ) : (
              <DriveBreakdown option={selected} />
            ))}

          <div className="line" style={{ paddingTop: 10 }}>
            <RouteLegend />
          </div>
        </div>
      )}

      <button className="info-fab" onClick={() => setIsInfoOpen(true)}>
        i
      </button>

      {isInfoOpen && (
        <Modal
          isOpen={isInfoOpen}
          onRequestClose={() => setIsInfoOpen(false)}
          contentLabel={t("modal.title")}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <button
            className="close-button top-right"
            onClick={() => setIsInfoOpen(false)}
          >
            <span className="cross-icon">X</span>
          </button>
          <h2 style={{ fontWeight: "bold", fontSize: "1.5em" }}>
            {t("modal.title")}
          </h2>
          <p>{t("modal.body")}</p>
          <h3>
            <a href="https://buymeacoffee.com/ihaveshinyboots" rel="noreferrer">
              {t("modal.support")}
            </a>
          </h3>
        </Modal>
      )}
    </div>
  );
}

export default App;
