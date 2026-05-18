'use client';

// Loader SOLO para rutas pesadas 3D/audio (acordeon-pro-max, simulador) que
// cargan client-only via dynamic(ssr:false). Se muestra MIENTRAS baja el
// chunk JS pesado, evitando el "blanco brusco". NO es global: solo aparece
// en la propia ruta durante su carga (no tapa el resto de la app).
export default function CargandoRuta() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'radial-gradient(ellipse at center, #1a1733 0%, #0b0a1a 70%)',
        color: '#cbb5ff',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          border: '4px solid rgba(139,92,246,0.25)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'avcr-spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: 14, letterSpacing: 0.5, opacity: 0.8 }}>Cargando…</span>
      <style>{`@keyframes avcr-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
