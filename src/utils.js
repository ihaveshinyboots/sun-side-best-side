export const getCurrentTime = () => {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const addAverageTime = (selectedTime, averageMins) => {
  if (selectedTime) {
    // Split the time into hours, minutes, and seconds
    const [hours, minutes, seconds] = selectedTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);

    // Add average travel time in seconds
    date.setSeconds(date.getSeconds() + averageMins * 60);

    const updatedTime = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    return updatedTime;
  }
  return selectedTime;
};
