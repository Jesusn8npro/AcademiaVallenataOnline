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
import { HILERAS_NATIVAS, TONALIDADES } from '../../../../Core/acordeon/notasAcordeonDiatonico';
import { MODELOS_VISUALES_ACORDEON } from '../../PracticaLibre/Datos/modelosVisualesAcordeon';
import { formatearDuracion } from '../../PracticaLibre/Utilidades/SecuenciaLogic';
import type { ModeloVisualAcordeon, SeccionPanelPracticaLibre } from '../../PracticaLibre/TiposPracticaLibre';
import { PanelAdminRec, PanelAdminGestor, PanelAdminGestorAcordes, PanelAdminListaAcordes, PanelAdminLibreria, PanelAdminUSB } from '..';

export interface HeroTransport {
  bpm: number;
  tickActual: number;
  totalTicks: number;
  reproduciendo: boolean;
  pausado: boolean;
  loopAB: any;
  grabaciones: { grabando: boolean };
  alternarPausaReproduccion: () => void;
  buscarTick: (tick: number) => void;
}

export interface AcordesAdmin {
  idSonandoCiclo: string | null;
  acordeMaestroActivo: boolean;
  onReproducirAcorde: (botones: string[], fuelle: string, id?: string) => void;
  onDetener: () => void;
  onEditarAcorde: (acorde: any) => void;
  onNuevoAcordeEnCirculo: (tonalidad?: string, modalidad?: string) => void;
  onReproducirCirculoCompleto: (acordes: any[]) => Promise<void>;
}

interface PanelLateralAdminProps {
  visible: boolean;
  seccionActiva: SeccionPanelPracticaLibre | null;
  logica: any;
  estudio: any;
  rec: any;
  libreria: any;
  hero: HeroTransport;
  acordes: AcordesAdmin;
  modosVista: Array<{ valor: any; label: string }>;
  modeloActivo: ModeloVisualAcordeon;
  onAbrirEditorAvanzado: () => void;
  onCrearAcorde: () => void;
  onVerAcordes: () => void;
  metronomoActivo: boolean;
  setMetronomoActivo: (val: boolean) => void;
}

const CIRCULO_MAYOR = ['Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa'];
const CIRCULO_MENOR = ['La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa', 'Do', 'Sol', 'Re'];

function extraerNotasFila(fila: Array<{ nombre: string }>) {
  return Array.from(new Set(fila.map((n) => n.nombre)));
}

const TITULO_SECCION: Partial<Record<SeccionPanelPracticaLibre, string>> = {
  sonido: 'Sonido y lectura', modelos: 'Modelos visuales', pistas: 'Pistas y capas',
  teoria: 'Teoria musical', efectos: 'Efectos y mezcla', rec: 'Grabacion pro',
  gestor: 'Gestor de sonidos', gestor_acordes: 'Creador de acordes',
  lista_acordes: 'Biblioteca de acordes', libreria: 'Libreria Hero', usb: 'Conexion USB',
};

