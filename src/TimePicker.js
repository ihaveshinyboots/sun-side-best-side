import React from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css"; // You can change the theme if needed
import "./SunSideBestSide.css"; // Import the CSS file for consistent styling

const TimePicker = ({ time, handleChange }) => {
  return (
    <div className="timepicker-container">
      <label htmlFor="timePicker">Select Time: </label>
      <Flatpickr
        id="timePicker"
        className="flatpickr-wrapper"
        options={{
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
        }}
        value={time}
        onChange={handleChange}
      />
    </div>
  );
};

export default TimePicker;
