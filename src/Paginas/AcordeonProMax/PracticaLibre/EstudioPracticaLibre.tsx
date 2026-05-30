import * as React from 'react'
import dynamic from 'next/dynamic';
import PanelAjustes from '../../../Core/componentes/PanelAjustes/PanelAjustes';
import CuerpoAcordeonBase from '../../../Core/componentes/CuerpoAcordeon';

const CuerpoAcordeon = React.memo(CuerpoAcordeonBase);
import { TONALIDADES } from '../../../Core/acordeon/notasAcordeonDiatonico';
import { obtenerModeloVisualPorId, resolverImagenModeloAcordeon } from './Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from './Hooks/useEstudioPracticaLibre';
import { useMetronomoEstudiante } from './Hooks/useMetronomoEstudiante';
import BarraSuperiorPracticaLibre from './Componentes/BarraSuperiorPracticaLibre';
import PanelLateralEstudiante from './Componentes/PanelLateralEstudiante';
import ModalGuardarPracticaLibre from './Componentes/ModalGuardarPracticaLibre';
import ReproductorCancionHero from './Componentes/ReproductorCancionHero';
import { VARIANTES_3D, type VarianteId } from './Componentes/SeccionPL3D';
import type { AnimShapeKeyId, AnimProgramaticaId, InfoPieza, MaterialPieza } from './Componentes/VisorAcordeon3D';
import { formatearDuracion } from './Utilidades/SecuenciaLogic';
import { LogicaAcordeonProvider } from './contextoLogicaAcordeon';
import './EstudioPracticaLibre.css';

// Three.js es pesado (~500KB) — cargar solo cuando el alumno abre la pestaña 3D.
const VisorAcordeon3D = dynamic(
  () => import('./Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="visor-acordeon-3d-cargando">Cargando visor 3D…</div> }
);

// Personaje 3D con acordeón: GLB pesado, cargar solo al abrir la pestaña Personaje.
const VisorPersonaje3D = dynamic(
  () => import('./Componentes/VisorPersonaje3D'),
  { ssr: false, loading: () => <div className="visor-acordeon-3d-cargando">Cargando personaje 3D…</div> }
);

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
  guardandoGrabacion: boolean;
  errorGuardadoGrabacion: string | null;
  tituloSugeridoGrabacion: string;
  resumenGrabacionPendiente: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  ultimaGrabacionGuardada: { id: string; titulo: string } | null;
  onIniciarGrabacion: (tipo?: 'practica_libre' | 'competencia') => void;
  onDetenerGrabacion: (metadataExtra?: Record<string, any>) => void;
  onGuardarGrabacion: (datos: any) => Promise<boolean>;
  onCancelarGuardado: () => void;
  volumenAcordeon: number;
  setVolumenAcordeon: (v: number) => void;
  onVolver?: () => void;
  esp32Conectado?: boolean;
  conectarESP32?: () => Promise<void>;
  hero?: any;
}

