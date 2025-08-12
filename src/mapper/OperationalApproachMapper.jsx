import React, { useMemo, useRef, useState } from 'react';
import { OAMContext } from './OAMContext';
import BuilderPanel from './components/BuilderPanel';
import LiveOperationalApproach from './components/LiveOperationalApproach';

const defaultPhases = [
  { id: 'p1', name: 'Phase 1', window: 'D+0–D+30' },
  { id: 'p2', name: 'Phase 2', window: 'D+31–D+60' },
  { id: 'p3', name: 'Phase 3', window: 'D+61–D+90' }
];

const defaultLOEs = [
  { id: 'l1', name: 'Maritime Interdiction' },
  { id: 'l2', name: 'Coastal Defense' },
  { id: 'l3', name: 'Air Superiority' },
  { id: 'l4', name: 'Coalition Force Integration' }
];

const emptyBoard = (phases, loes) => {
  const board = {};
  phases.forEach(p => {
    board[p.id] = {};
    loes.forEach(l => (board[p.id][l.id] = []));
  });
  return board;
};

export default function OperationalApproachMapper() {
  const [title, setTitle] = useState('Operational Approach (Live)');
  const [problem, setProblem] = useState('');
  const [currentOE, setCurrentOE] = useState('');
  const [desiredConditions, setDesiredConditions] = useState('');
  const [militaryEndState, setMilitaryEndState] = useState('');

  const [phases, setPhases] = useState(defaultPhases);
  const [loes, setLoe] = useState(defaultLOEs);
  const [board, setBoard] = useState(() => emptyBoard(defaultPhases, defaultLOEs));

  const [decisivePoints, setDP] = useState([
    { id: 'dp1', text: 'Neutralization of Redland A2/AD', phaseId: 'p1' },
    { id: 'dp2', text: 'Establishment of Coalition C2', phaseId: 'p2' }
  ]);

  const [risks, setRisks] = useState([]);

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
    setTitle(obj.title || '');
    setProblem(obj.problem || '');
    setCurrentOE(obj.currentOE || '');
    setDesiredConditions(obj.desiredConditions || '');
    setMilitaryEndState(obj.militaryEndState || '');
    setPhases(obj.phases?.length ? obj.phases : defaultPhases);
    setLoe(obj.loes?.length ? obj.loes : defaultLOEs);
    setBoard(obj.board || emptyBoard(obj.phases || defaultPhases, obj.loes || defaultLOEs));
    setDP(obj.decisivePoints || []);
    setRisks(obj.risks || []);
  };

  const addPhase = () => {
    const id = crypto.randomUUID();
    const p = { id, name: `Phase ${phases.length + 1}`, window: '—' };
    const next = [...phases, p];
    const nextBoard = { ...board, [id]: {} };
    loes.forEach(l => (nextBoard[id][l.id] = []));
    setPhases(next);
    setBoard(nextBoard);
  };

  const removePhase = (pid) => {
    const next = phases.filter(p => p.id !== pid);
    const nextBoard = { ...board };
    delete nextBoard[pid];
    setPhases(next);
    setBoard(nextBoard);
    setDP(dps => dps.filter(d => d.phaseId !== pid));
  };

  const addLoe = () => {
    const id = crypto.randomUUID();
    const l = { id, name: `LOE ${loes.length + 1}` };
    const next = [...loes, l];
    const nextBoard = structuredClone(board);
    Object.keys(nextBoard).forEach(pid => (nextBoard[pid][id] = []));
    setLoe(next);
    setBoard(nextBoard);
  };

  const removeLoe = (lid) => {
    const next = loes.filter(l => l.id !== lid);
    const nextBoard = structuredClone(board);
    Object.keys(nextBoard).forEach(pid => delete nextBoard[pid][lid]);
    setLoe(next);
    setBoard(nextBoard);
  };

  const addBullet = (pid, lid) => {
    const text = prompt('Add task/effect text:');
    if (!text) return;
    setBoard(b => {
      const nb = structuredClone(b);
      nb[pid][lid].push(text);
      return nb;
    });
  };

  const editBullet = (pid, lid, idx) => {
    const current = board[pid][lid][idx] ?? '';
    const text = prompt('Edit text:', current);
    if (text === null) return;
    setBoard(b => {
      const nb = structuredClone(b);
      nb[pid][lid][idx] = text;
      return nb;
    });
  };

  const deleteBullet = (pid, lid, idx) => {
    setBoard(b => {
      const nb = structuredClone(b);
      nb[pid][lid].splice(idx, 1);
      return nb;
    });
  };

  const addRisk = () => {
    const label = prompt('Risk label:');
    if (!label) return;
    const likelihood = Number(prompt('Likelihood (1–5):', '3')) || 3;
    const impact = Number(prompt('Impact (1–5):', '3')) || 3;
    setRisks(r => [...r, { id: crypto.randomUUID(), label, likelihood, impact }]);
  };

  const onHeatCellClick = (row, col) => {
    const existing = risks.find(r => r.likelihood === row && r.impact === col);
    if (existing) {
      const nextLabel = prompt('Edit risk label (blank to delete):', existing.label ?? '');
      if (nextLabel === null) return;
      if (nextLabel.trim() === '') {
        setRisks(rs => rs.filter(r => r.id !== existing.id));
      } else {
        setRisks(rs => rs.map(r => (r.id === existing.id ? { ...r, label: nextLabel } : r)));
      }
    } else {
      const label = prompt(`Add risk @ L${row}/I${col}:`);
      if (!label) return;
      setRisks(rs => [...rs, { id: crypto.randomUUID(), label, likelihood: row, impact: col }]);
    }
  };

  const ctxValue = {
    title, setTitle,
    problem, setProblem,
    currentOE, setCurrentOE,
    desiredConditions, setDesiredConditions,
    militaryEndState, setMilitaryEndState,
    phases, setPhases,
    loes, setLoe,
    board, setBoard,
    decisivePoints, setDP,
    risks, setRisks,
    stateToExport, importJSON,
    addPhase, removePhase,
    addLoe, removeLoe,
    addBullet, editBullet, deleteBullet,
    addRisk,
    onHeatCellClick,
    fileRef,
  };

  return (
    <OAMContext.Provider value={ctxValue}>
      <div className="oam-shell">
        <BuilderPanel />
        <LiveOperationalApproach />
      </div>
    </OAMContext.Provider>
  );
}
