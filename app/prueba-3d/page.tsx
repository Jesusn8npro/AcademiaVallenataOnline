'use client'
import dynamic from 'next/dynamic'

// /prueba-3d — sala de pruebas del mecanismo "fuelle por huesos" de Pelao.
// Pantalla completa, sin chrome de la app. El visor es pesado (three.js) → dynamic
// ssr:false para que no entre al bundle de servidor.
const Visor = dynamic(
  () => import('../../src/Paginas/Prueba3D/PruebaPelao3D'),
  { ssr: false, loading: () => <PantallaCarga /> },
)

function PantallaCarga() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'radial-gradient(ellipse at center, #1a2740 0%, #0a0e1a 80%)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes p3dSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid rgba(255,255,255,.14)', borderTopColor: '#ff7a18', animation: 'p3dSpin .9s linear infinite' }} />
      <div style={{ fontSize: 18, fontWeight: 800 }}>🪗 Cargando prueba 3D</div>
    </div>
  )
}

export default function PruebaTresDPage() {
  return <Visor />
}
