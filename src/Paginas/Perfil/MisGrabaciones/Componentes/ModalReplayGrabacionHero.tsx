import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Monitor, Music2, Pause, Play, RotateCcw, Smartphone, X } from 'lucide-react';
import CuerpoAcordeon from '../../../../Core/componentes/CuerpoAcordeon';
import { useLogicaAcordeon } from '../../../../Core/hooks/useLogicaAcordeon';
import { useReproductorHero } from '../../../../Core/hooks/useReproductorHero';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { resolverImagenModeloAcordeon } from '../../../AcordeonProMax/PracticaLibre/Datos/modelosVisualesAcordeon';
import { useReproductorReplay } from './useReproductorReplay';
import VisorReplaySimulador from './VisorReplaySimulador';
import { useVistaReplayPersistida } from './useVistaReplayPersistida';
import './ModalReplayGrabacionHero.css';

export type { GrabacionReplayHero } from './tiposReplay';

interface ModalReplayGrabacionHeroProps {
    abierta: boolean;
    grabacion: import('./tiposReplay').GrabacionReplayHero | null;
    onCerrar: () => void;
}

const IMAGEN_REPLAY = '/Acordeon PRO MAX.png';
const TAMANO_ACORDEON_REPLAY_PX = 980;
const POSICION_X_ACORDEON = '50%';
const POSICION_Y_ACORDEON = '50%';

