import React, { useEffect, useState } from "react";
import sunPosition from "./SunPosition";
import loadData from "./LoadData";
import LeafletMapComponent from "./LeafletComponent";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import Modal from "react-modal";

Modal.setAppElement("#root"); // To avoid accessibility issues with React Modal

function YourComponent() {
  const [csvData, setCSVData] = useState([]);
  const [stations, setStations] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [start, setStart] = useState("");
  const [time, setTime] = useState("12:00"); // Default time
  const [destination, setDestination] = useState("");
  const [sunDirections, setSunDirections] = useState([]);
  const [lineSets, setLineSets] = useState([]);
  const [leftPercentage, setLeftPercentage] = useState(0);
  const [rightPercentage, setRightPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const leftColour = "#FF0000";
  const rightColour = "#0000FF";

  useEffect(() => {
    const fetchMrt = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/ihaveshinyboots/sun-side-best-side/master/data/MRT/Compiled%20MRT%20Stations.csv"
        );
        const text = await response.text();
        const rows = text.split("\n");
        const dataList = rows.filter((row) => row.trim() !== ""); // Remove empty rows
        setStations(dataList);
        setIsLoading(false); // Set loading state to false after fetching data
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    closeModal();
    fetchMrt();
  }, []);

  useEffect(() => {
    if (lineSets.length > 0) setIsModalOpen(true);
  }, [lineSets]);

  useEffect(() => {
    // Initialize pointA and pointB
    let pointA = { longitude: null, latitude: null };
    let pointB = { longitude: null, latitude: null };

    const directions = [];
    const lines = [];

    // Use a for loop to iterate through csvData
    //
    //longitude,
    // latitude,
    // name,
    //ignore,
    //durationFromPrevious,
    //stopDuration,
    //

    for (let index = 0; index < csvData.length - 1; index++) {
      // Assign longitude and latitude values for pointA and pointB
      // find the next durationFromPrevious, then average it
      pointA.longitude = csvData[index].longitude;
      pointA.latitude = csvData[index].latitude;
      pointB.longitude = csvData[index + 1].longitude;
      pointB.latitude = csvData[index + 1].latitude;

      // Use useSunPosition hook to calculate sun direction
      const direction = sunPosition({ pointA, pointB }, time);

      const line = {
        coordinates: [
          { lat: pointA.latitude, lng: pointA.longitude },
          { lat: pointB.latitude, lng: pointB.longitude },
        ],
        color: getColor(sunPosition({ pointA, pointB }, time)),
      };

      lines.push(line);

      if (isFlipped) {
        if (direction === "left") directions.push("right");
        else directions.push("left");
      } else {
        directions.push(direction);
      }
      // Store direction in array
    }
    // Calculate percentage of left and right directions
    const leftCount = directions.filter(
      (direction) => direction === "left"
    ).length;
    const rightCount = directions.length - leftCount;
    const totalCount = directions.length;

    setLineSets(lines);
    setSunDirections(directions); // Update sun directions state

    if (totalCount > 0) {
      setLeftPercentage((leftCount / totalCount) * 100); // Update left percentage state
      setRightPercentage((rightCount / totalCount) * 100); // Update right percentage state
    } else {
      // If totalCount is zero, set percentages to 0
      setLeftPercentage(0);
      setRightPercentage(0);
    }
    setIsLoading(false); // Set loading state to false after fetching data
  }, [csvData, isFlipped, time]);

  const handleStartChange = (event) => {
    setStart(event.target.value);
  };

  const handleChange = (selectedDates) => {
    setTime(selectedDates[0]);
    console.log(`Selected time: ${selectedDates[0]}`);
  };

  const handleDestinationChange = (event) => {
    setDestination(event.target.value);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await loadData(start, destination);
      setIsFlipped(data.flip);
      setCSVData(data.result);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };
  const closeModal = () => setIsModalOpen(false);

  function getColor(direction) {
    // TODO: subsequent search not working. first search is right
    if (isFlipped) {
      if (direction === "left") return rightColour;
      else return leftColour;
    }
    if (direction === "left") return leftColour;
    else return rightColour;
  }

  return (
    <div>
      {" "}
      <div>
        <label htmlFor="from">Start: </label>
        <select id="from" value={start} onChange={handleStartChange}>
          <option value="">Select From</option>
          {stations.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="to">Destination: </label>
        <select id="to" value={destination} onChange={handleDestinationChange}>
          <option value="">Select To</option>
          {stations.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <label htmlFor="timePicker">Select Time: </label>
      <Flatpickr
        id="timePicker"
        options={{
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
        }}
        value={time}
        onChange={handleChange}
      />
      <div>
        <button onClick={handleSearch} disabled={isLoading}>
          Search
        </button>
        {
          <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            contentLabel="Map Modal"
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            <LeafletMapComponent lines={lineSets} onClose={closeModal} />
          </Modal>
        }
      </div>
      <div>
        <h2>Sun Directions</h2>
      </div>
      <div>
        <p>Left Percentage: {leftPercentage.toFixed(2)}%</p>
        <p>Right Percentage: {rightPercentage.toFixed(2)}%</p>
      </div>
    </div>
  );
}

export default YourComponent;
