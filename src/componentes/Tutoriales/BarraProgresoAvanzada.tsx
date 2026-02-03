import React from 'react'

export default function BarraProgresoAvanzada({ estadisticasProgreso, tipoContenido }: { estadisticasProgreso: { completadas: number; total: number; porcentaje: number }, tipoContenido: 'tutorial' | 'curso' }) {
  const color = tipoContenido === 'tutorial' ? '#a855f7' : '#2563eb'
  return (
    <div>
      <div style={{ marginBottom: 8 }}>Completadas {estadisticasProgreso.completadas} de {estadisticasProgreso.total} ({estadisticasProgreso.porcentaje}%)</div>
      <div style={{ height: 10, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: `${estadisticasProgreso.porcentaje}%`, height: '100%', background: color }} />
      </div>
    </div>
  )
}
