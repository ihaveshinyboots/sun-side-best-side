import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { searchPlaces } from "../services/onemap";
import "./PlaceSearch.css";

const MAX_RESULTS = 9;

// Place search backed by the OneMap search API, debounced as you type.
const PlaceSearch = ({ label, onSelect }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="dropdown-container" ref={containerRef}>
      <div className="search-input-wrapper fish-box">
        <input
          type="text"
          placeholder={label}
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          aria-label={label}
        />
      </div>
      {isOpen && searchTerm.trim().length >= 2 && (
        <ul className="dropdown-list fish-list">
          {isLoading && <li className="dropdown-item">{t("search.searching")}</li>}
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
        </ul>
      )}
    </div>
  );
};

export default PlaceSearch;
