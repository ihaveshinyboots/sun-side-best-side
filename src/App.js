import React, { useEffect, useState } from "react";
import sunPosition from "./SunPosition";
import loadData from "./LoadData";
import LeafletMapComponent from "./LeafletComponent";
import TimePicker from "./TimePicker";
import LinesComponent from "./LinesComponent";
import SearchableDropdown from "./SearchableDropdown";
import Modal from "react-modal";
import { getCurrentTime, addAverageTime } from "./utils";

import "./SunSideBestSide.css";
import "./Lines.css";
import "flatpickr/dist/flatpickr.min.css";

Modal.setAppElement("#root"); // To avoid accessibility issues with React Modal

function YourComponent() {
  const [csvData, setCSVData] = useState([]);
  const [stations, setStations] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [start, setStart] = useState("");
  const [time, setTime] = useState(getCurrentTime());
  const [destination, setDestination] = useState("");
  const [lineSets, setLineSets] = useState([]);
  const [leftPercentage, setLeftPercentage] = useState(0);
  const [rightPercentage, setRightPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripEndTime, setTripEndTime] = useState("");

  useEffect(() => {
    const fetchMrt = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/ihaveshinyboots/sun-side-best-side/master/data/MRT/Compiled%20MRT%20Stations.csv"
        );
        const text = await response.text();
        const rows = text.split("\n");
        const dataList = rows.filter((row) => row.trim() !== "");
        setStations(dataList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    closeModal();
    fetchMrt();
  }, []);

  useEffect(() => {
    if (lineSets.length > 0) {
      setIsModalOpen(true);
    }
  }, [lineSets]);

  useEffect(() => {
    let pointA = { longitude: null, latitude: null };
    let pointB = { longitude: null, latitude: null };
    let pointsToNextStation = 0;
    let durationFromPrevious = 0;
    let avgTravelTimeMins = 0;
    let computeTime = time;
    let directions = [];
    let lines = [];

    for (let index = 0; index < csvData.length - 1; index++) {
      if (pointsToNextStation === 0) {
        for (let i = index + 1; i < csvData.length; i++) {
          pointsToNextStation += 1;
          if (!isNaN(csvData[i].durationFromPrevious)) {
            durationFromPrevious = csvData[i].durationFromPrevious;
            avgTravelTimeMins = durationFromPrevious / pointsToNextStation;
            const stopDuration = csvData[i].stopDuration;
            if (!isNaN(stopDuration)) {
              computeTime = addAverageTime(computeTime, stopDuration);
            }
            break;
          }
        }
      } else {
        pointsToNextStation -= 1;
        computeTime = addAverageTime(computeTime, avgTravelTimeMins);
      }
      pointA.longitude = csvData[index].longitude;
      pointA.latitude = csvData[index].latitude;
      pointA.ignore = csvData[index].ignore;
      pointA.stopDuration = csvData[index].stopDuration;
      pointB.longitude = csvData[index + 1].longitude;
      pointB.latitude = csvData[index + 1].latitude;
      const ignore = csvData[index].ignore;
      console.log(computeTime);
      const direction = sunPosition({ pointA, pointB }, computeTime);
      let color = "grey";
      if (ignore === "True") {
        directions.push("ignore");
        color = "grey";
      } else {
        if (isFlipped) {
          if (direction === "left") {
            directions.push("right");
            color = "blue";
          } else {
            directions.push("left");
            color = "red";
          }
        } else {
          // Default behavior when not flipped
          if (direction === "left") {
            directions.push(direction);
            color = "red";
          } else {
            directions.push(direction);
            color = "blue";
          }
        }
      }

      const line = {
        coordinates: [
          { lat: pointA.latitude, lng: pointA.longitude },
          { lat: pointB.latitude, lng: pointB.longitude },
        ],
        color: color,
      };
      lines.push(line);
    }
    // Calculate percentage of left and right directions
    const leftCount = directions.filter(
      (direction) => direction === "left"
    ).length;
    const rightCount = directions.length - leftCount;
    const totalCount = directions.length;

    setLineSets(lines);

    if (totalCount > 0) {
      setLeftPercentage((leftCount / totalCount) * 100);
      setRightPercentage((rightCount / totalCount) * 100);
    } else {
      // If totalCount is zero, set percentages to 0
      setLeftPercentage(0);
      setRightPercentage(0);
    }
    setIsLoading(false);
    setTripEndTime(computeTime);
  }, [csvData, isFlipped, time]);

  const handleStartChange = (event) => {
    setStart(event.target.value);
  };

  const handleChange = (selectedDates) => {
    setTime(selectedDates[0]);
  };

  const handleDestinationChange = (event) => {
    setDestination(event.target.value);
  };

  const handleSearch = async () => {
    if (!start || !destination) {
      alert("Please select both Start and Destination before searching.");
      return;
    }

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

  return (
    <div>
      <div>
        <h1>Sun Side Best Side</h1>
        <SearchableDropdown
          label="Start"
          value={start}
          onChange={handleStartChange}
          options={stations}
        />
        <div />
        <SearchableDropdown
          label="Destination"
          value={destination}
          onChange={handleDestinationChange}
          options={stations}
        />
      </div>
      <TimePicker time={time} handleChange={handleChange} />
      <div>
        <div class="dropdown-container">
          <button
            class="custom-button"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </button>
        </div>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            contentLabel="Map Modal"
            className="modal-content"
            overlayClassName="modal-overlay"
          >
            <button class="custom-button top-right" onClick={closeModal}>
              Close
            </button>
            <div>
              <h2>Sun Directions</h2>
            </div>
            <LeafletMapComponent lines={lineSets} onClose={closeModal} />
            <div
              className="line"
              style={{ paddingTop: "20px", paddingBottom: "10px" }}
            >
              <LinesComponent />
            </div>
            <div style={{ paddingBottom: "10px" }}>
              Estimated trip end time: {tripEndTime.slice(0, 5)}
            </div>
            <div>
              {leftPercentage > rightPercentage ? (
                <p>Sun will be on the left most of the time</p>
              ) : (
                <p>Sun will be on the right most of the time</p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default YourComponent;
