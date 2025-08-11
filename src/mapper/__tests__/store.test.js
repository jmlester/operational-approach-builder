import { describe, it, expect } from 'vitest'
import { useOAStore } from '../store'

describe('soft delete & restore', () => {
  it('soft-deletes a phase and unassigns links', () => {
    const s = useOAStore.getState()
    s.addEffect(); s.addTask()
    const phId = useOAStore.getState().phases[0].id
    const eff = useOAStore.getState().effects.at(-1)
    const tsk = useOAStore.getState().tasks.at(-1)
    expect(eff.phaseId).toBe(phId)
    expect(tsk.phaseId).toBe(phId)
    s.softDelete({ type:'phase', id:phId, name:'Phase 1' })
    const st = useOAStore.getState()
    expect(st.phases.find(p=>p.id===phId)).toBeFalsy()
    expect(st.effects.at(-1).phaseId).toBe('')
    expect(st.tasks.at(-1).phaseId).toBe('')
    expect(st.trash.length).greaterThan(0)
  })

  it('restores an effect from trash', () => {
    const s = useOAStore.getState()
    s.addEffect()
    const e = useOAStore.getState().effects.at(-1)
    s.softDelete({ type:'effect', id:e.id, text:e.text, loeId:e.loeId })
    const trashId = useOAStore.getState().trash.at(-1).id
    s.restoreFromTrash(trashId)
    expect(useOAStore.getState().effects.find(x=>x.id===e.id)).toBeTruthy()
  })

  it('purges a trash item', () => {
    const s = useOAStore.getState()
    s.addTask()
    const t = useOAStore.getState().tasks.at(-1)
    s.softDelete({ type:'task', id:t.id, text:t.text })
    const trashId = useOAStore.getState().trash.at(-1).id
    s.purgeTrashItem(trashId)
    expect(useOAStore.getState().trash.find(x=>(x.id===trashId))).toBeFalsy()
  })
})
