export const getCurrentTime = () => {
  return new Date();
};

export const addAverageTime = (selectedTime, averageMins) => {
  const date = new Date(selectedTime);
  date.setSeconds(date.getSeconds() + averageMins * 60);

  return date;
};

export const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};
