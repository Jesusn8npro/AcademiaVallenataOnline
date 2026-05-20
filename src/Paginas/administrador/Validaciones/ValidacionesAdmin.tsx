'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import './ValidacionesAdmin.css';

interface Evaluacion {
  id: string;
  usuario_id: string;
  tutorial_id: string;
  parte_tutorial_id?: string;
  video_url: string;
  estado: string;
  monedas_fase1: number;
  monedas_fase2: number;
  fase1_otorgada: boolean;
  fase2_otorgada: boolean;
  comentario_profesor: string;
  created_at: string;
  tutoriales?: { titulo: string };
  partes_tutorial?: { titulo: string };
  perfiles?: { nombre: string; apellido: string; email: string };
}

interface TutorialConEval {
  id: string;
  titulo: string;
  tieneEvaluacion: boolean;
  monedasRecompensa?: number;
  parteEvalId?: string;
}

interface ModuloConEval {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  titulo: string;
  orden: number;
  tieneEvaluacion: boolean;
  leccionEvalId?: string;
  monedasRecompensa?: number;
}

type Tab = 'pendientes' | 'todas' | 'configurar' | 'configurar_cursos';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#fbbf24',
  en_revision: '#63b3ed',
  aprobado: '#34d399',
  rechazado: '#f87171',
};
const ESTADO_LABEL: Record<string, string> = {
  pendiente: '⏳ Pendiente',
  en_revision: '🔍 En Revisión',
  aprobado: '✅ Aprobado',
  rechazado: '❌ Rechazado',
};

function getVideoEmbed(url: string): { tipo: 'iframe' | 'video'; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (yt) return { tipo: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` }
  const gd = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gd) return { tipo: 'iframe', src: `https://drive.google.com/file/d/${gd[1]}/preview` }
  return { tipo: 'video', src: url }
}


function VideoModalBtn({ url }: { url: string }) {
  const [open, setOpen] = React.useState(false)
  const embed = getVideoEmbed(url)
  return (
    <div style={{ marginLeft: 'auto' }}>
      <button type="button" onClick={() => setOpen(v => !v)} className="va-btn-video">
        {open ? '▲ Ocultar' : '▶ Ver Video'}
      </button>
      {open && (
        <div style={{ marginTop: '0.75rem', width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          {embed.tipo === 'iframe'
            ? <iframe src={embed.src} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Video alumno" />
            : <video src={embed.src} controls style={{ width: '100%', height: '100%' }} />}
        </div>
      )}
    </div>
  )
}

function Initials({ nombre, apellido }: { nombre?: string; apellido?: string }) {
  const l1 = (nombre || '?')[0].toUpperCase();
  const l2 = (apellido || '')[0]?.toUpperCase() || '';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
    }}>
      {l1}{l2}
    </div>
  );
}