const PanelLateralAdmin: React.FC<PanelLateralAdminProps> = ({
  visible, seccionActiva, logica, estudio, rec, libreria, hero,
  acordes, modosVista, modeloActivo, onAbrirEditorAvanzado,
  onCrearAcorde, onVerAcordes, metronomoActivo, setMetronomoActivo,
}) => {
  if (!visible || !seccionActiva) return null;

  const tonalidadSeleccionada: string = logica.tonalidadSeleccionada;
  const listaTonalidades: string[] = logica.listaTonalidades?.length
    ? logica.listaTonalidades
    : Object.keys(TONALIDADES);
  const configuracionTonalidad = TONALIDADES[tonalidadSeleccionada as keyof typeof TONALIDADES] || TONALIDADES['ADG'];
  const hileras = HILERAS_NATIVAS[tonalidadSeleccionada] || [];

  const detenerHero = () => {
    hero.buscarTick(0);
    if (hero.reproduciendo && !hero.pausado) hero.alternarPausaReproduccion();
  };

  return (
    <aside className="estudio-practica-libre-panel">
      <div className="estudio-practica-libre-panel-encabezado">
        <div>
          <span className="estudio-practica-libre-panel-kicker">Panel Admin</span>
          <h3>{TITULO_SECCION[seccionActiva] || seccionActiva}</h3>
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
              {listaTonalidades.map((t) => (
                <button key={t}
                  className={`estudio-practica-libre-chip-boton ${tonalidadSeleccionada === t ? 'activo' : ''}`}
                  onClick={() => logica.setTonalidadSeleccionada(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Timbre de pitos</div>
            <div className="estudio-practica-libre-grid-doble">
              {(['Brillante', 'Armonizado'] as const).map((timbre) => (
                <button key={timbre}
                  className={`estudio-practica-libre-card-boton ${(logica.ajustes?.timbre || 'Brillante') === timbre ? 'activo' : ''}`}
                  onClick={() => logica.setAjustes((p: any) => ({ ...p, timbre }))}>
                  <strong>{timbre}</strong>
                  <span>{timbre === 'Brillante' ? 'Ataque abierto y definido' : 'Color mas grueso y envolvente'}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Instrumento</div>
            <div className="estudio-practica-libre-lista-vertical">
              {(logica.listaInstrumentos || []).map((inst: any) => (
                <button key={inst.id}
                  className={`estudio-practica-libre-item-lista ${logica.instrumentoId === inst.id ? 'activo' : ''}`}
                  onClick={() => logica.setInstrumentoId(inst.id)}>
                  <div><strong>{inst.nombre || 'Instrumento'}</strong><span>{inst.descripcion || ''}</span></div>
                  {logica.instrumentoId === inst.id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Modo de vista</div>
            <div className="estudio-practica-libre-grid-chips">
              {modosVista.map(({ valor, label }) => (
                <button key={valor}
                  className={`estudio-practica-libre-chip-boton ${logica.modoVista === valor ? 'activo' : ''}`}
                  onClick={() => logica.setModoVista(valor)}>{label}</button>
              ))}
            </div>
          </div>
          <button className="estudio-practica-libre-btn-linea" onClick={onAbrirEditorAvanzado}>
            <SlidersHorizontal size={16} />Abrir editor avanzado
          </button>
        </div>
      )}

      {seccionActiva === 'modelos' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-grid-modelos">
            {MODELOS_VISUALES_ACORDEON.map((modelo) => (
              <button key={modelo.id}
                className={`estudio-practica-libre-modelo-card ${modeloActivo.id === modelo.id ? 'activo' : ''}`}
                onClick={() => estudio.seleccionarModeloVisual(modelo.id)}>
                <div className="estudio-practica-libre-modelo-imagen-wrap">
                  <img src={modelo.imagen} alt={modelo.nombre} className="estudio-practica-libre-modelo-imagen" />
                </div>
                <strong>{modelo.nombre}</strong><span>{modelo.descripcion}</span>
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
                <strong>{estudio.pistaActiva?.nombre || 'Sin pista seleccionada'}</strong>
                <span>{estudio.pistaActiva
                  ? `${formatearDuracion(estudio.tiempoPistaActual * 1000)} / ${formatearDuracion(estudio.duracionPista * 1000)}`
                  : 'Carga una pista local o elige una del catalogo.'}</span>
              </div>
              <div className="estudio-practica-libre-pista-botones">
                <button className="estudio-practica-libre-icon-btn" onClick={estudio.alternarReproduccionPista} disabled={!estudio.pistaActiva}>
                  {estudio.reproduciendoPista ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button className="estudio-practica-libre-icon-btn" onClick={() => estudio.reiniciarPista(estudio.reproduciendoPista)} disabled={!estudio.pistaActiva}><RotateCcw size={15} /></button>
                <button className="estudio-practica-libre-icon-btn" onClick={estudio.limpiarPistaSeleccionada} disabled={!estudio.pistaActiva}><Square size={15} /></button>
              </div>
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <label className="estudio-practica-libre-carga-local">
              <Upload size={16} />Cargar pista local
              <input type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) estudio.cargarArchivoLocal(f); e.target.value = ''; }} />
            </label>
          </div>
          {estudio.pistaActiva?.capas?.length > 0 && (
            <div className="estudio-practica-libre-bloque">
              <div className="estudio-practica-libre-bloque-titulo">Capas sincronizadas</div>
              <div className="estudio-practica-libre-grid-chips">
                {estudio.pistaActiva.capas.map((capa: any) => (
                  <button key={capa.id}
                    className={`estudio-practica-libre-chip-boton ${estudio.preferencias.capasActivas.includes(capa.id) ? 'activo' : ''}`}
                    onClick={() => estudio.alternarCapa(capa.id)}>{capa.nombre}</button>
                ))}
              </div>
            </div>
          )}
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Catalogo</div>
            <div className="estudio-practica-libre-lista-vertical pista-lista">
              {estudio.cargandoPistas && <div className="estudio-practica-libre-vacio">Cargando...</div>}
              {estudio.pistasDisponibles.map((pista: any) => (
                <button key={pista.id}
                  className={`estudio-practica-libre-item-lista ${estudio.pistaActiva?.id === pista.id ? 'activo' : ''}`}
                  onClick={() => estudio.seleccionarPista(pista)}>
                  <div><strong>{pista.nombre}</strong><span>{pista.artista || ''}</span></div>
                  {estudio.pistaActiva?.id === pista.id && <Check size={16} />}
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
              {hileras.map((h: string) => (
                <span key={h} className="estudio-practica-libre-chip-boton activo solo-visual">{h}</span>
              ))}
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Notas por hilera</div>
            <div className="estudio-practica-libre-teoria-columnas">
              <div><strong>Primera</strong><span>{extraerNotasFila(configuracionTonalidad.primeraFila).join(', ')}</span></div>
              <div><strong>Segunda</strong><span>{extraerNotasFila(configuracionTonalidad.segundaFila).join(', ')}</span></div>
              <div><strong>Tercera</strong><span>{extraerNotasFila(configuracionTonalidad.terceraFila).join(', ')}</span></div>
            </div>
          </div>
          {estudio.preferencias?.mostrarTeoriaCircular && (
            <>
              <div className="estudio-practica-libre-bloque">
                <div className="estudio-practica-libre-bloque-titulo">Circulo mayor</div>
                <div className="estudio-practica-libre-grid-circulo">
                  {CIRCULO_MAYOR.map((n) => (
                    <span key={n} className={`estudio-practica-libre-chip-circulo ${hileras.includes(n.toUpperCase()) ? 'activo' : ''}`}>{n}</span>
                  ))}
                </div>
              </div>
              <div className="estudio-practica-libre-bloque">
                <div className="estudio-practica-libre-bloque-titulo">Circulo menor</div>
                <div className="estudio-practica-libre-grid-circulo">
                  {CIRCULO_MENOR.map((n) => <span key={n} className="estudio-practica-libre-chip-circulo">{n}m</span>)}
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
              <span>Volumen acordeon</span><strong>{estudio.volumenAcordeon}%</strong>
              <input type="range" min={0} max={100} value={estudio.volumenAcordeon}
                onChange={(e) => estudio.ajustarVolumenAcordeon(Number(e.target.value))} />
            </label>
            <label className="estudio-practica-libre-slider-row">
              <span>Volumen pista</span><strong>{estudio.preferencias.efectos.volumenPista}%</strong>
              <input type="range" min={0} max={100} value={estudio.preferencias.efectos.volumenPista}
                onChange={(e) => estudio.actualizarEfectos({ volumenPista: Number(e.target.value) })} />
            </label>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Preset FX</div>
            {(['reverb', 'bajos', 'medios', 'agudos'] as const).map((fx) => (
              <label key={fx} className="estudio-practica-libre-slider-row">
                <span>{fx.charAt(0).toUpperCase() + fx.slice(1)}</span>
                <strong>{estudio.preferencias.efectos[fx]}{fx === 'reverb' ? '%' : ''}</strong>
                <input type="range" min={fx === 'reverb' ? 0 : -12} max={fx === 'reverb' ? 100 : 12}
                  value={estudio.preferencias.efectos[fx]}
                  onChange={(e) => estudio.actualizarEfectos({ [fx]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
          <div className="estudio-practica-libre-bloque">
            <label className="estudio-practica-libre-switch-row">
              <div>
                <strong>Reiniciar pista al grabar</strong>
                <span>Mantiene sincronizada la toma desde cero.</span>
              </div>
              <button
                className={`estudio-practica-libre-switch ${estudio.preferencias.efectos.autoReiniciarPista ? 'activo' : ''}`}
                onClick={() => estudio.actualizarEfectos({ autoReiniciarPista: !estudio.preferencias.efectos.autoReiniciarPista })}>
                <span />
              </button>
            </label>
            <div className="estudio-practica-libre-aviso-fx"><Volume2 size={15} />Valores guardados en preset de practica.</div>
          </div>
        </div>
      )}

      {seccionActiva === 'rec' && (
        <PanelAdminRec
          bpm={libreria.bpmHero}
          setBpm={libreria.setBpmHero}
          grabando={rec.grabandoRecPro || rec.esperandoPunchIn}
          onIniciarGrabacion={rec.cancionEditandoSecuencia ? rec.iniciarPunchInEdicion : rec.iniciarGrabacionRecPro}
          onDetenerGrabacion={rec.detenerGrabacionRecPro}
          totalNotas={rec.grabadorLocal.secuencia.length}
          tiempoGrabacionMs={rec.tiempoGrabacionRecProMs}
          pistaActualUrl={libreria.pistaUrl}
          onPistaChange={libreria.handlePistaChange}
          reproduciendoHero={hero.reproduciendo}
          cancionActual={null}
          tickActual={hero.tickActual}
          totalTicks={hero.totalTicks}
          onAlternarPausaHero={hero.alternarPausaReproduccion}
          onDetenerHero={detenerHero}
          onBuscarTick={hero.buscarTick}
          bpmGrabacion={libreria.bpmGrabacion}
          punchInTick={rec.punchInTick}
          setPunchInTick={rec.setPunchInTick}
          preRollSegundos={rec.preRollSegundos}
          setPreRollSegundos={rec.setPreRollSegundos}
          cuentaAtrasPreRoll={rec.esperandoPunchIn ? rec.preRollSegundos : null}
          onIniciarPunchIn={rec.iniciarPunchInEdicion}
          esperandoPunchIn={rec.esperandoPunchIn}
          metronomoActivo={metronomoActivo}
          setMetronomoActivo={setMetronomoActivo}
          bloqueadoPorSesion={hero.grabaciones.grabando}
        />
      )}

      {seccionActiva === 'gestor' && logica.ajustes && (
        <PanelAdminGestor
          ajustes={logica.ajustes}
          setAjustes={logica.setAjustes}
          tonalidadSeleccionada={logica.tonalidadSeleccionada}
          setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
          listaTonalidades={logica.listaTonalidades || []}
          setListaTonalidades={logica.setListaTonalidades}
          nombresTonalidades={logica.nombresTonalidades || {}}
          actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
          sonidosVirtuales={logica.sonidosVirtuales || []}
          setSonidosVirtuales={logica.setSonidosVirtuales}
          eliminarTonalidad={logica.eliminarTonalidad}
          mapaBotonesActual={logica.mapaBotonesActual || {}}
          botonSeleccionado={logica.botonSeleccionado || null}
          playPreview={logica.playPreview}
          stopPreview={logica.stopPreview}
          reproduceTono={logica.reproduceTono}
          samplesBrillante={logica.samplesBrillante || []}
          samplesBajos={logica.samplesBajos || []}
          samplesArmonizado={logica.samplesArmonizado || []}
          muestrasDB={logica.muestrasDB || []}
          soundsPerKey={logica.soundsPerKey || {}}
          obtenerRutasAudio={logica.obtenerRutasAudio}
          guardarAjustes={logica.guardarAjustes}
          resetearAjustes={logica.resetearAjustes}
          sincronizarAudios={logica.sincronizarAudios}
          guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
          instrumentoId={logica.instrumentoId}
          setInstrumentoId={logica.setInstrumentoId}
          listaInstrumentos={logica.listaInstrumentos || []}
        />
      )}

      {seccionActiva === 'gestor_acordes' && (
        <PanelAdminGestorAcordes
          onCrearNuevo={onCrearAcorde}
          onVerTodos={onVerAcordes}
          totalAcordes={0}
        />
      )}

      {seccionActiva === 'lista_acordes' && (
        <PanelAdminListaAcordes
          onReproducirAcorde={acordes.onReproducirAcorde}
          onDetener={acordes.onDetener}
          idSonando={acordes.idSonandoCiclo}
          onEditarAcorde={acordes.onEditarAcorde}
          tonalidadActual={logica.tonalidadSeleccionada}
        />
      )}

      {seccionActiva === 'libreria' && (
        <PanelAdminLibreria
          onReproducir={rec.handleReproducirLibreria}
          onEditarSecuencia={rec.handleAbrirModalEditor}
          onMarcarEntradaEdicion={rec.marcarEntradaEdicion}
          onMarcarSalidaEdicion={rec.marcarSalidaEdicion}
          onIniciarPunchIn={rec.iniciarPunchInEdicion}
          onGuardarEdicionSecuencia={rec.guardarEdicionSecuencia}
          onCancelarEdicionSecuencia={rec.cancelarEdicionSecuencia}
          onLimpiarRangoEdicion={rec.limpiarRangoEdicion}
          cancionEditandoId={rec.cancionEditandoSecuencia?.id || null}
          tituloCancionEditando={rec.cancionEditandoSecuencia?.titulo || null}
          bpmCancionEditando={rec.cancionEditandoSecuencia?.bpm || hero.bpm}
          tickActual={hero.tickActual}
          punchInTick={rec.punchInTick ?? null}
          punchOutTick={hero.loopAB?.hasEnd ? hero.loopAB.end : null}
          preRollSegundos={rec.preRollSegundos || 4}
          setPreRollSegundos={rec.setPreRollSegundos}
          esperandoPunchIn={rec.esperandoPunchIn}
          grabandoEdicionSecuencia={rec.estaGrabandoEdicionSecuencia}
          guardandoEdicionSecuencia={rec.guardandoEdicionSecuencia}
          hayCambiosEdicionSecuencia={rec.hayCambiosEdicionSecuencia}
          mensajeEdicionSecuencia={rec.mensajeEdicionSecuencia}
          cancionActualizada={libreria.ultimaCancionLibreriaActualizada}
        />
      )}

      {seccionActiva === 'usb' && (
        <PanelAdminUSB
          conectado={logica.esp32Conectado}
          onConectar={logica.conectarESP32}
        />
      )}
    </aside>
  );
};

export default PanelLateralAdmin;
