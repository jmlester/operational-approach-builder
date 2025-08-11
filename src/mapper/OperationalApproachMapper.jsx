import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useOAStore } from './store.js'

function Button({children,onClick,variant='primary',title}){
  const cls = ['btn']
  if(variant==='primary') cls.push('primary')
  if(variant==='danger') cls.push('danger')
  if(variant==='ghost') cls.push('ghost')
  return <button type="button" className={cls.join(' ')} title={title} onClick={(e)=>{e.stopPropagation();onClick?.(e)}}>{children}</button>
}

function CopyModal({open,title,text,onClose}){
  const ref = useRef(null)
  useEffect(()=>{ if(open){ setTimeout(()=> ref.current?.focus(),150) } },[open])
  if(!open) return null
  return (
    <div className="copy-backdrop" role="dialog" aria-modal="true" aria-label="Copy Prompt">
      <div className="card" style={{width:720,maxWidth:'95%'}}>
        <div className="header"><strong>{title}</strong><button className="btn" onClick={onClose}>Close</button></div>
        <p className="small">Clipboard may be blocked. Use Select All + Copy, or download a .txt.</p>
        <textarea ref={ref} defaultValue={text} className="input" style={{height:280}} onFocus={(e)=>e.target.select()} />
        <div className="hstack" style={{marginTop:8}}>
          <Button variant="ghost" onClick={()=>{ ref.current?.select() }}>Select All</Button>
          <Button variant="ghost" onClick={()=>{ const blob=new Blob([text],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(title||'prompt')+'.txt'; a.click(); URL.revokeObjectURL(a.href);}}>Download .txt</Button>
          <Button variant="primary" onClick={async()=>{ try{ await navigator.clipboard.writeText(text); alert('Copied (if permitted)') } catch { alert('Blocked. Use Select All + Copy.') }}}>Try Clipboard</Button>
        </div>
      </div>
    </div>
  )
}

function Card({children,onDelete,ariaLabel}){
  return (
    <div className="card" style={{position:'relative'}} tabIndex={0} aria-label={ariaLabel}>
      {onDelete && <button type="button" className="delete-x" onClick={(e)=>{ e.stopPropagation(); onDelete() }} title="Soft‑delete">×</button>}
      {children}
    </div>
  )
}

export default function OperationalApproachMapper(){
  const store = useOAStore()
  const [toast,setToast] = useState(null)
  const [copyModal,setCopyModal] = useState({open:false,title:'',text:''})
  const fileRef = useRef(null)

  // keyboard shortcuts
  useEffect(()=>{
    const h = (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); store.undo(); setToast({msg:'Undid last action'}) }
    }
    window.addEventListener('keydown', h)
    return ()=> window.removeEventListener('keydown', h)
  },[])

  const phaseOptions = useMemo(()=> store.phases.map(p=>({value:p.id,label:p.name+(p.subtitle?(' — '+p.subtitle):'')})),[store.phases])
  const loeOptions = useMemo(()=> store.loes.map(l=>({value:l.id,label:l.title||l.id})),[store.loes])
  const effectOptions = useMemo(()=> store.effects.map(e=>({value:e.id,label:e.text.slice(0,60)||e.id})),[store.effects])

  const showToast=(msg)=>{ setToast({msg}); setTimeout(()=>setToast(null), 2500) }

  const stateJson = useMemo(()=> ({
    problemStatement:store.problemStatement,
    currentOE:store.currentOE,
    commsStrategy:store.commsStrategy,
    phases:store.phases,
    objectives:store.objectives,
    loes:store.loes,
    effects:store.effects,
    tasks:store.tasks,
    decisivePoints:store.dp,
    assumptions:store.assumptions,
    ccir:store.ccir,
    resources:store.resources
  }),[store.problemStatement,store.currentOE,store.commsStrategy,store.phases,store.objectives,store.loes,store.effects,store.tasks,store.dp,store.assumptions,store.ccir,store.resources])

  const copyForAI = (mode='Coach')=>{
    const text = `Persona: ${mode}\nAction: coaching/doctrine/red team\nContext: JSON follows\nJSON:\n`+JSON.stringify(stateJson,null,2)
    try{
      navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).then(()=> showToast('Copied to clipboard')).catch(()=> setCopyModal({open:true,title:`${mode}_Review_Prompt`,text})) : setCopyModal({open:true,title:`${mode}_Review_Prompt`,text})
    }catch{
      setCopyModal({open:true,title:`${mode}_Review_Prompt`,text})
    }
  }

  const exportJson=()=>{
    try{
      const blob=new Blob([JSON.stringify(stateJson,null,2)],{type:'application/json'})
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='operational_approach.json'; a.click(); URL.revokeObjectURL(a.href);
      showToast('Exported JSON')
    }catch(err){ showToast('Export failed: '+String(err)) }
  }

  const softDelete = (type, entity) => {
    if(!confirm(`Soft‑delete this ${type}? You can restore it from Trash.`)) return
    store.softDelete({ type, ...entity })
    showToast(`${type} moved to Trash`)
  }

  return (
    <div>
      {toast && <div className="toast">{toast.msg}</div>}
      <CopyModal open={copyModal.open} title={copyModal.title} text={copyModal.text} onClose={()=>setCopyModal({open:false,title:'',text:''})} />

      <div className="hstack" style={{justifyContent:'space-between', marginBottom:12}}>
        <div className="hstack">
          <Button variant="primary" onClick={()=>exportJson()}>Export JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={(e)=>{
            const file=e.target.files?.[0]; if(!file){ showToast('No file selected'); return }
            const reader=new FileReader(); reader.onload=ev=>{
              try{
                const data=JSON.parse(String(ev.target?.result||'{}'))
                if(!data.phases || !data.loes){ showToast('Invalid file: missing phases/loes'); return }
                Object.keys(data).forEach(k=> { if(typeof data[k]==='undefined') delete data[k] })
                useOAStore.setState(data); showToast('Imported JSON')
              }catch(err){ showToast('Import failed: '+String(err)) }
            }; reader.readAsText(file)
          }} />
          <Button variant="ghost" onClick={()=>fileRef.current?.click()}>Import JSON</Button>
          <Button variant="ghost" onClick={()=>copyForAI('Coach')}>Copy for AI</Button>
          <Button variant="ghost" onClick={()=>copyForAI('Doctrine')}>Doctrine Check</Button>
          <Button variant="danger" onClick={()=>copyForAI('RedTeam')}>Red Team</Button>
        </div>
        <div className="hstack">
          <Button variant="ghost" onClick={()=> useOAStore.setState({ showTrash:true })}>Trash ({store.trash.length})</Button>
          <Button variant="ghost" onClick={()=> store.undo()}>Undo</Button>
        </div>
      </div>

      {store.showTrash && (
        <div className="card" style={{marginBottom:12}}>
          <div className="header">
            <strong>Trash</strong>
            <Button variant="ghost" onClick={()=> useOAStore.setState({ showTrash:false })}>Close</Button>
          </div>
          <div className="row cols-3">
            {store.trash.length===0 && <div className="small">Nothing here.</div>}
            {store.trash.map(t=> (
              <div key={t.id} className="card">
                <div className="small"><strong>{t.type}</strong> — {new Date(t.deletedAt).toLocaleString()}</div>
                <pre className="small" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(t, null, 2)}</pre>
                <div className="hstack">
                  <Button variant="primary" onClick={()=>{ store.restoreFromTrash(t.id); showToast('Restored from Trash') }}>Restore</Button>
                  <Button variant="danger" onClick={()=>{ if(confirm('Permanently delete?')){ store.purgeTrashItem(t.id); showToast('Permanently deleted') } }}>Delete forever</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row cols-3">
        <Card ariaLabel="Problem Statement">
          <label>Problem Statement<textarea className="input" value={store.problemStatement} onChange={(e)=>useOAStore.setState({problemStatement:e.target.value})} rows={3}/></label>
        </Card>
        <Card ariaLabel="Current Operational Environment">
          <label>Current OE<textarea className="input" value={store.currentOE} onChange={(e)=>useOAStore.setState({currentOE:e.target.value})} rows={6}/></label>
        </Card>
        <Card ariaLabel="Communication Strategy">
          <label>Comms Strategy<textarea className="input" value={store.commsStrategy} onChange={(e)=>useOAStore.setState({commsStrategy:e.target.value})} rows={6}/></label>
        </Card>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>Phase Manager</strong><Button onClick={()=>{ store.addPhase(); }}>Add Phase</Button></div>
        <div className="row cols-3">
          {store.phases.map(p=>(
            <Card key={p.id} ariaLabel="Phase">
              <button type="button" className="delete-x" onClick={()=> softDelete('phase', p)} title="Soft‑delete">×</button>
              <label>Name<input className="input" value={p.name} onChange={(e)=> useOAStore.setState({ phases: store.phases.map(x=>x.id===p.id?{...x,name:e.target.value}:x) })}/></label>
              <label>Time/Transition<input className="input" value={p.subtitle} onChange={(e)=> useOAStore.setState({ phases: store.phases.map(x=>x.id===p.id?{...x,subtitle:e.target.value}:x) })}/></label>
            </Card>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>Objectives (Ends)</strong><Button onClick={()=> store.addObjective()}>Add Objective</Button></div>
        <div className="row cols-3">
          {store.objectives.map(o=>(
            <Card key={o.id} ariaLabel="Objective">
              <button type="button" className="delete-x" onClick={()=> softDelete('objective', o)} title="Soft‑delete">×</button>
              <label>Objective<textarea className="input" value={o.text} onChange={(e)=> useOAStore.setState({ objectives: store.objectives.map(x=>x.id===o.id?{...x,text:e.target.value}:x) })} rows={3}/></label>
              <label>MOEs<textarea className="input" value={o.moes} onChange={(e)=> useOAStore.setState({ objectives: store.objectives.map(x=>x.id===o.id?{...x,moes:e.target.value}:x) })} rows={2}/></label>
            </Card>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>Lines of Effort (Ways)</strong><Button onClick={()=> store.addLoe()}>Add LOE</Button></div>
        <div className="row cols-3">
          {store.loes.map(l=>(
            <Card key={l.id} ariaLabel="LOE">
              <button type="button" className="delete-x" onClick={()=> softDelete('loe', l)} title="Soft‑delete">×</button>
              <label>Title<input className="input" value={l.title} onChange={(e)=> useOAStore.setState({ loes: store.loes.map(x=>x.id===l.id?{...x,title:e.target.value}:x) })}/></label>
              <label>Notes<textarea className="input" value={l.notes} onChange={(e)=> useOAStore.setState({ loes: store.loes.map(x=>x.id===l.id?{...x,notes:e.target.value}:x) })} rows={2}/></label>
            </Card>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>Effects</strong><Button onClick={()=> store.addEffect()}>Add Effect</Button></div>
        <div className="row cols-3">
          {store.effects.map(e=>(
            <Card key={e.id} ariaLabel="Effect">
              <button type="button" className="delete-x" onClick={()=> softDelete('effect', e)} title="Soft‑delete">×</button>
              <label>LOE<select className="input" value={e.loeId} onChange={(ev)=> useOAStore.setState({ effects: store.effects.map(x=>x.id===e.id?{...x,loeId:ev.target.value}:x) })}>
                <option value="">Select...</option>
                {loeOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></label>
              <label>Effect<textarea className="input" value={e.text} onChange={(ev)=> useOAStore.setState({ effects: store.effects.map(x=>x.id===e.id?{...x,text:ev.target.value}:x) })} rows={3}/></label>
              <label>Phase<select className="input" value={e.phaseId} onChange={(ev)=> useOAStore.setState({ effects: store.effects.map(x=>x.id===e.id?{...x,phaseId:ev.target.value}:x) })}>
                <option value="">Select...</option>
                {phaseOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></label>
            </Card>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>Tasks</strong><Button onClick={()=> store.addTask()}>Add Task</Button></div>
        <div className="row cols-3">
          {store.tasks.map(t=>(
            <Card key={t.id} ariaLabel="Task">
              <button type="button" className="delete-x" onClick={()=> softDelete('task', t)} title="Soft‑delete">×</button>
              <label>Effect<select className="input" value={t.effectId} onChange={(ev)=> useOAStore.setState({ tasks: store.tasks.map(x=>x.id===t.id?{...x,effectId:ev.target.value}:x) })}>
                <option value="">Select...</option>
                {effectOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></label>
              <label>Task<textarea className="input" value={t.text} onChange={(ev)=> useOAStore.setState({ tasks: store.tasks.map(x=>x.id===t.id?{...x,text:ev.target.value}:x) })} rows={3}/></label>
              <label>Phase<select className="input" value={t.phaseId} onChange={(ev)=> useOAStore.setState({ tasks: store.tasks.map(x=>x.id===t.id?{...x,phaseId:ev.target.value}:x) })}>
                <option value="">Select...</option>
                {phaseOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></label>
            </Card>
          ))}
        </div>
      </div>

      {/* Live One-Slide, auto-condense */}
      <div className="card" style={{marginTop:12}}>
        <div className="header"><strong>One‑Slide Operational Approach (Live)</strong></div>
        <div className="one-slide">
          <AutoCondense OA={store} />
        </div>
      </div>
    </div>
  )
}

function AutoCondense({OA}){
  // Scale down font/cards if many phases/elements
  const phases = OA.phases.length || 1
  const loes = OA.loes.length || 1
  const effCount = OA.effects.length
  const tskCount = OA.tasks.length
  const density = (effCount + tskCount) / (phases * Math.max(1, loes))
  const scale = density > 12 ? 0.75 : density > 8 ? 0.85 : density > 5 ? 0.9 : 1

  const style = { transform:`scale(${scale})`, transformOrigin:'top left', width:`${100/scale}%` }
  return (
    <div style={style}>
      <div className="hstack" style={{justifyContent:'space-between', marginBottom:8}}>
        <div>
          <div className="small">Operational Approach</div>
          <div><strong>{OA.problemStatement || 'Problem Statement'}</strong></div>
        </div>
        <div className="badge">Phases: {OA.phases.length}</div>
      </div>
      <div className="row cols-3">
        <div>
          <div className="small">Current OE</div>
          <div className="card"><div className="small" style={{whiteSpace:'pre-wrap'}}>{OA.currentOE}</div></div>
        </div>
        <div>
          <div className="row" style={{gridTemplateColumns:`repeat(${Math.max(1,OA.phases.length)}, minmax(160px,1fr))`, gridGap:8}}>
            {OA.phases.map(p=> (
              <div key={p.id} className="phase-head">
                <div style={{fontWeight:600,fontSize:12}}>{p.name}</div>
                <div className="small">{p.subtitle}</div>
              </div>
            ))}
          </div>
          <div className="vstack" style={{marginTop:8}}>
            {OA.loes.map(l=> (
              <div key={l.id} className="swimlane">
                <div className="small"><strong>LOE:</strong> {l.title}</div>
                <div className="row" style={{gridTemplateColumns:`repeat(${Math.max(1,OA.phases.length)}, minmax(160px,1fr))`, gridGap:8}}>
                  {OA.phases.map(p=> {
                    const effs = OA.effects.filter(e=> e.loeId===l.id && e.phaseId===p.id)
                    const tsks = OA.tasks.filter(t=> effs.some(e=> e.id===t.effectId) && t.phaseId===p.id)
                    return (
                      <div key={p.id} className="card">
                        {effs.map(e=> <div key={e.id} className="eff">♦ {e.text}</div>)}
                        {tsks.map(t=> <div key={t.id} className="task">■ {t.text}</div>)}
                        {(!effs.length && !tsks.length) && <div className="small" style={{textAlign:'center'}}>—</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="small">Objectives</div>
          <div className="vstack">
            {OA.objectives.map((o,i)=> (
              <div key={o.id} className="card">
                <div className="small"><strong>Objective {i+1}</strong></div>
                <div className="small">{o.text}</div>
                {o.moes && <div className="small"><strong>MOEs:</strong> {o.moes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
