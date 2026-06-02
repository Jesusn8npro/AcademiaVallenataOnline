'use client';

import { useCupon } from '../../hooks/useCupon'

interface Props {
  monto: number
  usuarioId?: string
  onAplicar: (precioFinal: number, descuento: number, codigo: string) => void
  onLimpiar: () => void
}

export function InputCupon({ monto, usuarioId, onAplicar, onLimpiar }: Props) {
  const { codigo, setCodigo, validando, resultado, error, validarCupon, limpiarCupon } = useCupon()

  const handleAplicar = async () => {
    const r = await validarCupon(monto, usuarioId)
    // Propagar el precio con descuento y el código al modal para cobrar/consumir lo correcto.
    if (r?.valido) onAplicar(r.precio_final, r.descuento, codigo.toUpperCase().trim())
  }

  const handleLimpiar = () => { limpiarCupon(); onLimpiar() }

  if (resultado?.valido) {
    return (
      <div style={{ border: '1px solid #7c3aed', borderRadius: '10px', padding: '12px 16px', background: '#1a0a2e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#a78bfa', fontSize: '13px' }}>Cupón aplicado: </span>
            <strong style={{ color: '#c4b5fd' }}>{codigo.toUpperCase()}</strong>
            <div style={{ color: '#4ade80', fontSize: '13px', marginTop: '2px' }}>{resultado.mensaje}</div>
          </div>
          <button onClick={handleLimpiar} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: '#e9d5ff' }}>Descuento:</span>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>-${resultado.descuento.toLocaleString('es-CO')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
          <span style={{ color: 'white' }}>Total a pagar:</span>
          <span style={{ color: 'white' }}>${resultado.precio_final.toLocaleString('es-CO')}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Código de cupón"
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') handleAplicar() }}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '8px',
            border: `1px solid ${error ? '#f87171' : '#4c1d95'}`,
            background: '#1a0a2e', color: 'white', fontSize: '14px',
            outline: 'none', letterSpacing: '1px'
          }}
        />
        <button
          onClick={handleAplicar}
          disabled={validando || !codigo.trim()}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: 'none',
            background: validando ? '#4c1d95' : '#7c3aed',
            color: 'white', cursor: validando ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap'
          }}
        >
          {validando ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '13px', margin: '6px 0 0' }}>{error}</p>}
    </div>
  )
}
