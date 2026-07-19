import React from "react";
import { useTranslation } from "react-i18next";
import "./RouteLegend.css";

const RouteLegend = () => {
  const { t } = useTranslation();
  return (
    <div className="lines-container">
      <div className="line">
        <span className="line-bar red"></span>
        <span className="line-text">{t("legend.left")}</span>
      </div>
      <div className="line">
        <span className="line-bar blue"></span>
        <span className="line-text">{t("legend.right")}</span>
      </div>
      <div className="line">
        <span className="line-bar grey"></span>
        <span className="line-text">{t("legend.underground")}</span>
      </div>
    </div>
  );
};

export default RouteLegend;