export default function ValidacionesAdmin() {
  const { usuario } = useUsuario();
  const [tab, setTab] = useState<Tab>('pendientes');

  // ── evaluaciones ──────────────────────────────────────────────
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('pendiente');

  // ── modal ──────────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evalActual, setEvalActual] = useState<Evaluacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('aprobado');
  const [comentario, setComentario] = useState('');
  const [otorgarFase1, setOtorgarFase1] = useState(false);
  const [otorgarFase2, setOtorgarFase2] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ── configurar tutoriales ─────────────────────────────────────
  const [tutoriales, setTutoriales] = useState<TutorialConEval[]>([]);
  const [cargandoTuts, setCargandoTuts] = useState(false);
  const [monedasMap, setMonedasMap] = useState<Record<string, number>>({});
  const [agregando, setAgregando] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardandoMonedas, setGuardandoMonedas] = useState(false);

  // ── video abierto en tarjeta ──────────────────────────────────
  const [videoAbiertoId, setVideoAbiertoId] = useState<string | null>(null);

  // ── configurar cursos ─────────────────────────────────────────
  const [modulos, setModulos] = useState<ModuloConEval[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [monedasMapCursos, setMonedasMapCursos] = useState<Record<string, number>>({});
  const [agregandoCurso, setAgregandoCurso] = useState<string | null>(null);

  // ── toast ──────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);
  function showToast(tipo: 'ok' | 'err', msg: string) {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  }

  // ── stats (contadores rápidos) ─────────────────────────────────
  const stats = {
    pendiente: evaluaciones.filter(e => e.estado === 'pendiente').length,
    en_revision: evaluaciones.filter(e => e.estado === 'en_revision').length,
    aprobado: evaluaciones.filter(e => e.estado === 'aprobado').length,
    rechazado: evaluaciones.filter(e => e.estado === 'rechazado').length,
  };

  useEffect(() => {
    if (tab === 'pendientes') { setFiltroEstado('pendiente'); cargarEvaluaciones('pendiente'); }
    else if (tab === 'todas') { setFiltroEstado('todas'); cargarEvaluaciones('todas'); }
    else if (tab === 'configurar') { cargarTutoriales(); }
    else if (tab === 'configurar_cursos') { cargarCursos(); }
  }, [tab]);

  const cargarEvaluaciones = async (estado: string) => {
    setCargando(true);
    try {
      let q = (supabase.from('validaciones_tutorial') as any)
        .select('*, tutoriales(titulo), partes_tutorial:parte_tutorial_id(titulo)')
        .order('created_at', { ascending: false });
      if (estado !== 'todas') q = q.eq('estado', estado);
      const { data, error } = await q;
      if (error) throw error;

      const ids = Array.from(new Set(((data || []) as any[]).map((v: any) => v.usuario_id).filter(Boolean)));
      let perfilesMap: Record<string, any> = {};
      if (ids.length > 0) {
        const { data: perfiles } = await supabase.rpc('admin_listar_perfiles_con_pii', { p_ids: ids });
        if (Array.isArray(perfiles)) {
          perfilesMap = Object.fromEntries(perfiles.map((p: any) => [p.id, { nombre: p.nombre, apellido: p.apellido, email: p.correo_electronico }]));
        }
      }
      setEvaluaciones(((data || []) as any[]).map((v: any) => ({ ...v, perfiles: perfilesMap[v.usuario_id] || null })) as Evaluacion[]);
    } catch { /* silent */ } finally {
      setCargando(false);
    }
  };

  const cargarTutoriales = async () => {
    setCargandoTuts(true);
    try {
      const [{ data: tuts }, { data: partes }] = await Promise.all([
        supabase.from('tutoriales').select('id, titulo').eq('estado', 'publicado').order('titulo'),
        (supabase.from('partes_tutorial') as any).select('id, tutorial_id, monedas_recompensa').eq('tipo_contenido', 'evaluacion'),
      ]);
      const partesMap: Record<string, any> = {};
      (partes || []).forEach((p: any) => { partesMap[p.tutorial_id] = p; });
      const lista: TutorialConEval[] = (tuts || []).map((t: any) => ({
        id: t.id, titulo: t.titulo,
        tieneEvaluacion: !!partesMap[t.id],
        monedasRecompensa: partesMap[t.id]?.monedas_recompensa,
        parteEvalId: partesMap[t.id]?.id,
      }));
      setTutoriales(lista);
      const init: Record<string, number> = {};
      lista.forEach(t => { init[t.id] = t.monedasRecompensa ?? 5; });
      setMonedasMap(init);
    } catch { /* silent */ } finally {
      setCargandoTuts(false);
    }
  };

  const guardarMonedas = async (tutorialId: string, parteEvalId: string) => {
    setGuardandoMonedas(true);
    try {
      const { error } = await supabase.rpc('admin_actualizar_monedas_evaluacion' as any, {
        p_parte_id: parteEvalId,
        p_monedas: monedasMap[tutorialId] ?? 5,
      });
      if (error) throw error;
      setTutoriales(prev => prev.map(t => t.id === tutorialId
        ? { ...t, monedasRecompensa: monedasMap[tutorialId] } : t));
      setEditandoId(null);
      showToast('ok', '✅ Monedas actualizadas correctamente.');
    } catch {
      showToast('err', '❌ Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardandoMonedas(false);
    }
  };

  const cargarCursos = async () => {
    setCargandoCursos(true);
    try {
      const [{ data: cursosData }, { data: modulosData }, { data: evalLecciones }] = await Promise.all([
        (supabase.from('cursos') as any).select('id, titulo').order('titulo'),
        supabase.from('modulos').select('id, curso_id, titulo, orden').order('orden'),
        (supabase.from('lecciones') as any).select('id, modulo_id, monedas_recompensa').eq('tipo_contenido', 'evaluacion'),
      ]);
      const cursosMap: Record<string, string> = {};
      (cursosData || []).forEach((c: any) => { cursosMap[c.id] = c.titulo; });
      const evalMap: Record<string, any> = {};
      (evalLecciones || []).forEach((l: any) => { evalMap[l.modulo_id] = l; });
      const lista: ModuloConEval[] = (modulosData || [])
        .filter((m: any) => cursosMap[m.curso_id])
        .map((m: any) => ({
          id: m.id, cursoId: m.curso_id, cursoTitulo: cursosMap[m.curso_id],
          titulo: m.titulo, orden: m.orden,
          tieneEvaluacion: !!evalMap[m.id],
          leccionEvalId: evalMap[m.id]?.id,
          monedasRecompensa: evalMap[m.id]?.monedas_recompensa,
        }));
      setModulos(lista);
      const init: Record<string, number> = {};
      lista.forEach(m => { init[m.id] = m.monedasRecompensa ?? 5; });
      setMonedasMapCursos(init);
    } catch { /* silent */ } finally {
      setCargandoCursos(false);
    }
  };

  const agregarEvaluacionCurso = async (moduloId: string, cursoId: string) => {
    setAgregandoCurso(moduloId);
    try {
      const { error } = await supabase.rpc('agregar_evaluacion_modulo' as any, {
        p_modulo_id: moduloId,
        p_curso_id: cursoId,
        p_monedas: monedasMapCursos[moduloId] ?? 5,
      });
      if (error) throw error;
      await cargarCursos();
      showToast('ok', '✅ Evaluación añadida al módulo correctamente.');
    } catch {
      showToast('err', '❌ Error al añadir la evaluación. Intenta de nuevo.');
    } finally {
      setAgregandoCurso(null);
    }
  };

  const agregarEvaluacion = async (tutorialId: string) => {
    setAgregando(tutorialId);
    try {
      const { data: partes } = await supabase.from('partes_tutorial').select('orden').eq('tutorial_id', tutorialId).order('orden', { ascending: false }).limit(1);
      const maxOrden = ((partes || [])[0] as any)?.orden ?? 0;
      const { error } = await (supabase.from('partes_tutorial') as any).insert({
        tutorial_id: tutorialId,
        titulo: 'Evaluación Final',
        tipo_contenido: 'evaluacion',
        tipo_parte: 'evaluacion',
        orden: maxOrden + 1,
        visible: true,
        slug: `evaluacion-final-${tutorialId.slice(0, 8)}`,
        monedas_recompensa: monedasMap[tutorialId] ?? 10,
      });
      if (error) throw error;
      await cargarTutoriales();
      showToast('ok', '✅ Evaluación final añadida correctamente.');
    } catch {
      showToast('err', '❌ Error al añadir la evaluación. Intenta de nuevo.');
    } finally {
      setAgregando(null);
    }
  };

  const abrirRevision = (ev: Evaluacion) => {
    setEvalActual(ev);
    setNuevoEstado(ev.estado === 'pendiente' ? 'aprobado' : ev.estado);
    setComentario(ev.comentario_profesor || '');
    setOtorgarFase1(ev.fase1_otorgada);
    setOtorgarFase2(ev.fase2_otorgada);
    setModalAbierto(true);
  };
  const cerrarRevision = () => { setModalAbierto(false); setEvalActual(null); };

  const guardarRevision = async () => {
    if (!evalActual || !usuario?.id) return;
    setGuardando(true);
    try {
      const { error } = await (supabase.from('validaciones_tutorial') as any)
        .update({ estado: nuevoEstado, comentario_profesor: comentario, fase1_otorgada: otorgarFase1, fase2_otorgada: otorgarFase2, profesor_id: usuario.id })
        .eq('id', evalActual.id);
      if (error) throw error;

      const email = evalActual.perfiles?.email;
      if (email) {
        const parteNombre = evalActual.partes_tutorial?.titulo || 'Evaluación Final';
        const estadoLabel = nuevoEstado === 'aprobado' ? 'aprobado ✅' : nuevoEstado === 'rechazado' ? 'rechazado ❌' : 'en revisión 🔍';
        const monedasMsg = [otorgarFase1 && `+${evalActual.monedas_fase1} 🪙`, otorgarFase2 && `+${evalActual.monedas_fase2} 🪙 bonus`].filter(Boolean).join(' · ');
        supabase.functions.invoke('enviar-email', {
          body: {
            tipo: 'personalizado', destinatario: email, nombre: evalActual.perfiles?.nombre || '',
            extra: {
              asunto: `Tu evaluación de "${evalActual.tutoriales?.titulo}" fue calificada`,
              mensaje: `Tu "${parteNombre}" del tutorial "${evalActual.tutoriales?.titulo}" ha sido revisada.\n\nEstado: ${estadoLabel}${monedasMsg ? `\nMonedas: ${monedasMsg}` : ''}${comentario ? `\n\nComentario del profesor:\n${comentario}` : ''}\n\nRevisa tu progreso en la plataforma.`,
            },
          },
        }).catch(() => {});
      }

      setEvaluaciones(prev => prev.map(v => v.id === evalActual.id ? { ...v, estado: nuevoEstado, comentario_profesor: comentario, fase1_otorgada: otorgarFase1, fase2_otorgada: otorgarFase2 } : v));
      cerrarRevision();
      showToast('ok', '✅ Evaluación guardada. El estudiante fue notificado.');
    } catch {
      showToast('err', '❌ Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const listaFiltrada = tab === 'todas'
    ? evaluaciones
    : evaluaciones.filter(e => e.estado === 'pendiente');

  return (
    <div className="va-root">

      {/* Toast */}
      {toast && (
        <div className={`va-toast ${toast.tipo === 'ok' ? 'va-toast-ok' : 'va-toast-err'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="va-page-header">
        <div>
          <h1 className="va-page-title">Panel de Evaluaciones</h1>
          <p className="va-page-sub">Revisa, califica y gestiona las evaluaciones de los estudiantes</p>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="va-stats-row">
        {[
          { key: 'pendiente', label: 'Pendientes', icon: '⏳' },
          { key: 'en_revision', label: 'En Revisión', icon: '🔍' },
          { key: 'aprobado', label: 'Aprobadas', icon: '✅' },
          { key: 'rechazado', label: 'Rechazadas', icon: '❌' },
        ].map(s => (
          <div key={s.key} className={`va-stat-card va-stat-${s.key}`}>
            <span className="va-stat-icon">{s.icon}</span>
            <div>
              <div className="va-stat-num">{stats[s.key as keyof typeof stats]}</div>
              <div className="va-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="va-tabs">
        <button className={`va-tab ${tab === 'pendientes' ? 'va-tab-active' : ''}`} onClick={() => setTab('pendientes')}>
          ⏳ Pendientes {stats.pendiente > 0 && <span className="va-tab-badge">{stats.pendiente}</span>}
        </button>
        <button className={`va-tab ${tab === 'todas' ? 'va-tab-active' : ''}`} onClick={() => setTab('todas')}>
          📋 Todas las Evaluaciones
        </button>
        <button className={`va-tab ${tab === 'configurar' ? 'va-tab-active' : ''}`} onClick={() => setTab('configurar')}>
          ⚙️ Configurar Tutoriales
        </button>
        <button className={`va-tab ${tab === 'configurar_cursos' ? 'va-tab-active' : ''}`} onClick={() => setTab('configurar_cursos')}>
          🎓 Configurar Cursos
        </button>
      </div>

      {/* ── Tab: Evaluaciones ─────────────────────────────────────── */}
      {(tab === 'pendientes' || tab === 'todas') && (
        <div className="va-panel">
          {cargando ? (
            <div className="va-empty"><div className="va-spinner" /><p>Cargando evaluaciones...</p></div>
          ) : listaFiltrada.length === 0 ? (
            <div className="va-empty">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
              <p style={{ fontWeight: 600, color: '#1e293b' }}>
                {tab === 'pendientes' ? '¡Todo al día! No hay evaluaciones pendientes.' : 'No hay evaluaciones aún.'}
              </p>
            </div>
          ) : (
            <div className="va-cards-list">
              {listaFiltrada.map(ev => {
                const videoAbierto = videoAbiertoId === ev.id;
                const embed = getVideoEmbed(ev.video_url);
                return (
                  <div key={ev.id} className="va-eval-card">
                    <div className="va-eval-card-main">
                      <div className="va-eval-card-left">
                        <Initials nombre={ev.perfiles?.nombre} apellido={ev.perfiles?.apellido} />
                        <div className="va-eval-info">
                          <div className="va-eval-alumno">
                            {ev.perfiles?.nombre || 'Alumno'} {ev.perfiles?.apellido || ''}
                          </div>
                          <div className="va-eval-email">{ev.perfiles?.email}</div>
                          <div className="va-eval-tutorial">
                            📚 {ev.tutoriales?.titulo || 'Tutorial'}
                            {ev.partes_tutorial?.titulo && <span className="va-eval-parte"> · 🎯 {ev.partes_tutorial.titulo}</span>}
                          </div>
                          <div className="va-eval-fecha">{new Date(ev.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div className="va-eval-card-right">
                        <span className="va-badge" style={{ background: ESTADO_COLOR[ev.estado] + '20', color: ESTADO_COLOR[ev.estado], borderColor: ESTADO_COLOR[ev.estado] + '40' }}>
                          {ESTADO_LABEL[ev.estado] || ev.estado}
                        </span>
                        {(ev.fase1_otorgada || ev.fase2_otorgada) && (
                          <span className="va-monedas-tag">
                            🪙 {(ev.fase1_otorgada ? ev.monedas_fase1 : 0) + (ev.fase2_otorgada ? ev.monedas_fase2 : 0)}
                          </span>
                        )}
                        <div className="va-eval-actions">
                          <button className="va-btn-video" onClick={() => setVideoAbiertoId(videoAbierto ? null : ev.id)}>
                            {videoAbierto ? '▲ Ocultar video' : '▶ Ver Video'}
                          </button>
                          <button className="va-btn-primary" onClick={() => abrirRevision(ev)}>
                            {ev.estado === 'pendiente' || ev.estado === 'en_revision' ? '✏️ Evaluar' : '🔄 Editar'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {videoAbierto && (
                      <div className="va-eval-video-wrapper">
                        {embed.tipo === 'iframe'
                          ? <iframe src={embed.src} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="Video alumno" />
                          : <video src={embed.src} controls style={{ width: '100%', height: '100%' }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Configurar tutoriales ─────────────────────────────── */}
      {tab === 'configurar' && (
        <div className="va-panel">
          <div className="va-config-header">
            <h2>Añadir Evaluación Final a Tutoriales</h2>
            <p>Los tutoriales sin evaluación permiten completarse al 100% solo viendo videos. Al añadir una evaluación, el estudiante debe enviar un video y ser aprobado para llegar al 100%.</p>
          </div>
          {cargandoTuts ? (
            <div className="va-empty"><div className="va-spinner" /><p>Cargando tutoriales...</p></div>
          ) : tutoriales.length === 0 ? (
            <div className="va-empty"><p>No hay tutoriales publicados.</p></div>
          ) : (
            <div className="va-config-grid">
              {tutoriales.map(tut => (
                <div key={tut.id} className={`va-config-card ${tut.tieneEvaluacion ? 'va-config-card-done' : ''}`}>
                  <div className="va-config-card-body">
                    <div className="va-config-icon">{tut.tieneEvaluacion ? '✅' : '📚'}</div>
                    <div className="va-config-info">
                      <div className="va-config-titulo">{tut.titulo}</div>
                      {tut.tieneEvaluacion ? (
                        <div className="va-config-status-ok">
                          Evaluación activa · {editandoId === tut.id ? monedasMap[tut.id] : tut.monedasRecompensa} 🪙
                        </div>
                      ) : (
                        <div className="va-config-status-none">Sin evaluación final</div>
                      )}
                    </div>
                  </div>
                  <div className="va-config-card-footer">
                    <label>{tut.tieneEvaluacion ? 'Monedas:' : 'Monedas de recompensa:'}</label>
                    <input
                      type="number" min={0}
                      value={monedasMap[tut.id] ?? 5}
                      onChange={e => { setMonedasMap(prev => ({ ...prev, [tut.id]: parseInt(e.target.value) || 0 })); setEditandoId(tut.id); }}
                      className="va-monedas-input"
                    />
                    {tut.tieneEvaluacion ? (
                      editandoId === tut.id && (
                        <button
                          onClick={() => guardarMonedas(tut.id, tut.parteEvalId!)}
                          disabled={guardandoMonedas}
                          className="va-btn-primary"
                        >
                          {guardandoMonedas ? '...' : '💾 Guardar'}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => agregarEvaluacion(tut.id)}
                        disabled={agregando === tut.id}
                        className="va-btn-primary"
                      >
                        {agregando === tut.id ? 'Añadiendo...' : '+ Añadir'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Configurar Cursos ────────────────────────────────── */}
      {tab === 'configurar_cursos' && (
        <div className="va-panel">
          <div className="va-config-header">
            <h2>Añadir Evaluación Final a Módulos de Cursos</h2>
            <p>Selecciona en qué módulos de los cursos los estudiantes deben enviar un video de evaluación para completarlo al 100%. Al aprobar el video, el estudiante recibe monedas y XP.</p>
          </div>
          {cargandoCursos ? (
            <div className="va-empty"><div className="va-spinner" /><p>Cargando módulos...</p></div>
          ) : modulos.length === 0 ? (
            <div className="va-empty"><p>No hay módulos disponibles.</p></div>
          ) : (() => {
            const porCurso: Record<string, ModuloConEval[]> = {};
            modulos.forEach(m => {
              if (!porCurso[m.cursoId]) porCurso[m.cursoId] = [];
              porCurso[m.cursoId].push(m);
            });
            return Object.entries(porCurso).map(([cursoId, mods]) => (
              <div key={cursoId} style={{ marginBottom: '2rem' }}>
                <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                  🎓 {mods[0].cursoTitulo}
                </div>
                <div className="va-config-grid">
                  {mods.map(mod => (
                    <div key={mod.id} className={`va-config-card ${mod.tieneEvaluacion ? 'va-config-card-done' : ''}`}>
                      <div className="va-config-card-body">
                        <div className="va-config-icon">{mod.tieneEvaluacion ? '✅' : '📂'}</div>
                        <div className="va-config-info">
                          <div className="va-config-titulo">Módulo {mod.orden}: {mod.titulo}</div>
                          {mod.tieneEvaluacion ? (
                            <div className="va-config-status-ok">Evaluación activa · {mod.monedasRecompensa} 🪙 de recompensa</div>
                          ) : (
                            <div className="va-config-status-none">Sin evaluación final</div>
                          )}
                        </div>
                      </div>
                      {!mod.tieneEvaluacion && (
                        <div className="va-config-card-footer">
                          <label>Monedas:</label>
                          <input
                            type="number" min={0}
                            value={monedasMapCursos[mod.id] ?? 5}
                            onChange={e => setMonedasMapCursos(prev => ({ ...prev, [mod.id]: parseInt(e.target.value) || 0 }))}
                            className="va-monedas-input"
                          />
                          <button
                            onClick={() => agregarEvaluacionCurso(mod.id, mod.cursoId)}
                            disabled={agregandoCurso === mod.id}
                            className="va-btn-primary"
                          >
                            {agregandoCurso === mod.id ? 'Añadiendo...' : '+ Añadir'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Modal de revisión ─────────────────────────────────────── */}
      {modalAbierto && evalActual && (
        <div className="va-modal-backdrop">
          <div className="va-modal">
            <div className="va-modal-header">
              <div>
                <h2 className="va-modal-title">Calificar Evaluación</h2>
                <p className="va-modal-sub">{evalActual.tutoriales?.titulo} {evalActual.partes_tutorial?.titulo ? `· ${evalActual.partes_tutorial.titulo}` : ''}</p>
              </div>
              <button className="va-modal-close" onClick={cerrarRevision}>✕</button>
            </div>

            <div className="va-modal-body">
              {/* Alumno */}
              <div className="va-modal-alumno">
                <Initials nombre={evalActual.perfiles?.nombre} apellido={evalActual.perfiles?.apellido} />
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {evalActual.perfiles?.nombre} {evalActual.perfiles?.apellido}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{evalActual.perfiles?.email}</div>
                </div>
                <VideoModalBtn url={evalActual.video_url} />
              </div>

              {/* Decisión */}
              <div className="va-modal-section">
                <label className="va-label">Decisión</label>
                <div className="va-decision-grid">
                  {[
                    { val: 'aprobado', icon: '✅', label: 'Aprobado', desc: 'Excelente ejecución' },
                    { val: 'en_revision', icon: '🔍', label: 'En Revisión', desc: 'Necesita correcciones' },
                    { val: 'rechazado', icon: '❌', label: 'Rechazado', desc: 'No superado' },
                  ].map(op => (
                    <button
                      key={op.val} type="button"
                      className={`va-decision-btn ${nuevoEstado === op.val ? 'va-decision-active' : ''}`}
                      onClick={() => setNuevoEstado(op.val)}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{op.icon}</span>
                      <span style={{ fontWeight: 700 }}>{op.label}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{op.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monedas */}
              <div className="va-modal-section">
                <label className="va-label">Otorgar Monedas</label>
                <div className="va-monedas-checks">
                  <label className="va-check-label">
                    <input type="checkbox" checked={otorgarFase1} onChange={e => setOtorgarFase1(e.target.checked)} />
                    <span>Recompensa principal — <strong>+{evalActual.monedas_fase1} 🪙</strong></span>
                  </label>
                  {evalActual.monedas_fase2 > 0 && (
                    <label className="va-check-label">
                      <input type="checkbox" checked={otorgarFase2} onChange={e => setOtorgarFase2(e.target.checked)} />
                      <span>Bonus extra — <strong>+{evalActual.monedas_fase2} 🪙</strong></span>
                    </label>
                  )}
                </div>
              </div>

              {/* Comentario */}
              <div className="va-modal-section">
                <label className="va-label">Comentario / Retroalimentación</label>
                <textarea
                  className="va-textarea"
                  rows={4}
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="Escribe tu retroalimentación detallada para el estudiante..."
                />
              </div>
            </div>

            <div className="va-modal-footer">
              <button className="va-btn-cancel" onClick={cerrarRevision} disabled={guardando}>Cancelar</button>
              <button className="va-btn-save" onClick={guardarRevision} disabled={guardando}>
                {guardando ? 'Guardando...' : '💾 Guardar y Notificar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
