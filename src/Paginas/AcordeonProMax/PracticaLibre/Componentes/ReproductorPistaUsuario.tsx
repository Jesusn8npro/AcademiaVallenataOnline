'use client';

import * as React from 'react';
import {
  Play, Pause, Square, ArrowLeft, Gauge, Music3, RotateCcw, Save, Repeat, Key,
  Plus, Trash2, MapPin, Flag, Pencil, X, Check, Loader2, Mic, Disc3, Volume2, Crown,
} from 'lucide-react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { ReproductorSoundTouch } from '../../../../Core/audio/ReproductorSoundTouch';
import {
  actualizarPistaUsuario, obtenerUrlFirmada,
  type PistaUsuario, type SeccionPistaUsuario, type ConfigPistaUsuario,
} from '../Servicios/servicioPistasUsuario';
import {
  listarGrabacionesPorPista, crearGrabacionUsuario, eliminarGrabacionUsuario,
  contarGrabacionesUsuario, type GrabacionUsuario,
} from '../Servicios/servicioGrabacionesUsuario';
import { detectarTono } from '../Utilidades/detectorTono';
import { useCapturaGrabacionPista } from '../Hooks/useCapturaGrabacionPista';
import { useReproduccionGrabacion } from '../Hooks/useReproduccionGrabacion';
import { useLogicaAcordeonCtx } from '../contextoLogicaAcordeon';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import { obtenerLimiteGrabaciones, LIMITE_GRABACIONES_FREE } from '../../../../config/limitesPlan';

interface Props {
  pista: PistaUsuario;
  onVolver: () => void;
  /** Notifica al padre cuando se actualizan secciones/config (para refrescar la lista). */
  onCambios?: (cambios: Partial<PistaUsuario>) => void;
}

function fmt(seg: number): string {
  if (!isFinite(seg) || seg < 0) seg = 0;
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const PALETA = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];

