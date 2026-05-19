'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 100%)',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem',
      gap: '1.5rem',
    }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
        Algo salió mal
      </h1>
      <p style={{ color: '#a78bfa', maxWidth: '480px', lineHeight: 1.6, margin: 0 }}>
        Ocurrió un error inesperado. Nuestro equipo fue notificado automáticamente.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#8b5cf6',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
        <a
          href="/"
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: '1px solid #4c1d95',
            background: 'transparent',
            color: '#a78bfa',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
