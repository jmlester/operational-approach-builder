import React from 'react'
import OperationalApproachMapper from './mapper/OperationalApproachMapper.jsx'
import ErrorBoundary from './mapper/ErrorBoundary.jsx'

export default function App(){
  return (
    <div className="container">
      <div className="header">
        <h1>Operational Approach Mapper — Pro</h1>
        <div className="small">Tip: <kbd>Del</kbd> soft‑deletes, <kbd>Ctrl/Cmd+Z</kbd> undo</div>
      </div>
      <ErrorBoundary>
        <OperationalApproachMapper/>
      </ErrorBoundary>
    </div>
  )
}
