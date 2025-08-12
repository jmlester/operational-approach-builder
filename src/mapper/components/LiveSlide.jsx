import React from 'react';

export default function LiveSlide({
  title, problem, currentOE, desiredConditions, militaryEndState,
  phases, loes, dps, riskGrid, toggles
}) {
  return (
    <div className="live-card">
      <div className="live-header">
        <h2>{title}</h2>
        {toggles.legend && (
          <div className="legend">
            <span className="pill pill-obj">Objective</span>
            <span className="pill pill-loe">Line of Effort</span>
            <span className="pill pill-task">Task</span>
            <span className="pill pill-risk">Operational Risk</span>
            <span className="pill pill-dp">Decisive Point</span>
          </div>
        )}
      </div>

      <div className="live-top">
        <div className="note"><strong>Problem:</strong> {problem}</div>
        <div className="note"><strong>Current OE:</strong> {currentOE}</div>
        {toggles.desiredConditions && (
          <div className="note"><strong>Desired Conditions:</strong> {desiredConditions}</div>
        )}
        {toggles.militaryEndState && (
          <div className="note"><strong>Military End State:</strong> {militaryEndState}</div>
        )}
      </div>

      {/* Phases – responsive, no overlap */}
      <div className="phase-grid">
        {phases.map(p => (
          <div key={p.id} className="phase-col">
            <div className="phase-header">
              <div>{p.name}</div>
              <div className="window">{p.window}</div>
            </div>
            {loes.map(loe => (
              <div key={`${p.id}-${loe.id}`} className="loe-lane">
                <div className="loe-title">{loe.name}</div>
                {/* You can render effects/tasks here by phase later if needed */}
                <div className="lane-canvas">—</div>
              </div>
            ))}
            {toggles.dp && (
              <div className="dp-strip">
                {(dps || []).filter(d => d.phaseId === p.id).map(d => (
                  <div className="dp-chip" key={d.id}>{d.title}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {toggles.risks && (
        <div className="risk-block">
          <h3>Risk Heatmap</h3>
          <div className="risk-grid">
            {riskGrid.map((row, li) => (
              <div className="risk-row" key={`L${li+1}`}>
                {row.map((cell, ii) => (
                  <div className="risk-cell" key={`L${li+1}-I${ii+1}`}>
                    {cell ? cell : '—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
