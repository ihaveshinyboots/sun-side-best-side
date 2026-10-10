import axios from "axios";

async function LoadCSVData(from, to) {
  try {
    // Fetch CSV data
    let response;
    if (from.includes("EW")) {
      response = await axios.get(
        "https://raw.githubusercontent.com/ihaveshinyboots/sun-side-best-side/master/data/MRT/East%20West%20Line.csv"
      );
    } else {
      response = await axios.get(
        "https://raw.githubusercontent.com/ihaveshinyboots/sun-side-best-side/master/data/MRT/North%20South%20Line.csv"
      );
    }

    const data = response.data;
    let foundTo = false;
    let foundFrom = false;
    let toIndex = null;
    let fromIndex = null;

    // Parse CSV data
    let rows = data
      .split("\n")
      .map((row) => row.trim()) // Trim whitespace from each row
      .map((row) => row.split(","))
      .map((row) => row.map((cell) => (cell === undefined ? "0" : cell)));

    // Perform calculations
    const result = rows.map((row, index) => {
      const longitude = parseFloat(row[0]);
      const latitude = parseFloat(row[1]);
      const name = row[2];
      const ignore = row[3];
      let durationFromPrevious = parseFloat(row[4]);
      let stopDuration = parseFloat(row[5]);
      if (name === to) {
        foundTo = true;
        toIndex = index;
      }
      if (name === from) {
        foundFrom = true;
        fromIndex = index;
      }
      return {
        longitude,
        latitude,
        name,
        ignore,
        durationFromPrevious,
        stopDuration,
      };
    });
    if (foundFrom && foundTo) return { result, toIndex, fromIndex };
    else return null;
  } catch (error) {
    console.error("Error loading CSV:", error);
    return null;
  }
}

async function LoadData(start, destination) {
  const data = await LoadCSVData(start, destination);
  const startNumber = Number(start.match(/\d+/)[0]);
  const destinationNumber = Number(destination.match(/\d+/)[0]);

  if (data) {
    const startIndex = Math.min(data.toIndex, data.fromIndex);
    const destinationIndex = Math.max(data.toIndex, data.fromIndex);
    if (startNumber > destinationNumber)
      return {
        result: data.result.slice(startIndex, destinationIndex + 1),
        flip: true,
      };
    else
      return {
        result: data.result.slice(startIndex, destinationIndex + 1),
        flip: false,
      };
  } else {
    console.log("Failed to load CSV data.");
  }
}

export default LoadData;
