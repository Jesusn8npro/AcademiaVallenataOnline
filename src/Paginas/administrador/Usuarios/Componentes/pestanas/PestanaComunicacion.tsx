import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../../servicios/clienteSupabase';
import './PestanaComunicacion.css';

interface Props { usuario: any; }

const fmt = (d?: string | null) => d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

type Plantilla = 'personalizado' | 'bienvenida' | 'recordatorio_inactividad' | 'recordatorio_curso' | 'pago_abandonado';

const PLANTILLAS: { id: Plantilla; label: string; emoji: string }[] = [
  { id: 'personalizado', label: 'Personalizado', emoji: '💌' },
  { id: 'bienvenida', label: 'Bienvenida', emoji: '🎻' },
  { id: 'recordatorio_inactividad', label: 'Te extrañamos', emoji: '👋' },
  { id: 'recordatorio_curso', label: 'Curso incompleto', emoji: '📚' },
  { id: 'pago_abandonado', label: 'Pago abandonado', emoji: '⏳' },
];

const PestanaComunicacion: React.FC<Props> = ({ usuario }) => {
  const [tab, setTab] = useState<'notificacion' | 'email'>('notificacion');
  // Notificación
  const [notiTitulo, setNotiTitulo] = useState('');
  const [notiMensaje, setNotiMensaje] = useState('');
  const [notiPrioridad, setNotiPrioridad] = useState('normal');
  const [notiUrl, setNotiUrl] = useState('');
  // Email
  const [plantilla, setPlantilla] = useState<Plantilla>('personalizado');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [diasInactivo, setDiasInactivo] = useState('7');
  const [curso, setCurso] = useState('');
  const [progreso, setProgreso] = useState('50');
  const [producto, setProducto] = useState('');
  const [monto, setMonto] = useState('');
  const [cupon, setCupon] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; texto: string } | null>(null);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  const nombre = usuario.nombre || usuario.nombre_completo || 'estudiante';

  const cargarHistorial = async () => {
    const [n, e] = await Promise.all([
      supabase.from('notificaciones').select('id, tipo, titulo, mensaje, leida, prioridad, fecha_creacion').eq('usuario_id', usuario.id).order('fecha_creacion', { ascending: false }).limit(15),
      supabase.from('emails_enviados').select('id, asunto, tipo, estado, created_at').eq('usuario_id', usuario.id).order('created_at', { ascending: false }).limit(15),
    ]);
    setNotificaciones(n.data || []);
    setEmails(e.data || []);
  };
  useEffect(() => { cargarHistorial(); }, [usuario.id]);

  // Vista previa según plantilla
  const preview = useMemo(() => {
    switch (plantilla) {
      case 'bienvenida':
        return { emoji: '🎻', titulo: `¡Bienvenido, ${nombre}! 👋`, cuerpo: `¡Qué alegría tenerte aquí, ${nombre}! Ya eres parte de la academia #1 de acordeón vallenato online. 🎉`, cta: 'Empezar a aprender →' };
      case 'recordatorio_inactividad':
        return { emoji: '👋', titulo: '¡Te echamos de menos!', cuerpo: `Hace ${diasInactivo || 'varios'} días que no nos visitas. ¡Tu acordeón te espera para seguir aprendiendo! 🎻`, cta: 'Volver a practicar →' };
      case 'recordatorio_curso':
        return { emoji: '📚', titulo: 'Tienes un curso por terminar', cuerpo: `Llevas un ${progreso || '0'}% en ${curso || 'tu curso'}. ¡Estás muy cerca de completarlo! 💪`, cta: 'Continuar el curso →' };
      case 'pago_abandonado':
        return { emoji: '⏳', titulo: '¡Casi lo tienes!', cuerpo: `Vimos que estabas a punto de adquirir ${producto || 'contenido de la academia'}${monto ? ` por ${monto}` : ''}, pero no completaste el pago.`, cta: 'Completar mi compra →', cupon };
      default:
        return { emoji: '💌', titulo: `¡Hola, ${nombre}!`, cuerpo: mensaje || 'Escribe tu mensaje y verás la vista previa aquí…', cta: '' };
    }
  }, [plantilla, nombre, mensaje, diasInactivo, curso, progreso, producto, monto, cupon]);

  const enviarNotificacion = async () => {
    if (!notiTitulo.trim() || !notiMensaje.trim()) { setFeedback({ ok: false, texto: 'Completa título y mensaje.' }); return; }
    setEnviando(true); setFeedback(null);
    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: usuario.id, tipo: 'mensaje_admin', titulo: notiTitulo.trim(), mensaje: notiMensaje.trim(),
      icono: '📢', prioridad: notiPrioridad, categoria: 'sistema', url_accion: notiUrl.trim() || null, leida: false,
    } as any);
    if (error) setFeedback({ ok: false, texto: `Error: ${error.message}` });
    else { setFeedback({ ok: true, texto: `Notificación enviada a ${nombre}.` }); setNotiTitulo(''); setNotiMensaje(''); setNotiUrl(''); cargarHistorial(); }
    setEnviando(false);
  };

  const construirBody = () => {
    const base: any = { destinatario: usuario.correo_electronico, nombre, extra: { usuario_id: usuario.id } };
    switch (plantilla) {
      case 'bienvenida': return { ...base, tipo: 'bienvenida' };
      case 'recordatorio_inactividad': return { ...base, tipo: 'recordatorio', extra: { ...base.extra, tipo_recordatorio: 'inactividad', dias_inactivo: diasInactivo } };
      case 'recordatorio_curso': return { ...base, tipo: 'recordatorio', extra: { ...base.extra, tipo_recordatorio: 'curso_incompleto', curso, progreso } };
      case 'pago_abandonado': return { ...base, tipo: 'pago_abandonado', extra: { ...base.extra, producto, monto, cupon } };
      default: return { ...base, tipo: 'personalizado', extra: { ...base.extra, asunto: asunto.trim(), mensaje: mensaje.trim() } };
    }
  };

  const enviarEmail = async () => {
    if (!usuario.correo_electronico) { setFeedback({ ok: false, texto: 'El usuario no tiene correo registrado.' }); return; }
    if (plantilla === 'personalizado' && (!asunto.trim() || !mensaje.trim())) { setFeedback({ ok: false, texto: 'Completa asunto y mensaje.' }); return; }
    setEnviando(true); setFeedback(null);
    const { data, error } = await supabase.functions.invoke('enviar-email', { body: construirBody() });
    if (error || data?.error) setFeedback({ ok: false, texto: `Error: ${error?.message || data?.error}` });
    else { setFeedback({ ok: true, texto: `Email enviado a ${usuario.correo_electronico}.` }); cargarHistorial(); }
    setEnviando(false);
  };

  return (
    <div className="pcom">
      <div className="pcom-tabs">
        <button className={`pcom-tab ${tab === 'notificacion' ? 'activa' : ''}`} onClick={() => { setTab('notificacion'); setFeedback(null); }}>🔔 Notificación in-app</button>
        <button className={`pcom-tab ${tab === 'email' ? 'activa' : ''}`} onClick={() => { setTab('email'); setFeedback(null); }}>📧 Email</button>
      </div>

      {feedback && <div className={`pcom-msg ${feedback.ok ? 'ok' : 'err'}`}>{feedback.texto}</div>}

      {tab === 'notificacion' ? (
        <div className="pcom-card">
          <h3 className="pcom-titulo">Enviar notificación a {usuario.nombre_completo || 'este usuario'}</h3>
          <div className="pcom-form">
            <label className="pcom-field"><span>Título *</span><input value={notiTitulo} onChange={e => setNotiTitulo(e.target.value)} placeholder="Ej: ¡Tu membresía está por vencer!" /></label>
            <label className="pcom-field"><span>Mensaje *</span><textarea value={notiMensaje} onChange={e => setNotiMensaje(e.target.value)} placeholder="Contenido de la notificación…" rows={4} /></label>
            <div className="pcom-row">
              <label className="pcom-field"><span>Prioridad</span>
                <select value={notiPrioridad} onChange={e => setNotiPrioridad(e.target.value)}><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option></select>
              </label>
              <label className="pcom-field"><span>URL de acción (opcional)</span><input value={notiUrl} onChange={e => setNotiUrl(e.target.value)} placeholder="/membresias" /></label>
            </div>
            <button className="pcom-btn" disabled={enviando} onClick={enviarNotificacion}>{enviando ? 'Enviando…' : '📤 Enviar notificación'}</button>
          </div>
        </div>
      ) : (
        <div className="pcom-email-grid">
          <div className="pcom-card">
            <h3 className="pcom-titulo">Plantilla de email</h3>
            <div className="pcom-plantillas">
              {PLANTILLAS.map(p => (
                <button key={p.id} className={`pcom-chip ${plantilla === p.id ? 'activa' : ''}`} onClick={() => setPlantilla(p.id)}>
                  <span className="pcom-chip-emoji">{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>

            <div className="pcom-form">
              {plantilla === 'personalizado' && (<>
                <label className="pcom-field"><span>Asunto *</span><input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Ej: Información sobre tu cuenta" /></label>
                <label className="pcom-field"><span>Mensaje *</span><textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Se envía con la plantilla visual de la academia." rows={6} /></label>
              </>)}
              {plantilla === 'bienvenida' && <p className="pcom-hint">Email de bienvenida estándar de la academia. No requiere campos.</p>}
              {plantilla === 'recordatorio_inactividad' && (
                <label className="pcom-field"><span>Días sin actividad</span><input type="number" value={diasInactivo} onChange={e => setDiasInactivo(e.target.value)} /></label>
              )}
              {plantilla === 'recordatorio_curso' && (<>
                <label className="pcom-field"><span>Nombre del curso</span><input value={curso} onChange={e => setCurso(e.target.value)} placeholder="Ej: Acordeón desde cero" /></label>
                <label className="pcom-field"><span>Progreso (%)</span><input type="number" value={progreso} onChange={e => setProgreso(e.target.value)} /></label>
              </>)}
              {plantilla === 'pago_abandonado' && (<>
                <label className="pcom-field"><span>Producto</span><input value={producto} onChange={e => setProducto(e.target.value)} placeholder="Ej: Membresía Pro" /></label>
                <div className="pcom-row">
                  <label className="pcom-field"><span>Monto</span><input value={monto} onChange={e => setMonto(e.target.value)} placeholder="$50.000" /></label>
                  <label className="pcom-field"><span>Cupón (opcional)</span><input value={cupon} onChange={e => setCupon(e.target.value)} placeholder="VUELVE20" /></label>
                </div>
              </>)}
              <button className="pcom-btn" disabled={enviando} onClick={enviarEmail}>{enviando ? 'Enviando…' : `📤 Enviar a ${usuario.correo_electronico || '(sin correo)'}`}</button>
            </div>
          </div>

          {/* Vista previa de lujo */}
          <div className="pcom-preview-wrap">
            <span className="pcom-preview-label">Vista previa</span>
            <div className="pcom-preview">
              <div className="pcom-preview-header">
                <div className="pcom-preview-logo">🎵</div>
                <div className="pcom-preview-brand">ACADEMIA VALLENATA ONLINE</div>
                <div className="pcom-preview-emoji">{preview.emoji}</div>
                <div className="pcom-preview-h1">{preview.titulo}</div>
              </div>
              <div className="pcom-preview-divider" />
              <div className="pcom-preview-body">
                <p>{preview.cuerpo}</p>
                {'cupon' in preview && preview.cupon && (
                  <div className="pcom-preview-cupon"><span>🎁 CUPÓN</span><strong>{preview.cupon}</strong></div>
                )}
                {preview.cta && <div className="pcom-preview-cta">{preview.cta}</div>}
              </div>
              <div className="pcom-preview-social">⭐ 4.9/5 · 5.000+ estudiantes · Academia #1</div>
            </div>
          </div>
        </div>
      )}

      <div className="pcom-card">
        <h3 className="pcom-titulo">Notificaciones enviadas ({notificaciones.length})</h3>
        {notificaciones.length === 0 ? <p className="pcom-vacio">Sin notificaciones.</p> : notificaciones.map(n => (
          <div key={n.id} className="pcom-fila">
            <span><strong>{n.titulo}</strong> — {n.mensaje}</span>
            <span className="pcom-fila-meta">{n.leida ? '✓ leída' : '• no leída'} · {fmt(n.fecha_creacion)}</span>
          </div>
        ))}
      </div>

      <div className="pcom-card">
        <h3 className="pcom-titulo">Emails enviados ({emails.length})</h3>
        {emails.length === 0 ? <p className="pcom-vacio">Sin emails registrados para este usuario.</p> : emails.map(e => (
          <div key={e.id} className="pcom-fila">
            <span><strong>{e.asunto || e.tipo}</strong></span>
            <span className="pcom-fila-meta" style={{ color: e.estado === 'enviado' ? '#86efac' : '#fca5a5' }}>{e.estado} · {fmt(e.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PestanaComunicacion;
