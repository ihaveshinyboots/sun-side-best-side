import { translateInstruction } from "../driveInstructions";

// Fake t: echoes the key + the road it was given, so we can assert the maneuver
// key chosen and the road extracted without initializing i18next.
const t = (key, opts) => `${key}|${opts.road}`;
const step = (text) => {
  const s = [];
  s[9] = text;
  return s;
};

describe("translateInstruction", () => {
  test("keeps OneMap's English when language is English", () => {
    expect(translateInstruction(step("Turn Right Onto Pioneer Road North"), t, "en")).toBe(
      "Turn Right Onto Pioneer Road North"
    );
  });

  test("translates the maneuver and keeps the road name", () => {
    expect(translateInstruction(step("Turn Right Onto Pioneer Road North"), t, "zh")).toBe(
      "maneuver.turnRight|Pioneer Road North"
    );
  });

  test("matches the more specific ramp prefix first", () => {
    expect(
      translateInstruction(step("Take The Ramp On The Left Onto Central Expressway"), t, "zh")
    ).toBe("maneuver.rampLeft|Central Expressway");
  });

  test("compound compass matched before simple", () => {
    expect(translateInstruction(step("Head Southwest On Jurong West Street 65"), t, "ta")).toBe(
      "maneuver.headSW|Jurong West Street 65"
    );
  });

  test("arrival has no road", () => {
    expect(translateInstruction(step("You Have Arrived At Your Destination"), t, "zh")).toBe(
      "maneuver.arrived|"
    );
  });

  test("unknown maneuver falls back to the original text", () => {
    expect(translateInstruction(step("Do A Barrel Roll Onto X Road"), t, "zh")).toBe(
      "Do A Barrel Roll Onto X Road"
    );
  });
});
