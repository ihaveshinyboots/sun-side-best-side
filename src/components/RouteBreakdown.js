import React from "react";
import { useTranslation } from "react-i18next";
import { getLegPresentation, readableText } from "../lib/transitLines";

const legMinutes = (leg) =>
  Math.max(1, Math.round((leg.endTime - leg.startTime) / 60000));

const Badge = ({ presentation, small }) => (
  <span
    style={{
      display: "inline-block",
      minWidth: small ? 26 : 40,
      textAlign: "center",
      padding: small ? "1px 5px" : "3px 8px",
      borderRadius: 6,
      background: presentation.color,
      color: readableText(presentation.color),
      fontWeight: 700,
      fontSize: small ? 11 : 13,
      lineHeight: 1.4,
    }}
  >
    {presentation.badge}
  </span>
);

// Compact sequence of badges for one itinerary (used in the route picker).
export const RouteChips = ({ legs = [] }) => (
  <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
    {legs.map((leg, i) => {
      const p = getLegPresentation(leg);
      return (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: "#bbb" }}>›</span>}
          <Badge presentation={p} small />
        </React.Fragment>
      );
    })}
  </span>
);

// Drive summary + turn-by-turn. OneMap instruction is an array: index 9 is the
// readable text, index 5 the distance label.
export const DriveBreakdown = ({ option }) => {
  const { t } = useTranslation();
  return (
  <div style={{ textAlign: "left", maxWidth: 440, margin: "0 auto" }}>
    <div style={{ fontSize: 13, color: "#555", padding: "4px 0 8px" }}>
      🚗 {t("drive.via", { via: option.via })} ·{" "}
      {t("route.minutes", { count: option.minutes })} ·{" "}
      {t("units.km", { km: option.km })}
    </div>
    {(option.instructions || []).map((step, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          padding: "6px 0",
          borderBottom: "1px solid #eee",
          fontSize: 13,
        }}
      >
        <span>{step[9] || step[0]}</span>
        <span style={{ color: "#888", whiteSpace: "nowrap" }}>{step[5]}</span>
      </div>
    ))}
  </div>
  );
};

// Detailed, leg-by-leg breakdown for one transit itinerary.
const RouteBreakdown = ({ legs = [] }) => {
  const { t } = useTranslation();
  return (
  <div style={{ textAlign: "left", maxWidth: 440, margin: "0 auto" }}>
    {legs.map((leg, i) => {
      const p = getLegPresentation(leg);
      return (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <Badge presentation={p} />
          <div style={{ flex: 1, fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{p.title}</div>
            {p.subtitle && <div style={{ color: "#666" }}>{p.subtitle}</div>}
          </div>
          <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
            {t("route.minutes", { count: legMinutes(leg) })}
          </span>
        </div>
      );
    })}
  </div>
  );
};

export default RouteBreakdown;
