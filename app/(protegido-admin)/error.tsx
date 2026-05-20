'use client';

import { useEffect } from 'react';

export default function ErrorAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorAdmin]', error);
    }
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🔧</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        Error en el panel de administración
      </h2>
      <p style={{ color: '#94a3b8', maxWidth: '400px', margin: 0 }}>
        Se produjo un error inesperado. El resto de la plataforma sigue funcionando.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
        <a href="/administrador"
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            color: '#94a3b8',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Volver al admin
        </a>
      </div>
    </div>
  );
}