function formatearTiempoDesdeTicks(ticks: number, bpm: number, resolucion: number) {
    const totalSegundos = Math.max(0, Math.floor((ticks / Math.max(1, resolucion)) * (60 / Math.max(1, bpm))));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export default function ModalReplayGrabacionHero({ abierta, grabacion, onCerrar }: ModalReplayGrabacionHeroProps) {
    const [bpm, setBpm] = useState(120);
    const navigate = useNavigate();

    const logica = useLogicaAcordeon({ deshabilitarInteraccion: false });

    const reproductor = useReproductorHero(
        logica.actualizarBotonActivo,
        logica.setDireccionSinSwap,
        logica.reproduceTono,
        bpm,
        undefined,
        (beatIndex) => {
            const metActivo = grabacion?.metadata?.metronomo_activo || grabacion?.metadata?.practica_libre?.efectos?.metronomoActivo;
            if (!metActivo) return;
            const beatEnCompas = beatIndex % 4;
            motorAudioPro.reproducir(
                beatEnCompas === 0 ? 'click_fuerte' : 'click_debil',
                'metronomo',
                beatEnCompas === 0 ? 0.6 : 0.4
            );
        }
    );

    const { preparandoReplay, totalTicksCalculados, tonalidadReplayLista, urlAudioFondo,
            reproducirOReanudar, pausar, buscarTick, reiniciar } = useReproductorReplay({
        abierta, grabacion, logica, reproductor, bpm, setBpm,
    });

    // Toggle Escritorio / Movil. Default automatico segun donde se grabo.
    const vistaPreferidaGrabacion = (grabacion?.metadata as any)?.vista_preferida || null;
    const { vista, setVista } = useVistaReplayPersistida(vistaPreferidaGrabacion);

    const imagenReplay = useMemo(() => {
        const modeloId = grabacion?.metadata?.modelo_visual_id || grabacion?.metadata?.practica_libre?.modelo_visual_id;
        return resolverImagenModeloAcordeon(modeloId, IMAGEN_REPLAY);
    }, [grabacion]);

    const ajustesReplay = useMemo(() => ({
        ...logica.ajustes,
        tamano: `${TAMANO_ACORDEON_REPLAY_PX}px`,
        x: POSICION_X_ACORDEON,
        y: POSICION_Y_ACORDEON,
    }), [logica.ajustes]);

    if (!abierta || !grabacion) return null;

    const resolucionActiva = grabacion.resolucion || 192;
    const totalTicks = reproductor.totalTicks || totalTicksCalculados;
    const progreso = totalTicks > 0 ? Math.min(100, (reproductor.tickActual / totalTicks) * 100) : 0;
    const replayListo = logica.disenoCargado && !logica.cargando && tonalidadReplayLista && !preparandoReplay;

    return createPortal(
        <div className="grabaciones-hero-modal-overlay" onClick={onCerrar}>
            <div className="grabaciones-hero-modal" onClick={(event) => event.stopPropagation()}>
                <button className="grabaciones-hero-modal-cerrar" onClick={onCerrar} aria-label="Cerrar replay">
                    <X size={18} />
                </button>

                <div className="grabaciones-hero-modal-encabezado">
                    <div>
                        <p className="grabaciones-hero-modal-eyebrow">Replay privado</p>
                        <h2>{grabacion.titulo || 'Grabacion sin titulo'}</h2>
                        <p className="grabaciones-hero-modal-subtitulo">
                            {grabacion.canciones_hero?.titulo || (grabacion.modo === 'competencia' ? 'Modo competencia' : 'Practica libre')}
                            {grabacion.canciones_hero?.autor ? ` · ${grabacion.canciones_hero.autor}` : ''}
                        </p>
                    </div>
                    <div className="grabaciones-hero-modal-badges">
                        <span className={`grabaciones-hero-badge ${grabacion.modo === 'competencia' ? 'competencia' : 'practica'}`}>
                            {grabacion.modo === 'competencia' ? 'Competencia' : 'Practica libre'}
                        </span>
                        {urlAudioFondo && <span className="grabaciones-hero-badge audio">Con pista original</span>}
                        {grabacion.precision_porcentaje !== null && (
                            <span className="grabaciones-hero-badge precision">{Math.round(grabacion.precision_porcentaje)}%</span>
                        )}
                    </div>
                </div>

                <div className="grabaciones-hero-modal-metricas">
                    <div><span>BPM</span><strong>{bpm}</strong></div>
                    <div><span>Tonalidad</span><strong>{grabacion.tonalidad || 'N/D'}</strong></div>
                    <div><span>Notas</span><strong>{grabacion.notas_totales || grabacion.secuencia_grabada.length}</strong></div>
                    <div><span>Puntos</span><strong>{grabacion.puntuacion?.toLocaleString('es-CO') || 'N/D'}</strong></div>
                </div>

                <div className="grabaciones-hero-replay-vista-toggle" role="tablist" aria-label="Vista del replay">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={vista === 'escritorio'}
                        className={`grabaciones-hero-replay-vista-btn ${vista === 'escritorio' ? 'activa' : ''}`}
                        onClick={() => setVista('escritorio')}
                    >
                        <Monitor size={14} /> Escritorio
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={vista === 'movil'}
                        className={`grabaciones-hero-replay-vista-btn ${vista === 'movil' ? 'activa' : ''}`}
                        onClick={() => setVista('movil')}
                    >
                        <Smartphone size={14} /> Móvil
                    </button>
                </div>

                <div className="grabaciones-hero-replay-layout">
                    <div className="grabaciones-hero-replay-escenario">
                        {!logica.disenoCargado ? (
                            <div className="grabaciones-hero-replay-cargando">
                                <Music2 size={24} />
                                <span>Cargando replay...</span>
                            </div>
                        ) : vista === 'movil' ? (
                            <VisorReplaySimulador logica={logica} direccion={logica.direccion} />
                        ) : (
                            <CuerpoAcordeon
                                imagenFondo={imagenReplay}
                                ajustes={ajustesReplay as any}
                                direccion={logica.direccion}
                                configTonalidad={logica.configTonalidad}
                                botonesActivos={logica.botonesActivos}
                                modoAjuste={false}
                                botonSeleccionado={null}
                                modoVista={logica.modoVista}
                                vistaDoble={false}
                                setBotonSeleccionado={() => {}}
                                actualizarBotonActivo={() => {}}
                                listo={true}
                            />
                        )}
                    </div>

                    <div className="grabaciones-hero-replay-panel">
                        <div className="grabaciones-hero-replay-controles">
                            <div className="grabaciones-hero-replay-tiempo">
                                <span>{formatearTiempoDesdeTicks(reproductor.tickActual, bpm, resolucionActiva)}</span>
                                <span>{formatearTiempoDesdeTicks(totalTicks, bpm, resolucionActiva)}</span>
                            </div>
                            <input
                                className="grabaciones-hero-replay-slider"
                                type="range"
                                min={0}
                                max={Math.max(totalTicks, 1)}
                                value={Math.min(reproductor.tickActual, Math.max(totalTicks, 1))}
                                onChange={(event) => buscarTick(Number(event.target.value))}
                            />
                            <div className="grabaciones-hero-replay-acciones">
                                <button className="grabaciones-hero-replay-btn" onClick={reiniciar}>
                                    <RotateCcw size={16} />
                                    Reiniciar
                                </button>
                                {reproductor.reproduciendo && !reproductor.pausado ? (
                                    <button className="grabaciones-hero-replay-btn primaria" onClick={pausar}>
                                        <Pause size={16} />
                                        Pausar
                                    </button>
                                ) : (
                                    <button className="grabaciones-hero-replay-btn primaria" onClick={reproducirOReanudar} disabled={!replayListo}>
                                        <Play size={16} />
                                        {reproductor.reproduciendo ? 'Reanudar' : replayListo ? 'Reproducir replay' : 'Preparando replay...'}
                                    </button>
                                )}
                            </div>

                            {grabacion.id && (
                                <button
                                    className="grabaciones-hero-replay-btn ir-simulador"
                                    onClick={() => {
                                        onCerrar();
                                        navigate(`/simulador-app?reproducir=${grabacion.id}`);
                                    }}
                                    title="Abre el SimuladorApp completo y reproduce la grabación allí"
                                >
                                    <ExternalLink size={16} />
                                    Reproducir en simulador
                                </button>
                            )}
                            <div className="grabaciones-hero-replay-progreso-texto">
                                <span>Avance del replay</span>
                                <strong>{Math.round(progreso)}%</strong>
                            </div>
                        </div>
                        {grabacion.descripcion && (
                            <div className="grabaciones-hero-replay-descripcion">
                                <h3>Notas del estudiante</h3>
                                <p>{grabacion.descripcion}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
