'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
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
