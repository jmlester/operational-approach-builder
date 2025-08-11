import { create } from 'zustand'

const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,9)}`

const initial = {
  phases: [{id:uid('PH'), name:'Phase 1', subtitle:'D+0–D+30'}],
  objectives: [{id:uid('OBJ'), text:'Restore territorial integrity', moes:''}],
  loes: [{id:uid('LOE'), title:'Maritime Control', notes:''}],
  effects: [], tasks: [], dp: [], assumptions: [], ccir: [],
  resources: { liftHours:0, isrOrbits:0, logisticsThroughput:'amber', authorities:'standard' },
  problemStatement:'', currentOE:'• Key facts', commsStrategy:'',

  trash: [], // soft-deleted items
  undoStack: [], // for quick undo
}

const pushUndo = (get,set,action) => {
  const snapshot = JSON.parse(JSON.stringify(get()))
  set({ undoStack: [...get().undoStack, snapshot] })
  action()
}

export const useOAStore = create((set,get)=> ({
  ...initial,

  reset: () => set(JSON.parse(JSON.stringify(initial))),

  takeSnapshot: ()=> set({ _snapshot: JSON.parse(JSON.stringify(get())) }),

  addPhase: ()=> pushUndo(get,set, ()=> set(s=> ({ phases:[...s.phases,{id:uid('PH'), name:`Phase ${s.phases.length+1}`, subtitle:''}] }))),

  softDelete: (item) => {
    const type = item.type; const id = item.id
    pushUndo(get,set, ()=> {
      const s = get()
      const trashItem = { ...item, deletedAt: Date.now() }
      const trash = [...s.trash, trashItem]
      // detach links depending on type
      let next = {}
      if(type==='phase'){
        next.phases = s.phases.filter(p=>p.id!==id)
        next.effects = s.effects.map(e=> e.phaseId===id?{...e, phaseId:''}:e)
        next.tasks = s.tasks.map(t=> t.phaseId===id?{...t, phaseId:''}:t)
        next.dp = s.dp.map(d=> d.phaseId===id?{...d, phaseId:''}:d)
      } else if(type==='objective'){
        next.objectives = s.objectives.filter(o=>o.id!==id)
        next.effects = s.effects.map(e=> ({...e, objectives:(e.objectives||[]).filter(oid=>oid!==id)}))
      } else if(type==='loe'){
        next.loes = s.loes.filter(l=>l.id!==id)
        next.effects = s.effects.map(e=> e.loeId===id?{...e, loeId:''}:e)
      } else if(type==='effect'){
        next.effects = s.effects.filter(e=>e.id!==id)
        next.tasks = s.tasks.map(t=> t.effectId===id?{...t, effectId:''}:t)
      } else if(type==='task'){
        next.tasks = s.tasks.filter(t=>t.id!==id)
      }
      set({ ...next, trash })
    })
  },

  restoreFromTrash: (trashId) => {
    pushUndo(get,set, ()=> {
      const s = get()
      const t = s.trash.find(x=>x.trashId===trashId || x.id===trashId)
      if(!t) return
      const keep = s.trash.filter(x=> (x.trashId||x.id)!== (t.trashId||t.id))
      // naive restore: append back to its collection
      if(t.type==='phase') set({ phases:[...s.phases, {id:t.id, name:t.name, subtitle:t.subtitle}], trash:keep })
      if(t.type==='objective') set({ objectives:[...s.objectives, {id:t.id, text:t.text, moes:t.moes}], trash:keep })
      if(t.type==='loe') set({ loes:[...s.loes, {id:t.id, title:t.title, notes:t.notes}], trash:keep })
      if(t.type==='effect') set({ effects:[...s.effects, {id:t.id, loeId:t.loeId||'', text:t.text, objectives:t.objectives||[], phaseId:t.phaseId||'', moes:t.moes||''}], trash:keep })
      if(t.type==='task') set({ tasks:[...s.tasks, {id:t.id, effectId:t.effectId||'', text:t.text, phaseId:t.phaseId||'', mops:t.mops||'', risk:t.risk||{}}], trash:keep })
    })
  },

  purgeTrashItem: (trashId) => pushUndo(get,set, ()=> set(s=> ({ trash: s.trash.filter(x=> (x.trashId||x.id)!==trashId) }))),

  undo: () => {
    const s = get()
    const prev = s.undoStack.pop()
    if(prev) set({ ...prev, undoStack: s.undoStack })
  },

  // Creator helpers
  addObjective: ()=> pushUndo(get,set, ()=> set(s=> ({ objectives:[...s.objectives,{id:uid('OBJ'), text:'', moes:''}] }))),

  addLoe: ()=> pushUndo(get,set, ()=> set(s=> ({ loes:[...s.loes,{id:uid('LOE'), title:'', notes:''}] }))),

  addEffect: ()=> pushUndo(get,set, ()=> set(s=> ({ effects:[...s.effects,{id:uid('EFF'), loeId:s.loes[0]?.id||'', text:'', objectives:[], phaseId:s.phases[0]?.id||'', moes:''}] }))),

  addTask: ()=> pushUndo(get,set, ()=> set(s=> ({ tasks:[...s.tasks,{id:uid('TSK'), effectId:s.effects[0]?.id||'', text:'', phaseId:s.phases[0]?.id||'', mops:'', risk:{likelihood:1, impact:1}}] }))),
}))
