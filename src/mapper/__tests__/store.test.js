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
})
