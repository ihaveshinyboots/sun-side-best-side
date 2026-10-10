import React, { useState, useEffect, useRef } from "react";
import "./SearchableDropdown.css";

const SearchableDropdown = ({ label, value, onChange, options }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownOpen(true);
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setSearchTerm(option);
    setIsDropdownOpen(false);
  };

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const clearSearchTerm = () => {
    setSearchTerm("");
    onChange({ target: { value: "" } });
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`dropdown-container ${isFocused ? "focused" : ""}`}
      ref={containerRef}
    >
      <label htmlFor={label}>{label}: </label>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            setIsDropdownOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
        />
        {searchTerm && ( // Show clear button only when searchTerm is not empty
          <button className="clear-btn" onClick={clearSearchTerm}>
            ✕
          </button>
        )}
      </div>
      {isDropdownOpen && (
        <ul className="dropdown-list">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => handleOptionClick(option)}
              className="dropdown-item"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;
