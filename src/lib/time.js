// Dev-only override so you can test other times of day (e.g. after sunset).
// Add ?mockTime=21:00 to the URL for today at 21:00, or a full ISO string like
// ?mockTime=2025-11-10T21:00. Ignored in production builds.
function mockTime() {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("mockTime");
  if (!raw) return null;
  let d;
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    d = new Date();
    d.setHours(h, m, 0, 0);
  } else {
    d = new Date(raw);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

export const getCurrentTime = () => mockTime() || new Date();

export const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// OneMap routing wants the date as MM-DD-YYYY and the time as HH:MM:SS.
export const formatOneMapDate = (date) => {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

export const formatOneMapTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
