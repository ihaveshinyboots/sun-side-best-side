// Localizes a OneMap drive instruction. Each instruction is "<maneuver phrase>
// <road name>", e.g. "Turn Right Onto Pioneer Road North". The road name is a
// proper noun and stays as OneMap gives it; only the maneuver phrase is
// translated, via a lookup keyed by the known English prefixes. Anything we
// don't recognise falls back to the original English text.

// Longest / most-specific prefixes first so startsWith matches correctly
// (e.g. "Continue Onto" before "Continue On", compound compass before simple).
const PREFIX_ENTRIES = [
  ["Take The Ramp On The Left Onto", "rampLeft"],
  ["Take The Ramp On The Right Onto", "rampRight"],
  ["Make A U-turn And Continue On", "uTurn"],
  ["Make A Slight Left To Stay On", "slightLeftStay"],
  ["Make A Slight Right To Stay On", "slightRightStay"],
  ["You Have Arrived At Your Destination", "arrived"],
  ["Take The Ramp Onto", "rampOnto"],
  ["Turn Right To Stay On", "turnRightStay"],
  ["Turn Left To Stay On", "turnLeftStay"],
  ["Head Northeast On", "headNE"],
  ["Head Northwest On", "headNW"],
  ["Head Southeast On", "headSE"],
  ["Head Southwest On", "headSW"],
  ["Merge Right Onto", "mergeRight"],
  ["Merge Left Onto", "mergeLeft"],
  ["Keep Right Onto", "keepRight"],
  ["Keep Left Onto", "keepLeft"],
  ["Turn Right Onto", "turnRight"],
  ["Turn Left Onto", "turnLeft"],
  ["Head North On", "headN"],
  ["Head South On", "headS"],
  ["Head East On", "headE"],
  ["Head West On", "headW"],
  ["Continue Onto", "continue"],
  ["Merge Onto", "merge"],
  ["Continue On", "continueOn"],
];

export function translateInstruction(step, t, lang) {
  const full = (step && (step[9] || step[0])) || "";
  if (!full) return "";
  // Keep OneMap's original English phrasing when the app is in English.
  if (lang && lang.split("-")[0] === "en") return full;

  for (const [prefix, key] of PREFIX_ENTRIES) {
    if (full.startsWith(prefix)) {
      const road = full.slice(prefix.length).trim();
      return t(`maneuver.${key}`, { road, defaultValue: full });
    }
  }
  return full;
}

export default translateInstruction;