const EstudioPracticaLibre: React.FC<EstudioPracticaLibreProps> = ({
  logica, modoAjuste, setModoAjuste, pestanaActiva, setPestanaActiva,
  imagenFondo, modosVista, grabando, tiempoGrabacionMs,
  mostrarModalGuardar, guardandoGrabacion, errorGuardadoGrabacion,
  tituloSugeridoGrabacion, resumenGrabacionPendiente, ultimaGrabacionGuardada,
  onIniciarGrabacion, onDetenerGrabacion, onGuardarGrabacion, onCancelarGuardado,
  volumenAcordeon, setVolumenAcordeon, onVolver, esp32Conectado = false, conectarESP32,
  hero,
}) => {
  // Canción hero seleccionada para reproducir inline (sin salir de Práctica Libre).
  const [cancionEnReproductor, setCancionEnReproductor] = React.useState<any>(null);
  const [seccionInicialPendiente, setSeccionInicialPendiente] = React.useState<any>(null);

  const onSeleccionarCancionHero = React.useCallback((cancion: any) => {
    setCancionEnReproductor(cancion);
    setSeccionInicialPendiente(null);
  }, []);

  const onSeleccionarSeccionHero = React.useCallback((cancion: any, seccion: any) => {
    setCancionEnReproductor(cancion);
    setSeccionInicialPendiente(seccion);
  }, []);

  const cerrarReproductor = React.useCallback(() => {
    setCancionEnReproductor(null);
    setSeccionInicialPendiente(null);
  }, []);

  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando,
    volumenAcordeon,
    setVolumenAcordeon,
  });
  const metronomo = useMetronomoEstudiante();

  // ─── Visor 3D ───────────────────────────────────────────────────────
  // Material por mesh: clave 'todos' es default, claves de grupo (ej 'botones-melodia')
  // sobrescriben para ese grupo, claves de nombre exacto (ej 'Boton_D_05') ganan a todo lo demás.
  // Default cálido: textura baked tintada en un crema marfil (no blanco plano).
  // Cuando el usuario aplique cualquier color del panel, se desactiva la textura y va
  // sólido. Cuando vuelva a "Original" (#ffffff), se restaura este look cálido.
  const [materialPorMesh, setMaterialPorMesh] = React.useState<Record<string, MaterialPieza>>({
    todos: { tinta: '#f5ead3', roughness: 0.55, metalness: 0.08, usarTexturaOriginal: true },
  });
  const [visor3dPiezas, setVisor3dPiezas] = React.useState<InfoPieza[]>([]);
  const [piezaSeleccionada, setPiezaSeleccionada] = React.useState<string | null>(null);
  const [grupoActivo, setGrupoActivo] = React.useState<string>('todos');
  const [visor3dShapeKey, setVisor3dShapeKey] = React.useState<{ id: AnimShapeKeyId; epoch: number } | null>(null);
  const [visor3dProgramatica, setVisor3dProgramatica] = React.useState<{ id: AnimProgramaticaId; epoch: number } | null>(null);
  const [pulseEpoch, setPulseEpoch] = React.useState<{ mesh: string; epoch: number } | null>(null);

  // Q key (control continuo del fuelle). Usamos ref para que el visor lo lea en useFrame sin re-renderizar.
  const fuelleCerrandoRef = React.useRef(false);
  React.useEffect(() => {
    if (estudio.panelActivo !== 'visor3d') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') fuelleCerrandoRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') fuelleCerrandoRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      fuelleCerrandoRef.current = false;
    };
  }, [estudio.panelActivo]);

  // Click en una pieza del visor → la deja seleccionada y dispara pulse visual.
  const onClickPieza = React.useCallback((nombre: string) => {
    setPiezaSeleccionada(nombre);
    setPulseEpoch({ mesh: nombre, epoch: Date.now() });
  }, []);

  // Aplicar color al target actual: pieza individual gana, sino grupo.
  // hex === '#ffffff' = boton "Original" del panel → vuelve a mostrar la textura baked
  // del GLB. Cualquier otro color → mostramos solido sin textura para que el cambio se
  // vea limpio (sin la textura baked filtrando el color).
  const aplicarTinta = React.useCallback((hex: string) => {
    const target = piezaSeleccionada ?? grupoActivo;
    const esOriginal = hex.toLowerCase() === '#ffffff';
    setMaterialPorMesh((prev) => ({
      ...prev,
      [target]: {
        ...(prev[target] ?? prev['todos']),
        tinta: hex,
        usarTexturaOriginal: esOriginal,
      },
    }));
  }, [piezaSeleccionada, grupoActivo]);

  const aplicarVariante = React.useCallback((id: VarianteId) => {
    const v = VARIANTES_3D.find((x) => x.id === id) ?? VARIANTES_3D[1];
    const target = piezaSeleccionada ?? grupoActivo;
    setMaterialPorMesh((prev) => ({
      ...prev,
      [target]: {
        ...(prev[target] ?? prev['todos']),
        roughness: v.roughness,
        metalness: v.metalness,
        usarTexturaOriginal: false,
      },
    }));
  }, [piezaSeleccionada, grupoActivo]);

  const dispararVisor3DShapeKey = React.useCallback((id: AnimShapeKeyId) => {
    setVisor3dShapeKey({ id, epoch: Date.now() });
  }, []);
  const dispararVisor3DProgramatica = React.useCallback((id: AnimProgramaticaId) => {
    setVisor3dProgramatica({ id, epoch: Date.now() });
  }, []);
  const detenerVisor3DProgramatica = React.useCallback(() => {
    setVisor3dProgramatica(null);
  }, []);
  // Solo las animaciones programáticas en loop (Respira) deben mostrarse como "activas"
  // — las one-shot terminan solas y el botón Stop no aplica para ellas.
  const programaticaActiva = visor3dProgramatica?.id === 'Respira' ? visor3dProgramatica.id : null;

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
    const actual = logica.listaInstrumentos?.find((i: any) => i.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  const imagenFondoAcordeon = React.useMemo(
    () => resolverImagenModeloAcordeon(estudio.preferencias.modeloVisualId, imagenFondo),
    [estudio.preferencias.modeloVisualId, imagenFondo]
  );

  React.useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;
    const timer = window.setTimeout(() => void logica.guardarAjustes(), 420);
    return () => window.clearTimeout(timer);
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  // Cuando el alumno cambia de modo (sin estar grabando), apagamos todo lo del modo
  // anterior. Sino, si activó pista en modo "pista" y cambia a "metronomo", la pista
  // sigue sonando y se mete en su sesión de metrónomo → modos enredados.
  React.useEffect(() => {
    if (grabando) return;
    estudio.pausarPista();
    if (metronomo.activo) metronomo.setActivo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudio.modoGrabacion]);

  const manejarGrabacionSesion = async () => {
    if (grabando) {
      // Al detener: silenciar todo lo que estaba sonando como guía + snapshot del metrónomo
      // para que el replay lo reconstruya con la misma config (bpm, compás, sonido, etc).
      const metadataExtra: Record<string, any> = {};
      if (estudio.modoGrabacion === 'metronomo') {
        metadataExtra.metronomo = {
          activo: true,
          bpm: metronomo.bpm,
          compas: metronomo.compas,
          subdivision: metronomo.subdivision,
          sonido: metronomo.sonido,
          volumen: metronomo.volumen,
        };
      }
      if (metronomo.activo) metronomo.setActivo(false);
      estudio.pausarPista();
      onDetenerGrabacion(metadataExtra);
      return;
    }
    // ARRANQUE — aislamiento estricto: apagamos TODO antes de activar SÓLO el guía del
    // modo elegido. Si el alumno había manualmente puesto play a la pista, o el metrónomo
    // venía activo de antes, lo paramos. Cada modo arranca limpio.
    estudio.pausarPista();
    if (metronomo.activo) metronomo.setActivo(false);

    if (estudio.modoGrabacion === 'pista') {
      // Sólo prepara/arranca la pista si hay una seleccionada. Si no, la grabación va
      // muda (mismo efecto que modo 'libre') — el alumno ve el aviso en el panel.
      if (estudio.pistaActiva) await estudio.prepararPistaParaGrabar();
    } else if (estudio.modoGrabacion === 'metronomo') {
      metronomo.setActivo(true);
    }
    // 'libre' no hace nada — solo acordeón.
    onIniciarGrabacion('practica_libre');
  };

  // El botón REC superior NO inicia/detiene la grabación: solo es atajo para abrir el panel
  // "Pistas y Estudio", donde el alumno elige el modo y luego graba con el botón REC interno.
  // Así forzamos que la elección de modo (libre / pista / metrónomo) sea siempre explícita.
  const abrirPanelGrabacion = () => {
    if (estudio.panelActivo !== 'pistas') estudio.alternarPanel('pistas');
  };

  return (
    <LogicaAcordeonProvider logica={logica}>
    <section className="estudio-practica-libre">
      <BarraSuperiorPracticaLibre
        panelActivo={estudio.panelActivo}
        onAlternarPanel={estudio.alternarPanel}
        tonalidad={logica.tonalidadSeleccionada}
        timbre={logica.ajustes?.timbre || 'Brillante'}
        nombreInstrumento={nombreInstrumento}
        nombreModelo={modeloActivo.nombre}
        nombrePista={estudio.pistaActiva?.nombre || estudio.preferencias.pistaNombre}
        grabandoSesion={grabando}
        tiempoGrabacionSesion={formatearDuracion(tiempoGrabacionMs)}
        onAlternarGrabacion={abrirPanelGrabacion}
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
            {estudio.pistaActiva && <div className="estudio-practica-libre-escenario-chip">Pista {estudio.pistaActiva.nombre}</div>}
            {ultimaGrabacionGuardada && !grabando && (
              <div className="estudio-practica-libre-escenario-chip">Guardada {ultimaGrabacionGuardada.titulo}</div>
            )}
          </div>

          <div className="estudio-practica-libre-area-acordeon">
            <div className="estudio-practica-libre-acordeon">
              {estudio.panelActivo === 'personaje3d' ? (
                <VisorPersonaje3D />
              ) : estudio.panelActivo === 'visor3d' ? (
                <VisorAcordeon3D
                  materialPorMesh={materialPorMesh}
                  piezaSeleccionada={piezaSeleccionada}
                  onClickPieza={onClickPieza}
                  onMallasDetectadas={setVisor3dPiezas}
                  fuelleCerrandoRef={fuelleCerrandoRef}
                  animShapeKey={visor3dShapeKey}
                  animProgramatica={visor3dProgramatica}
                  pulseEpoch={pulseEpoch}
                />
              ) : (
                logica.disenoCargado && (
                  <CuerpoAcordeon
                    imagenFondo={imagenFondoAcordeon}
                    ajustes={ajustesPractica as any}
                    direccion={logica.direccion}
                    configTonalidad={logica.configTonalidad}
                    botonesActivos={logica.botonesActivos}
                    modoAjuste={modoAjuste}
                    botonSeleccionado={logica.botonSeleccionado}
                    modoVista={logica.modoVista}
                    vistaDoble={false}
                    setBotonSeleccionado={logica.setBotonSeleccionado}
                    actualizarBotonActivo={logica.actualizarBotonActivo}
                    listo
                  />
                )
              )}
            </div>
          </div>
        </div>

        <PanelLateralEstudiante
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
          onAbrirEditorAvanzado={() => { setPestanaActiva('sonido'); setModoAjuste(true); }}
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
          onSeleccionarCancionHero={onSeleccionarCancionHero}
          onSeleccionarSeccionHero={onSeleccionarSeccionHero}
          modoGrabacion={estudio.modoGrabacion}
          onCambiarModoGrabacion={estudio.setModoGrabacion}
          metronomo={metronomo}
          grabando={grabando}
          tiempoGrabacionTexto={formatearDuracion(tiempoGrabacionMs)}
          onAlternarGrabacion={manejarGrabacionSesion}
          visor3dPiezaSeleccionada={piezaSeleccionada}
          visor3dPiezas={visor3dPiezas}
          visor3dGrupoActivo={grupoActivo}
          onCambiarVisor3DGrupo={(g) => { setPiezaSeleccionada(null); setGrupoActivo(g); }}
          onAplicarVisor3DTinta={aplicarTinta}
          onAplicarVisor3DVariante={aplicarVariante}
          onDispararVisor3DShapeKey={dispararVisor3DShapeKey}
          onDispararVisor3DProgramatica={dispararVisor3DProgramatica}
          onDetenerVisor3DProgramatica={detenerVisor3DProgramatica}
          visor3dProgramaticaActiva={programaticaActiva}
          logica={logica}
        />
      </div>

      <PanelAjustes
        modoAjuste={modoAjuste} setModoAjuste={setModoAjuste}
        pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva}
        botonSeleccionado={logica.botonSeleccionado} setBotonSeleccionado={logica.setBotonSeleccionado}
        ajustes={logica.ajustes} setAjustes={logica.setAjustes}
        tonalidadSeleccionada={logica.tonalidadSeleccionada} setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
        listaTonalidades={logica.listaTonalidades} setListaTonalidades={logica.setListaTonalidades}
        nombresTonalidades={logica.nombresTonalidades} actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
        sonidosVirtuales={logica.sonidosVirtuales} setSonidosVirtuales={logica.setSonidosVirtuales}
        eliminarTonalidad={logica.eliminarTonalidad} mapaBotonesActual={logica.mapaBotonesActual}
        playPreview={logica.playPreview} stopPreview={logica.stopPreview} reproduceTono={logica.reproduceTono}
        samplesBrillante={logica.samplesBrillante} samplesBajos={logica.samplesBajos} samplesArmonizado={logica.samplesArmonizado}
        muestrasDB={logica.muestrasDB} soundsPerKey={logica.soundsPerKey} obtenerRutasAudio={logica.obtenerRutasAudio}
        guardarAjustes={logica.guardarAjustes} resetearAjustes={logica.resetearAjustes}
        sincronizarAudios={logica.sincronizarAudios} guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
        instrumentoId={logica.instrumentoId} setInstrumentoId={logica.setInstrumentoId} listaInstrumentos={logica.listaInstrumentos}
      />

      <ModalGuardarPracticaLibre
        visible={mostrarModalGuardar} guardando={guardandoGrabacion} error={errorGuardadoGrabacion}
        tituloSugerido={tituloSugeridoGrabacion} resumen={resumenGrabacionPendiente}
        onCancelar={onCancelarGuardado}
        onGuardar={(titulo, descripcion) => onGuardarGrabacion({ titulo, descripcion })}
      />

      {cancionEnReproductor && (
        <ReproductorCancionHero
          cancion={cancionEnReproductor}
          logica={logica}
          seccionInicial={seccionInicialPendiente}
          onCerrar={cerrarReproductor}
        />
      )}

    </section>
    </LogicaAcordeonProvider>
  );
};

export default EstudioPracticaLibre;
