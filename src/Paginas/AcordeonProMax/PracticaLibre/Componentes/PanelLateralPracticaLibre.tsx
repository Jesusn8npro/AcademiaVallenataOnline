import React from 'react';
import {
  Check,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Upload,
  Volume2,
} from 'lucide-react';
import { HILERAS_NATIVAS, TONALIDADES } from '../../../SimuladorDeAcordeon/notasAcordeonDiatonico';
import { MODELOS_VISUALES_ACORDEON } from '../Datos/modelosVisualesAcordeon';
import type { ModeloVisualAcordeon, PistaPracticaLibre, PreferenciasPracticaLibre, SeccionPanelPracticaLibre } from '../TiposPracticaLibre';
import { PanelAdminRec, PanelAdminGestor, PanelAdminGestorAcordes, PanelAdminLibreria, PanelAdminUSB, PanelAdminListaAcordes } from '../../Admin';

interface PanelLateralPracticaLibreProps {
  visible: boolean;
  seccionActiva: SeccionPanelPracticaLibre | null;
  tonalidadSeleccionada: string;
  listaTonalidades: string[];
  timbreActivo: string;
  onSeleccionarTonalidad: (tonalidad: string) => void;
  onSeleccionarTimbre: (timbre: 'Brillante' | 'Armonizado') => void;
  instrumentoId: string;
  listaInstrumentos: any[];
  onSeleccionarInstrumento: (id: string) => void;
  modoVista: string;
  modosVista: Array<{ valor: any; label: string }>;
  onSeleccionarVista: (vista: any) => void;
  onAbrirEditorAvanzado: () => void;
  modeloActivo: ModeloVisualAcordeon;
  onSeleccionarModelo: (modeloId: string) => void;
  preferencias: PreferenciasPracticaLibre;
  pistaActiva: PistaPracticaLibre | null;
  pistasDisponibles: PistaPracticaLibre[];
  cargandoPistas: boolean;
  reproduciendoPista: boolean;
  tiempoPista: string;
  duracionPista: string;
  onSeleccionarPista: (pista: PistaPracticaLibre) => void;
  onLimpiarPista: () => void;
  onAlternarReproduccionPista: () => void;
  onReiniciarPista: () => void;
  onCargarArchivoLocal: (archivo: File) => void;
  onAlternarCapa: (capaId: string) => void;
  onActualizarEfectos: (cambios: Partial<PreferenciasPracticaLibre['efectos']>) => void;
  volumenAcordeon: number;
  onAjustarVolumenAcordeon: (valor: number) => void;
  // Props ADMIN
  esAdmin?: boolean;
  bpmRec?: number;
  setBpmRec?: (bpm: number) => void;
  grabandoRec?: boolean;
  onIniciarGrabacionRec?: () => void;
  onDetenerGrabacionRec?: () => void;
  totalNotasRec?: number;
  tiempoGrabacionRecMs?: number;
  onCrearNuevoAcorde?: () => void;
  onVerTodosAcordes?: () => void;
  onAbrirBibliotecaAcordes?: () => void;
  esp32Conectado?: boolean;
  onConectarESP32?: () => void;
  // Props para PanelAdminGestor (Diseño + Sonidos)
  ajustes?: any;
  setAjustes?: (a: any) => void;
  tonalidadSeleccionadaGestor?: string;
  setTonalidadSeleccionadaGestor?: (v: string) => void;
  listaTonalidades_Gestor?: string[];
  setListaTonalidades_Gestor?: (l: string[]) => void;
  nombresTonalidades?: Record<string, string>;
  actualizarNombreTonalidad?: (id: string, nombre: string) => void;
  sonidosVirtuales?: any[];
  setSonidosVirtuales?: (sv: any[]) => void;
  eliminarTonalidad?: (t: string) => void;
  mapaBotonesActual?: any;
  botonSeleccionado?: string | null;
  playPreview?: (r: string, p: number) => void;
  stopPreview?: () => void;
  reproduceTono?: (id: string) => { instances: any[] };
  samplesBrillante?: string[];
  samplesBajos?: string[];
  samplesArmonizado?: string[];
  muestrasDB?: any[];
  soundsPerKey?: Record<string, string[]>;
  obtenerRutasAudio?: (id: string) => string[];
  guardarAjustes?: () => void;
  resetearAjustes?: () => void;
  sincronizarAudios?: () => void;
  guardarNuevoSonidoVirtual?: (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante' | 'Armonizado') => void;
  instrumentoIdGestor?: string;
  setInstrumentoIdGestor?: (id: string) => void;
  listaInstrumentosGestor?: any[];
  // Props Librería
  onReproducirLibreria?: (cancion: any) => void;
  // Props Lista Acordes
  onReproducirAcorde?: (botones: string[], fuelle: string, id?: string) => void;
  onDetenerAcorde?: () => void;
  idSonandoAcorde?: string | null;
  onEditarAcordePanel?: (acorde: any) => void;
  tonalidadActualAcordes?: string;
  // Props para REC con backing track
  pistaActualUrl?: string | null;
  onPistaChange?: (url: string | null, archivo: File | null) => void;
  reproduciendoHero?: boolean;
  cancionActual?: any;
  tickActual?: number;
  totalTicks?: number;
  onAlternarPausaHero?: () => void;
  onDetenerHero?: () => void;  onBuscarTickHero?: (tick: number) => void;
  bpmGrabacion?: number;
  // PUNCH-IN / PRE-ROLL
  punchInTick?: number | null;
  setPunchInTick?: (tick: number | null) => void;
  preRollSegundos?: number;
  setPreRollSegundos?: (seg: number) => void;
  cuentaAtrasPreRoll?: number | null;
  onIniciarPunchIn?: () => void;
  esperandoPunchIn?: boolean;
  metronomoActivo?: boolean;
  setMetronomoActivo?: (val: boolean) => void;
}

const CIRCULO_MAYOR = ['Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa'];
const CIRCULO_MENOR = ['La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa', 'Do', 'Sol', 'Re'];

function extraerNotasFila(configuracionFila: Array<{ nombre: string }>) {
  return Array.from(new Set(configuracionFila.map((nota) => nota.nombre)));
}

const PanelLateralPracticaLibre: React.FC<PanelLateralPracticaLibreProps> = ({
  visible,
  seccionActiva,
  tonalidadSeleccionada,
  listaTonalidades,
  timbreActivo,
  onSeleccionarTonalidad,
  onSeleccionarTimbre,
  instrumentoId,
  listaInstrumentos,
  onSeleccionarInstrumento,
  modoVista,
  modosVista,
  onSeleccionarVista,
  onAbrirEditorAvanzado,
  modeloActivo,
  onSeleccionarModelo,
  preferencias,
  pistaActiva,
  pistasDisponibles,
  cargandoPistas,
  reproduciendoPista,
  tiempoPista,
  duracionPista,
  onSeleccionarPista,
  onLimpiarPista,
  onAlternarReproduccionPista,
  onReiniciarPista,
  onCargarArchivoLocal,
  onAlternarCapa,
  onActualizarEfectos,
  volumenAcordeon,
  onAjustarVolumenAcordeon,
  esAdmin = false,
  bpmRec = 120,
  setBpmRec,
  grabandoRec = false,
  onIniciarGrabacionRec,
  onDetenerGrabacionRec,
  totalNotasRec = 0,
  tiempoGrabacionRecMs = 0,
  onCrearNuevoAcorde,
  onVerTodosAcordes,
  onAbrirBibliotecaAcordes,
  esp32Conectado = false,
  onConectarESP32,
  // Props Gestor
  ajustes,
  setAjustes,
  tonalidadSeleccionadaGestor,
  setTonalidadSeleccionadaGestor,
  listaTonalidades_Gestor,
  setListaTonalidades_Gestor,
  nombresTonalidades,
  actualizarNombreTonalidad,
  sonidosVirtuales,
  setSonidosVirtuales,
  eliminarTonalidad,
  mapaBotonesActual,
  botonSeleccionado,
  playPreview,
  stopPreview,
  reproduceTono,
  samplesBrillante,
  samplesBajos,
  samplesArmonizado,
  muestrasDB,
  soundsPerKey,
  obtenerRutasAudio,
  guardarAjustes,
  resetearAjustes,
  sincronizarAudios,
  guardarNuevoSonidoVirtual,
  instrumentoIdGestor,
  setInstrumentoIdGestor,
  listaInstrumentosGestor,
  // Props Librería
  onReproducirLibreria,
  // Props Lista Acordes
  onReproducirAcorde,
  onDetenerAcorde,
  idSonandoAcorde,
  onEditarAcordePanel,
  tonalidadActualAcordes,
  // Props REC
  pistaActualUrl,
  onPistaChange,
  reproduciendoHero,
  cancionActual,
  tickActual,
  totalTicks,
  onAlternarPausaHero,
  onDetenerHero,
  onBuscarTickHero,
  bpmGrabacion,
  punchInTick,
  setPunchInTick,
  preRollSegundos,
  setPreRollSegundos,
  cuentaAtrasPreRoll,
  onIniciarPunchIn,
  esperandoPunchIn,
  metronomoActivo,
  setMetronomoActivo,
}) => {
  const configuracionTonalidad = TONALIDADES[tonalidadSeleccionada as keyof typeof TONALIDADES] || TONALIDADES['ADG'];
  const hileras = HILERAS_NATIVAS[tonalidadSeleccionada] || [];
  const notasPrimeraFila = extraerNotasFila(configuracionTonalidad.primeraFila);
  const notasSegundaFila = extraerNotasFila(configuracionTonalidad.segundaFila);
  const notasTerceraFila = extraerNotasFila(configuracionTonalidad.terceraFila);

  if (!visible || !seccionActiva) return null;

  return (
    <aside className="estudio-practica-libre-panel">
      <div className="estudio-practica-libre-panel-encabezado">
        <div>
          <span className="estudio-practica-libre-panel-kicker">Panel del estudio</span>
          <h3>{seccionActiva === 'sonido' ? 'Sonido y lectura' : seccionActiva === 'modelos' ? 'Modelos visuales' : seccionActiva === 'pistas' ? 'Pistas y capas' : seccionActiva === 'teoria' ? 'Teoria musical' : seccionActiva === 'rec' ? 'Grabacion pro' : 'Efectos y mezcla'}</h3>
        </div>
        <div className="estudio-practica-libre-chip-simple">
          <ChevronRight size={14} />
          {tonalidadSeleccionada}
        </div>
      </div>

      {seccionActiva === 'sonido' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Tonalidades</div>
            <div className="estudio-practica-libre-grid-chips">
              {listaTonalidades.map((tonalidad) => (
                <button
                  key={tonalidad}
                  className={`estudio-practica-libre-chip-boton ${tonalidadSeleccionada === tonalidad ? 'activo' : ''}`}
                  onClick={() => onSeleccionarTonalidad(tonalidad)}
                >
                  {tonalidad}
                </button>
              ))}
            </div>
          </div>

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Timbre de pitos</div>
            <div className="estudio-practica-libre-grid-doble">
              {(['Brillante', 'Armonizado'] as const).map((timbre) => (
                <button
                  key={timbre}
                  className={`estudio-practica-libre-card-boton ${timbreActivo === timbre ? 'activo' : ''}`}
                  onClick={() => onSeleccionarTimbre(timbre)}
                >
                  <strong>{timbre}</strong>
                  <span>{timbre === 'Brillante' ? 'Ataque abierto y definido' : 'Color mas grueso y envolvente'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Instrumento del acordeon</div>
            <div className="estudio-practica-libre-lista-vertical">
              {listaInstrumentos.length === 0 && (
                <div className="estudio-practica-libre-vacio">Cargando bancos del acordeon...</div>
              )}

              {listaInstrumentos.map((instrumento: any) => (
                <button
                  key={instrumento.id}
                  className={`estudio-practica-libre-item-lista ${instrumentoId === instrumento.id ? 'activo' : ''}`}
                  onClick={() => onSeleccionarInstrumento(instrumento.id)}
                >
                  <div>
                    <strong>{instrumento.nombre || 'Instrumento'}</strong>
                    <span>{instrumento.descripcion || 'Banco principal del acordeon.'}</span>
                  </div>
                  {instrumentoId === instrumento.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Modo de vista</div>
            <div className="estudio-practica-libre-grid-chips">
              {modosVista.map(({ valor, label }) => (
                <button
                  key={valor}
                  className={`estudio-practica-libre-chip-boton ${modoVista === valor ? 'activo' : ''}`}
                  onClick={() => onSeleccionarVista(valor)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className="estudio-practica-libre-btn-linea" onClick={onAbrirEditorAvanzado}>
            <SlidersHorizontal size={16} />
            Abrir editor avanzado del acordeon
          </button>
        </div>
      )}

      {seccionActiva === 'modelos' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-grid-modelos">
            {MODELOS_VISUALES_ACORDEON.map((modelo) => (
              <button
                key={modelo.id}
                className={`estudio-practica-libre-modelo-card ${modeloActivo.id === modelo.id ? 'activo' : ''}`}
                onClick={() => onSeleccionarModelo(modelo.id)}
              >
                <div className="estudio-practica-libre-modelo-imagen-wrap">
                  <img src={modelo.imagen} alt={modelo.nombre} className="estudio-practica-libre-modelo-imagen" />
                </div>
                <strong>{modelo.nombre}</strong>
                <span>{modelo.descripcion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {seccionActiva === 'pistas' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Pista activa</div>
            <div className="estudio-practica-libre-pista-activa">
              <div>
                <strong>{pistaActiva?.nombre || 'Sin pista seleccionada'}</strong>
                <span>
                  {pistaActiva
                    ? `${tiempoPista} / ${duracionPista}${pistaActiva.bpm ? ` · ${pistaActiva.bpm} BPM` : ''}`
                    : 'Carga una pista local o elige una del catalogo.'}
                </span>
              </div>

              <div className="estudio-practica-libre-pista-botones">
                <button className="estudio-practica-libre-icon-btn" onClick={onAlternarReproduccionPista} disabled={!pistaActiva}>
                  {reproduciendoPista ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button className="estudio-practica-libre-icon-btn" onClick={onReiniciarPista} disabled={!pistaActiva}>
                  <RotateCcw size={15} />
                </button>
                <button className="estudio-practica-libre-icon-btn" onClick={onLimpiarPista} disabled={!pistaActiva}>
                  <Square size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="estudio-practica-libre-bloque">
            <label className="estudio-practica-libre-carga-local">
              <Upload size={16} />
              Cargar pista local
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
                onChange={(event) => {
                  const archivo = event.target.files?.[0];
                  if (archivo) onCargarArchivoLocal(archivo);
                  event.target.value = '';
                }}
              />
            </label>
          </div>

          {pistaActiva?.capas && pistaActiva.capas.length > 0 && (
            <div className="estudio-practica-libre-bloque">
              <div className="estudio-practica-libre-bloque-titulo">Capas sincronizadas</div>
              <div className="estudio-practica-libre-grid-chips">
                {pistaActiva.capas.map((capa) => (
                  <button
                    key={capa.id}
                    className={`estudio-practica-libre-chip-boton ${preferencias.capasActivas.includes(capa.id) ? 'activo' : ''}`}
                    onClick={() => onAlternarCapa(capa.id)}
                  >
                    {capa.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Catalogo disponible</div>
            <div className="estudio-practica-libre-lista-vertical pista-lista">
              {cargandoPistas && <div className="estudio-practica-libre-vacio">Cargando pistas disponibles...</div>}

              {!cargandoPistas && pistasDisponibles.length === 0 && (
                <div className="estudio-practica-libre-vacio">Todavia no hay pistas precargadas. Ya puedes probar con una pista local.</div>
              )}

              {pistasDisponibles.map((pista) => (
                <button
                  key={pista.id}
                  className={`estudio-practica-libre-item-lista ${pistaActiva?.id === pista.id ? 'activo' : ''}`}
                  onClick={() => onSeleccionarPista(pista)}
                >
                  <div>
                    <strong>{pista.nombre}</strong>
                    <span>
                      {[pista.artista, pista.tonalidad, pista.bpm ? `${pista.bpm} BPM` : null].filter(Boolean).join(' · ') || 'Pista de practica'}
                    </span>
                  </div>
                  {pistaActiva?.id === pista.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccionActiva === 'teoria' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Hileras nativas</div>
            <div className="estudio-practica-libre-grid-chips">
              {hileras.map((hilera) => (
                <span key={hilera} className="estudio-practica-libre-chip-boton activo solo-visual">{hilera}</span>
              ))}
            </div>
          </div>

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Notas por hilera</div>
            <div className="estudio-practica-libre-teoria-columnas">
              <div>
                <strong>Primera</strong>
                <span>{notasPrimeraFila.join(', ')}</span>
              </div>
              <div>
                <strong>Segunda</strong>
                <span>{notasSegundaFila.join(', ')}</span>
              </div>
              <div>
                <strong>Tercera</strong>
                <span>{notasTerceraFila.join(', ')}</span>
              </div>
            </div>
          </div>

          {preferencias.mostrarTeoriaCircular && (
            <>
              <div className="estudio-practica-libre-bloque">
                <div className="estudio-practica-libre-bloque-titulo">Circulo mayor</div>
                <div className="estudio-practica-libre-grid-circulo">
                  {CIRCULO_MAYOR.map((nota) => (
                    <span key={nota} className={`estudio-practica-libre-chip-circulo ${hileras.includes(nota.toUpperCase()) ? 'activo' : ''}`}>
                      {nota}
                    </span>
                  ))}
                </div>
              </div>

              <div className="estudio-practica-libre-bloque">
                <div className="estudio-practica-libre-bloque-titulo">Circulo menor</div>
                <div className="estudio-practica-libre-grid-circulo">
                  {CIRCULO_MENOR.map((nota) => (
                    <span key={nota} className="estudio-practica-libre-chip-circulo">{nota}m</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {seccionActiva === 'efectos' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Mezcla funcional</div>
            <label className="estudio-practica-libre-slider-row">
              <span>Volumen acordeon</span>
              <strong>{volumenAcordeon}%</strong>
              <input type="range" min={0} max={100} value={volumenAcordeon} onChange={(event) => onAjustarVolumenAcordeon(Number(event.target.value))} />
            </label>
            <label className="estudio-practica-libre-slider-row">
              <span>Volumen pista</span>
              <strong>{preferencias.efectos.volumenPista}%</strong>
              <input type="range" min={0} max={100} value={preferencias.efectos.volumenPista} onChange={(event) => onActualizarEfectos({ volumenPista: Number(event.target.value) })} />
            </label>
          </div>

          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Preset guardado de FX</div>
            <label className="estudio-practica-libre-slider-row">
              <span>Reverb</span>
              <strong>{preferencias.efectos.reverb}%</strong>
              <input type="range" min={0} max={100} value={preferencias.efectos.reverb} onChange={(event) => onActualizarEfectos({ reverb: Number(event.target.value) })} />
            </label>
            <label className="estudio-practica-libre-slider-row">
              <span>Graves</span>
              <strong>{preferencias.efectos.bajos}</strong>
              <input type="range" min={-12} max={12} value={preferencias.efectos.bajos} onChange={(event) => onActualizarEfectos({ bajos: Number(event.target.value) })} />
            </label>
            <label className="estudio-practica-libre-slider-row">
              <span>Medios</span>
              <strong>{preferencias.efectos.medios}</strong>
              <input type="range" min={-12} max={12} value={preferencias.efectos.medios} onChange={(event) => onActualizarEfectos({ medios: Number(event.target.value) })} />
            </label>
            <label className="estudio-practica-libre-slider-row">
              <span>Agudos</span>
              <strong>{preferencias.efectos.agudos}</strong>
              <input type="range" min={-12} max={12} value={preferencias.efectos.agudos} onChange={(event) => onActualizarEfectos({ agudos: Number(event.target.value) })} />
            </label>
          </div>

          <div className="estudio-practica-libre-bloque">
            <label className="estudio-practica-libre-switch-row">
              <div>
                <strong>Reiniciar pista al grabar</strong>
                <span>Ideal para mantener sincronizada la toma desde cero.</span>
              </div>
              <button
                className={`estudio-practica-libre-switch ${preferencias.efectos.autoReiniciarPista ? 'activo' : ''}`}
                onClick={() => onActualizarEfectos({ autoReiniciarPista: !preferencias.efectos.autoReiniciarPista })}
              >
                <span />
              </button>
            </label>

            <div className="estudio-practica-libre-aviso-fx">
              <Volume2 size={15} />
              Los valores de reverb y ecualizador ya quedan guardados en tu preset de practica para conectarlos despues al motor avanzado.
            </div>
          </div>
        </div>
      )}

      {esAdmin && seccionActiva === 'rec' && (
        <PanelAdminRec
          bpm={bpmRec}
          setBpm={setBpmRec || (() => {})}
          grabando={grabandoRec}
          onIniciarGrabacion={onIniciarGrabacionRec || (() => {})}
          onDetenerGrabacion={onDetenerGrabacionRec || (() => {})}
          totalNotas={totalNotasRec}
          tiempoGrabacionMs={tiempoGrabacionRecMs}
          pistaActualUrl={pistaActualUrl || null}
          onPistaChange={onPistaChange || (() => {})}
          reproduciendoHero={reproduciendoHero || false}
          cancionActual={cancionActual || null}
          tickActual={tickActual || 0}
          totalTicks={totalTicks || 0}
          onAlternarPausaHero={onAlternarPausaHero || (() => {})}
          onDetenerHero={onDetenerHero || (() => {})}
          onBuscarTick={onBuscarTickHero || (() => {})}
          bpmGrabacion={bpmGrabacion || bpmRec}
          punchInTick={punchInTick}
          setPunchInTick={setPunchInTick}
          preRollSegundos={preRollSegundos}
          setPreRollSegundos={setPreRollSegundos}
          cuentaAtrasPreRoll={cuentaAtrasPreRoll}
          onIniciarPunchIn={onIniciarPunchIn}
          esperandoPunchIn={esperandoPunchIn}
          metronomoActivo={metronomoActivo}
          setMetronomoActivo={setMetronomoActivo || (() => {})}
        />
      )}

      {esAdmin && seccionActiva === 'gestor' && ajustes && setAjustes && (
        <PanelAdminGestor
          ajustes={ajustes}
          setAjustes={setAjustes}
          tonalidadSeleccionada={tonalidadSeleccionadaGestor || tonalidadSeleccionada}
          setTonalidadSeleccionada={setTonalidadSeleccionadaGestor || (() => {})}
          listaTonalidades={listaTonalidades_Gestor || []}
          setListaTonalidades={setListaTonalidades_Gestor || (() => {})}
          nombresTonalidades={nombresTonalidades || {}}
          actualizarNombreTonalidad={actualizarNombreTonalidad || (() => {})}
          sonidosVirtuales={sonidosVirtuales || []}
          setSonidosVirtuales={setSonidosVirtuales || (() => {})}
          eliminarTonalidad={eliminarTonalidad || (() => {})}
          mapaBotonesActual={mapaBotonesActual || {}}
          botonSeleccionado={botonSeleccionado || null}
          playPreview={playPreview || (() => {})}
          stopPreview={stopPreview || (() => {})}
          reproduceTono={reproduceTono || (() => ({ instances: [] }))}
          samplesBrillante={samplesBrillante || []}
          samplesBajos={samplesBajos || []}
          samplesArmonizado={samplesArmonizado || []}
          muestrasDB={muestrasDB || []}
          soundsPerKey={soundsPerKey || {}}
          obtenerRutasAudio={obtenerRutasAudio || (() => [])}
          guardarAjustes={guardarAjustes || (() => {})}
          resetearAjustes={resetearAjustes || (() => {})}
          sincronizarAudios={sincronizarAudios || (() => {})}
          guardarNuevoSonidoVirtual={guardarNuevoSonidoVirtual || (() => {})}
          instrumentoId={instrumentoIdGestor || instrumentoId}
          setInstrumentoId={setInstrumentoIdGestor || onSeleccionarInstrumento}
          listaInstrumentos={listaInstrumentosGestor || listaInstrumentos}
        />
      )}

      {esAdmin && seccionActiva === 'gestor_acordes' && (
        <PanelAdminGestorAcordes
          onCrearNuevo={onCrearNuevoAcorde || (() => {})}
          onVerTodos={onVerTodosAcordes || (() => {})}
          totalAcordes={0}
        />
      )}

      {esAdmin && seccionActiva === 'lista_acordes' && (
        <PanelAdminListaAcordes
          onReproducirAcorde={onReproducirAcorde || (() => {})}
          onDetener={onDetenerAcorde || (() => {})}
          idSonando={idSonandoAcorde || null}
          onEditarAcorde={onEditarAcordePanel || (() => {})}
          tonalidadActual={tonalidadActualAcordes || tonalidadSeleccionada}
        />
      )}

      {esAdmin && seccionActiva === 'libreria' && (
        <PanelAdminLibreria
          onReproducir={onReproducirLibreria || (() => {})}
        />
      )}

      {esAdmin && seccionActiva === 'usb' && (
        <PanelAdminUSB
          conectado={esp32Conectado}
          onConectar={onConectarESP32 || (() => {})}
        />
      )}
    </aside>
  );
};

export default PanelLateralPracticaLibre;
