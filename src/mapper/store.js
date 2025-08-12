// src/mapper/store.js
// Centralized normalization + import/export helpers for the Operational Approach state

export const initialState = {
  problemStatement: "",
  currentOE: "",
  desiredConditions: [],
  endState: "",
  phases: [],
  objectives: [],
  loes: [],
  effects: [],
  tasks: [],
  dp: [],
  cogs: {
    friendly: { cog: "", cc: [], cr: [], cv: [] },
    adversary: { cog: "", cc: [], cr: [], cv: [] },
  },
  opRisks: [],
  visibility: {
    showCurrentOE: true,
    showCOGs: true,
    showDesiredConditions: true,
    showDPs: true,
    showObjectives: true,
    showEndState: true,
    showLegend: true,
    showRiskHeatmap: true,
    showComms: true,
  },
  commsStrategy: "",
};

// ---- utilities ----

const clamp15 = (n) => Math.max(1, Math.min(5, n));

const toScore = (v) => {
  if (v == null) return 1;
  if (typeof v === "number" && Number.isFinite(v)) return clamp15(v);
  const m = String(v).trim().toLowerCase();
  const lut = {
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    low: 1, med: 3, medium: 3, high: 4, critical: 5, crit: 5,
  };
  const num = lut[m] ?? Number(m);
  return clamp15(Number.isFinite(num) ? num : 1);
};

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const uniqById = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const id = x?.id ?? x?.title ?? x?.text;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// ---- NORMALIZER ----

export function normalize(data = {}) {
  // Desired conditions can be strings or objects
  const desiredConditions = Array.isArray(data.desiredConditions)
    ? data.desiredConditions.map((d, i) =>
        typeof d === "string" ? { id: `DC_${i}`, text: d } : { id: d.id ?? `DC_${i}`, text: d.text ?? "" }
      )
    : [];

  // LOEs must be unique and ordered; remove blanks
  const loes = uniqById(
    asArray(data.loes)
      .map((l, i) => ({
        id: l.id ?? `LOE_${i + 1}`,
        title: (l.title ?? l.name ?? "").trim() || `LOE ${i + 1}`,
        notes: l.notes ?? "",
      }))
      .filter((l) => l.title)
  );

  // Effects: ensure loe linkage is valid; drop orphaned effects
  const loeIds = new Set(loes.map((l) => l.id));
  const effects = uniqById(
    asArray(data.effects)
      .map((e, i) => ({
        id: e.id ?? `EFF_${i + 1}`,
        loeId: e.loeId && loeIds.has(e.loeId) ? e.loeId : null,
        text: (e.text ?? e.name ?? "").trim(),
        objectives: asArray(e.objectives),
        phaseId: e.phaseId ?? null,
        moes: e.moes ?? "",
        cogRef: e.cogRef ?? null,
      }))
      .filter((e) => e.text && e.loeId)
  );

  // Tasks: ensure effect linkage is valid; drop orphaned tasks
  const effIds = new Set(effects.map((e) => e.id));
  const tasks = uniqById(
    asArray(data.tasks)
      .map((t, i) => ({
        id: t.id ?? `TSK_${i + 1}`,
        effectId: t.effectId && effIds.has(t.effectId) ? t.effectId : null,
        text: (t.text ?? t.name ?? "").trim(),
        phaseId: t.phaseId ?? null,
        mops: t.mops ?? "",
        // Explicitly remove any "risk" fields from tasks (risks live only in opRisks)
      }))
      .filter((t) => t.text && t.effectId)
  );

  // Phases
  const phases = uniqById(
    asArray(data.phases).map((p, i) => ({
      id: p.id ?? `PH_${i + 1}`,
      name: (p.name ?? `Phase ${i + 1}`).trim(),
      subtitle: p.subtitle ?? p.timeHorizon ?? "",
      color: p.color ?? "",
      order: Number.isFinite(p.order) ? p.order : i,
    }))
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Objectives
  const objectives = uniqById(
    asArray(data.objectives).map((o, i) => ({
      id: o.id ?? `OBJ_${i + 1}`,
      text: (o.text ?? o.name ?? "").trim(),
      moes: o.moes ?? "",
    }))
  ).filter((o) => o.text);

  // DPs
  const dp = uniqById(
    asArray(data.dp).map((d, i) => ({
      id: d.id ?? `DP_${i + 1}`,
      text: (d.text ?? d.name ?? "").trim(),
      phaseId: d.phaseId ?? null,
      loeId: d.loeId && loeIds.has(d.loeId) ? d.loeId : null,
      effectId: d.effectId && effIds.has(d.effectId) ? d.effectId : null,
    }))
  ).filter((d) => d.text);

  // COGs
  const cogs = {
    friendly: {
      cog: data.cogs?.friendly?.cog ?? "",
      cc: asArray(data.cogs?.friendly?.cc),
      cr: asArray(data.cogs?.friendly?.cr),
      cv: asArray(data.cogs?.friendly?.cv),
    },
    adversary: {
      cog: data.cogs?.adversary?.cog ?? "",
      cc: asArray(data.cogs?.adversary?.cc),
      cr: asArray(data.cogs?.adversary?.cr),
      cv: asArray(data.cogs?.adversary?.cv),
    },
  };

  // Operational risks: accept strings or numbers; clamp; fill ids
  const opRisks = uniqById(
    asArray(data.opRisks).map((r, i) => ({
      id: r.id ?? `R_${i + 1}`,
      title: (r.title ?? r.name ?? "").trim() || `Risk ${i + 1}`,
      description: r.description ?? "",
      owner: r.owner ?? "",
      mitigation: r.mitigation ?? "",
      likelihood: toScore(r.likelihood),
      impact: toScore(r.impact),
      loeId: r.loeId && loeIds.has(r.loeId) ? r.loeId : null,
      phaseId: r.phaseId ?? null,
    }))
  );

  // Visibility toggles
  const visibility = {
    ...initialState.visibility,
    ...(typeof data.visibility === "object" ? data.visibility : {}),
  };

  return {
    problemStatement: data.problemStatement ?? "",
    currentOE: data.currentOE ?? "",
    desiredConditions,
    endState: data.endState ?? data.militaryEndState ?? "",
    phases,
    objectives,
    loes,
    effects,
    tasks,
    dp,
    cogs,
    opRisks,
    visibility,
    commsStrategy: data.commsStrategy ?? "",
  };
}

// ---- IMPORT/EXPORT ----

export async function importFromFile(file) {
  const text = await file.text();
  const raw = JSON.parse(text);
  return normalize(raw);
}

export function exportToBlob(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  return blob;
}
