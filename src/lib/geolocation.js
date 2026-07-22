// Current position as { lat, lng } from the device GPS. Uses the Capacitor
// plugin on native (it handles the permission bridge), and the browser's
// geolocation on web/PWA. Both are free — no OneMap/API call. If the device
// won't give a fix (denied/unavailable), the caller falls back to manual entry.
export async function getCurrentPosition() {
  if (window.Capacitor?.isNativePlatform?.()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      // Desktop browsers have no GPS; high accuracy just times out on macOS
      // Safari. Low accuracy (WiFi/IP) is plenty for a trip start, and a cached
      // fix (maximumAge) returns instantly on repeat loads.
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  });
}
