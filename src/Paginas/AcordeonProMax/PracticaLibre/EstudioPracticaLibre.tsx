import React from 'react';
import PanelAjustes from '../../SimuladorDeAcordeon/Componentes/PanelAjustes/PanelAjustes';
import CuerpoAcordeon from '../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import { TONALIDADES } from '../../SimuladorDeAcordeon/notasAcordeonDiatonico';
import { obtenerModeloVisualPorId, resolverImagenModeloAcordeon } from './Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from './Hooks/useEstudioPracticaLibre';
import { useUsuario } from '../../../contextos/UsuarioContext';
import BarraSuperiorPracticaLibre from './Componentes/BarraSuperiorPracticaLibre';
import PanelLateralPracticaLibre from './Componentes/PanelLateralPracticaLibre';
import ModalGuardarPracticaLibre from './Componentes/ModalGuardarPracticaLibre';
import ModalCreadorAcordes from '../../SimuladorDeAcordeon/Componentes/ModalCreadorAcordes';
import ModalListaAcordes from '../../SimuladorDeAcordeon/Componentes/ModalListaAcordes';
import { useGrabadorHero } from '../../SimuladorDeAcordeon/Hooks/useGrabadorHero';
import ModalGuardarHero from '../../SimuladorDeAcordeon/Componentes/ModalGuardarHero';
import PuenteNotas from '../Componentes/PuenteNotas';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import { useAudioFondoPracticaLibre } from './Hooks/useAudioFondoPracticaLibre';
import BarraReproductorPracticaLibre from './Componentes/BarraReproductorPracticaLibre';
import BarraTransporte from '../Modos/BarraTransporte';
import ModalEditorSecuencia from '../Admin/Componentes/ModalEditorSecuencia';
import { motorAudioPro } from '../../SimuladorDeAcordeon/AudioEnginePro';
import type { NotaHero } from '../../SimuladorDeAcordeon/videojuego_acordeon/tipos_Hero';
import { actualizarSecuenciaCancionHero } from '../../../servicios/cancionesHeroService';
import { useReproductorAcordesAdmin } from './Hooks/useReproductorAcordesAdmin';
import './EstudioPracticaLibre.css';

interface EstudioPracticaLibreProps {
  logica: any;
  modoAjuste: boolean;
  setModoAjuste: React.Dispatch<React.SetStateAction<boolean>>;
  pestanaActiva: 'diseno' | 'sonido';
  setPestanaActiva: React.Dispatch<React.SetStateAction<'diseno' | 'sonido'>>;
  imagenFondo: string;
  modosVista: Array<{ valor: any; label: string }>;
  grabando: boolean;
  tiempoGrabacionMs: number;
  mostrarModalGuardar: boolean;
  mostrarModalProfesional: boolean;
  guardandoGrabacion: boolean;
  errorGuardadoGrabacion: string | null;
  tituloSugeridoGrabacion: string;
  resumenGrabacionPendiente: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  ultimaGrabacionGuardada: { id: string; titulo: string } | null;
  onIniciarGrabacion: (tipo?: 'practica_libre' | 'competencia') => void;
  onDetenerGrabacion: () => void;
  onGuardarGrabacion: (datos: any) => Promise<boolean>;
  onCancelarGuardado: () => void;
  volumenAcordeon: number;
  setVolumenAcordeon: (v: number) => void;
  bpm: number;
  onCambiarBpm: (bpm: number | ((prev: number) => number)) => void;
  onVolver?: () => void;
  esp32Conectado?: boolean;
  conectarESP32?: () => Promise<void>;

  // Sincronización de reproductor (Desde el parent)
  tickActual: number;
  totalTicks: number;
  reproduciendo: boolean;
  pausado: boolean;
  onAlternarPausa: () => void;
  onBuscarTick: (tick: number) => void;

  // Loop
  loopAB: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean };
  onMarcarLoopInicio: () => void;
  onMarcarLoopFin: () => void;
  onActualizarLoopInicio: (tick: number) => void;
  onActualizarLoopFin: (tick: number) => void;
  onAlternarLoop: () => void;
  onLimpiarLoop: () => void;
  onReproducirSecuencia: (cancion: any) => void;
  secuencia: any[];
  secuenciaGrabacion: any[];

  // Estado maestro para visualizar botones presionados durante reproducción
  botonesActivosMaestro?: Record<string, any>;
  direccionMaestro?: 'halar' | 'empujar';
}

import { 
  formatearDuracion,
  normalizarSecuenciaHero,
  calcularTotalTicksSecuencia,
  calcularTicksDesdeSegundos,
  combinarSecuenciasPorPunch 
} from './Utilidades/SecuenciaLogic';

