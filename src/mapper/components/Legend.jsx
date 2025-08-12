import React from "react";
import "../live.css";

export default function Legend() {
  return (
    <div className="legend">
      <div className="legend__title">Legend</div>
      <ul className="legend__list">
        <li className="legend__item" key="lg-obj">
          <span className="legend__swatch legend__swatch--obj" />
          Objective
        </li>
        <li className="legend__item" key="lg-loe">
          <span className="legend__swatch legend__swatch--loe" />
          Line of Effort
        </li>
        <li className="legend__item" key="lg-eff">
          <span className="legend__swatch legend__swatch--eff" />
          Effect
        </li>
        <li className="legend__item" key="lg-task">
          <span className="legend__swatch legend__swatch--task" />
          Task
        </li>
        <li className="legend__item" key="lg-dp">
          <span className="legend__swatch legend__swatch--dp" />
          Decisive Point
        </li>
        <li className="legend__item" key="lg-risk">
          <span className="legend__swatch legend__swatch--risk" />
          Operational Risk
        </li>
      </ul>
    </div>
  );
}
