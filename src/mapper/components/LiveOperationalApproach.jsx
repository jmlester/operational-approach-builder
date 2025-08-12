import React from 'react';
import { useOAM } from '../OAMContext';
import RiskMatrix2 from './RiskMatrix2';

export default function LiveOperationalApproach() {
  const {
    title,
    problem,
    currentOE,
    desiredConditions,
    militaryEndState,
    phases,
    loes,
    board,
    decisivePoints,
    risks,
    editBullet,
    deleteBullet,
    addBullet,
    onHeatCellClick,
  } = useOAM();

  return (
    <div className="oam-live">
      <div className="live-h">
        <div className="live-title">{title}</div>
        <div className="chiprow">
          <span className="chip">Objective</span>
          <span className="chip">Line of Effort</span>
          <span className="chip">Task</span>
          <span className="chip chip-warn">Decisive Point</span>
          <span className="chip chip-risk">Operational Risk</span>
        </div>
      </div>

      <div className="live-overview">
        <div className="box">
          <div className="box-h">Problem</div>
          <div className="box-b">{problem || '—'}</div>
        </div>
        <div className="box">
          <div className="box-h">Current OE</div>
          <div className="box-b">{currentOE || '—'}</div>
        </div>
        <div className="box">
          <div className="box-h">Desired Conditions</div>
          <div className="box-b">{desiredConditions || '—'}</div>
        </div>
        <div className="box">
          <div className="box-h">Military End State</div>
          <div className="box-b">{militaryEndState || '—'}</div>
        </div>
      </div>

      <div className="board">
        {phases.map(p => (
          <div key={p.id} className="col">
            <div className="col-h">
              <div className="col-title">{p.name}</div>
              <div className="col-sub">{p.window}</div>
              <div className="dps">
                {decisivePoints
                  .filter(d => d.phaseId === p.id)
                  .map(d => (
                    <span key={d.id} className="chip chip-warn small">
                      {d.text}
                    </span>
                  ))}
              </div>
            </div>

            {loes.map(l => (
              <div key={l.id} className="cell">
                <div className="cell-h">{l.name}</div>
                <div className="cell-body">
                  {board[p.id][l.id].length === 0 && <div className="placeholder">—</div>}
                  {board[p.id][l.id].map((t, idx) => (
                    <div key={`${l.id}-${idx}`} className="bullet">
                      <span className="dot">•</span>
                      <span className="text" onClick={() => editBullet(p.id, l.id, idx)} title="Click to edit">
                        {t}
                      </span>
                      <button className="x" title="Delete" onClick={() => deleteBullet(p.id, l.id, idx)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cell-actions">
                  <button className="btn tiny" onClick={() => addBullet(p.id, l.id)}>+ Task / Effect</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="heatmap-wrap">
        <div className="section-h">Risk Heatmap</div>
        <RiskMatrix2 risks={risks} onCellClick={onHeatCellClick} />
      </div>
    </div>
  );
}
