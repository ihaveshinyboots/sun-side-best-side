import React, { useState, useEffect, useRef } from "react";

const SearchableDropdown = ({ label, value, onChange, options }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsDropdownOpen(true);
  };

  const handleOptionClick = (option) => {
    onChange({ target: { value: option } });
    setSearchTerm(option); // Set the search term to the selected option
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
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dropdown-container" ref={containerRef}>
      <label htmlFor={label}>{label}: </label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsDropdownOpen(true)}
          style={{ padding: "5px", width: "200px", marginRight: "10px" }}
        />
        {searchTerm && ( // Show clear button only when searchTerm is not empty
          <button
            onClick={clearSearchTerm}
            style={{
              borderRadius: "50%",
              padding: "5px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "1.2em", color: "gray" }}>x</span>
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