const ReproductorPistaUsuario: React.FC<Props> = ({ pista, onVolver, onCambios }) => {
  const reproductorRef = React.useRef<ReproductorSoundTouch | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [segActual, setSegActual] = React.useState(0);
  const [duracion, setDuracion] = React.useState(pista.duracion_seg || 0);
  // arrastrandoSlider evita que el RAF del SoundTouch sobreescriba la posición mientras el usuario arrastra
  const arrastrandoRef = React.useRef(false);

  const [velocidad, setVelocidad] = React.useState<number>(pista.config?.velocidad ?? 1);
  const [semitonos, setSemitonos] = React.useState<number>(pista.config?.semitonos ?? 0);
  const [tonalidad, setTonalidad] = React.useState<string>(pista.config?.tonalidad ?? '');
  const [tonalidadConfianza, setTonalidadConfianza] = React.useState<number>(pista.config?.tonalidadConfianza ?? 0);
  const [editandoTono, setEditandoTono] = React.useState(false);
  const [detectandoTono, setDetectandoTono] = React.useState<{ activo: boolean; pct: number }>({ activo: false, pct: 0 });

  const [secciones, setSecciones] = React.useState<SeccionPistaUsuario[]>(pista.secciones || []);
  const [seccionLoopId, setSeccionLoopId] = React.useState<string | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [guardado, setGuardado] = React.useState(false);

  // Marcado de secciones — vivido en el reproductor (no en componente hijo) para mostrar
  // los markers en la timeline arriba.
  const [marcaInicio, setMarcaInicio] = React.useState<number | null>(null);
  const [marcaFin, setMarcaFin] = React.useState<number | null>(null);
  const [nombreNueva, setNombreNueva] = React.useState('');
  const [editandoSeccionId, setEditandoSeccionId] = React.useState<string | null>(null);
  const [nombreEdicion, setNombreEdicion] = React.useState('');

  // ─────────────── Grabaciones del alumno ───────────────
  const { usuario } = useUsuario();
  // Ref estable a la lógica del acordeón (el valor real se lee con .current).
  const logicaAcordeonRef = useLogicaAcordeonCtx();
  const [tabPanel, setTabPanel] = React.useState<'secciones' | 'grabaciones'>('secciones');
  const [grabaciones, setGrabaciones] = React.useState<GrabacionUsuario[]>([]);
  const [cargandoGrabaciones, setCargandoGrabaciones] = React.useState(false);
  const [limiteGrabaciones, setLimiteGrabaciones] = React.useState<number>(LIMITE_GRABACIONES_FREE);
  const [esPremium, setEsPremium] = React.useState(false);
  const [totalGrabacionesUsuario, setTotalGrabacionesUsuario] = React.useState(0);
  const [reproduciendoGrabacionId, setReproduciendoGrabacionId] = React.useState<string | null>(null);
  const [eventosReproduciendose, setEventosReproduciendose] = React.useState<any[]>([]);
  const [mostrarDialogoGuardar, setMostrarDialogoGuardar] = React.useState(false);
  const [tituloGrabacionNueva, setTituloGrabacionNueva] = React.useState('');
  const [guardandoGrabacion, setGuardandoGrabacion] = React.useState(false);
  const [volumenAcordeonRepro, setVolumenAcordeonRepro] = React.useState(0.85);

  const captura = useCapturaGrabacionPista(reproductorRef);
  useReproduccionGrabacion({
    activo: reproduciendoGrabacionId !== null,
    eventos: eventosReproduciendose,
    reproductorRef,
    logicaRef: logicaAcordeonRef,
  });

  // Volumen del acordeón durante la mezcla: solo aplica MIENTRAS hay una grabación
  // reproduciéndose. Sin restaurar valor previo — el useEffect de useEstudioPracticaLibre
  // se vuelve a disparar y restaura el volumen del estudio cuando cambia preferencias.
  React.useEffect(() => {
    if (reproduciendoGrabacionId === null) return;
    try { motorAudioPro.setVolumenMaestro(volumenAcordeonRepro); } catch (_) {}
  }, [volumenAcordeonRepro, reproduciendoGrabacionId]);

  const refrescarGrabaciones = React.useCallback(async () => {
    if (!usuario?.id) return;
    setCargandoGrabaciones(true);
    try {
      const [lista, info, total] = await Promise.all([
        listarGrabacionesPorPista(pista.id),
        obtenerLimiteGrabaciones(usuario.id),
        contarGrabacionesUsuario(usuario.id),
      ]);
      setGrabaciones(lista);
      setLimiteGrabaciones(info.limite);
      setEsPremium(info.esPremium);
      setTotalGrabacionesUsuario(total);
    } catch (e) {
      console.error('[ReproductorPistaUsuario] error grabaciones', e);
    } finally {
      setCargandoGrabaciones(false);
    }
  }, [usuario?.id, pista.id]);

  React.useEffect(() => { void refrescarGrabaciones(); }, [refrescarGrabaciones]);

  const enLimiteGrabaciones = totalGrabacionesUsuario >= limiteGrabaciones;

  // ─────────────── Cargar audio ───────────────
  React.useEffect(() => {
    let vivo = true;
    const repro = new ReproductorSoundTouch(motorAudioPro.contextoAudio);
    reproductorRef.current = repro;

    (async () => {
      try {
        const url = await obtenerUrlFirmada(pista.storage_path);
        if (!vivo) return;
        await repro.cargarUrl(url);
        if (!vivo) return;
        repro.setVelocidad(velocidad);
        repro.setSemitonos(semitonos);
        setDuracion(repro.duration);
        setCargando(false);
      } catch (e: any) {
        if (!vivo) return;
        setError(e?.message || 'No se pudo cargar la canción.');
        setCargando(false);
      }
    })();

    const offTime = repro.onTimeUpdate((t) => {
      if (!arrastrandoRef.current) setSegActual(t.seg);
    });
    const offFin = repro.onFin(() => {
      setReproduciendo(false);
    });

    return () => {
      vivo = false;
      offTime();
      offFin();
      repro.destruir();
      if (reproductorRef.current === repro) reproductorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pista.id]);

  // ─────────────── Controles transporte ───────────────
  const togglePlay = React.useCallback(async () => {
    const r = reproductorRef.current;
    if (!r) return;
    if (reproduciendo) {
      r.pause();
      setReproduciendo(false);
    } else {
      await r.play();
      setReproduciendo(true);
    }
  }, [reproduciendo]);

  const detener = React.useCallback(() => {
    const r = reproductorRef.current;
    if (!r) return;
    r.pause();
    r.seekSeg(0);
    r.quitarLoop();
    setSeccionLoopId(null);
    setReproduciendo(false);
    setSegActual(0);
  }, []);

  const seek = React.useCallback((seg: number) => {
    const r = reproductorRef.current;
    if (!r) return;
    r.seekSeg(seg);
    setSegActual(seg);
  }, []);

  // ─────────────── Velocidad / tono ───────────────
  const cambiarVelocidad = React.useCallback((v: number) => {
    setVelocidad(v);
    setGuardado(false);
    reproductorRef.current?.setVelocidad(v);
  }, []);

  const cambiarSemitonos = React.useCallback((n: number) => {
    setSemitonos(n);
    setGuardado(false);
    reproductorRef.current?.setSemitonos(n);
  }, []);

  // ─────────────── Detector de tono on-demand ───────────────
  const detectarTonoOnDemand = React.useCallback(async () => {
    const r = reproductorRef.current;
    const buf = r?.audioBuffer;
    if (!buf) return;
    setDetectandoTono({ activo: true, pct: 0 });
    try {
      const tono = await detectarTono(buf, {
        onProgreso: (pct) => setDetectandoTono({ activo: true, pct }),
      });
      setTonalidad(tono.etiqueta);
      setTonalidadConfianza(tono.confianza);
      setGuardado(false);
    } catch (e: any) {
      setError(`No se pudo detectar el tono: ${e?.message || 'error'}`);
    } finally {
      setDetectandoTono({ activo: false, pct: 0 });
    }
  }, []);

  // ─────────────── Loops / secciones ───────────────
  const loopearSeccion = React.useCallback((s: SeccionPistaUsuario) => {
    const r = reproductorRef.current;
    if (!r) return;
    const inicio = s.tickInicio / 1000;
    const fin = s.tickFin / 1000;
    r.setLoop(inicio, fin);
    r.seekSeg(inicio);
    setSegActual(inicio);
    setSeccionLoopId(s.id);
    if (!reproduciendo) {
      void r.play();
      setReproduciendo(true);
    }
  }, [reproduciendo]);

  const quitarLoop = React.useCallback(() => {
    reproductorRef.current?.quitarLoop();
    setSeccionLoopId(null);
  }, []);

  const segAMs = (s: number) => Math.round(s * 1000);
  const msASeg = (ms: number) => ms / 1000;

  const puedeAgregar = !!nombreNueva.trim() && marcaInicio != null && marcaFin != null && marcaFin > marcaInicio;
  const agregarSeccion = () => {
    if (!puedeAgregar || marcaInicio == null || marcaFin == null) return;
    const nueva: SeccionPistaUsuario = {
      id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      nombre: nombreNueva.trim(),
      tickInicio: segAMs(marcaInicio),
      tickFin: segAMs(marcaFin),
    };
    setSecciones((prev) => [...prev, nueva].sort((a, b) => a.tickInicio - b.tickInicio));
    setNombreNueva('');
    setMarcaInicio(null);
    setMarcaFin(null);
    setGuardado(false);
  };

  const eliminarSeccion = (id: string) => {
    setSecciones((prev) => prev.filter((s) => s.id !== id));
    if (seccionLoopId === id) quitarLoop();
    setGuardado(false);
  };

  const guardarEdicionSeccion = (id: string) => {
    setSecciones((prev) => prev.map((s) => (s.id === id ? { ...s, nombre: nombreEdicion.trim() || 'Sin nombre' } : s)));
    setEditandoSeccionId(null);
    setGuardado(false);
  };

  // ─────────────── Guardar todo ───────────────
  const guardarTodo = React.useCallback(async () => {
    setGuardando(true);
    try {
      const config: ConfigPistaUsuario = {
        velocidad,
        semitonos,
        loopActivo: seccionLoopId !== null,
        ultimaSeccionId: seccionLoopId,
        bpm: pista.config?.bpm,
        tonalidad: tonalidad || undefined,
        tonalidadConfianza: tonalidad ? tonalidadConfianza : undefined,
      };
      await actualizarPistaUsuario(pista.id, { secciones, config });
      setGuardado(true);
      onCambios?.({ secciones, config });
      window.setTimeout(() => setGuardado(false), 2000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  }, [pista.id, pista.config?.bpm, velocidad, semitonos, secciones, seccionLoopId, tonalidad, tonalidadConfianza, onCambios]);

  const seccionActivaIdx = secciones.findIndex((s) => {
    const ini = s.tickInicio / 1000;
    const fin = s.tickFin / 1000;
    return segActual >= ini && segActual < fin;
  });

  // ─────────────── Handlers de grabación REC ───────────────
  const iniciarGrabacionRec = React.useCallback(async () => {
    if (enLimiteGrabaciones && !esPremium) return;
    // Detener cualquier reproducción de grabación previa
    if (reproduciendoGrabacionId) {
      setReproduciendoGrabacionId(null);
      setEventosReproduciendose([]);
    }
    // Reiniciamos la pista al inicio para que el alumno empiece desde 0 (más predecible)
    const r = reproductorRef.current;
    if (r) {
      r.seekSeg(0);
      setSegActual(0);
      await r.play();
      setReproduciendo(true);
    }
    captura.iniciar();
  }, [captura, enLimiteGrabaciones, esPremium, reproduciendoGrabacionId]);

  const detenerGrabacionRec = React.useCallback(() => {
    const eventos = captura.detener();
    // Pausa la pista para que el alumno revise
    const r = reproductorRef.current;
    if (r) { r.pause(); setReproduciendo(false); }
    if (eventos.length > 0) {
      setTituloGrabacionNueva(`Mi grabación ${new Date().toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`);
      setMostrarDialogoGuardar(true);
    } else {
      // Si no capturó nada, no abre el diálogo
      captura.cancelar();
    }
  }, [captura]);

  const guardarGrabacion = React.useCallback(async () => {
    const eventos = captura.eventos;
    if (eventos.length === 0) return;
    setGuardandoGrabacion(true);
    try {
      await crearGrabacionUsuario({
        pista_id: pista.id,
        titulo: tituloGrabacionNueva.trim() || 'Mi grabación',
        secuencia_json: eventos,
        duracion_seg: eventos[eventos.length - 1].ms / 1000,
        config: {
          tonalidad: logicaAcordeonRef?.current?.tonalidadSeleccionada,
          instrumentoId: logicaAcordeonRef?.current?.instrumentoId,
          velocidad,
          semitonos,
          volumenAcordeon: volumenAcordeonRepro,
          volumenPista: 0.85,
        },
      });
      captura.cancelar();
      setMostrarDialogoGuardar(false);
      setTituloGrabacionNueva('');
      await refrescarGrabaciones();
      setTabPanel('grabaciones');
    } catch (e: any) {
      setError(`No se pudo guardar la grabación: ${e?.message || 'error'}`);
    } finally {
      setGuardandoGrabacion(false);
    }
  }, [captura, pista.id, tituloGrabacionNueva, velocidad, semitonos, volumenAcordeonRepro, logicaAcordeonRef, refrescarGrabaciones]);

  const descartarGrabacionPendiente = React.useCallback(() => {
    captura.cancelar();
    setMostrarDialogoGuardar(false);
    setTituloGrabacionNueva('');
  }, [captura]);

  const reproducirGrabacion = React.useCallback(async (g: GrabacionUsuario) => {
    // Detener cualquier captura activa
    if (captura.grabando) captura.cancelar();
    setEventosReproduciendose(g.secuencia_json || []);
    setReproduciendoGrabacionId(g.id);
    // Arrancar la pista desde el inicio para sincronía con los eventos
    const r = reproductorRef.current;
    if (r) {
      r.seekSeg(0);
      setSegActual(0);
      await r.play();
      setReproduciendo(true);
    }
  }, [captura]);

  const detenerReproduccionGrabacion = React.useCallback(() => {
    setReproduciendoGrabacionId(null);
    setEventosReproduciendose([]);
    const r = reproductorRef.current;
    if (r) { r.pause(); setReproduciendo(false); }
  }, []);

  const eliminarGrabacion = React.useCallback(async (g: GrabacionUsuario) => {
    if (!confirm(`¿Eliminar "${g.titulo}"?`)) return;
    try {
      if (reproduciendoGrabacionId === g.id) detenerReproduccionGrabacion();
      await eliminarGrabacionUsuario(g.id);
      await refrescarGrabaciones();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e?.message || 'error'}`);
    }
  }, [reproduciendoGrabacionId, detenerReproduccionGrabacion, refrescarGrabaciones]);

  // ─────────────── UI ───────────────
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#fca5a5' }}>
        <button onClick={onVolver} style={btnVolver}><ArrowLeft size={14} /> Volver</button>
        <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: volver + título + tonalidad + guardar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onVolver} style={btnVolver} title="Volver a la lista">
          <ArrowLeft size={14} /> Volver
        </button>
        <button onClick={guardarTodo} disabled={guardando} style={{
          background: guardado ? '#22c55e' : 'rgba(59, 130, 246, 0.25)',
          border: '1px solid #3b82f6', color: 'white', borderRadius: 6,
          padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
          marginLeft: 'auto',
        }} title="Guardar velocidad, tono, tonalidad y secciones">
          <Save size={11} /> {guardando ? 'Guardando…' : guardado ? 'Guardado ✓' : 'Guardar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
          Mi pista
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', wordBreak: 'break-word' }}>{pista.titulo}</div>
      </div>

      {/* Tonalidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {editandoTono ? (
          <input
            value={tonalidad}
            onChange={(e) => { setTonalidad(e.target.value); setGuardado(false); }}
            onBlur={() => setEditandoTono(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditandoTono(false); }}
            placeholder="Ej: Sol mayor"
            autoFocus
            style={{
              background: 'rgba(0,0,0,0.4)', color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: 5,
              padding: '4px 8px', fontSize: 12, width: 130,
            }}
          />
        ) : (
          <span
            onClick={() => setEditandoTono(true)}
            title="Click para editar manualmente"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              background: tonalidad ? (tonalidadConfianza >= 0.5 ? 'rgba(34, 197, 94, 0.18)' : 'rgba(251, 191, 36, 0.18)') : 'rgba(255,255,255,0.06)',
              color: tonalidad ? (tonalidadConfianza >= 0.5 ? '#22c55e' : '#fbbf24') : '#94a3b8',
              border: `1px solid ${tonalidad ? (tonalidadConfianza >= 0.5 ? '#22c55e' : '#fbbf24') : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
            }}
          >
            <Key size={11} /> {tonalidad || 'Sin tonalidad'}
            {tonalidad && (
              <span style={{ opacity: 0.7, fontSize: 10, marginLeft: 4 }}>
                {Math.round(tonalidadConfianza * 100)}%
              </span>
            )}
          </span>
        )}
        <button
          onClick={detectarTonoOnDemand}
          disabled={detectandoTono.activo || cargando}
          style={btnDetectarTono}
          title="Analizar el audio y detectar la tonalidad"
        >
          {detectandoTono.activo ? <Loader2 size={11} className="anim-spin" /> : <Key size={11} />}
          {detectandoTono.activo ? `Detectando… ${detectandoTono.pct}%` : 'Detectar tono'}
        </button>
      </div>

      {/* Timeline con secciones + markers de inicio/fin */}
      <div style={{ position: 'relative', height: 50, marginTop: 6 }}>
        {/* Sección track */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22, pointerEvents: 'none' }}>
          {secciones.map((s, i) => {
            const inicio = s.tickInicio / 1000;
            const fin = s.tickFin / 1000;
            const left = duracion > 0 ? (inicio / duracion) * 100 : 0;
            const width = duracion > 0 ? ((fin - inicio) / duracion) * 100 : 0;
            const color = PALETA[i % PALETA.length];
            return (
              <div key={s.id} title={s.nombre} style={{
                position: 'absolute', left: `${left}%`, width: `${Math.max(width, 0.4)}%`, top: 0, bottom: 0,
                background: color + '33', borderLeft: `2px solid ${color}`, borderRadius: 3,
                display: 'flex', alignItems: 'center', paddingLeft: 4,
                fontSize: 9, color, fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                {width > 6 && s.nombre}
              </div>
            );
          })}
        </div>

        {/* Markers pendientes de inicio/fin de nueva sección */}
        {marcaInicio != null && duracion > 0 && (
          <div style={{
            position: 'absolute', left: `${(marcaInicio / duracion) * 100}%`, top: 0, height: 22, width: 3,
            background: '#3b82f6', borderRadius: 2, pointerEvents: 'none',
            boxShadow: '0 0 6px #3b82f6',
          }} title={`Inicio marcado: ${fmt(marcaInicio)}`}>
            <span style={{ position: 'absolute', top: -16, left: -6, fontSize: 9, color: '#3b82f6', fontWeight: 700 }}>A</span>
          </div>
        )}
        {marcaFin != null && duracion > 0 && (
          <div style={{
            position: 'absolute', left: `${(marcaFin / duracion) * 100}%`, top: 0, height: 22, width: 3,
            background: '#a855f7', borderRadius: 2, pointerEvents: 'none',
            boxShadow: '0 0 6px #a855f7',
          }} title={`Fin marcado: ${fmt(marcaFin)}`}>
            <span style={{ position: 'absolute', top: -16, left: -6, fontSize: 9, color: '#a855f7', fontWeight: 700 }}>B</span>
          </div>
        )}

        {/* Cabeza de reproducción */}
        <div style={{
          position: 'absolute',
          left: `${duracion > 0 ? (segActual / duracion) * 100 : 0}%`,
          top: 0, height: 22, width: 2, background: '#22c55e',
          boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)', pointerEvents: 'none', transform: 'translateX(-1px)',
        }} />

        {/* Slider de seek
            - Durante el arrastre: solo actualiza el state visual (no toca el audio).
            - Al soltar: dispara el seek REAL usando el valor del DOM (no segActual, que es
              state asincrónico y puede llegar desfasado). */}
        <input
          type="range" min={0} max={duracion || 1} step={0.05} value={segActual}
          onPointerDown={(e) => {
            arrastrandoRef.current = true;
            (e.currentTarget as HTMLInputElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={(e) => {
            arrastrandoRef.current = false;
            const v = Number((e.currentTarget as HTMLInputElement).value);
            seek(v);
          }}
          onPointerCancel={() => { arrastrandoRef.current = false; }}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSegActual(v);
            // Teclado / cambios sin arrastre (al hacer foco + flechas): aplica seek directo.
            if (!arrastrandoRef.current) seek(v);
          }}
          disabled={cargando}
          style={{ position: 'absolute', top: 22, left: 0, right: 0, width: '100%', height: 18, cursor: 'pointer', opacity: 0.85, zIndex: 2 }}
        />
      </div>

      {/* Transporte + REC */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={togglePlay} disabled={cargando || captura.grabando} style={{
          background: reproduciendo ? '#ef4444' : '#22c55e', border: 'none', borderRadius: '50%',
          width: 40, height: 40, cursor: cargando ? 'wait' : 'pointer', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          opacity: captura.grabando ? 0.5 : 1,
        }}>
          {reproduciendo ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: 2 }} />}
        </button>
        <button onClick={detener} style={btnTransporte} title="Detener" disabled={captura.grabando}>
          <Square size={11} fill="currentColor" />
        </button>

        {/* Botón REC para grabar el acordeón sobre esta pista */}
        {!captura.grabando ? (
          <button
            onClick={iniciarGrabacionRec}
            disabled={cargando || (enLimiteGrabaciones && !esPremium) || reproduciendoGrabacionId !== null}
            style={{
              background: (enLimiteGrabaciones && !esPremium) ? 'rgba(239, 68, 68, 0.15)' : '#ef4444',
              border: 'none', borderRadius: 6, padding: '6px 12px',
              cursor: (enLimiteGrabaciones && !esPremium) ? 'not-allowed' : 'pointer',
              color: 'white', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700,
              opacity: cargando ? 0.5 : 1,
            }}
            title={(enLimiteGrabaciones && !esPremium) ? `Llegaste al límite de ${LIMITE_GRABACIONES_FREE} grabaciones del plan gratis` : 'Grabar tu acordeón sobre esta pista'}
          >
            <Mic size={12} /> REC
          </button>
        ) : (
          <button
            onClick={detenerGrabacionRec}
            style={{
              background: '#dc2626', border: '2px solid #fff', borderRadius: 6, padding: '6px 12px',
              cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700,
              animation: 'pulse-rec 1.2s ease-in-out infinite',
            }}
          >
            <Square size={11} fill="white" /> Detener · {fmt(captura.tiempoGrabadoMs / 1000)}
          </button>
        )}

        {reproduciendoGrabacionId && (
          <button
            onClick={detenerReproduccionGrabacion}
            style={{ ...btnTransporte, color: '#a855f7', borderColor: '#a855f7' }}
            title="Detener reproducción de grabación"
          >
            <Disc3 size={11} /> Reproduciendo grabación
          </button>
        )}
        {seccionLoopId && (
          <button onClick={quitarLoop} style={{ ...btnTransporte, color: '#22c55e', borderColor: '#22c55e' }} title="Quitar loop">
            <Repeat size={11} /> Loop
          </button>
        )}
        <div style={{ fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
          {fmt(segActual)} / {fmt(duracion)}
        </div>
        {seccionActivaIdx >= 0 && !captura.grabando && (
          <div style={{ marginLeft: 'auto', fontSize: 10, color: PALETA[seccionActivaIdx % PALETA.length], fontWeight: 700 }}>
            ▶ {secciones[seccionActivaIdx].nombre}
          </div>
        )}
      </div>

      {captura.grabando && (
        <div style={{
          padding: '8px 12px', background: 'rgba(220, 38, 38, 0.15)',
          border: '1px solid #dc2626', borderRadius: 6, fontSize: 11, color: '#fca5a5',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse-rec 1s infinite' }} />
          <strong>Grabando…</strong> Toca el acordeón. {captura.eventos.length} notas capturadas.
        </div>
      )}

      {/* Velocidad + Tono */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><Gauge size={11} /> Velocidad</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{velocidad.toFixed(2)}x</span>
          </div>
          <input type="range" min={0.5} max={1.5} step={0.05} value={velocidad}
            onChange={(e) => cambiarVelocidad(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => cambiarVelocidad(1)} style={btnReset}><RotateCcw size={9} /> 1.0x</button>
            <span style={{ fontSize: 10, color: '#64748b' }}>0.5x — 1.5x</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><Music3 size={11} /> Tono</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{semitonos > 0 ? `+${semitonos}` : semitonos} st</span>
          </div>
          <input type="range" min={-12} max={12} step={1} value={semitonos}
            onChange={(e) => cambiarSemitonos(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => cambiarSemitonos(0)} style={btnReset}><RotateCcw size={9} /> 0 st</button>
            <span style={{ fontSize: 10, color: '#64748b' }}>-12 — +12</span>
          </div>
        </div>
      </div>

      {/* Tabs Secciones / Grabaciones */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
        <button
          onClick={() => setTabPanel('secciones')}
          style={{
            flex: 1, padding: '8px 12px', background: 'transparent', border: 'none',
            color: tabPanel === 'secciones' ? '#3b82f6' : '#94a3b8',
            borderBottom: tabPanel === 'secciones' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >📍 Secciones · {secciones.length}</button>
        <button
          onClick={() => setTabPanel('grabaciones')}
          style={{
            flex: 1, padding: '8px 12px', background: 'transparent', border: 'none',
            color: tabPanel === 'grabaciones' ? '#ef4444' : '#94a3b8',
            borderBottom: tabPanel === 'grabaciones' ? '2px solid #ef4444' : '2px solid transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        ><Mic size={12} /> Mis grabaciones · {grabaciones.length}</button>
      </div>

      {/* Marcar nueva sección (sólo cuando tab activa = secciones) */}
      {tabPanel === 'secciones' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          📍 Crear sección
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
          Reproduce la canción. Cuando llegues al punto donde empieza la sección, da clic en <strong style={{ color: '#3b82f6' }}>A · Marcar inicio</strong>. Cuando llegue al final, clic en <strong style={{ color: '#a855f7' }}>B · Marcar fin</strong>.
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setMarcaInicio(segActual)}
            style={{
              ...btnMarca,
              borderColor: marcaInicio != null ? '#3b82f6' : 'rgba(255,255,255,0.15)',
              background: marcaInicio != null ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                background: '#3b82f6', color: 'white', borderRadius: 3, padding: '1px 5px',
                fontSize: 9, fontWeight: 800,
              }}>A</span>
              <MapPin size={11} /> Marcar inicio
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
              {marcaInicio != null ? fmt(marcaInicio) : '--:--'}
            </span>
          </button>
          <button
            onClick={() => setMarcaFin(segActual)}
            style={{
              ...btnMarca,
              borderColor: marcaFin != null ? '#a855f7' : 'rgba(255,255,255,0.15)',
              background: marcaFin != null ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                background: '#a855f7', color: 'white', borderRadius: 3, padding: '1px 5px',
                fontSize: 9, fontWeight: 800,
              }}>B</span>
              <Flag size={11} /> Marcar fin
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
              {marcaFin != null ? fmt(marcaFin) : '--:--'}
            </span>
          </button>
        </div>
        {marcaInicio != null && marcaFin != null && marcaFin <= marcaInicio && (
          <div style={{ fontSize: 11, color: '#ef4444' }}>⚠ El fin debe ser después del inicio.</div>
        )}
        <input
          type="text"
          placeholder="Nombre: Intro, Estrofa, Coro, Pase final…"
          value={nombreNueva}
          onChange={(e) => setNombreNueva(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.4)', color: 'white',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
            padding: '8px 10px', fontSize: 12,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={agregarSeccion}
            disabled={!puedeAgregar}
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 6, border: 'none',
              background: puedeAgregar ? '#22c55e' : 'rgba(255,255,255,0.05)',
              color: puedeAgregar ? 'white' : '#475569',
              fontSize: 12, fontWeight: 700,
              cursor: puedeAgregar ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={12} /> Agregar sección
          </button>
          {(marcaInicio != null || marcaFin != null) && (
            <button
              onClick={() => { setMarcaInicio(null); setMarcaFin(null); }}
              style={{
                padding: '9px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 11,
              }}
            >Limpiar</button>
          )}
        </div>
      </div>
      )}

      {/* Lista de secciones */}
      {tabPanel === 'secciones' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Secciones · {secciones.length}
        </div>
        {secciones.length === 0 && (
          <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
            Aún no creaste secciones. Marca un inicio y un fin arriba.
          </div>
        )}
        {secciones.map((s, i) => {
          const enLoop = seccionLoopId === s.id;
          const color = PALETA[i % PALETA.length];
          const editando = editandoSeccionId === s.id;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
              background: enLoop ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.04)',
              border: enLoop ? '1px solid #22c55e' : `1px solid ${color}33`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 6,
            }}>
              {editando ? (
                <input
                  value={nombreEdicion}
                  onChange={(e) => setNombreEdicion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') guardarEdicionSeccion(s.id); }}
                  autoFocus
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.4)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 6px', fontSize: 12,
                  }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 12, color: 'white', fontWeight: 600 }}>{s.nombre}</span>
              )}
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                {fmt(msASeg(s.tickInicio))} → {fmt(msASeg(s.tickFin))}
              </span>
              <button onClick={() => seek(msASeg(s.tickInicio))} title="Ir al inicio" style={btnIcono}><Play size={10} /></button>
              <button
                onClick={() => enLoop ? quitarLoop() : loopearSeccion(s)}
                title={enLoop ? 'Detener loop' : 'Reproducir en loop'}
                style={{ ...btnIcono, color: enLoop ? '#22c55e' : '#cbd5e1', borderColor: enLoop ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
              ><Repeat size={10} /></button>
              {editando ? (
                <>
                  <button onClick={() => guardarEdicionSeccion(s.id)} title="Guardar" style={{ ...btnIcono, color: '#22c55e' }}><Check size={10} /></button>
                  <button onClick={() => setEditandoSeccionId(null)} title="Cancelar" style={btnIcono}><X size={10} /></button>
                </>
              ) : (
                <button onClick={() => { setEditandoSeccionId(s.id); setNombreEdicion(s.nombre); }} title="Editar" style={btnIcono}><Pencil size={10} /></button>
              )}
              <button onClick={() => eliminarSeccion(s.id)} title="Eliminar" style={{ ...btnIcono, color: '#ef4444' }}><Trash2 size={10} /></button>
            </div>
          );
        })}
      </div>
      )}

      {/* PANEL GRABACIONES */}
      {tabPanel === 'grabaciones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Mis grabaciones <span style={{ color: enLimiteGrabaciones && !esPremium ? '#ef4444' : '#22c55e' }}>
                {totalGrabacionesUsuario}/{isFinite(limiteGrabaciones) ? limiteGrabaciones : '∞'}
              </span>
            </span>
            {esPremium && <span style={{ fontSize: 9, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Crown size={10} /> Premium</span>}
          </div>

          {enLimiteGrabaciones && !esPremium && (
            <div style={{ fontSize: 11, color: '#fbbf24', padding: '6px 8px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 6 }}>
              Plan gratis permite {LIMITE_GRABACIONES_FREE} grabaciones. Pasate a Premium para grabar sin límite.
            </div>
          )}

          {/* Volumen del acordeón en reproducción */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><Volume2 size={11} /> Vol. acordeón en mezcla</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{Math.round(volumenAcordeonRepro * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={volumenAcordeonRepro}
              onChange={(e) => setVolumenAcordeonRepro(Number(e.target.value))} />
          </div>

          {cargandoGrabaciones ? (
            <div style={{ fontSize: 11, color: '#94a3b8', padding: 10, textAlign: 'center' }}>Cargando grabaciones…</div>
          ) : grabaciones.length === 0 ? (
            <div style={{ fontSize: 11, color: '#64748b', padding: 12, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px dashed rgba(255,255,255,0.1)', lineHeight: 1.5 }}>
              Aún no has grabado nada sobre esta pista.<br />
              <span style={{ fontSize: 10, opacity: 0.8 }}>Dale <strong style={{ color: '#ef4444' }}>REC</strong> arriba y toca el acordeón mientras suena la pista. Tu ejecución queda guardada para volver a oírla cuando quieras.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {grabaciones.map((g) => {
                const enRepro = reproduciendoGrabacionId === g.id;
                return (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                    background: enRepro ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.04)',
                    border: enRepro ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                  }}>
                    <Disc3 size={13} style={{ color: '#a855f7', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.titulo}</div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>
                        {g.duracion_seg ? fmt(g.duracion_seg) : '0:00'}
                        {g.secuencia_json?.length ? ` · ${g.secuencia_json.length} notas` : ''}
                        {g.config?.tonalidad ? ` · Tono ${g.config.tonalidad}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => enRepro ? detenerReproduccionGrabacion() : reproducirGrabacion(g)}
                      title={enRepro ? 'Detener' : 'Reproducir con la pista'}
                      style={{
                        background: enRepro ? '#ef4444' : '#22c55e', border: 'none', borderRadius: 5,
                        padding: '5px 7px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center',
                      }}
                    >
                      {enRepro ? <Square size={10} fill="white" /> : <Play size={10} fill="white" />}
                    </button>
                    <button onClick={() => eliminarGrabacion(g)} title="Eliminar"
                      style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 5, padding: '5px 7px', cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Diálogo guardar grabación */}
      {mostrarDialogoGuardar && (
        <div style={{
          padding: 12, background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid #ef4444', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700 }}>🎙 Guardar tu grabación</div>
          <div style={{ fontSize: 11, color: '#cbd5e1' }}>{captura.eventos.length} notas capturadas · {fmt(captura.tiempoGrabadoMs / 1000)}</div>
          <input
            type="text" value={tituloGrabacionNueva}
            onChange={(e) => setTituloGrabacionNueva(e.target.value)}
            placeholder="Título de la grabación"
            autoFocus
            style={{
              background: 'rgba(0,0,0,0.4)', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 5, padding: '6px 10px', fontSize: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={guardarGrabacion}
              disabled={guardandoGrabacion || !tituloGrabacionNueva.trim()}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 5, border: 'none',
                background: tituloGrabacionNueva.trim() ? '#22c55e' : 'rgba(255,255,255,0.05)',
                color: tituloGrabacionNueva.trim() ? 'white' : '#475569',
                fontSize: 12, fontWeight: 700,
                cursor: tituloGrabacionNueva.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {guardandoGrabacion ? <Loader2 size={11} className="anim-spin" /> : <Save size={11} />}
              {guardandoGrabacion ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={descartarGrabacionPendiente}
              disabled={guardandoGrabacion}
              style={{
                padding: '8px 12px', borderRadius: 5,
                background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 11,
              }}
            >Descartar</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .anim-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-rec { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </div>
  );
};

const btnVolver: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
  padding: '5px 10px', cursor: 'pointer', color: '#cbd5e1',
  display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
};

const btnTransporte: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
  padding: '5px 9px', cursor: 'pointer', color: '#cbd5e1',
  display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600,
};

const btnReset: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
  padding: '2px 6px', fontSize: 10, color: '#94a3b8', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 3,
};

const btnMarca: React.CSSProperties = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
  padding: '8px 10px', fontSize: 11, color: 'white', cursor: 'pointer',
};

const btnIcono: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
  padding: '4px 6px', cursor: 'pointer', color: '#cbd5e1',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const btnDetectarTono: React.CSSProperties = {
  background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)',
  borderRadius: 5, padding: '4px 10px', cursor: 'pointer', color: '#3b82f6',
  display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
};

export default ReproductorPistaUsuario;
