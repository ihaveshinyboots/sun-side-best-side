import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { searchPlaces } from "../services/onemap";
import { getCurrentPosition } from "../lib/geolocation";
import "./PlaceSearch.css";

const MAX_RESULTS = 9;

// Place search backed by the OneMap search API, debounced as you type.
// With `enableMyLocation`, the dropdown offers a "My location" row that fills
// the field from the device GPS (free, no API call).
const PlaceSearch = ({ label, onSelect, enableMyLocation = false }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const places = await searchPlaces(term);
        if (!cancelled) setResults(places.slice(0, MAX_RESULTS));
      } catch (err) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
    setIsOpen(true);
    onSelect(null); // typing invalidates any prior selection
  };

  const handleOptionClick = (place) => {
    onSelect(place);
    setSearchTerm(place.value);
    setResults([]);
    setIsOpen(false);
  };

  const handleMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      handleOptionClick({
        lat: pos.lat,
        lng: pos.lng,
        value: t("search.yourLocation"),
        current: true,
      });
    } catch (err) {
      console.warn("Geolocation failed:", err.code, err.message);
    } finally {
      setLocating(false);
    }
  };

  const term = searchTerm.trim();
  const showList = isOpen && (enableMyLocation || term.length >= 2);

  return (
    <div className="dropdown-container" ref={containerRef}>
      <div className="search-input-wrapper fish-box">
        <input
          type="text"
          placeholder={label}
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          aria-label={label}
        />
      </div>
      {showList && (
        <ul className="dropdown-list fish-list">
          {enableMyLocation && (
            <li
              onClick={handleMyLocation}
              className="dropdown-item my-location"
            >
              {locating ? t("search.locating") : t("search.myLocation")}
            </li>
          )}
          {term.length >= 2 && (
            <>
              {isLoading && (
                <li className="dropdown-item">{t("search.searching")}</li>
              )}
              {!isLoading && results.length === 0 && (
                <li className="dropdown-item">{t("search.noResults")}</li>
              )}
              {results.map((place, index) => (
                <li
                  key={`${place.value}-${index}`}
                  onClick={() => handleOptionClick(place)}
                  className="dropdown-item"
                >
                  {place.value}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearch;
