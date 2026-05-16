import { useState, useEffect } from 'react'
import { supabase } from '../../../servicios/clienteSupabase'

interface Cupon {
  id: string
  codigo: string
  descripcion: string
  tipo: 'porcentaje' | 'fijo'
  valor: number
  valor_minimo: number
  usos_maximos: number | null
  usos_actuales: number
  fecha_expiracion: string | null
  activo: boolean
  created_at: string
}

const VACIO: Omit<Cupon, 'id' | 'usos_actuales' | 'created_at'> = {
  codigo: '', descripcion: '', tipo: 'porcentaje', valor: 10,
  valor_minimo: 0, usos_maximos: null, fecha_expiracion: null, activo: true
}

export default function CuponesAdmin() {
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState({ ...VACIO })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase.from('cupones').select('*').order('created_at', { ascending: false })
    setCupones(data || [])
    setCargando(false)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo.trim()) { setMsg('El código es obligatorio'); return }
    setGuardando(true)
    setMsg('')
    const payload = { ...form, codigo: form.codigo.toUpperCase().trim() }
    const { error } = await supabase.from('cupones').insert(payload)
    if (error) { setMsg(error.message); setGuardando(false); return }
    setForm({ ...VACIO })
    setMsg('✅ Cupón creado')
    cargar()
    setGuardando(false)
  }

  const toggleActivo = async (id: string, activo: boolean) => {
    await supabase.from('cupones').update({ activo: !activo }).eq('id', id)
    cargar()
  }

  const eliminar = async (id: string, codigo: string) => {
    if (!confirm(`¿Eliminar cupón ${codigo}?`)) return
    await supabase.from('cupones').delete().eq('id', id)
    cargar()
  }

  const s: Record<string, React.CSSProperties> = {
    page: { padding: '24px', maxWidth: 1000, margin: '0 auto', color: 'white' },
    card: { background: '#1a0a2e', border: '1px solid #4c1d95', borderRadius: 12, padding: 24, marginBottom: 24 },
    input: { width: '100%', padding: '10px 14px', background: '#0f0520', border: '1px solid #4c1d95', borderRadius: 8, color: 'white', fontSize: 14 },
    btn: { padding: '10px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    btnSm: { padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
    label: { fontSize: 13, color: '#c4b5fd', marginBottom: 4, display: 'block' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { textAlign: 'left' as const, padding: '10px 12px', color: '#a78bfa', fontSize: 13, borderBottom: '1px solid #4c1d95' },
    td: { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid #2d1264', verticalAlign: 'middle' as const },
  }

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🎟️ Cupones de Descuento</h1>
      <p style={{ color: '#a78bfa', marginBottom: 24 }}>Crea y gestiona códigos de descuento para tus estudiantes</p>

      {/* FORM */}
      <div style={s.card}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#c4b5fd' }}>Crear nuevo cupón</h2>
        <form onSubmit={guardar}>
          <div style={{ ...s.grid2, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Código *</label>
              <input style={s.input} placeholder="BIENVENIDO20" value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={s.label}>Descripción</label>
              <input style={s.input} placeholder="Descuento de bienvenida" value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>

          <div style={{ ...s.grid3, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Tipo</label>
              <select style={s.input} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'porcentaje' | 'fijo' }))}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (COP)</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Valor {form.tipo === 'porcentaje' ? '(%)' : '(COP)'}</label>
              <input style={s.input} type="number" min={1} max={form.tipo === 'porcentaje' ? 100 : undefined}
                value={form.valor} onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={s.label}>Monto mínimo (COP)</label>
              <input style={s.input} type="number" min={0} value={form.valor_minimo}
                onChange={e => setForm(f => ({ ...f, valor_minimo: Number(e.target.value) }))} />
            </div>
          </div>

          <div style={{ ...s.grid2, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Usos máximos (vacío = ilimitado)</label>
              <input style={s.input} type="number" min={1} placeholder="Ilimitado"
                value={form.usos_maximos ?? ''}
                onChange={e => setForm(f => ({ ...f, usos_maximos: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div>
              <label style={s.label}>Fecha de expiración (vacío = nunca)</label>
              <input style={s.input} type="datetime-local"
                value={form.fecha_expiracion?.slice(0, 16) ?? ''}
                onChange={e => setForm(f => ({ ...f, fecha_expiracion: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
            </div>
          </div>

          {msg && <p style={{ marginBottom: 12, color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</p>}

          <button style={s.btn} type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : '+ Crear cupón'}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div style={s.card}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#c4b5fd' }}>
          Cupones activos ({cupones.filter(c => c.activo).length} / {cupones.length})
        </h2>
        {cargando ? (
          <p style={{ color: '#a78bfa' }}>Cargando...</p>
        ) : cupones.length === 0 ? (
          <p style={{ color: '#a78bfa' }}>No hay cupones creados aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Código', 'Descuento', 'Mín.', 'Usos', 'Expira', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cupones.map(c => {
                  const expirado = c.fecha_expiracion && new Date(c.fecha_expiracion) < new Date()
                  return (
                    <tr key={c.id}>
                      <td style={s.td}>
                        <code style={{ background: '#2d1264', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#c4b5fd' }}>
                          {c.codigo}
                        </code>
                        {c.descripcion && <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>{c.descripcion}</div>}
                      </td>
                      <td style={s.td}>
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>
                          {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor.toLocaleString('es-CO')}`}
                        </span>
                      </td>
                      <td style={s.td}>{c.valor_minimo > 0 ? `$${c.valor_minimo.toLocaleString('es-CO')}` : '—'}</td>
                      <td style={s.td}>{c.usos_actuales}{c.usos_maximos ? ` / ${c.usos_maximos}` : ''}</td>
                      <td style={s.td}>
                        {c.fecha_expiracion
                          ? <span style={{ color: expirado ? '#f87171' : '#e9d5ff' }}>
                              {new Date(c.fecha_expiracion).toLocaleDateString('es-CO')}
                              {expirado && ' (expirado)'}
                            </span>
                          : '—'}
                      </td>
                      <td style={s.td}>
                        <button
                          onClick={() => toggleActivo(c.id, c.activo)}
                          style={{ ...s.btnSm, background: c.activo ? '#166534' : '#7f1d1d', color: 'white' }}>
                          {c.activo ? '✅ Activo' : '❌ Inactivo'}
                        </button>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => eliminar(c.id, c.codigo)}
                          style={{ ...s.btnSm, background: '#450a0a', color: '#fca5a5' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