const EstudioPracticaLibre: React.FC<EstudioPracticaLibreProps> = ({
  logica,
  modoAjuste,
  setModoAjuste,
  pestanaActiva,
  setPestanaActiva,
  imagenFondo,
  modosVista,
  grabando,
  tiempoGrabacionMs,
  mostrarModalGuardar,
  mostrarModalProfesional,
  guardandoGrabacion,
  errorGuardadoGrabacion,
  tituloSugeridoGrabacion,
  resumenGrabacionPendiente,
  ultimaGrabacionGuardada,
  onIniciarGrabacion,
  onDetenerGrabacion,
  onGuardarGrabacion,
  onCancelarGuardado,
  volumenAcordeon,
  setVolumenAcordeon,
  bpm,
  onCambiarBpm,
  onVolver,
  esp32Conectado = false,
  conectarESP32,

  tickActual,
  totalTicks,
  reproduciendo,
  pausado,
  onAlternarPausa,
  onBuscarTick,
  loopAB,
  onMarcarLoopInicio,
  onMarcarLoopFin,
  onActualizarLoopInicio,
  onActualizarLoopFin,
  onAlternarLoop,
  onLimpiarLoop,
  onReproducirSecuencia,
  secuencia,
  secuenciaGrabacion,
  botonesActivosMaestro,
  direccionMaestro,
}) => {
  // Detectar si es ADMIN y obtener email
  const { esAdmin, usuario } = useUsuario();

  // 🔐 RESTRICCIÓN: Solo shalom@gmail.com puede acceder por ahora
  const emailAutorizado = 'shalom@gmail.com';
  const emailNormalizado = usuario?.email?.toLowerCase().trim() || '';
  const tieneAcceso = emailNormalizado === emailAutorizado || esAdmin;

  // Debug: Log para verificar
  React.useEffect(() => {
    console.log('🔍 PracticaLibre - Email:', emailNormalizado, '| Admin:', esAdmin, '| Acceso:', tieneAcceso);
  }, [emailNormalizado, esAdmin, tieneAcceso]);

  // Función para detener reproducción (reinicia a tick 0 y pausa)
  const onDetenerHero = React.useCallback(() => {
    onBuscarTick(0);
    if (reproduciendo && !pausado) {
      onAlternarPausa();
    }
  }, [onBuscarTick, onAlternarPausa, reproduciendo, pausado]);

  if (!tieneAcceso) {
    return (
      <section className="estudio-practica-libre" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        padding: '40px 20px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
          <h1 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: 'bold' }}>Acceso Restringido</h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
            Este módulo está en fase de pruebas. Por el momento, solo está disponible para usuarios seleccionados.
          </p>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Tu email:</strong> {usuario?.email}
            <br />
            <strong>Requerido:</strong> shalom@gmail.com
          </div>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Si crees que deberías tener acceso, contacta a tu instructor. 📧
          </p>
        </div>
      </section>
    );
  }

  // Estados ADMIN
  const [modalCreadorAcordesVisible, setModalCreadorAcordesVisible] = React.useState(false);
  const [modalListaAcordesVisible, setModalListaAcordesVisible] = React.useState(false);
  const [acordeAEditar, setAcordeAEditar] = React.useState<any>(null);

  const {
    idSonandoCiclo,
    acordeMaestroActivo,
    onReproducirAcorde,
    onDetener,
    onEditarAcorde,
    onNuevoAcordeEnCirculo,
    onReproducirCirculoCompleto
  } = useReproductorAcordesAdmin(
    logica,
    setModalListaAcordesVisible,
    setAcordeAEditar,
    setModalCreadorAcordesVisible
  );

  // Estados para REC con backing track
  const [bpmHero, setBpmHero] = React.useState(120);
  const [pistaUrl, setPistaUrl] = React.useState<string | null>(null);
  const [pistaFile, setPistaFile] = React.useState<File | null>(null);
  const [bpmGrabacion, setBpmGrabacion] = React.useState(120);
  const [modalGuardarHeroVisible, setModalGuardarHeroVisible] = React.useState(false);
  const [tipoSugeridoGrabacion, setTipoSugeridoGrabacion] = React.useState<'secuencia' | 'cancion' | 'ejercicio'>('secuencia');
  const usoMetronomoRef = React.useRef(false);
  const [tiempoGrabacionRecProMs, setTiempoGrabacionRecProMs] = React.useState(0);
  const inicioGrabacionRecProRef = React.useRef<number | null>(null);

  // Estados de grabación
  const [metronomoActivo, setMetronomoActivo] = React.useState(false);
  const [bpmOriginalGrabacion, setBpmOriginalGrabacion] = React.useState(120);
  const [cancionActivaLibreria, setCancionActivaLibreria] = React.useState<any | null>(null);
  const [cancionEditandoSecuencia, setCancionEditandoSecuencia] = React.useState<any | null>(null);
  const [cancionEnModalEditor, setCancionEnModalEditor] = React.useState<any | null>(null);
  const [secuenciaEditada, setSecuenciaEditada] = React.useState<NotaHero[]>([]);
  const [preRollSegundos, setPreRollSegundos] = React.useState(4);
  const [esperandoPunchIn, setEsperandoPunchIn] = React.useState(false);
  const [modoCapturaRec, setModoCapturaRec] = React.useState<'libre' | 'edicion' | null>(null);
  const [guardandoEdicionSecuencia, setGuardandoEdicionSecuencia] = React.useState(false);
  const [hayCambiosEdicionSecuencia, setHayCambiosEdicionSecuencia] = React.useState(false);
  const [mensajeEdicionSecuencia, setMensajeEdicionSecuencia] = React.useState<string | null>(null);
  const [ultimaCancionLibreriaActualizada, setUltimaCancionLibreriaActualizada] = React.useState<any | null>(null);
  const [secuenciaVisualModal, setSecuenciaVisualModal] = React.useState<NotaHero[]>([]);
  const secuenciaEditadaRef = React.useRef<NotaHero[]>([]);

  // Sincronizar ref para metadata
  React.useEffect(() => {
    usoMetronomoRef.current = metronomoActivo;
  }, [metronomoActivo]);

  React.useEffect(() => {
    secuenciaEditadaRef.current = secuenciaEditada;
  }, [secuenciaEditada]);

  // 🎵 Hook para sincronizar audio de fondo con reproducción
  const audioRef = useAudioFondoPracticaLibre({
    reproduciendo,
    pausado,
    bpm,
    tickActual,
    cancionData: {
      bpm: bpmOriginalGrabacion, // ✅ El BPM original de cuando se grabó
      resolucion: 192,
      audio_fondo_url: pistaUrl
    },
    audioUrl: pistaUrl,
    volumen: 0.8
  });

  // 🎙️ GRABADOR LOCAL - Captura las notas REALMENTE presionadas
  const grabadorLocal = useGrabadorHero(bpmHero);
  const botonesActivosAnteriorRef = React.useRef<Record<string, any>>({});
  const grabandoSesion = grabando;
  const grabandoRecPro = grabadorLocal.grabando;
  const hayGrabacionActiva = grabandoSesion || grabandoRecPro;
  const estaGrabandoEdicionSecuencia = grabandoRecPro && modoCapturaRec === 'edicion';
  const punchInTick = loopAB.hasStart ? loopAB.start : null;
  const punchOutTick = loopAB.hasEnd ? loopAB.end : null;

  React.useEffect(() => {
    if (cancionActivaLibreria || cancionEditandoSecuencia || reproduciendo || grabandoRecPro) {
      setBpmHero(bpm);
    }
  }, [bpm, cancionActivaLibreria, cancionEditandoSecuencia, grabandoRecPro, reproduciendo]);

  // Detectar presiones y liberaciones por cambios en botonesActivos
  React.useEffect(() => {
    if (!grabadorLocal.grabando) {
      botonesActivosAnteriorRef.current = {};
      return;
    }

    const botonActualesIds = Object.keys(logica.botonesActivos || {});
    const botonesAnterioresIds = Object.keys(botonesActivosAnteriorRef.current);

    // Detectar PRESIONES (nuevos botones que no estaban antes)
    for (const id of botonActualesIds) {
      if (!botonesActivosAnteriorRef.current[id]) {
        const dirHero = logica.direccion === 'halar' ? 'abriendo' : 'cerrando';
        grabadorLocal.registrarPresion(id, dirHero);
      }
    }

    // Detectar LIBERACIONES (botones que estaban antes y ahora no)
    for (const id of botonesAnterioresIds) {
      if (!logica.botonesActivos[id]) {
        grabadorLocal.registrarLiberacion(id);
      }
    }

    // Actualizar referencia
    botonesActivosAnteriorRef.current = { ...logica.botonesActivos };
  }, [logica.botonesActivos, logica.direccion, grabadorLocal.grabando]);

  React.useEffect(() => {
    if (!grabandoRecPro || inicioGrabacionRecProRef.current === null) {
      if (!grabandoRecPro) {
        setTiempoGrabacionRecProMs(0);
      }
      return;
    }

    const actualizarCronometro = () => {
      if (inicioGrabacionRecProRef.current !== null) {
        setTiempoGrabacionRecProMs(Date.now() - inicioGrabacionRecProRef.current);
      }
    };

    actualizarCronometro();
    const intervalo = window.setInterval(actualizarCronometro, 250);
    return () => window.clearInterval(intervalo);
  }, [grabandoRecPro]);

  // Cargar sonidos de metrónomo al iniciar
  React.useEffect(() => {
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_fuerte', '/audio/effects/du2.mp3').catch(() => {});
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_debil', '/audio/effects/du.mp3').catch(() => {});
  }, []);

  // 🥁 Lógica de Metrónomo para Práctica Libre
  React.useEffect(() => {
    if (!metronomoActivo) return;

    // Solo activamos el click manual si NO se está reproduciendo una secuencia (que ya tiene su propio metrónomo)
    if (reproduciendo) return;

    const intervalMs = (60 / bpmHero) * 1000;
    let beatCount = 0;

    const interval = setInterval(() => {
      const beatEnCompas = beatCount % 4; // Asumimos 4/4 para práctica libre
      motorAudioPro.reproducir(
        beatEnCompas === 0 ? 'click_fuerte' : 'click_debil',
        'metronomo',
        beatEnCompas === 0 ? 0.6 : 0.4
      );
      beatCount++;
    }, intervalMs);

    return () => clearInterval(interval);
  }, [metronomoActivo, bpmHero, reproduciendo]);

  const [estudioCargado, setEstudioCargado] = React.useState(false);
  const timerPreRollRef = React.useRef<any>(null);

  // Hooks REC
  const { 
    refMaestro, 
    refAlumno, 
    obtenerPosicionMaestro, 
    obtenerPosicionAlumno 
  } = usePosicionProMax();


  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando,
    volumenAcordeon,
    setVolumenAcordeon,
  });

  const modeloActivo = React.useMemo(
    () => obtenerModeloVisualPorId(estudio.preferencias.modeloVisualId),
    [estudio.preferencias.modeloVisualId]
  );

  const ajustesPractica = React.useMemo(() => ({
    ...logica.ajustes,
    tamano: 'var(--estudio-acordeon-tamano)',
    x: 'var(--estudio-acordeon-x)',
    y: 'var(--estudio-acordeon-y)',
  }), [logica.ajustes]);

  const nombreInstrumento = React.useMemo(() => {
    const actual = logica.listaInstrumentos?.find((instrumento: any) => instrumento.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  React.useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;

    const timer = window.setTimeout(() => {
      void logica.guardarAjustes();
    }, 420);

    return () => {
      window.clearTimeout(timer);
    };
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  const formatearTickComoTiempo = React.useCallback((tick: number) => {
    return formatearDuracion((tick / 192) * (60 / Math.max(1, bpm)) * 1000);
  }, [bpm]);

  const construirCancionHero = React.useCallback((cancionBase: any, secuenciaForzada?: NotaHero[]) => {
    const secuenciaNormalizada = secuenciaForzada || normalizarSecuenciaHero(cancionBase?.secuencia || cancionBase?.secuencia_json);

    return {
      ...cancionBase,
      secuencia: secuenciaNormalizada,
      secuencia_json: secuenciaNormalizada,
      bpm: cancionBase?.bpm || 120,
      tonalidad: cancionBase?.tonalidad || 'ADG',
      id: cancionBase?.id || `cancion-${Date.now()}`
    };
  }, []);

  const prepararCancionEnEscenario = React.useCallback((cancionPreparada: any) => {
    const bpmCancion = cancionPreparada?.bpm || 120;

    onCambiarBpm(bpmCancion);
    setBpmHero(bpmCancion);
    setBpmGrabacion(bpmCancion);
    setBpmOriginalGrabacion(bpmCancion);
    setPistaUrl(cancionPreparada?.audio_fondo_url || null);
    setPistaFile(null);
    setCancionActivaLibreria(cancionPreparada);

    // 🎹 SINCRONIZACIÓN DE TONALIDAD:
    // Poner el acordeón en el tono en el que se grabó la canción automáticamente
    if (cancionPreparada?.tonalidad && cancionPreparada.tonalidad !== logica.tonalidadSeleccionada) {
      console.log(`🎵 Cambiando tonalidad automáticamente a: ${cancionPreparada.tonalidad}`);
      logica.setTonalidadSeleccionada(cancionPreparada.tonalidad);
    }
  }, [onCambiarBpm, logica.tonalidadSeleccionada, logica.setTonalidadSeleccionada]);

  const reproducirCancionActivaDesdeTick = React.useCallback((tickInicio = 0, cancionForzada?: any) => {
    const cancionBase = cancionForzada
      || (cancionEditandoSecuencia
        ? construirCancionHero(cancionEditandoSecuencia, secuenciaEditadaRef.current)
        : cancionActivaLibreria
          ? construirCancionHero(
              cancionActivaLibreria,
              cancionEditandoSecuencia?.id === cancionActivaLibreria.id ? secuenciaEditadaRef.current : undefined
            )
          : null);

    if (!cancionBase) {
      return;
    }

    prepararCancionEnEscenario(cancionBase);
    window.setTimeout(() => {
      onReproducirSecuencia(cancionBase);
      window.setTimeout(() => {
        onBuscarTick(Math.max(0, Math.floor(tickInicio)));
      }, 0);
    }, 0);
  }, [cancionActivaLibreria, cancionEditandoSecuencia, construirCancionHero, onBuscarTick, onReproducirSecuencia, prepararCancionEnEscenario]);

  const detenerReproduccionLocal = React.useCallback((tickDestino = 0) => {
    if (reproduciendo && !pausado) {
      onAlternarPausa();
    }

    onBuscarTick(Math.max(0, Math.floor(tickDestino)));
  }, [onAlternarPausa, onBuscarTick, pausado, reproduciendo]);

  const manejarGrabacionSesion = async () => {
    if (grabandoRecPro || esperandoPunchIn) {
      return;
    }

    if (grabandoSesion) {
      onDetenerGrabacion();
      return;
    }

    if (estudio.pistaActiva) {
      await estudio.prepararPistaParaGrabar();
    }

    onIniciarGrabacion('practica_libre');
  };

  const iniciarGrabacionRecPro = React.useCallback(() => {
    if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) {
      return;
    }

    setModoCapturaRec('libre');
    usoMetronomoRef.current = metronomoActivo;
    inicioGrabacionRecProRef.current = Date.now();
    setTiempoGrabacionRecProMs(0);
    grabadorLocal.iniciarGrabacion();
  }, [esperandoPunchIn, grabandoSesion, grabadorLocal, metronomoActivo]);

  const finalizarGrabacionEdicion = React.useCallback((tickFinForzado?: number) => {
    if (!grabadorLocal.grabando || punchInTick === null) {
      return null;
    }

    const resultado = grabadorLocal.detenerGrabacion();
    inicioGrabacionRecProRef.current = null;

    const tickFin = Math.max(
      punchInTick + 1,
      Math.floor(typeof tickFinForzado === 'number' ? tickFinForzado : resultado.tickFinal)
    );

    const secuenciaCombinada = combinarSecuenciasPorPunch(
      secuenciaEditadaRef.current,
      resultado.secuencia,
      punchInTick,
      tickFin
    );

    const cancionActualizada = cancionEditandoSecuencia
      ? construirCancionHero(cancionEditandoSecuencia, secuenciaCombinada)
      : null;

    setSecuenciaEditada(secuenciaCombinada);
    setHayCambiosEdicionSecuencia(true);
    setEsperandoPunchIn(false);
    setModoCapturaRec(null);
    setMensajeEdicionSecuencia(
      `Tramo actualizado de ${formatearTickComoTiempo(punchInTick)} a ${formatearTickComoTiempo(tickFin)}.`
    );

    if (cancionActualizada) {
      setCancionEditandoSecuencia(cancionActualizada);
      setCancionActivaLibreria(cancionActualizada);
    }

    return { tickInicio: punchInTick, tickFin, secuenciaCombinada };
  }, [cancionEditandoSecuencia, construirCancionHero, formatearTickComoTiempo, grabadorLocal, punchInTick]);

  const detenerGrabacionRecPro = React.useCallback(() => {
    if (!grabadorLocal.grabando) {
      if (esperandoPunchIn) {
        setEsperandoPunchIn(false);
        setModoCapturaRec(null);
        setMensajeEdicionSecuencia('Punch-in cancelado antes de comenzar a grabar.');
        detenerReproduccionLocal(Math.max(0, (punchInTick || 0) - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
      }
      return;
    }

    if (modoCapturaRec === 'edicion') {
      const resumen = finalizarGrabacionEdicion();
      if (reproduciendo && !pausado) {
        onAlternarPausa();
      }
      if (resumen) {
        onBuscarTick(Math.max(0, resumen.tickInicio - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
      }
      return;
    }

    const resultado = grabadorLocal.detenerGrabacion();
    inicioGrabacionRecProRef.current = null;
    setModoCapturaRec(null);

    if (!resultado.secuencia.length) {
      alert('❌ No hay notas grabadas. Presiona algunos botones del acordeon antes de guardar.');
      return;
    }

    setTipoSugeridoGrabacion(usoMetronomoRef.current ? 'secuencia' : 'ejercicio');
    setModalGuardarHeroVisible(true);
  }, [bpm, esperandoPunchIn, finalizarGrabacionEdicion, grabadorLocal, modoCapturaRec, onAlternarPausa, onBuscarTick, pausado, preRollSegundos, punchInTick, reproduciendo, detenerReproduccionLocal]);

  const handlePistaChange = (url: string | null, archivo: File | null) => {
    setPistaUrl(url);
    setPistaFile(archivo);
  };

  const marcarEntradaEdicion = React.useCallback(() => {
    onActualizarLoopInicio(Math.max(0, Math.floor(tickActual)));
    setMensajeEdicionSecuencia('Entrada de punch marcada en el cursor actual.');
  }, [onActualizarLoopInicio, tickActual]);

  const marcarSalidaEdicion = React.useCallback(() => {
    onActualizarLoopFin(Math.max(0, Math.floor(tickActual)));
    setMensajeEdicionSecuencia('Salida de punch marcada en el cursor actual.');
  }, [onActualizarLoopFin, tickActual]);

  const limpiarRangoEdicion = React.useCallback(() => {
    onLimpiarLoop();
    setMensajeEdicionSecuencia('Rango de edicion limpio.');
  }, [onLimpiarLoop]);

  const guardarEdicionSecuencia = React.useCallback(async () => {
    if (!cancionEditandoSecuencia) {
      return;
    }

    if (!hayCambiosEdicionSecuencia) {
      setMensajeEdicionSecuencia('No hay cambios nuevos por guardar.');
      return;
    }

    if (grabadorLocal.grabando || esperandoPunchIn) {
      setMensajeEdicionSecuencia('Deten el punch-in antes de guardar la secuencia.');
      return;
    }

    try {
      setGuardandoEdicionSecuencia(true);
      const data = await actualizarSecuenciaCancionHero(cancionEditandoSecuencia.id, secuenciaEditadaRef.current);
      const cancionGuardada = construirCancionHero(data, secuenciaEditadaRef.current);

      setCancionEditandoSecuencia(cancionGuardada);
      setCancionActivaLibreria(cancionGuardada);
      setUltimaCancionLibreriaActualizada(cancionGuardada);
      setHayCambiosEdicionSecuencia(false);
      setMensajeEdicionSecuencia('Secuencia guardada correctamente en canciones_hero.');
    } catch (error: any) {
      console.error('❌ Error guardando secuencia editada:', error);
      setMensajeEdicionSecuencia(error?.message || 'No se pudo guardar la secuencia editada.');
    } finally {
      setGuardandoEdicionSecuencia(false);
    }
  }, [cancionEditandoSecuencia, construirCancionHero, esperandoPunchIn, grabadorLocal.grabando, hayCambiosEdicionSecuencia]);

  const cancelarEdicionSecuencia = React.useCallback(() => {
    if ((hayCambiosEdicionSecuencia || esperandoPunchIn || grabadorLocal.grabando) && !window.confirm('Tienes una edicion activa con cambios sin guardar. ¿Deseas salir del editor?')) {
      return;
    }

    if (grabadorLocal.grabando) {
      grabadorLocal.detenerGrabacion();
    }

    setEsperandoPunchIn(false);
    setModoCapturaRec(null);
    setHayCambiosEdicionSecuencia(false);
    setMensajeEdicionSecuencia(null);
    setCancionEditandoSecuencia(null);
    setSecuenciaEditada([]);
    onLimpiarLoop();
    detenerReproduccionLocal(0);
  }, [detenerReproduccionLocal, esperandoPunchIn, grabadorLocal, hayCambiosEdicionSecuencia, onLimpiarLoop]);

  const iniciarPunchInEdicion = React.useCallback(() => {
    if (!cancionEditandoSecuencia) {
      setMensajeEdicionSecuencia('Primero elige una cancion de la libreria para editar.');
      return;
    }

    if (grabandoSesion || grabadorLocal.grabando) {
      setMensajeEdicionSecuencia('Deten la grabacion actual antes de iniciar un punch-in.');
      return;
    }

    if (punchInTick === null) {
      setMensajeEdicionSecuencia('Marca la entrada de punch antes de grabar el reemplazo.');
      return;
    }

    if (loopAB.activo) {
      onAlternarLoop();
    }

    const cancionPreparada = construirCancionHero(cancionEditandoSecuencia, secuenciaEditadaRef.current);
    const tickPreRoll = Math.max(0, punchInTick - calcularTicksDesdeSegundos(preRollSegundos, bpm));

    setEsperandoPunchIn(true);
    setModoCapturaRec('edicion');
    setMensajeEdicionSecuencia('Reproduciendo pre-roll. La grabacion arrancara en la entrada marcada.');
    inicioGrabacionRecProRef.current = null;

    reproducirCancionActivaDesdeTick(tickPreRoll, cancionPreparada);
  }, [bpm, cancionEditandoSecuencia, construirCancionHero, grabandoSesion, grabadorLocal, loopAB.activo, onAlternarLoop, preRollSegundos, punchInTick, reproducirCancionActivaDesdeTick]);

  const handleReproducirLibreria = React.useCallback((cancion: any) => {
    const secuenciaActiva = cancionEditandoSecuencia?.id === cancion.id
      ? secuenciaEditadaRef.current
      : undefined;
    const cancionPreparada = construirCancionHero(cancion, secuenciaActiva);

    reproducirCancionActivaDesdeTick(0, cancionPreparada);
  }, [cancionEditandoSecuencia?.id, construirCancionHero, reproducirCancionActivaDesdeTick]);

  const handleEditarSecuenciaLibreria = React.useCallback((cancion: any) => {
    if (cancionEditandoSecuencia && hayCambiosEdicionSecuencia && cancion.id !== cancionEditandoSecuencia.id) {
      const confirmado = window.confirm('Hay cambios sin guardar en la cancion actual. ¿Deseas abrir otra cancion y perder esos cambios?');
      if (!confirmado) {
        return;
      }
    }

    if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) {
      setMensajeEdicionSecuencia('Deten la grabacion o el pre-roll actual antes de abrir otra secuencia.');
      return;
    }

    const cancionPreparada = construirCancionHero(cancion);

    prepararCancionEnEscenario(cancionPreparada);
    setCancionEditandoSecuencia(cancionPreparada);
    setSecuenciaEditada(cancionPreparada.secuencia || []);
    setHayCambiosEdicionSecuencia(false);
    setMensajeEdicionSecuencia('Editor de secuencia listo. Marca entrada y salida para grabar por tramos.');
    onLimpiarLoop();
    detenerReproduccionLocal(0);
  }, [cancionEditandoSecuencia, construirCancionHero, detenerReproduccionLocal, esperandoPunchIn, grabadorLocal.grabando, grabandoSesion, hayCambiosEdicionSecuencia, onLimpiarLoop, prepararCancionEnEscenario]);

  const handleAbrirModalEditor = React.useCallback((cancion: any) => {
    if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) {
      setMensajeEdicionSecuencia('Detén la grabación o el pre-roll actual antes de abrir el editor.');
      return;
    }

    // Detener reproducción
    onDetenerHero?.();
    onBuscarTick?.(0);

    // Cargar la canción en el reproductor
    const cancionPreparada = construirCancionHero(cancion);
    prepararCancionEnEscenario(cancionPreparada);

    // Abrir el modal
    setCancionEnModalEditor(cancion);
  }, [grabandoSesion, grabadorLocal.grabando, esperandoPunchIn, onDetenerHero, onBuscarTick, construirCancionHero, prepararCancionEnEscenario]);

  const notasCheadasModalRef = React.useRef<Set<string>>(new Set());

  const handleNotasActualesDelModal = React.useCallback((notas: NotaHero[]) => {
    if (!logica) return;

    // 🔄 Sincronizar dirección del fuelle con las notas de la secuencia (para que se vean las 'cerrando')
    if (notas.length > 0) {
      const dirRequerida = (notas[0].fuelle === 'abriendo' || notas[0].fuelle === 'halar') ? 'halar' : 'empujar';
      if (logica.direccion !== dirRequerida) {
        logica.setDireccion(dirRequerida);
      }
    }

    // 🔍 CONSTRUIR IDS EXACTOS PARA EL MOTOR DE AUDIO
    const idsNuevos = new Set(notas.map(n => {
      const fuelle = n.fuelle === 'abriendo' ? 'halar' : 'empujar';
      
      // Limpiamos el ID base de rastros de fuelle anteriores para normalizar
      let baseId = n.botonId.replace('-halar', '').replace('-empujar', '');
      
      if (baseId.includes('-bajo')) {
        // Formato Bajo: id-fuelle-bajo
        baseId = baseId.replace('-bajo', '');
        return `${baseId}-${fuelle}-bajo`;
      }
      
      // Formato Pito: id-fuelle
      return `${baseId}-${fuelle}`;
    }));

    const notasAnteriores = notasCheadasModalRef.current;

    // 1. Quitar las que ya no están (Fade out)
    notasAnteriores.forEach(id => {
      if (!idsNuevos.has(id)) {
        logica.actualizarBotonActivo(id, 'remove', null, false, undefined);
      }
    });

    // 2. Agregar las nuevas que no estaban (Fade in suave / Ataque)
    idsNuevos.forEach(id => {
      if (!notasAnteriores.has(id)) {
        logica.actualizarBotonActivo(id, 'add', null, false, undefined, true);
      }
    });

    // 3. Sincronizar referencia para el próximo frame
    notasCheadasModalRef.current = idsNuevos;
  }, [logica]);

  React.useEffect(() => {
    if (!esperandoPunchIn || modoCapturaRec !== 'edicion' || punchInTick === null || tickActual < punchInTick) {
      return;
    }

    usoMetronomoRef.current = metronomoActivo;
    inicioGrabacionRecProRef.current = Date.now();
    setTiempoGrabacionRecProMs(0);
    setEsperandoPunchIn(false);
    setMensajeEdicionSecuencia('Grabando reemplazo desde la entrada marcada.');
    grabadorLocal.iniciarGrabacion(secuenciaEditadaRef.current, punchInTick);
  }, [esperandoPunchIn, grabadorLocal, metronomoActivo, modoCapturaRec, punchInTick, tickActual]);

  React.useEffect(() => {
    if (!estaGrabandoEdicionSecuencia || punchOutTick === null || tickActual < punchOutTick) {
      return;
    }

    const resumen = finalizarGrabacionEdicion(punchOutTick);
    if (reproduciendo && !pausado) {
      onAlternarPausa();
    }
    if (resumen) {
      onBuscarTick(Math.max(0, resumen.tickInicio - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
    }
  }, [bpm, estaGrabandoEdicionSecuencia, finalizarGrabacionEdicion, onAlternarPausa, onBuscarTick, pausado, preRollSegundos, punchOutTick, reproduciendo, tickActual]);

  const secuenciaVisualActiva = React.useMemo(() => {
    if (cancionEnModalEditor) {
      return secuenciaVisualModal;
    }
    if (cancionEditandoSecuencia) {
      return secuenciaEditada;
    }

    return cancionActivaLibreria?.secuencia || secuencia || [];
  }, [cancionActivaLibreria, cancionEditandoSecuencia, cancionEnModalEditor, secuencia, secuenciaEditada, secuenciaVisualModal]);

  const totalTicksTransporte = React.useMemo(() => {
    if (cancionEditandoSecuencia) {
      return Math.max(totalTicks || 0, calcularTotalTicksSecuencia(secuenciaEditada));
    }

    return totalTicks || 2100;
  }, [cancionEditandoSecuencia, secuenciaEditada, totalTicks]);

  return (
    <section className="estudio-practica-libre">
      <BarraSuperiorPracticaLibre
        panelActivo={estudio.panelActivo}
        onAlternarPanel={estudio.alternarPanel}
        tonalidad={logica.tonalidadSeleccionada}
        timbre={logica.ajustes?.timbre || 'Brillante'}
        nombreInstrumento={nombreInstrumento}
        nombreModelo={modeloActivo.nombre}
        nombrePista={estudio.pistaActiva?.nombre || estudio.preferencias.pistaNombre}
        grabandoSesion={grabandoSesion}
        tiempoGrabacionSesion={formatearDuracion(tiempoGrabacionMs)}
        grabandoRecPro={grabandoRecPro || esperandoPunchIn}
        onAlternarGrabacion={manejarGrabacionSesion}
        esAdmin={esAdmin}
        esp32Conectado={logica.esp32Conectado}
        onVolver={onVolver}
      />

      {!mostrarModalGuardar && errorGuardadoGrabacion && (
        <div className="estudio-practica-libre-alerta">{errorGuardadoGrabacion}</div>
      )}

      {mensajeEdicionSecuencia && (
        <div className="estudio-practica-libre-alerta">{mensajeEdicionSecuencia}</div>
      )}

      <div className="estudio-practica-libre-contenido">
        <div className="estudio-practica-libre-escenario">
          <div className="estudio-practica-libre-escenario-head">
            <div className="estudio-practica-libre-escenario-chip">Modelo {modeloActivo.nombre}</div>
            <div className="estudio-practica-libre-escenario-chip">Vista {modosVista.find(({ valor }) => valor === logica.modoVista)?.label || 'T'}</div>
            <div className="estudio-practica-libre-escenario-chip">Instrumento {nombreInstrumento}</div>
            {estudio.pistaActiva && (
              <div className="estudio-practica-libre-escenario-chip">Pista {estudio.pistaActiva.nombre}</div>
            )}
            {cancionActivaLibreria && (
              <div className="estudio-practica-libre-escenario-chip">Hero {cancionActivaLibreria.titulo || 'Sin titulo'}</div>
            )}
            {cancionEditandoSecuencia && (
              <div className="estudio-practica-libre-escenario-chip">
                Editando secuencia{hayCambiosEdicionSecuencia ? ' *' : ''}
              </div>
            )}
            {ultimaGrabacionGuardada && !hayGrabacionActiva && (
              <div className="estudio-practica-libre-escenario-chip">Guardada {ultimaGrabacionGuardada.titulo}</div>
            )}
          </div>

          <div className="estudio-practica-libre-area-acordeon" ref={refAlumno}>
            <div className="estudio-practica-libre-acordeon">
              {logica.disenoCargado && (
                <CuerpoAcordeon
                  imagenFondo={resolverImagenModeloAcordeon(estudio.preferencias.modeloVisualId, imagenFondo)}
                  ajustes={ajustesPractica as any}
                  direccion={reproduciendo && direccionMaestro ? direccionMaestro : logica.direccion}
                  configTonalidad={logica.configTonalidad}
                  botonesActivos={reproduciendo && botonesActivosMaestro ? botonesActivosMaestro : logica.botonesActivos}
                  modoAjuste={modoAjuste}
                  botonSeleccionado={logica.botonSeleccionado}
                  modoVista={logica.modoVista}
                  vistaDoble={false}
                  setBotonSeleccionado={logica.setBotonSeleccionado}
                  actualizarBotonActivo={logica.actualizarBotonActivo}
                  listo
                />
              )}
            </div>

            {/* Puente de Notas (Falling Notes) - SOLO EN MODOS CON GAMEPLAY (No en Editor) */}
            {(reproduciendo || hayGrabacionActiva) && !cancionEnModalEditor && (
              <PuenteNotas
                cancion={{
                  id: 'practica-id',
                  titulo: 'Práctica',
                  secuencia: secuenciaVisualActiva || [],
                  bpm: grabandoRecPro ? bpmHero : bpm,
                  tonalidad: logica.tonalidadSeleccionada
                } as any}
                tickActual={tickActual}
                obtenerPosicionMaestro={(id) => {
                  // Simulamos una posición "Master" arriba de la pantalla
                  const pos = obtenerPosicionAlumno(id);
                  if (!pos) return null;
                  return { x: pos.x, y: -200 };
                }}
                obtenerPosicionAlumno={obtenerPosicionAlumno}
                modoVista={logica.modoVista}
                configTonalidad={logica.configTonalidad}
                notasImpactadas={new Set()}
              />
            )}
          </div>

          {/* 🚀 BARRA DE REPRODUCCIÓN INDEPENDIENTE PARA PRÁCTICA LIBRE */}
          {(reproduciendo || hayGrabacionActiva || pistaUrl || Boolean(cancionEditandoSecuencia)) && (
            <div className="estudio-practica-libre-transport-fixed">
              {cancionEditandoSecuencia ? (
                <BarraTransporte
                  reproduciendo={reproduciendo || hayGrabacionActiva}
                  pausado={pausado && !hayGrabacionActiva}
                  onAlternarPausa={() => {
                    if (grabandoSesion) {
                      onDetenerGrabacion();
                    } else if (grabandoRecPro || esperandoPunchIn) {
                      detenerGrabacionRecPro();
                    } else if (!reproduciendo) {
                      reproducirCancionActivaDesdeTick(tickActual || 0);
                    } else {
                      onAlternarPausa();
                    }
                  }}
                  onDetener={() => {
                    if (grabandoSesion) {
                      onDetenerGrabacion();
                    } else if (grabandoRecPro || esperandoPunchIn) {
                      detenerGrabacionRecPro();
                    } else {
                      detenerReproduccionLocal(0);
                    }
                  }}
                  tickActual={tickActual || 0}
                  totalTicks={totalTicksTransporte}
                  onBuscarTick={(tick) => onBuscarTick?.(tick)}
                  bpm={bpm}
                  loopAB={loopAB}
                  onMarcarLoopInicio={onMarcarLoopInicio}
                  onMarcarLoopFin={onMarcarLoopFin}
                  onActualizarLoopInicio={onActualizarLoopInicio}
                  onActualizarLoopFin={onActualizarLoopFin}
                  onAlternarLoop={onAlternarLoop}
                  onLimpiarLoop={onLimpiarLoop}
                  onCambiarBpm={(valor) => {
                    onCambiarBpm(valor);
                    if (typeof valor === 'number') {
                      setBpmHero(valor);
                    }
                  }}
                  punchInTick={punchInTick}
                />
              ) : (
                <BarraReproductorPracticaLibre
                  reproduciendo={reproduciendo || hayGrabacionActiva}
                  pausado={pausado && !hayGrabacionActiva}
                  onAlternarPausa={() => {
                     // 🔒 🔒 🔒 COMPLETAMENTE INDEPENDIENTE: NUNCA dispara estado global
                      if (grabandoSesion) {
                          onDetenerGrabacion();
                      } else if (grabandoRecPro) {
                          detenerGrabacionRecPro();
                      } else if (!reproduciendo && cancionActivaLibreria) {
                          reproducirCancionActivaDesdeTick(tickActual || 0);
                      } else {
                         onAlternarPausa();
                         console.log('⏸️ PracticaLibre: Pausa LOCAL (sin afectar estado global)');
                     }
                  }}
                  onDetener={() => {
                      if (grabandoSesion) {
                          onDetenerGrabacion();
                      } else if (grabandoRecPro) {
                          detenerGrabacionRecPro();
                      } else {
                          onBuscarTick?.(0);
                         console.log('⏹️ PracticaLibre: Resetear a inicio (sin afectar estado global)');
                     }
                  }}
                  tickActual={tickActual || 0}
                  totalTicks={totalTicksTransporte}
                  onBuscarTick={(tick) => {
                     onBuscarTick?.(tick);
                  }}
                  bpm={grabandoRecPro ? bpmHero : bpm}
                  onCambiarBpm={grabandoRecPro ? setBpmHero : onCambiarBpm}
                />
              )}
            </div>
          )}
        </div>

        {!cancionEnModalEditor && (
          <PanelLateralPracticaLibre
            visible={Boolean(estudio.panelActivo)}
          seccionActiva={estudio.panelActivo}
          tonalidadSeleccionada={logica.tonalidadSeleccionada}
          listaTonalidades={logica.listaTonalidades?.length ? logica.listaTonalidades : Object.keys(TONALIDADES)}
          timbreActivo={logica.ajustes?.timbre || 'Brillante'}
          onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
          onSeleccionarTimbre={(timbre) => logica.setAjustes((prev: any) => ({ ...prev, timbre }))}
          instrumentoId={logica.instrumentoId}
          listaInstrumentos={logica.listaInstrumentos || []}
          onSeleccionarInstrumento={logica.setInstrumentoId}
          modoVista={logica.modoVista}
          modosVista={modosVista}
          onSeleccionarVista={logica.setModoVista}
          onAbrirEditorAvanzado={() => {
            setPestanaActiva('sonido');
            setModoAjuste(true);
          }}
          modeloActivo={modeloActivo}
          onSeleccionarModelo={estudio.seleccionarModeloVisual}
          preferencias={estudio.preferencias}
          pistaActiva={estudio.pistaActiva}
          pistasDisponibles={estudio.pistasDisponibles}
          cargandoPistas={estudio.cargandoPistas}
          reproduciendoPista={estudio.reproduciendoPista}
          tiempoPista={formatearDuracion(estudio.tiempoPistaActual * 1000)}
          duracionPista={formatearDuracion(estudio.duracionPista * 1000)}
          onSeleccionarPista={estudio.seleccionarPista}
          onLimpiarPista={estudio.limpiarPistaSeleccionada}
          onAlternarReproduccionPista={estudio.alternarReproduccionPista}
          onReiniciarPista={() => void estudio.reiniciarPista(estudio.reproduciendoPista)}
          onCargarArchivoLocal={estudio.cargarArchivoLocal}
          onAlternarCapa={estudio.alternarCapa}
          onActualizarEfectos={estudio.actualizarEfectos}
          volumenAcordeon={estudio.volumenAcordeon}
          onAjustarVolumenAcordeon={estudio.ajustarVolumenAcordeon}
          esAdmin={esAdmin}
          grabandoSesionActiva={grabandoSesion}
          onCrearNuevoAcorde={() => setModalCreadorAcordesVisible(true)}
          onVerTodosAcordes={() => setModalListaAcordesVisible(true)}
          onAbrirBibliotecaAcordes={() => setModalListaAcordesVisible(true)}
          esp32Conectado={esp32Conectado}
          onConectarESP32={conectarESP32}
          // Props Gestor (Diseño + Sonidos)
          ajustes={logica.ajustes}
          setAjustes={logica.setAjustes}
          tonalidadSeleccionadaGestor={logica.tonalidadSeleccionada}
          setTonalidadSeleccionadaGestor={logica.setTonalidadSeleccionada}
          listaTonalidades_Gestor={logica.listaTonalidades}
          setListaTonalidades_Gestor={logica.setListaTonalidades}
          nombresTonalidades={logica.nombresTonalidades}
          actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
          sonidosVirtuales={logica.sonidosVirtuales}
          setSonidosVirtuales={logica.setSonidosVirtuales}
          eliminarTonalidad={logica.eliminarTonalidad}
          mapaBotonesActual={logica.mapaBotonesActual}
          botonSeleccionado={logica.botonSeleccionado}
          playPreview={logica.playPreview}
          stopPreview={logica.stopPreview}
          reproduceTono={logica.reproduceTono}
          samplesBrillante={logica.samplesBrillante}
          samplesBajos={logica.samplesBajos}
          samplesArmonizado={logica.samplesArmonizado}
          muestrasDB={logica.muestrasDB}
          soundsPerKey={logica.soundsPerKey}
          obtenerRutasAudio={logica.obtenerRutasAudio}
          guardarAjustes={logica.guardarAjustes}
          resetearAjustes={logica.resetearAjustes}
          sincronizarAudios={logica.sincronizarAudios}
          guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
          instrumentoIdGestor={logica.instrumentoId}
          setInstrumentoIdGestor={logica.setInstrumentoId}
          listaInstrumentosGestor={logica.listaInstrumentos}
          // Props REC básicos
          bpmRec={bpmHero}
          setBpmRec={setBpmHero}
          grabandoRec={grabandoRecPro || esperandoPunchIn}
          onIniciarGrabacionRec={cancionEditandoSecuencia ? iniciarPunchInEdicion : iniciarGrabacionRecPro}
          onDetenerGrabacionRec={detenerGrabacionRecPro}
          totalNotasRec={grabadorLocal.secuencia.length}
          tiempoGrabacionRecMs={tiempoGrabacionRecProMs}
          // Props Librería
          onReproducirLibreria={handleReproducirLibreria}
          onEditarSecuenciaLibreria={handleAbrirModalEditor}
          onMarcarEntradaEdicionLibreria={marcarEntradaEdicion}
          onMarcarSalidaEdicionLibreria={marcarSalidaEdicion}
          onIniciarPunchInLibreria={iniciarPunchInEdicion}
          onGuardarEdicionSecuenciaLibreria={guardarEdicionSecuencia}
          onCancelarEdicionSecuenciaLibreria={cancelarEdicionSecuencia}
          onLimpiarRangoEdicionLibreria={limpiarRangoEdicion}
          cancionEditandoLibreriaId={cancionEditandoSecuencia?.id || null}
          tituloCancionEditandoLibreria={cancionEditandoSecuencia?.titulo || null}
          bpmCancionEditandoLibreria={cancionEditandoSecuencia?.bpm || bpm}
          mensajeEdicionSecuenciaLibreria={mensajeEdicionSecuencia}
          cancionActualizadaLibreria={ultimaCancionLibreriaActualizada}
          guardandoEdicionSecuenciaLibreria={guardandoEdicionSecuencia}
          hayCambiosEdicionSecuenciaLibreria={hayCambiosEdicionSecuencia}
          grabandoEdicionSecuenciaLibreria={estaGrabandoEdicionSecuencia}
          esperandoPunchInLibreria={esperandoPunchIn}
          // Props Lista Acordes
          onReproducirAcorde={onReproducirAcorde}
          onDetenerAcorde={onDetener}
          idSonandoAcorde={idSonandoCiclo}
          onEditarAcordePanel={setAcordeAEditar}
          tonalidadActualAcordes={logica.tonalidadSeleccionada}
          // Props REC con backing track
          pistaActualUrl={pistaUrl}
          onPistaChange={handlePistaChange}
          reproduciendoHero={reproduciendo}
          cancionActual={null} // O pasar cancionSeleccionada si se agrega a props
          tickActual={tickActual}
          totalTicks={totalTicksTransporte}
          loopABHero={loopAB}
          onAlternarPausaHero={onAlternarPausa}
          onDetenerHero={onDetenerHero}
          onBuscarTickHero={onBuscarTick}
          bpmGrabacion={bpmGrabacion}
          punchInTick={punchInTick}
          setPunchInTick={onActualizarLoopInicio}
          preRollSegundos={preRollSegundos}
          setPreRollSegundos={setPreRollSegundos}
          cuentaAtrasPreRoll={null}
          onIniciarPunchIn={iniciarPunchInEdicion}
          esperandoPunchIn={esperandoPunchIn}
          metronomoActivo={metronomoActivo}
          setMetronomoActivo={setMetronomoActivo}
        />
        )}

        {cancionEnModalEditor && (
          <ModalEditorSecuencia
            cancion={cancionEnModalEditor}
            onCerrar={() => {
              setCancionEnModalEditor(null);
              logica.limpiarTodasLasNotas();
              notasCheadasModalRef.current.clear();
              // Recargar la canción en la librería si fue modificada
              if (cancionEnModalEditor?.id === cancionActivaLibreria?.id) {
                // La canción se recarga automáticamente
              }
            }}
            tickActual={tickActual}
            totalTicks={totalTicksTransporte}
            reproduciendoHero={reproduciendo}
            onAlternarPausa={onAlternarPausa}
            onDetener={onDetenerHero}
            onBuscarTick={onBuscarTick}
            bpm={bpm}
            onCambiarBpm={onCambiarBpm}
            grabando={estaGrabandoEdicionSecuencia}
            tiempoGrabacionMs={tiempoGrabacionRecProMs}
            cuentaAtrasPreRoll={esperandoPunchIn ? 4 : null}
            onIniciarGrabacion={iniciarPunchInEdicion}
            onDetenerGrabacion={detenerGrabacionRecPro}
            punchInTick={punchInTick}
            setPunchInTick={onActualizarLoopInicio}
            notasGrabadas={grabadorLocal.secuencia}
            onNotasActuales={handleNotasActualesDelModal}
            onSecuenciaChange={setSecuenciaVisualModal}
            duracionAudioProp={audioRef.current?.duration || 0}
          />
        )}
      </div>

      <PanelAjustes
        modoAjuste={modoAjuste}
        setModoAjuste={setModoAjuste}
        pestanaActiva={pestanaActiva}
        setPestanaActiva={setPestanaActiva}
        botonSeleccionado={logica.botonSeleccionado}
        setBotonSeleccionado={logica.setBotonSeleccionado}
        ajustes={logica.ajustes}
        setAjustes={logica.setAjustes}
        tonalidadSeleccionada={logica.tonalidadSeleccionada}
        setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
        listaTonalidades={logica.listaTonalidades}
        setListaTonalidades={logica.setListaTonalidades}
        nombresTonalidades={logica.nombresTonalidades}
        actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
        sonidosVirtuales={logica.sonidosVirtuales}
        setSonidosVirtuales={logica.setSonidosVirtuales}
        eliminarTonalidad={logica.eliminarTonalidad}
        mapaBotonesActual={logica.mapaBotonesActual}
        playPreview={logica.playPreview}
        stopPreview={logica.stopPreview}
        reproduceTono={logica.reproduceTono}
        samplesBrillante={logica.samplesBrillante}
        samplesBajos={logica.samplesBajos}
        samplesArmonizado={logica.samplesArmonizado}
        muestrasDB={logica.muestrasDB}
        soundsPerKey={logica.soundsPerKey}
        obtenerRutasAudio={logica.obtenerRutasAudio}
        guardarAjustes={logica.guardarAjustes}
        resetearAjustes={logica.resetearAjustes}
        sincronizarAudios={logica.sincronizarAudios}
        guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
        instrumentoId={logica.instrumentoId}
        setInstrumentoId={logica.setInstrumentoId}
        listaInstrumentos={logica.listaInstrumentos}
      />

      <ModalGuardarPracticaLibre
        visible={mostrarModalGuardar}
        guardando={guardandoGrabacion}
        error={errorGuardadoGrabacion}
        tituloSugerido={tituloSugeridoGrabacion}
        resumen={resumenGrabacionPendiente}
        onCancelar={onCancelarGuardado}
        onGuardar={(titulo, descripcion) => onGuardarGrabacion({ titulo, descripcion })}
      />

      {esAdmin && (
        <>
          <ModalCreadorAcordes
            visible={modalCreadorAcordesVisible}
            onCerrar={() => {
              setModalCreadorAcordesVisible(false);
              if (acordeAEditar) setModalListaAcordesVisible(true);
              setAcordeAEditar(null);
            }}
            botonesSeleccionados={Object.keys(logica.botonesActivos)}
            fuelleActual={logica.direccion === 'halar' ? 'abriendo' : 'cerrando'}
            tonalidadActual={logica.tonalidadSeleccionada}
            acordeAEditar={acordeAEditar}
            onExitoUpdate={() => {
              setModalListaAcordesVisible(true);
            }}
          />

          <ModalListaAcordes
            visible={modalListaAcordesVisible}
            onCerrar={() => setModalListaAcordesVisible(false)}
            tonalidadActual={logica.tonalidadSeleccionada}
            onReproducirAcorde={onReproducirAcorde}
            onDetener={onDetener}
            idSonando={idSonandoCiclo || (acordeMaestroActivo ? 'activo' : null)}
            onEditarAcorde={onEditarAcorde}
            onNuevoAcordeEnCirculo={onNuevoAcordeEnCirculo}
            onReproducirCirculoCompleto={onReproducirCirculoCompleto}
          />

          {/* Modal para guardar grabación REC PRO en canciones_hero */}
          <ModalGuardarHero
            visible={modalGuardarHeroVisible}
            onCerrar={() => {
              setModalGuardarHeroVisible(false);
            }}
            bpm={bpmHero}
            totalNotas={grabadorLocal.secuencia.length}
            sugerenciaTipo={tipoSugeridoGrabacion}
            tonalidadActual={logica.tonalidadSeleccionada}
            onGuardar={async (datos) => {
              try {
                console.log('💾 Guardando grabación...');
                console.log('📝 Datos formulario:', datos);
                console.log('📝 Secuencia local:', grabadorLocal.secuencia);
                console.log('📊 Grabador estado:', {
                  grabando: grabadorLocal.grabando,
                  secuenciaLength: grabadorLocal.secuencia.length,
                  bpm: bpmHero
                });

                const secuenciaFinal = grabadorLocal.secuencia;

                if (!secuenciaFinal || secuenciaFinal.length === 0) {
                  console.error('❌ No hay notas grabadas');
                  alert('❌ No hay notas grabadas. Presiona algunos botones del acordeon antes de guardar.');
                  return;
                }

                console.log('✅ Secuencia válida:', {
                  cantidad: secuenciaFinal.length,
                  primera: secuenciaFinal[0],
                  ultima: secuenciaFinal[secuenciaFinal.length - 1]
                });

                // 🎯 GUARDAR USANDO EL GRABADOR LOCAL (IGUAL A SIMULADOR)
                // Esto usa useGrabadorHero.guardarSecuencia() que funciona en SimuladorDeAcordeon
                const resultado = await grabadorLocal.guardarSecuencia({
                  titulo: datos.titulo,
                  autor: datos.autor,
                  descripcion: datos.descripcion,
                  tipo: datos.tipo,
                  dificultad: datos.dificultad,
                  usoMetronomo: usoMetronomoRef.current,
                  tonalidad: logica.tonalidadSeleccionada,
                  pistaFile: pistaFile
                });

                console.log('💾 Resultado guardado:', resultado);

                if (resultado.error) {
                  const mensajeError = typeof resultado.error === 'string'
                    ? resultado.error
                    : (resultado.error as any)?.message || 'Error al guardar';
                  console.error('❌ Error al guardar:', resultado.error);
                  alert('❌ Error al guardar: ' + mensajeError);
                } else {
                  console.log('✅ Grabación guardada exitosamente');
                  alert('✅ ¡Se grabó correctamente en la nube!');
                  setModalGuardarHeroVisible(false);
                }
              } catch (error) {
                console.error('❌ Error guardando:', error);
                alert('❌ Error: ' + (error as any).message);
              }
            }}
          />

          {/* Modal para guardar grabación PROFESIONAL (Admin REC) */}
          <ModalGuardarHero
            visible={mostrarModalProfesional}
            onCerrar={onCancelarGuardado}
            bpm={bpmGrabacion}
            totalNotas={secuenciaGrabacion.length}
            sugerenciaTipo="secuencia"
            tonalidadActual={logica.tonalidadSeleccionada}
            onGuardar={async (datos) => {
              try {
                const exito = await onGuardarGrabacion(datos);
                if (exito) alert('✅ Grabación profesional guardada correctamente');
              } catch (error) {
                console.error('Error guardando:', error);
                alert('❌ Error al guardar');
              }
            }}
          />
        </>
      )}
    </section>
  );
};

export default EstudioPracticaLibre;
