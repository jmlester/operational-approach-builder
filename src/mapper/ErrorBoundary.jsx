import React from 'react'

export default class ErrorBoundary extends React.Component{
  constructor(props){ super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error('UI crashed:', error, info) }
  render(){
    if(this.state.hasError){
      return <div className="card">
        <h3>Something went wrong</h3>
        <p className="small">{String(this.state.error)}</p>
        <details className="small"><summary>Stack</summary><pre>{this.state.error?.stack}</pre></details>
        <p className="small">Try reloading or import a previously exported JSON.</p>
      </div>
    }
    return this.props.children
  }
}
