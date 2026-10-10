import React, { useState, useRef, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css"; // You can change the theme if needed
import "./TimePicker.css"; // Import the CSS file for consistent styling

const TimePicker = ({ time, handleChange }) => {
  const [selectedTime, setSelectedTime] = useState(time);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  const onChange = (selectedDates) => {
    const selectedTime = selectedDates[0];
    setSelectedTime(selectedTime);
    handleChange([selectedTime]);
  };

  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`timepicker-container ${isFocused ? "focused" : ""}`}
      ref={containerRef}
    >
      <label htmlFor="timePicker">Select Time: </label>
      <div className="timepicker-wrapper">
        <Flatpickr
          id="timePicker"
          className="flatpickr-input"
          options={{
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
          }}
          value={selectedTime}
          onChange={onChange}
          onOpen={() => setIsFocused(true)}
          onClose={() => setIsFocused(false)}
        />
      </div>
    </div>
  );
};

export default TimePicker;
