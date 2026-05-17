import { useState, useEffect } from 'react'
import { supabase } from '../../../servicios/clienteSupabase'

type Tab = 'enviados' | 'inactivos' | 'incompletos' | 'abandonados' | 'suscriptores' | 'redactar'

interface EmailEnviado {
  id: string
  email: string
  nombre: string
  nombre_producto: string
  valor: number
  fecha: string
}

interface UsuarioInactivo {
  usuario_id: string
  nombre: string
  apellido: string
  correo_electronico: string
  ultima_actividad: string
  dias_inactivo: number
}

interface CursoIncompleto {
  id: string
  usuario_id: string
  nombre: string
  apellido: string
  correo_electronico: string
  titulo_contenido: string
  porcentaje_completado: number
  tipo: 'tutorial' | 'curso'
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: 1100, margin: '0 auto', color: 'white' },
  card: { background: '#1a0a2e', border: '1px solid #4c1d95', borderRadius: 12, padding: 24, marginBottom: 16 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' as const },
  tab: { padding: '10px 20px', borderRadius: 8, border: '1px solid #4c1d95', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'transparent', color: '#a78bfa' },
  tabActive: { padding: '10px 20px', borderRadius: 8, border: '1px solid #7c3aed', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: '#7c3aed', color: 'white' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '10px 12px', color: '#a78bfa', fontSize: 13, borderBottom: '1px solid #4c1d95' },
  td: { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid #2d1264', verticalAlign: 'middle' as const },
  btnSm: { padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  btn: { padding: '11px 28px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  input: { width: '100%', padding: '10px 14px', background: '#0f0520', border: '1px solid #4c1d95', borderRadius: 8, color: 'white', fontSize: 14, boxSizing: 'border-box' as const },
  label: { fontSize: 13, color: '#c4b5fd', marginBottom: 6, display: 'block' },
}

async function invocarEmail(body: object): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('enviar-email', { body })
  if (error) return { ok: false, error: error.message }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true }
}

export default function EmailsAdmin() {
  const [tab, setTab] = useState<Tab>('enviados')
  const [enviados, setEnviados] = useState<EmailEnviado[]>([])
  const [inactivos, setInactivos] = useState<UsuarioInactivo[]>([])
  const [incompletos, setIncompletos] = useState<CursoIncompleto[]>([])
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState({ texto: '', ok: true })
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [diasInactivo, setDiasInactivo] = useState(7)

  // Estado pagos abandonados
  const [horasMin, setHorasMin] = useState(1)
  const [codigoCupon, setCodigoCupon] = useState('')
  const [ejecutandoRecuperacion, setEjecutandoRecuperacion] = useState(false)
  const [resultadoRecuperacion, setResultadoRecuperacion] = useState<{ enviados: number; sin_email: number; total: number } | null>(null)

  // Estado suscriptores
  interface Suscriptor { id: string; email: string; nombre: string | null; activo: boolean; created_at: string }
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([])
  const [cargandoSubs, setCargandoSubs] = useState(false)
  const [boletinAsunto, setBoletinAsunto] = useState('')
  const [boletinMensaje, setBoletinMensaje] = useState('')
  const [enviandoBoletin, setEnviandoBoletin] = useState(false)
  const [resultadoBoletin, setResultadoBoletin] = useState<{ enviados: number; total: number } | null>(null)

  // Estado formulario redactar
  const [destinatario, setDestinatario] = useState('')
  const [nombreDest, setNombreDest] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviandoForm, setEnviandoForm] = useState(false)

  useEffect(() => {
    if (tab === 'enviados') cargarEnviados()
    else if (tab === 'inactivos') cargarInactivos()
    else if (tab === 'incompletos') cargarIncompletos()
    else if (tab === 'suscriptores') cargarSuscriptores()
  }, [tab, diasInactivo])

  const notif = (texto: string, ok = true) => setMsg({ texto, ok })

  const cargarEnviados = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('pagos_epayco')
      .select('id, nombre_producto, valor, fecha_transaccion, created_at, datos_adicionales, perfiles:usuario_id(nombre, apellido, correo_electronico)')
      .eq('estado', 'aceptada')
      .order('created_at', { ascending: false })
      .limit(60)

    const lista: EmailEnviado[] = (data || []).map((r: any) => {
      const dp = r.datos_adicionales?.datos_personales || {}
      const perfil = r.perfiles || {}
      return {
        id: r.id,
        email: dp.email || perfil.correo_electronico || '—',
        nombre: dp.nombre || perfil.nombre || '—',
        nombre_producto: r.nombre_producto,
        valor: r.valor,
        fecha: r.fecha_transaccion || r.created_at,
      }
    })
    setEnviados(lista)
    setCargando(false)
  }

  const cargarInactivos = async () => {
    setCargando(true)
    const corte = new Date(Date.now() - diasInactivo * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('sesiones_usuario')
      .select('usuario_id, ultima_actividad, perfiles:usuario_id (nombre, apellido, correo_electronico, rol)')
      .lt('ultima_actividad', corte)
      .order('ultima_actividad', { ascending: false })
      .limit(200)

    // Deduplicate por usuario_id (sesiones_usuario puede tener varias filas por usuario)
    const seen = new Set<string>()
    const lista: UsuarioInactivo[] = []
    for (const r of (data || []) as any[]) {
      if (seen.has(r.usuario_id)) continue
      if (r.perfiles?.rol !== 'estudiante' || !r.perfiles?.correo_electronico) continue
      seen.add(r.usuario_id)
      lista.push({
        usuario_id: r.usuario_id,
        nombre: r.perfiles.nombre || '',
        apellido: r.perfiles.apellido || '',
        correo_electronico: r.perfiles.correo_electronico,
        ultima_actividad: r.ultima_actividad,
        dias_inactivo: Math.floor((Date.now() - new Date(r.ultima_actividad).getTime()) / 86400000),
      })
    }
    setInactivos(lista)
    setCargando(false)
  }

  const cargarIncompletos = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('inscripciones')
      .select(`
        id, usuario_id, porcentaje_completado, tutorial_id, curso_id,
        perfiles:usuario_id (nombre, apellido, correo_electronico),
        tutoriales:tutorial_id (titulo),
        cursos:curso_id (titulo)
      `)
      .eq('completado', false)
      .gt('porcentaje_completado', 0)
      .order('porcentaje_completado', { ascending: false })
      .limit(80)

    const lista: CursoIncompleto[] = (data || [])
      .filter((r: any) => r.perfiles?.correo_electronico)
      .map((r: any) => ({
        id: r.id,
        usuario_id: r.usuario_id,
        nombre: r.perfiles.nombre || '',
        apellido: r.perfiles.apellido || '',
        correo_electronico: r.perfiles.correo_electronico,
        titulo_contenido: r.tutoriales?.titulo || r.cursos?.titulo || 'Contenido',
        porcentaje_completado: r.porcentaje_completado || 0,
        tipo: r.tutorial_id ? 'tutorial' : 'curso',
      }))
    setIncompletos(lista)
    setCargando(false)
  }

  const handleRecordatorioInactivo = async (u: UsuarioInactivo) => {
    setEnviandoId(u.usuario_id)
    notif('')
    const res = await invocarEmail({
      tipo: 'recordatorio', destinatario: u.correo_electronico, nombre: u.nombre,
      extra: { tipo_recordatorio: 'inactividad', dias_inactivo: String(u.dias_inactivo) },
    })
    notif(res.ok ? `✅ Recordatorio enviado a ${u.nombre} (${u.correo_electronico})` : `❌ ${res.error}`, res.ok)
    setEnviandoId(null)
  }

  const handleRecordatorioIncompleto = async (c: CursoIncompleto) => {
    setEnviandoId(c.id)
    notif('')
    const res = await invocarEmail({
      tipo: 'recordatorio', destinatario: c.correo_electronico, nombre: c.nombre,
      extra: { tipo_recordatorio: 'curso_incompleto', curso: c.titulo_contenido, progreso: String(c.porcentaje_completado) },
    })
    notif(res.ok ? `✅ Recordatorio enviado a ${c.nombre} (${c.correo_electronico})` : `❌ ${res.error}`, res.ok)
    setEnviandoId(null)
  }

  const cargarSuscriptores = async () => {
    setCargandoSubs(true)
    const { data } = await supabase
      .from('suscriptores_boletin')
      .select('id, email, nombre, activo, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setSuscriptores((data as any[]) || [])
    setCargandoSubs(false)
  }

  const toggleSuscriptor = async (id: string, activo: boolean) => {
    await supabase.from('suscriptores_boletin').update({ activo: !activo }).eq('id', id)
    setSuscriptores(prev => prev.map(s => s.id === id ? { ...s, activo: !activo } : s))
  }

  const handleEnviarBoletin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boletinAsunto.trim() || !boletinMensaje.trim()) {
      notif('❌ Completa el asunto y el mensaje.', false); return
    }
    setEnviandoBoletin(true)
    setResultadoBoletin(null)
    notif('')
    const { data, error } = await supabase.functions.invoke('notificar-suscriptores', {
      body: { asunto: boletinAsunto.trim(), mensaje: boletinMensaje.trim() },
    })
    if (error || data?.error) {
      notif(`❌ Error: ${error?.message || data?.error}`, false)
    } else {
      setResultadoBoletin({ enviados: data.enviados, total: data.total_suscriptores })
      notif(`✅ Boletín enviado a ${data.enviados} suscriptores.`, true)
      setBoletinAsunto('')
      setBoletinMensaje('')
    }
    setEnviandoBoletin(false)
  }

  const handleRecuperarAbandonados = async () => {
    setEjecutandoRecuperacion(true)
    setResultadoRecuperacion(null)
    notif('')
    const { data, error } = await supabase.functions.invoke('recuperar-pagos-abandonados', {
      body: { horas_min: horasMin, ...(codigoCupon.trim() ? { codigo_cupon: codigoCupon.trim() } : {}) },
    })
    if (error || data?.error) {
      notif(`❌ Error: ${error?.message || data?.error}`, false)
    } else {
      setResultadoRecuperacion({ enviados: data.enviados, sin_email: data.sin_email, total: data.total_encontrados })
      notif(`✅ Recuperación completada: ${data.enviados} emails enviados de ${data.total_encontrados} pagos encontrados.`, true)
    }
    setEjecutandoRecuperacion(false)
  }

  const handleEnviarPersonalizado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinatario.trim() || !asunto.trim() || !mensaje.trim()) {
      notif('❌ Completa destinatario, asunto y mensaje.', false); return
    }
    setEnviandoForm(true)
    notif('')
    const res = await invocarEmail({
      tipo: 'personalizado',
      destinatario: destinatario.trim(),
      nombre: nombreDest.trim() || undefined,
      extra: { asunto: asunto.trim(), mensaje: mensaje.trim() },
    })
    notif(res.ok ? `✅ Email enviado a ${destinatario}` : `❌ ${res.error}`, res.ok)
    if (res.ok) { setDestinatario(''); setNombreDest(''); setAsunto(''); setMensaje('') }
    setEnviandoForm(false)
  }

  const fmtFecha = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'enviados', label: '📨 Confirmaciones' },
    { id: 'inactivos', label: '💤 Inactivos' },
    { id: 'incompletos', label: '📚 Incompletos' },
    { id: 'abandonados', label: '⏳ Pagos abandonados' },
    { id: 'suscriptores', label: '🔔 Boletín' },
    { id: 'redactar', label: '✏️ Redactar' },
  ]

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📧 Emails & Recordatorios</h1>
      <p style={{ color: '#a78bfa', marginBottom: 24, fontSize: 14 }}>
        Historial de confirmaciones, recordatorios automáticos y redacción de mensajes personalizados.
      </p>

      {msg.texto && (
        <div style={{ ...s.card, borderColor: msg.ok ? '#22c55e' : '#ef4444', padding: '12px 20px', marginBottom: 16 }}>
          <span style={{ color: msg.ok ? '#86efac' : '#fca5a5' }}>{msg.texto}</span>
        </div>
      )}

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={tab === t.id ? s.tabActive : s.tab} onClick={() => { setTab(t.id); setMsg({ texto: '', ok: true }) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Enviados ─────────────────────────────── */}
      {tab === 'enviados' && (
        <div style={s.card}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: '#c4b5fd' }}>
            Confirmaciones de pago enviadas
          </h2>
          {cargando ? <p style={{ color: '#a78bfa' }}>Cargando…</p> : enviados.length === 0 ? (
            <p style={{ color: '#6d28d9' }}>No hay pagos aceptados registrados.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Producto</th>
                  <th style={s.th}>Monto</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {enviados.map(e => (
                  <tr key={e.id}>
                    <td style={s.td}>{e.email}</td>
                    <td style={s.td}>{e.nombre}</td>
                    <td style={s.td}>{e.nombre_producto}</td>
                    <td style={s.td}>${Number(e.valor || 0).toLocaleString('es-CO')}</td>
                    <td style={s.td}>{fmtFecha(e.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Inactivos ────────────────────────────── */}
      {tab === 'inactivos' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' as const }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#c4b5fd', margin: 0 }}>Usuarios inactivos</h2>
            <label style={{ color: '#a78bfa', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              Sin actividad hace más de
              <input
                type="number" min={1} max={90} value={diasInactivo}
                onChange={e => setDiasInactivo(Number(e.target.value))}
                style={{ ...s.input, width: 60, padding: '4px 8px' }}
              />
              días
            </label>
            {!cargando && <span style={{ color: '#6d28d9', fontSize: 13 }}>{inactivos.length} usuarios</span>}
          </div>
          {cargando ? <p style={{ color: '#a78bfa' }}>Cargando…</p> : inactivos.length === 0 ? (
            <p style={{ color: '#6d28d9' }}>No hay usuarios inactivos en ese período.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Nombre</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Última actividad</th>
                  <th style={s.th}>Días inactivo</th>
                  <th style={s.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map(u => (
                  <tr key={u.usuario_id}>
                    <td style={s.td}>{u.nombre} {u.apellido}</td>
                    <td style={s.td}>{u.correo_electronico}</td>
                    <td style={s.td}>{fmtFecha(u.ultima_actividad)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: u.dias_inactivo > 14 ? '#7f1d1d' : '#4c1d95', color: 'white' }}>
                        {u.dias_inactivo}d
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        style={{ ...s.btnSm, background: '#7c3aed', color: 'white', opacity: enviandoId === u.usuario_id ? 0.6 : 1 }}
                        disabled={enviandoId === u.usuario_id}
                        onClick={() => handleRecordatorioInactivo(u)}
                      >
                        {enviandoId === u.usuario_id ? 'Enviando…' : '📩 Recordatorio'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Incompletos ──────────────────────────── */}
      {tab === 'incompletos' && (
        <div style={s.card}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, color: '#c4b5fd' }}>
            Estudiantes con contenido incompleto
          </h2>
          {cargando ? <p style={{ color: '#a78bfa' }}>Cargando…</p> : incompletos.length === 0 ? (
            <p style={{ color: '#6d28d9' }}>No hay cursos incompletos con progreso registrado.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Estudiante</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Contenido</th>
                  <th style={s.th}>Progreso</th>
                  <th style={s.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {incompletos.map(c => (
                  <tr key={c.id}>
                    <td style={s.td}>{c.nombre} {c.apellido}</td>
                    <td style={s.td}>{c.correo_electronico}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: '#2d1264', color: '#c4b5fd', marginRight: 6 }}>{c.tipo}</span>
                      {c.titulo_contenido}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: '#2d1264', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${c.porcentaje_completado}%`, height: '100%', background: '#7c3aed' }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#c4b5fd' }}>{c.porcentaje_completado}%</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <button
                        style={{ ...s.btnSm, background: '#7c3aed', color: 'white', opacity: enviandoId === c.id ? 0.6 : 1 }}
                        disabled={enviandoId === c.id}
                        onClick={() => handleRecordatorioIncompleto(c)}
                      >
                        {enviandoId === c.id ? 'Enviando…' : '📩 Recordatorio'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: Pagos Abandonados ────────────────────── */}
      {tab === 'abandonados' && (
        <div style={s.card}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: '#c4b5fd' }}>
            Recuperar pagos abandonados
          </h2>
          <p style={{ color: '#6d28d9', fontSize: 13, marginBottom: 20 }}>
            Envía un email a usuarios con pagos en estado <strong style={{ color: '#a78bfa' }}>pendiente</strong> que lleven más del tiempo indicado sin completarse.
            Puedes incluir un cupón de descuento para incentivar la compra.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={s.label}>Horas mínimas de abandono</label>
                <input
                  type="number" min={1} max={720} value={horasMin}
                  onChange={e => setHorasMin(Number(e.target.value))}
                  style={s.input}
                />
              </div>
              <div>
                <label style={s.label}>Código de cupón (opcional)</label>
                <input
                  type="text" value={codigoCupon}
                  onChange={e => setCodigoCupon(e.target.value)}
                  placeholder="Ej: VUELVE20"
                  style={s.input}
                />
              </div>
            </div>

            <div>
              <button
                style={{ ...s.btn, opacity: ejecutandoRecuperacion ? 0.6 : 1 }}
                disabled={ejecutandoRecuperacion}
                onClick={handleRecuperarAbandonados}
              >
                {ejecutandoRecuperacion ? 'Procesando…' : '📤 Enviar emails de recuperación'}
              </button>
            </div>

            {resultadoRecuperacion && (
              <div style={{ ...s.card, background: '#0f0520', marginBottom: 0 }}>
                <p style={{ margin: '0 0 8px', color: '#c4b5fd', fontWeight: 600 }}>Resultado</p>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#86efac' }}>{resultadoRecuperacion.enviados}</div>
                    <div style={{ fontSize: 12, color: '#6d28d9' }}>Emails enviados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#fca5a5' }}>{resultadoRecuperacion.sin_email}</div>
                    <div style={{ fontSize: 12, color: '#6d28d9' }}>Sin email</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>{resultadoRecuperacion.total}</div>
                    <div style={{ fontSize: 12, color: '#6d28d9' }}>Total encontrados</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Suscriptores / Boletín ───────────────── */}
      {tab === 'suscriptores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Enviar boletín */}
          <div style={s.card}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: '#c4b5fd' }}>
              Enviar boletín a todos los suscriptores
            </h2>
            <p style={{ color: '#6d28d9', fontSize: 13, marginBottom: 20 }}>
              El email se envía con la plantilla visual de la academia a todos los suscriptores activos.
            </p>
            <form onSubmit={handleEnviarBoletin} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
              <div>
                <label style={s.label}>Asunto *</label>
                <input
                  type="text" required value={boletinAsunto}
                  onChange={e => setBoletinAsunto(e.target.value)}
                  placeholder="Ej: Nuevo artículo: Cómo dominar el paseo vallenato"
                  style={s.input}
                />
              </div>
              <div>
                <label style={s.label}>Mensaje *</label>
                <textarea
                  required value={boletinMensaje}
                  onChange={e => setBoletinMensaje(e.target.value)}
                  placeholder="Escribe el mensaje aquí. Usa saltos de línea para párrafos."
                  rows={7}
                  style={{ ...s.input, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button type="submit" style={{ ...s.btn, opacity: enviandoBoletin ? 0.6 : 1 }} disabled={enviandoBoletin}>
                  {enviandoBoletin ? 'Enviando…' : `📤 Enviar a ${suscriptores.filter(s => s.activo).length} suscriptores`}
                </button>
              </div>
            </form>
            {resultadoBoletin && (
              <div style={{ ...s.card, background: '#0f0520', marginTop: 12, marginBottom: 0, padding: '14px 20px' }}>
                <span style={{ color: '#86efac', fontWeight: 600 }}>
                  ✅ Enviado a {resultadoBoletin.enviados} de {resultadoBoletin.total} suscriptores activos.
                </span>
              </div>
            )}
          </div>

          {/* Lista de suscriptores */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#c4b5fd', margin: 0 }}>Lista de suscriptores</h2>
              {!cargandoSubs && (
                <span style={{ color: '#6d28d9', fontSize: 13 }}>
                  {suscriptores.filter(s => s.activo).length} activos · {suscriptores.length} total
                </span>
              )}
            </div>
            {cargandoSubs ? <p style={{ color: '#a78bfa' }}>Cargando…</p> : suscriptores.length === 0 ? (
              <p style={{ color: '#6d28d9' }}>Aún no hay suscriptores.</p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Email</th>
                    <th style={s.th}>Nombre</th>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {suscriptores.map(sub => (
                    <tr key={sub.id}>
                      <td style={s.td}>{sub.email}</td>
                      <td style={s.td}>{sub.nombre || '—'}</td>
                      <td style={s.td}>{fmtFecha(sub.created_at)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: sub.activo ? '#14532d' : '#450a0a', color: sub.activo ? '#86efac' : '#fca5a5' }}>
                          {sub.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          style={{ ...s.btnSm, background: sub.activo ? '#7f1d1d' : '#1e3a5f', color: 'white' }}
                          onClick={() => toggleSuscriptor(sub.id, sub.activo)}
                        >
                          {sub.activo ? 'Desuscribir' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Redactar ─────────────────────────────── */}
      {tab === 'redactar' && (
        <div style={s.card}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: '#c4b5fd' }}>
            Redactar email personalizado
          </h2>
          <p style={{ color: '#6d28d9', fontSize: 13, marginBottom: 20 }}>
            El mensaje se envía con la plantilla visual de la academia.
          </p>
          <form onSubmit={handleEnviarPersonalizado} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={s.label}>Destinatario (email) *</label>
                <input
                  type="email" required value={destinatario}
                  onChange={e => setDestinatario(e.target.value)}
                  placeholder="usuario@email.com"
                  style={s.input}
                />
              </div>
              <div>
                <label style={s.label}>Nombre del destinatario</label>
                <input
                  type="text" value={nombreDest}
                  onChange={e => setNombreDest(e.target.value)}
                  placeholder="Ej: Carlos Martínez"
                  style={s.input}
                />
              </div>
            </div>

            <div>
              <label style={s.label}>Asunto *</label>
              <input
                type="text" required value={asunto}
                onChange={e => setAsunto(e.target.value)}
                placeholder="Ej: Información sobre tu cuenta"
                style={s.input}
              />
            </div>

            <div>
              <label style={s.label}>Mensaje *</label>
              <textarea
                required value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Escribe el cuerpo del mensaje aquí. Puedes usar saltos de línea para párrafos."
                rows={8}
                style={{ ...s.input, resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            <div>
              <button type="submit" style={{ ...s.btn, opacity: enviandoForm ? 0.6 : 1 }} disabled={enviandoForm}>
                {enviandoForm ? 'Enviando…' : '📤 Enviar email'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
