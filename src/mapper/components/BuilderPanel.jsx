import React from 'react';
import { useOAM } from '../OAMContext';

export default function BuilderPanel() {
  const {
    title, setTitle,
    problem, setProblem,
    currentOE, setCurrentOE,
    desiredConditions, setDesiredConditions,
    militaryEndState, setMilitaryEndState,
    phases, setPhases, addPhase, removePhase,
    loes, setLoe, addLoe, removeLoe,
    board, editBullet, deleteBullet, addBullet,
    decisivePoints, setDP,
    risks, setRisks, addRisk,
    stateToExport, importJSON,
    fileRef,
  } = useOAM();

  return (
    <div className="oam-inputs">
      <div className="oam-row">
        <label>Slide Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="oam-row">
        <label>Problem Statement</label>
        <textarea value={problem} onChange={e => setProblem(e.target.value)} />
      </div>

      <div className="oam-row">
        <label>Current OE</label>
        <textarea value={currentOE} onChange={e => setCurrentOE(e.target.value)} />
      </div>

      <div className="oam-row">
        <label>Desired Conditions</label>
        <textarea value={desiredConditions} onChange={e => setDesiredConditions(e.target.value)} />
      </div>

      <div className="oam-row">
        <label>Military End State</label>
        <textarea value={militaryEndState} onChange={e => setMilitaryEndState(e.target.value)} />
      </div>

      <div className="oam-columns">
        <div className="card">
          <div className="card-h">
            <h4>Phases</h4>
            <button className="btn" onClick={addPhase}>+ Add Phase</button>
          </div>
          {phases.map(p => (
            <div key={p.id} className="row-flex">
              <input
                value={p.name}
                onChange={e => setPhases(arr => arr.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}
                className="mr8"
              />
              <input
                value={p.window}
                onChange={e => setPhases(arr => arr.map(x => x.id === p.id ? { ...x, window: e.target.value } : x))}
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
          {loes.map(l => (
            <div key={l.id} className="row-flex">
              <input
                value={l.name}
                onChange={e => setLoe(arr => arr.map(x => x.id === l.id ? { ...x, name: e.target.value } : x))}
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
              onClick={() => setDP(dps => [...dps, { id: crypto.randomUUID(), text: 'New DP', phaseId: phases[0]?.id }])}
            >
              + Add DP
            </button>
          </div>
          {decisivePoints.map(d => (
            <div key={d.id} className="row-flex">
              <input
                value={d.text}
                onChange={e => setDP(arr => arr.map(x => x.id === d.id ? { ...x, text: e.target.value } : x))}
                className="mr8"
              />
              <select
                value={d.phaseId}
                onChange={e => setDP(arr => arr.map(x => x.id === d.id ? { ...x, phaseId: e.target.value } : x))}
                className="mr8"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button className="btn danger" onClick={() => setDP(arr => arr.filter(x => x.id !== d.id))}>×</button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-h">
            <h4>Operational Risks</h4>
            <button className="btn" onClick={addRisk}>+ Add Risk</button>
          </div>
          {risks.map(r => (
            <div key={r.id} className="row-flex">
              <input
                value={r.label}
                onChange={e => setRisks(arr => arr.map(x => x.id === r.id ? { ...x, label: e.target.value } : x))}
                className="mr8"
              />
              <select
                value={r.likelihood}
                onChange={e => setRisks(arr => arr.map(x => x.id === r.id ? { ...x, likelihood: Number(e.target.value) } : x))}
                className="mr8"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>L{n}</option>)}
              </select>
              <select
                value={r.impact}
                onChange={e => setRisks(arr => arr.map(x => x.id === r.id ? { ...x, impact: Number(e.target.value) } : x))}
                className="mr8"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>I{n}</option>)}
              </select>
              <button className="btn danger" onClick={() => setRisks(arr => arr.filter(x => x.id !== r.id))}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="oam-row gap8">
        <button
          className="btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(stateToExport, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'operational_approach.json';
            a.click();
          }}
        >
          Export JSON
        </button>
        <input
          type="file"
          ref={fileRef}
          accept="application/json"
          onChange={async e => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              importJSON(JSON.parse(text));
            } catch (err) {
              alert('Invalid JSON.');
            } finally {
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}
