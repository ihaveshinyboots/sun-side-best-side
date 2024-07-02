import React from "react";
import "./Lines.css"; // Import your CSS file for styling

const LinesComponent = () => {
  return (
    <div className="lines-container">
      <div className="line">
        <span className="line-bar red"></span>
        <span className="line-text">LEFT</span>
      </div>
      <div className="line">
        <span className="line-bar blue"></span>
        <span className="line-text">RIGHT</span>
      </div>
      <div className="line">
        <span className="line-bar grey"></span>
        <span className="line-text">UNDERGROUND</span>
      </div>
    </div>
  );
};

export default LinesComponent;
