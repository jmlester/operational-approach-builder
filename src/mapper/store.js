import { create } from 'zustand'
import example from '../../example_data/initial_example.json'

const uid = (p='id') => `${p}_${Math.random().toString(36).slice(2,9)}`

const decorate = (data) => ({
  ...data,
  trash: [], undoStack: [], showTrash:false,
  // safety defaults if example is missing any field
  phases: data.phases?.length ? data.phases : [{id:uid('PH'), name:'Phase 1', subtitle:''}],
  objectives: data.objectives||[],
  loes: data.loes||[],
  effects: data.effects||[],
  tasks: data.tasks||[],
  dp: data.decisivePoints||[],
  assumptions: data.assumptions||[],
  ccir: data.ccir||[],
  resources: data.resources || { liftHours:0, isrOrbits:0, logisticsThroughput:'amber', authorities:'standard' },
  problemStatement: data.problemStatement||'',
  currentOE: data.currentOE||'',
  commsStrategy: data.commsStrategy||'',
})

function loadInitial(){
  try{
    const saved = localStorage.getItem('oa_state_v1')
    if(saved){ return JSON.parse(saved) }
  }catch{ /* ignore */ }
  return decorate(example)
}

export const useOAStore = create((set,get)=> ({
  ...loadInitial(),

  save(){ try{ localStorage.setItem('oa_state_v1', JSON.stringify(get())) }catch{} },

  undo(){ const s=get(); const prev=s.undoStack.pop(); if(prev) set({...prev, undoStack:s.undoStack}) },
  _pushUndo(fn){ const ss=JSON.parse(JSON.stringify(get())); set({undoStack:[...get().undoStack, ss]}); fn(); get().save() },

  addPhase(){ get()._pushUndo(()=> set(s=> ({ phases:[...s.phases,{id:uid('PH'), name:`Phase ${s.phases.length+1}`, subtitle:''}] }))) },
  addObjective(){ get()._pushUndo(()=> set(s=> ({ objectives:[...s.objectives,{id:uid('OBJ'), text:'', moes:''}] }))) },
  addLoe(){ get()._pushUndo(()=> set(s=> ({ loes:[...s.loes,{id:uid('LOE'), title:'', notes:''}] }))) },
  addEffect(){ get()._pushUndo(()=> set(s=> ({ effects:[...s.effects,{id:uid('EFF'), loeId:s.loes[0]?.id||'', text:'', objectives:[], phaseId:s.phases[0]?.id||'', moes:''}] }))) },
  addTask(){ get()._pushUndo(()=> set(s=> ({ tasks:[...s.tasks,{id:uid('TSK'), effectId:s.effects[0]?.id||'', text:'', phaseId:s.phases[0]?.id||'', mops:'', risk:{likelihood:1, impact:1}}] }))) },

  softDelete({type, ...entity}){
    get()._pushUndo(()=> {
      const s = get()
      const trash = [...s.trash, { type, ...entity, deletedAt: Date.now() }]
      if(type==='phase'){
        set({
          phases: s.phases.filter(p=>p.id!==entity.id),
          effects: s.effects.map(e=> e.phaseId===entity.id?{...e, phaseId:''}:e),
          tasks:   s.tasks.map(t=> t.phaseId===entity.id?{...t, phaseId:''}:t),
          dp:      s.dp.map(d=> d.phaseId===entity.id?{...d, phaseId:''}:d),
          trash
        })
      } else if(type==='objective'){
        set({
          objectives: s.objectives.filter(o=>o.id!==entity.id),
          effects: s.effects.map(e=> ({...e, objectives:(e.objectives||[]).filter(oid=>oid!==entity.id)})),
          trash
        })
      } else if(type==='loe'){
        set({
          loes: s.loes.filter(l=>l.id!==entity.id),
          effects: s.effects.map(e=> e.loeId===entity.id?{...e, loeId:''}:e),
          trash
        })
      } else if(type==='effect'){
        set({
          effects: s.effects.filter(e=>e.id!==entity.id),
          tasks: s.tasks.map(t=> t.effectId===entity.id?{...t, effectId:''}:t),
          trash
        })
      } else if(type==='task'){
        set({ tasks: s.tasks.filter(t=>t.id!==entity.id), trash })
      }
    })
  },

  restoreFromTrash(id){
    get()._pushUndo(()=> {
      const s = get()
      const t = s.trash.find(x=>x.id===id)
      if(!t) return
      const keep = s.trash.filter(x=>x.id!==id)
      if(t.type==='phase') set({ phases:[...s.phases, {id:t.id,name:t.name,subtitle:t.subtitle}], trash:keep })
      if(t.type==='objective') set({ objectives:[...s.objectives, {id:t.id,text:t.text,moes:t.moes}], trash:keep })
      if(t.type==='loe') set({ loes:[...s.loes, {id:t.id,title:t.title,notes:t.notes}], trash:keep })
      if(t.type==='effect') set({ effects:[...s.effects, {id:t.id, loeId:t.loeId||'', text:t.text, objectives:t.objectives||[], phaseId:t.phaseId||'', moes:t.moes||''}], trash:keep })
      if(t.type==='task') set({ tasks:[...s.tasks, {id:t.id, effectId:t.effectId||'', text:t.text, phaseId:t.phaseId||'', mops:t.mops||'', risk:t.risk||{}}], trash:keep })
    })
  },

  purgeTrashItem(id){ get()._pushUndo(()=> set(s=> ({ trash: s.trash.filter(x=> x.id!==id) }))) },
}))
