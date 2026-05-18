// Spinner de marca reutilizable (loading.tsx de rutas + Suspense global).
export default function Cargando() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f2937',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(139,92,246,0.25)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'av-spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes av-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
