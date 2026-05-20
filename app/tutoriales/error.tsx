'use client';

import { useEffect } from 'react';

export default function ErrorTutoriales({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorTutoriales]', error);
    }
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1a1a2e',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem' }}>🎵</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        No se pudo cargar este tutorial
      </h2>
      <p style={{ color: '#6b7280', maxWidth: '400px', margin: 0 }}>
        Hubo un problema cargando el contenido. Intenta de nuevo o vuelve al catálogo.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: '#e63946',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
        <a href="/tutoriales-de-acordeon"
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            color: '#374151',
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Ver tutoriales
        </a>
      </div>
    </div>
  );
}
