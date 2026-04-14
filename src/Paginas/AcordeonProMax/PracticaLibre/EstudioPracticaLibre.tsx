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
import { motorAudioPro } from '../../SimuladorDeAcordeon/AudioEnginePro';
import './EstudioPracticaLibre.css';

// ✅ Removemos BarraTransporte import - ahora usamos BarraReproductorPracticaLibre independiente

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
  loopAB: { start: number; end: number; activo: boolean };
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

function formatearDuracion(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

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
  // Loop props - removidas de destructuración ya que PracticaLibre no usa bucles
  // loopAB, onMarcarLoopInicio, onMarcarLoopFin, onActualizarLoopInicio, onActualizarLoopFin, onAlternarLoop, onLimpiarLoop,
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
  const [idSonandoCiclo, setIdSonandoCiclo] = React.useState<string | null>(null);
  const [acordeMaestroActivo, setAcordeMaestroActivo] = React.useState(false);
  const timerAutostopRef = React.useRef<any>(null);
  const cicloActivoRef = React.useRef(false);

  // Estados para REC con backing track
  const [bpmHero, setBpmHero] = React.useState(120);
  const [pistaUrl, setPistaUrl] = React.useState<string | null>(null);
  const [pistaFile, setPistaFile] = React.useState<File | null>(null);
  const [bpmGrabacion, setBpmGrabacion] = React.useState(120);
  const [modalGuardarHeroVisible, setModalGuardarHeroVisible] = React.useState(false);

  // Rastrear si acaba de terminar la grabación
  const [lastGrabando, setLastGrabando] = React.useState(false);
  const [tipoSugeridoGrabacion, setTipoSugeridoGrabacion] = React.useState<'secuencia' | 'cancion' | 'ejercicio'>('secuencia');
  const usoMetronomoRef = React.useRef(false);

  // Estados de grabación
  const [metronomoActivo, setMetronomoActivo] = React.useState(false);
  const [bpmOriginalGrabacion, setBpmOriginalGrabacion] = React.useState(120);

  // Sincronizar ref para metadata
  React.useEffect(() => {
    usoMetronomoRef.current = metronomoActivo;
  }, [metronomoActivo]);

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
  const grabadorLocal = useGrabadorHero(bpm);
  const botonesActivosAnteriorRef = React.useRef<Record<string, any>>({});

  // Sincronizar inicio/fin de grabación
  React.useEffect(() => {
    if (grabando && !grabadorLocal.grabando) {
      console.log('🔴 Iniciando grabación local...');
      grabadorLocal.iniciarGrabacion();
    } else if (!grabando && grabadorLocal.grabando) {
      console.log('⏹️ Deteniendo grabación local...');
      const resultado = grabadorLocal.detenerGrabacion();
      console.log('✅ Grabación local detenida. Notas capturadas:', resultado.secuencia.length);
    }
  }, [grabando, grabadorLocal]);

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

    const intervalMs = (60 / bpm) * 1000;
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
  }, [metronomoActivo, bpm, reproduciendo]);

  // 🎯 EFECTO: Mostrar modal cuando termina grabación (IGUAL A AcordeonSimulador)
  React.useEffect(() => {
    console.log('🔄 Estado grabación:', { grabando, lastGrabando, resumenPendiente: resumenGrabacionPendiente?.notas });

    if (grabando) {
      // Registrar si se está usando metrónomo al iniciar
      usoMetronomoRef.current = metronomoActivo;
      setLastGrabando(true);
    }

    // Si estábamos grabando y ahora NO, mostrar modal
    if (lastGrabando && !grabando) {
      console.log('✅ Transición: Grabando → Parado. Mostrando modal...');

      // Mostrar modal incluso si no tenemos resumen (el servidor lo calcula)
      // Determinar tipo sugerido basado en uso de metrónomo
      if (usoMetronomoRef.current) {
        setTipoSugeridoGrabacion('secuencia');
      } else {
        setTipoSugeridoGrabacion('ejercicio');
      }

      // Mostrar modal de guardado
      setModalGuardarHeroVisible(true);
      setLastGrabando(false);
    }
  }, [grabando, lastGrabando, metronomoActivo]);

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

  // Effect: mostrar modal de guardar cuando REC termina
  // (Ahora se maneja en el parent o vía props)


  const manejarGrabacion = async () => {
    if (grabando) {
      onDetenerGrabacion();
      return;
    }

    // 1. Preparar pista de fondo si existe
    if (estudio.pistaActiva) {
      await estudio.prepararPistaParaGrabar();
    }

    // 2. Determinar tipo de grabación
    const tipo = (esAdmin && estudio.panelActivo === 'rec') ? 'competencia' : 'practica_libre';

    // 3. Iniciar grabación
    onIniciarGrabacion(tipo);
  };


  const handlePistaChange = (url: string | null, archivo: File | null) => {
    setPistaUrl(url);
    setPistaFile(archivo);
  };

  const handleReproducirLibreria = (cancion: any) => {
    console.log('🎵 Reproduciendo desde librería:', cancion);

    // 1. Actualizar BPM
    const bpmCancion = cancion.bpm || 120;
    setBpmHero(bpmCancion);
    setBpmGrabacion(bpmCancion);
    setBpmOriginalGrabacion(bpmCancion); // ✅ Guarda el BPM original para que el audio escale correctamente

    // 2. Cargar pista de fondo si existe
    if (cancion.audio_fondo_url) {
      console.log('🔊 Cargando pista de fondo:', cancion.audio_fondo_url);
      setPistaUrl(cancion.audio_fondo_url);
      setPistaFile(null);
    }

    // 3. Resetear posición y reproducir desde cero
    onBuscarTick(0);

    // 4. Asegurar que la secuencia tenga el formato correcto
    const secuenciaParaReproducir = {
      ...cancion,
      secuencia: cancion.secuencia || cancion.secuencia_json || [],
      bpm: cancion.bpm || 120,
      tonalidad: cancion.tonalidad || 'ADG',
      id: cancion.id || 'grabacion-' + Date.now()
    };

    console.log('📝 Secuencia a reproducir:', secuenciaParaReproducir.secuencia?.length, 'notas');

    // 5. Reproducir la secuencia (esto sincroniza ticks automáticamente)
    // y se mostrarán las notas visualmente
    onReproducirSecuencia(secuenciaParaReproducir);
  };

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
        grabando={grabando}
        tiempoGrabacion={formatearDuracion(tiempoGrabacionMs)}
        onAlternarGrabacion={manejarGrabacion}
        esAdmin={esAdmin}
        esp32Conectado={logica.esp32Conectado}
        onVolver={onVolver}
      />

      {!mostrarModalGuardar && errorGuardadoGrabacion && (
        <div className="estudio-practica-libre-alerta">{errorGuardadoGrabacion}</div>
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
            {ultimaGrabacionGuardada && !grabando && (
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

            {/* Puente de Notas (Falling Notes) */}
            {(reproduciendo || grabando) && (
              <PuenteNotas
                cancion={{
                  id: 'practica-id',
                  titulo: 'Práctica',
                  secuencia: (reproduciendo ? secuencia : secuenciaGrabacion) || [],
                  bpm: bpm,
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
          {(reproduciendo || grabando || pistaUrl) && (
            <div className="estudio-practica-libre-transport-fixed">
              <BarraReproductorPracticaLibre
                reproduciendo={reproduciendo || grabando}
                pausado={pausado && !grabando}
                onAlternarPausa={() => {
                   // 🔒 🔒 🔒 COMPLETAMENTE INDEPENDIENTE: NUNCA dispara estado global
                   if (grabando) {
                       // Si estamos grabando, detener grabación
                       onDetenerGrabacion();
                   } else {
                       // Si estamos reproduciendo en PracticaLibre, pausar la reproducción
                       // usando el callback del parent que pausa sin cambiar estado global
                       onAlternarPausa();
                       console.log('⏸️ PracticaLibre: Pausa LOCAL (sin afectar estado global)');
                   }
                }}
                onDetener={() => {
                   // 🔒 🔒 🔒 COMPLETAMENTE INDEPENDIENTE: Reinicia LOCAL SOLO
                   if (grabando) {
                       onDetenerGrabacion();
                   } else {
                       // Resetear a inicio SIN alterar estado global
                       onBuscarTick?.(0);
                       console.log('⏹️ PracticaLibre: Resetear a inicio (sin afectar estado global)');
                   }
                }}
                tickActual={tickActual || 0}
                totalTicks={totalTicks || 2100}
                onBuscarTick={(tick) => {
                   // 🔒 Buscar tick LOCAL SOLO
                   onBuscarTick?.(tick);
                }}
                bpm={bpm}
                onCambiarBpm={onCambiarBpm}
              />
            </div>
          )}
        </div>

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
          grabandoRec={grabando}
          onIniciarGrabacionRec={onIniciarGrabacion}
          onDetenerGrabacionRec={onDetenerGrabacion}
          totalNotasRec={secuenciaGrabacion.length}
          tiempoGrabacionRecMs={tiempoGrabacionMs}
          // Props Librería
          onReproducirLibreria={handleReproducirLibreria}
          // Props Lista Acordes
          onReproducirAcorde={(botones, fuelle, id) => {
            logica.limpiarTodasLasNotas();
            if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);

            const dirNueva = fuelle === 'abriendo' ? 'halar' : 'empujar';
            logica.setDireccion(dirNueva);
            if (id) setIdSonandoCiclo(id);

            // Pequeño delay para asegurar que el cambio de dirección (fuelle)
            // se procese antes de activar las notas.
            setTimeout(() => {
              botones.forEach((idBoton: string) => {
                // El ID que viene de la DB puede ser "4-2" pero necesitamos
                // el ID completo "4-2-halar" o "4-2-empujar"
                const parts = idBoton.split('-');
                const esBajo = idBoton.includes('bajo');
                const idFinal = `${parts[0]}-${parts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
                logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
              });
            }, 50);

            // Auto-stop después de 5 segundos
            timerAutostopRef.current = setTimeout(() => {
              logica.limpiarTodasLasNotas();
              setIdSonandoCiclo(null);
            }, 5000);
          }}
          onDetenerAcorde={() => {
            if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);
            logica.limpiarTodasLasNotas();
            setIdSonandoCiclo(null);
          }}
          idSonandoAcorde={idSonandoCiclo}
          onEditarAcordePanel={setAcordeAEditar}
          tonalidadActualAcordes={logica.tonalidadSeleccionada}
          // Props REC con backing track
          pistaActualUrl={pistaUrl}
          onPistaChange={handlePistaChange}
          reproduciendoHero={reproduciendo}
          cancionActual={null} // O pasar cancionSeleccionada si se agrega a props
          tickActual={tickActual}
          totalTicks={totalTicks}
          onAlternarPausaHero={onAlternarPausa}
          onDetenerHero={onDetenerHero}
          onBuscarTickHero={onBuscarTick}
          bpmGrabacion={bpmGrabacion}
          metronomoActivo={metronomoActivo}
          setMetronomoActivo={setMetronomoActivo}
        />
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
            onReproducirAcorde={(botones, fuelle, id) => {
              logica.limpiarTodasLasNotas();
              if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);

              const dirNueva = fuelle === 'abriendo' ? 'halar' : 'empujar';
              logica.setDireccion(dirNueva);
              setAcordeMaestroActivo(true);
              if (id) setIdSonandoCiclo(id);

              setTimeout(() => {
                botones.forEach((idNote: string) => {
                  const originalParts = idNote.split('-');
                  const esBajo = idNote.includes('bajo');
                  const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
                  logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
                });
              }, 50);

              timerAutostopRef.current = setTimeout(() => {
                logica.limpiarTodasLasNotas();
                setAcordeMaestroActivo(false);
                setIdSonandoCiclo(null);
              }, 5000);
            }}
            onDetener={() => {
              if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);
              cicloActivoRef.current = false;
              logica.limpiarTodasLasNotas();
              setAcordeMaestroActivo(false);
              setIdSonandoCiclo(null);
            }}
            idSonando={idSonandoCiclo || (acordeMaestroActivo ? 'activo' : null)}
            onEditarAcorde={(acorde) => {
              setModalListaAcordesVisible(false);
              setAcordeAEditar(acorde);
              setModalCreadorAcordesVisible(true);
            }}
            onNuevoAcordeEnCirculo={(tonalidad, modalidad) => {
              setModalListaAcordesVisible(false);
              setAcordeAEditar({
                grado: tonalidad || '',
                modalidad_circulo: modalidad || 'Mayor',
              });
              setModalCreadorAcordesVisible(true);
            }}
            onReproducirCirculoCompleto={async (acordes) => {
              if (cicloActivoRef.current) {
                cicloActivoRef.current = false;
                logica.limpiarTodasLasNotas();
                setAcordeMaestroActivo(false);
                return;
              }

              cicloActivoRef.current = true;
              setAcordeMaestroActivo(true);

              for (const ac of acordes) {
                setIdSonandoCiclo(ac.id);

                logica.limpiarTodasLasNotas();
                const dirNueva = ac.fuelle === 'abriendo' ? 'halar' : 'empujar';
                logica.setDireccion(dirNueva);

                await new Promise((r) => setTimeout(r, 50));
                if (!cicloActivoRef.current) break;

                ac.botones.forEach((id: string) => {
                  const originalParts = id.split('-');
                  const esBajo = id.includes('bajo');
                  const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
                  logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
                });

                await new Promise((r) => {
                  timerAutostopRef.current = setTimeout(r, 3000);
                });
              }

              cicloActivoRef.current = false;
              logica.limpiarTodasLasNotas();
              setAcordeMaestroActivo(false);
              setIdSonandoCiclo(null);
            }}
          />

          {/* Modal para guardar grabación PRÁCTICA LIBRE (Automático) */}
          <ModalGuardarHero
            visible={modalGuardarHeroVisible}
            onCerrar={() => {
              setModalGuardarHeroVisible(false);
              // Limpiar estado si el usuario cancela
              onCancelarGuardado?.();
            }}
            bpm={bpmHero}
            totalNotas={resumenGrabacionPendiente?.notas || 0}
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
                  bpm: bpm
                });

                // ✅ USAR SECUENCIA DEL GRABADOR LOCAL (esto tiene las notas REALES)
                const secuenciaFinal = grabadorLocal.secuencia && grabadorLocal.secuencia.length > 0
                  ? grabadorLocal.secuencia
                  : secuenciaGrabacion;

                if (!secuenciaFinal || secuenciaFinal.length === 0) {
                  console.error('❌ No hay notas grabadas');
                  alert('❌ No hay notas grabadas. Presiona algunos botones del acordeón antes de guardar.');
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
                  console.error('❌ Error al guardar:', resultado.error);
                  alert('❌ Error al guardar: ' + (resultado.error as any).message);
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
