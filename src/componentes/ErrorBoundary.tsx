'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; esErrorExtension: boolean }

function esErrorDOMExtension(error: Error): boolean {
  const msg = error.message || '';
  return (
    msg.includes('removeChild') ||
    msg.includes('insertBefore') ||
    msg.includes('is not a child of this node') ||
    msg.includes('The node to be removed')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, esErrorExtension: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, esErrorExtension: esErrorDOMExtension(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
    // Errores de extensión manipulando el DOM: recuperar automáticamente
    if (esErrorDOMExtension(error)) {
      setTimeout(() => this.setState({ hasError: false, esErrorExtension: false }), 100);
    }
  }

  render() {
    // Errores de extensión: renderizar children (se remontarán tras el reset)
    if (this.state.hasError && !this.state.esErrorExtension) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          padding: '24px', textAlign: 'center', background: '#0f0520', color: 'white'
        }}>
          <span style={{ fontSize: '48px' }}>🎵</span>
          <h2 style={{ fontSize: '24px', margin: 0 }}>Algo salió mal</h2>
          <p style={{ color: '#c4b5fd', margin: 0 }}>Recarga la página para continuar</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: '#7c3aed', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '16px', marginTop: '8px'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
