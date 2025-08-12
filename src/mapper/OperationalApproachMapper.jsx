import React, { useEffect, useMemo, useRef, useState } from "react";
import RiskMatrix2 from "./components/RiskMatrix2";

/**
 * Simple shape of the app's data.
 */
const defaultPhases = [
  { id: "p1", name: "Phase 1", window: "D+0–D+30" },
  { id: "p2", name: "Phase 2", window: "D+31–D+60" },
  { id: "p3", name: "Phase 3", window: "D+61–D+90" }
];

const defaultLOEs = [
  { id: "l1", name: "Maritime Interdiction" },
  { id: "l2", name: "Coastal Defense" },
  { id: "l3", name: "Air Superiority" },
  { id: "l4", name: "Coalition Force Integration" }
];

const emptyBoard = (phases, loes) => {
  // board[phaseId][loeId] -> array of strings (bullets)
  const board = {};
  phases.forEach((p) => {
    board[p.id] = {};
    loes.forEach((l) => (board[p.id][l.id] = []));
  });
  return board;
};

const defaultRisks = [
  // { id, label, likelihood:1..5, impact:1..5 }
];

export default function OperationalApproachMapper() {
  // Top inputs
  const [title, setTitle] = useState("Operational Approach (Live)");
  const [problem, setProblem] = useState("");
  const [currentOE, setCurrentOE] = useState("");
  const [desiredConditions, setDesiredConditions] = useState("");
  const [militaryEndState, setMilitaryEndState] = useState("");

  // Structure
  const [phases, setPhases] = useState(defaultPhases);
  const [loes, setLoe] = useState(defaultLOEs);
  const [board, setBoard] = useState(() => emptyBoard(defaultPhases, defaultLOEs));

  // Decisive points (each mapped to a phase id)
  const [decisivePoints, setDP] = useState([
    { id: "dp1", text: "Neutralization of Redland A2/AD", phaseId: "p1" },
    { id: "dp2", text: "Establishment of Coalition C2", phaseId: "p2" }
  ]);

  // Risks (drive the heatmap)
  const [risks, setRisks] = useState(defaultRisks);

  // Import / export
  const fileRef = useRef(null);

  const stateToExport = useMemo(
    () => ({
      title,
      problem,
      currentOE,
      desiredConditions,
      militaryEndState,
      phases,
      loes,
      board,
      decisivePoints,
      risks
    }),
    [title, problem, currentOE, desiredConditions, militaryEndState, phases, loes, board, decisivePoints, risks]
  );

  const importJSON = (obj) => {
    if (!obj) return;
    setTitle(obj.title || "");
    setProblem(obj.problem || "");
    setCurrentOE(obj.currentOE || "");
    setDesiredConditions(obj.desiredConditions || "");
    setMilitaryEndState(obj.militaryEndState || "");
    setPhases(obj.phases?.length ? obj.phases : defaultPhases);
    setLoe(obj.loes?.length ? obj.loes : defaultLOEs);
    setBoard(obj.board || emptyBoard(obj.phases || defaultPhases, obj.loes || defaultLOEs));
    setDP(obj.decisivePoints || []);
    setRisks(obj.risks || []);
  };

  // helpers
  const addPhase = () => {
    const id = crypto.randomUUID();
    const p = { id, name: `Phase ${phases.length + 1}`, window: "—" };
    const next = [...phases, p];
    // expand board
    const nextBoard = { ...board, [id]: {} };
    loes.forEach((l) => (nextBoard[id][l.id] = []));
    setPhases(next);
    setBoard(nextBoard);
  };

  const removePhase = (pid) => {
    const next = phases.filter((p) => p.id !== pid);
    const nextBoard = { ...board };
    delete nextBoard[pid];
    setPhases(next);
    setBoard(nextBoard);
    setDP((dps) => dps.filter((d) => d.phaseId !== pid));
  };

  const addLoe = () => {
    const id = crypto.randomUUID();
    const l = { id, name: `LOE ${loes.length + 1}` };
    const next = [...loes, l];
    const nextBoard = structuredClone(board);
    Object.keys(nextBoard).forEach((pid) => (nextBoard[pid][id] = []));
    setLoe(next);
    setBoard(nextBoard);
  };

  const removeLoe = (lid) => {
    const next = loes.filter((l) => l.id !== lid);
    const nextBoard = structuredClone(board);
    Object.keys(nextBoard).forEach((pid) => delete nextBoard[pid][lid]);
    setLoe(next);
    setBoard(nextBoard);
  };

  const addBullet = (pid, lid) => {
    const text = prompt("Add task/effect text:");
    if (!text) return;
    setBoard((b) => {
      const nb = structuredClone(b);
      nb[pid][lid].push(text);
      return nb;
    });
  };

  const editBullet = (pid, lid, idx) => {
    const current = board[pid][lid][idx] ?? "";
    const text = prompt("Edit text:", current);
    if (text === null) return;
    setBoard((b) => {
      const nb = structuredClone(b);
      nb[pid][lid][idx] = text;
      return nb;
    });
  };

  const deleteBullet = (pid, lid, idx) => {
    setBoard((b) => {
      const nb = structuredClone(b);
      nb[pid][lid].splice(idx, 1);
      return nb;
    });
  };

  const addRisk = () => {
    const label = prompt("Risk label:");
    if (!label) return;
    const likelihood = Number(prompt("Likelihood (1–5):", "3")) || 3;
    const impact = Number(prompt("Impact (1–5):", "3")) || 3;
    setRisks((r) => [...r, { id: crypto.randomUUID(), label, likelihood, impact }]);
  };

  const onHeatCellClick = (row, col) => {
    // quick ad‑hoc add/edit from heatmap click
    const existing = risks.find((r) => r.likelihood === row && r.impact === col);
    if (existing) {
      const nextLabel = prompt("Edit risk label (blank to delete):", existing.label ?? "");
      if (nextLabel === null) return;
      if (nextLabel.trim() === "") {
        setRisks((rs) => rs.filter((r) => r.id !== existing.id));
      } else {
        setRisks((rs) => rs.map((r) => (r.id === existing.id ? { ...r, label: nextLabel } : r)));
      }
    } else {
      const label = prompt(`Add risk @ L${row}/I${col}:`);
      if (!label) return;
      setRisks((rs) => [...rs, { id: crypto.randomUUID(), label, likelihood: row, impact: col }]);
    }
  };

  return (
    <div className="oam-shell">
      {/* CONTROL BAR */}
      <div className="oam-inputs">
        <div className="oam-row">
          <label>Slide Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="oam-row">
          <label>Problem Statement</label>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} />
        </div>

        <div className="oam-row">
          <label>Current OE</label>
          <textarea value={currentOE} onChange={(e) => setCurrentOE(e.target.value)} />
        </div>

        <div className="oam-row">
          <label>Desired Conditions</label>
          <textarea value={desiredConditions} onChange={(e) => setDesiredConditions(e.target.value)} />
        </div>

        <div className="oam-row">
          <label>Military End State</label>
          <textarea value={militaryEndState} onChange={(e) => setMilitaryEndState(e.target.value)} />
        </div>

        {/* Phases + LOEs */}
        <div className="oam-columns">
          <div className="card">
            <div className="card-h">
              <h4>Phases</h4>
              <button className="btn" onClick={addPhase}>+ Add Phase</button>
            </div>
            {phases.map((p) => (
              <div key={p.id} className="row-flex">
                <input
                  value={p.name}
                  onChange={(e) =>
                    setPhases((arr) => arr.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                  }
                  className="mr8"
                />
                <input
                  value={p.window}
                  onChange={(e) =>
                    setPhases((arr) => arr.map((x) => (x.id === p.id ? { ...x, window: e.target.value } : x)))
                  }
                  className="mr8"
                  placeholder="Timing window"
                />
                <button className="btn danger" onClick={() => removePhase(p.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h">
              <h4>Lines of Effort</h4>
              <button className="btn" onClick={addLoe}>+ Add LOE</button>
            </div>
            {loes.map((l) => (
              <div key={l.id} className="row-flex">
                <input
                  value={l.name}
                  onChange={(e) => setLoe((arr) => arr.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))}
                  className="mr8"
                />
                <button className="btn danger" onClick={() => removeLoe(l.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h">
              <h4>Decisive Points</h4>
              <button
                className="btn"
                onClick={() =>
                  setDP((dps) => [...dps, { id: crypto.randomUUID(), text: "New DP", phaseId: phases[0]?.id }])
                }
              >
                + Add DP
              </button>
            </div>
            {decisivePoints.map((d) => (
              <div key={d.id} className="row-flex">
                <input
                  value={d.text}
                  onChange={(e) =>
                    setDP((arr) => arr.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)))
                  }
                  className="mr8"
                />
                <select
                  value={d.phaseId}
                  onChange={(e) =>
                    setDP((arr) => arr.map((x) => (x.id === d.id ? { ...x, phaseId: e.target.value } : x)))
                  }
                  className="mr8"
                >
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button className="btn danger" onClick={() => setDP((arr) => arr.filter((x) => x.id !== d.id))}>×</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h">
              <h4>Operational Risks</h4>
              <button className="btn" onClick={addRisk}>+ Add Risk</button>
            </div>
            {risks.map((r) => (
              <div key={r.id} className="row-flex">
                <input
                  value={r.label}
                  onChange={(e) =>
                    setRisks((arr) => arr.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))
                  }
                  className="mr8"
                />
                <select
                  value={r.likelihood}
                  onChange={(e) =>
                    setRisks((arr) =>
                      arr.map((x) => (x.id === r.id ? { ...x, likelihood: Number(e.target.value) } : x))
                    )
                  }
                  className="mr8"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>L{n}</option>
                  ))}
                </select>
                <select
                  value={r.impact}
                  onChange={(e) =>
                    setRisks((arr) => arr.map((x) => (x.id === r.id ? { ...x, impact: Number(e.target.value) } : x)))
                  }
                  className="mr8"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>I{n}</option>
                  ))}
                </select>
                <button className="btn danger" onClick={() => setRisks((arr) => arr.filter((x) => x.id !== r.id))}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Import/Export */}
        <div className="oam-row gap8">
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "operational_approach.json";
              a.click();
            }}
          >
            Export JSON
          </button>
          <input
            type="file"
            ref={fileRef}
            accept="application/json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const text = await f.text();
                importJSON(JSON.parse(text));
              } catch (err) {
                alert("Invalid JSON.");
              } finally {
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>

      {/* LIVE VIEW – full width */}
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

        {/* Overview boxes */}
        <div className="live-overview">
          <div className="box">
            <div className="box-h">Problem</div>
            <div className="box-b">{problem || "—"}</div>
          </div>
          <div className="box">
            <div className="box-h">Current OE</div>
            <div className="box-b">{currentOE || "—"}</div>
          </div>
          <div className="box">
            <div className="box-h">Desired Conditions</div>
            <div className="box-b">{desiredConditions || "—"}</div>
          </div>
          <div className="box">
            <div className="box-h">Military End State</div>
            <div className="box-b">{militaryEndState || "—"}</div>
          </div>
        </div>

        {/* Phases x LOEs board */}
        <div className="board">
          {phases.map((p) => (
            <div key={p.id} className="col">
              <div className="col-h">
                <div className="col-title">{p.name}</div>
                <div className="col-sub">{p.window}</div>
                {/* DPs for this phase */}
                <div className="dps">
                  {decisivePoints
                    .filter((d) => d.phaseId === p.id)
                    .map((d) => (
                      <span key={d.id} className="chip chip-warn small">
                        {d.text}
                      </span>
                    ))}
                </div>
              </div>

              {loes.map((l) => (
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
                        <button
                          className="x"
                          title="Delete"
                          onClick={() => deleteBullet(p.id, l.id, idx)}
                        >
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

        {/* Risk Heatmap */}
        <div className="heatmap-wrap">
          <div className="section-h">Risk Heatmap</div>
          <RiskMatrix2 risks={risks} onCellClick={onHeatCellClick} />
        </div>
      </div>
    </div>
  );
}
