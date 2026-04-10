import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Music2, Pause, Play, RotateCcw, X } from 'lucide-react';
import CuerpoAcordeon from '../../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import { useLogicaAcordeon } from '../../../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { useReproductorHero } from '../../../SimuladorDeAcordeon/Hooks/useReproductorHero';
import { motorAudioPro } from '../../../SimuladorDeAcordeon/AudioEnginePro';
import { resolverImagenModeloAcordeon } from '../../../AcordeonProMax/PracticaLibre/Datos/modelosVisualesAcordeon';
import type { NotaHero } from '../../../SimuladorDeAcordeon/videojuego_acordeon/tipos_Hero';
import './ModalReplayGrabacionHero.css';

interface CancionRelacionada {
    titulo?: string | null;
    autor?: string | null;
    slug?: string | null;
    bpm?: number | null;
    audio_fondo_url?: string | null;
}

export interface GrabacionReplayHero {
    id: string;
    modo: 'competencia' | 'practica_libre';
    titulo: string | null;
    descripcion: string | null;
    secuencia_grabada: NotaHero[];
    bpm: number;
    resolucion: number;
    tonalidad: string | null;
    duracion_ms: number | null;
    precision_porcentaje: number | null;
    puntuacion: number | null;
    notas_totales: number | null;
    es_publica?: boolean;
    publicacion_id?: string | null;
    metadata?: Record<string, any> | null;
    created_at: string;
    canciones_hero?: CancionRelacionada | null;
}

interface ModalReplayGrabacionHeroProps {
    abierta: boolean;
    grabacion: GrabacionReplayHero | null;
    onCerrar: () => void;
}

const IMAGEN_REPLAY = '/Acordeon PRO MAX.png';

function formatearTiempoDesdeTicks(ticks: number, bpm: number, resolucion: number) {
    const totalSegundos = Math.max(0, Math.floor((ticks / Math.max(1, resolucion)) * (60 / Math.max(1, bpm))));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

function convertirTicksASegundos(ticks: number, bpm: number, resolucion: number) {
    return (ticks / Math.max(1, resolucion)) * (60 / Math.max(1, bpm));
}

function limitarPlaybackRate(valor: number) {
    return Math.min(4, Math.max(0.1, valor));
}

export default function ModalReplayGrabacionHero({ abierta, grabacion, onCerrar }: ModalReplayGrabacionHeroProps) {
    const [bpm, setBpm] = useState(120);
    const [preparandoReplay, setPreparandoReplay] = useState(false);
    const audioFondoRef = useRef<HTMLAudioElement | null>(null);
    const tickActualRef = useRef(0);
    const precargaReplayRef = useRef<Promise<void> | null>(null);
    const claveReplayPrecargadoRef = useRef('');
    const resolucionActiva = grabacion?.resolucion || 192;

    // ESTE ES EL VALOR PRINCIPAL DEL TAMANO DEL ACORDEON EN EL MODAL.
    // Si quieres agrandarlo o achicarlo, cambia solo este numero en pixeles.
    const TAMANO_ACORDEON_REPLAY_PX = 980;

    // Estas posiciones mantienen el acordeon centrado dentro del escenario.
    const POSICION_X_ACORDEON = '50%';
    const POSICION_Y_ACORDEON = '50%';

    const logica = useLogicaAcordeon({
        deshabilitarInteraccion: false
    });

    const reproductor = useReproductorHero(
        logica.actualizarBotonActivo,
        logica.setDireccionSinSwap,
        logica.reproduceTono,
        bpm
    );

    const cancionReplay = useMemo(() => {
        if (!grabacion) return null;

        return {
            titulo: grabacion.titulo || grabacion.canciones_hero?.titulo || 'Replay Hero',
            autor: grabacion.canciones_hero?.autor || (grabacion.modo === 'competencia' ? 'Modo competencia' : 'Practica libre'),
            bpm: grabacion.bpm || 120,
            resolucion: grabacion.resolucion || 192,
            secuencia: grabacion.secuencia_grabada || [],
            dificultad: 'basico' as const,
            tipo: 'secuencia' as const,
            tonalidad: grabacion.tonalidad || undefined,
        };
    }, [grabacion]);

    const totalTicksCalculados = useMemo(() => {
        if (!grabacion?.secuencia_grabada?.length) return 0;
        return grabacion.secuencia_grabada.reduce((maximo, nota) => Math.max(maximo, nota.tick + (nota.duracion || 0)), 0);
    }, [grabacion]);

    const botonesReplayUnicos = useMemo(() => {
        return Array.from(new Set((grabacion?.secuencia_grabada || []).map((nota) => nota.botonId).filter(Boolean)));
    }, [grabacion]);

    const bpmPistaOriginal = useMemo(() => {
        if (!grabacion) return bpm;

        // ✅ Intenta obtener el BPM de la pista en este orden de prioridad:
        // 1. BPM de la canción asociada
        // 2. BPM en metadata de varias formas posibles
        // 3. BPM de la grabación
        // 4. Default a 120
        const bpmDesdeCancion = Number(grabacion.canciones_hero?.bpm);
        const bpmDesdeMetadata = Number(
            grabacion.metadata?.bpm_original
            ?? grabacion.metadata?.cancion_bpm
            ?? grabacion.metadata?.bpm_cancion
            ?? grabacion.metadata?.bpm
        );

        if (Number.isFinite(bpmDesdeCancion) && bpmDesdeCancion > 0) {
            return bpmDesdeCancion;
        }

        if (Number.isFinite(bpmDesdeMetadata) && bpmDesdeMetadata > 0) {
            return bpmDesdeMetadata;
        }

        return grabacion.bpm || 120;
    }, [bpm, grabacion]);

    const playbackRateAudio = useMemo(() => {
        return limitarPlaybackRate((grabacion?.bpm || bpm || 120) / Math.max(1, bpmPistaOriginal || 120));
    }, [bpm, bpmPistaOriginal, grabacion?.bpm]);

    const tonalidadReplayLista = !grabacion?.tonalidad || logica.tonalidadSeleccionada === grabacion.tonalidad;

    const clavePrecargaReplay = useMemo(() => {
        return [grabacion?.id || 'sin-grabacion', grabacion?.tonalidad || 'sin-tonalidad', logica.instrumentoId, botonesReplayUnicos.join('|')].join('::');
    }, [botonesReplayUnicos, grabacion?.id, grabacion?.tonalidad, logica.instrumentoId]);

    const urlAudioFondo = useMemo(() => {
        if (!grabacion) return null;
        return grabacion.canciones_hero?.audio_fondo_url || grabacion.metadata?.audio_fondo_url || null;
    }, [grabacion]);

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

    useEffect(() => {
        if (!grabacion) return;
        setBpm(grabacion.bpm || 120);
    }, [grabacion]);

    const precargarNotasReplay = useCallback(async () => {
        if (!abierta || !grabacion || !logica.disenoCargado || logica.cargando || !tonalidadReplayLista) {
            return;
        }

        if (claveReplayPrecargadoRef.current === clavePrecargaReplay && precargaReplayRef.current) {
            return precargaReplayRef.current;
        }

        setPreparandoReplay(true);

        const rutasUnicas = new Map<string, string>();
        botonesReplayUnicos.forEach((botonId) => {
            const rutas = logica.obtenerRutasAudio(botonId);
            rutas.forEach((rutaRaw) => {
                const ruta = rutaRaw.startsWith('pitch:') ? rutaRaw.split('|')[1] : rutaRaw;
                const rutaFinal = ruta.startsWith('http') || ruta.startsWith('/') ? ruta : `/${ruta}`;
                rutasUnicas.set(ruta, rutaFinal);
            });
        });

        const promesa = Promise.allSettled(
            Array.from(rutasUnicas.entries()).map(([ruta, rutaFinal]) => (
                motorAudioPro.cargarSonidoEnBanco(logica.instrumentoId, ruta, rutaFinal)
            ))
        ).then(() => {
            claveReplayPrecargadoRef.current = clavePrecargaReplay;
        }).finally(() => {
            if (precargaReplayRef.current === promesa) {
                setPreparandoReplay(false);
            }
        });

        precargaReplayRef.current = promesa;
        return promesa;
    }, [abierta, botonesReplayUnicos, clavePrecargaReplay, grabacion, logica.cargando, logica.disenoCargado, logica.instrumentoId, logica.obtenerRutasAudio, tonalidadReplayLista]);

    useEffect(() => {
        if (!abierta || !grabacion?.tonalidad) return;
        logica.setTonalidadSeleccionada(grabacion.tonalidad);
    }, [abierta, grabacion?.tonalidad, logica.setTonalidadSeleccionada]);

    useEffect(() => {
        if (!abierta || !grabacion?.metadata?.instrumento_id) return;
        logica.setInstrumentoId(grabacion.metadata.instrumento_id);
    }, [abierta, grabacion?.metadata?.instrumento_id, logica.setInstrumentoId]);

    useEffect(() => {
        if (!abierta || !grabacion?.metadata?.timbre) return;
        logica.setAjustes((prev: any) => ({
            ...prev,
            timbre: grabacion.metadata?.timbre,
        }));
    }, [abierta, grabacion?.metadata?.timbre, logica.setAjustes]);

    useEffect(() => {
        if (!abierta || !grabacion) {
            setPreparandoReplay(false);
            precargaReplayRef.current = null;
            claveReplayPrecargadoRef.current = '';
            return;
        }

        if (!logica.disenoCargado || logica.cargando || !tonalidadReplayLista) {
            setPreparandoReplay(true);
            return;
        }

        void precargarNotasReplay();
    }, [abierta, grabacion, logica.cargando, logica.disenoCargado, precargarNotasReplay, tonalidadReplayLista]);

    useEffect(() => {
        if (!abierta) return;
        logica.setModoVista('notas');
    }, [abierta, logica.setModoVista]);

    useEffect(() => {
        if (!abierta) return;

        const bloquearTeclas = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            event.stopPropagation();
        };

        window.addEventListener('keydown', bloquearTeclas, true);
        window.addEventListener('keyup', bloquearTeclas, true);

        return () => {
            window.removeEventListener('keydown', bloquearTeclas, true);
            window.removeEventListener('keyup', bloquearTeclas, true);
        };
    }, [abierta]);

    useEffect(() => {
        tickActualRef.current = reproductor.tickActual;
    }, [reproductor.tickActual]);

    useEffect(() => {
        if (!abierta) return;

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflowAnterior;
        };
    }, [abierta]);

    useEffect(() => {
        if (audioFondoRef.current) {
            audioFondoRef.current.pause();
            audioFondoRef.current.src = '';
            audioFondoRef.current = null;
        }

        if (!abierta || !urlAudioFondo) return;

        const audio = new Audio(urlAudioFondo);
        audio.preload = 'auto';
        audio.volume = 1;
        audio.playbackRate = playbackRateAudio;
        audioFondoRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
            if (audioFondoRef.current === audio) {
                audioFondoRef.current = null;
            }
        };
    }, [abierta, urlAudioFondo]);

    useEffect(() => {
        if (!audioFondoRef.current) return;
        audioFondoRef.current.playbackRate = playbackRateAudio;
    }, [playbackRateAudio]);

    const invocarSincronizacionConPista = () => {
        if (typeof (window as any).sincronizarRelojConPista === 'function') {
            (window as any).sincronizarRelojConPista();
        }
    };

    const registrarSyncCuandoSuene = (audio: HTMLAudioElement) => {
        audio.onplaying = () => {
            invocarSincronizacionConPista();
            audio.onplaying = null;
        };
    };

    const sincronizarAudioConTick = (tick: number) => {
        const audio = audioFondoRef.current;
        if (!audio) return;

        const tiempoObjetivo = convertirTicksASegundos(tick, bpmPistaOriginal, resolucionActiva);
        audio.currentTime = tiempoObjetivo;
    };


    const iniciarSecuenciaDesdeTick = (tick: number) => {
        if (!cancionReplay) return;

        const tickNormalizado = Math.max(0, Math.floor(tick));
        reproductor.reproducirSecuencia(cancionReplay as any);
        if (tickNormalizado > 0) {
            reproductor.buscarTick(tickNormalizado);
        }
    };

    const reproducirAudioFondo = async (tick: number, alIniciarReplay: boolean = false) => {
        const audio = audioFondoRef.current;
        const tickObjetivo = Math.max(0, Math.floor(tick));

        await precargarNotasReplay();

        if (!audio) {
            if (alIniciarReplay && !reproductor.reproduciendo && cancionReplay) {
                iniciarSecuenciaDesdeTick(tickObjetivo);
            }
            return tickObjetivo;
        }

        sincronizarAudioConTick(tickObjetivo);
        audio.playbackRate = playbackRateAudio;

        if (alIniciarReplay && !reproductor.reproduciendo && cancionReplay) {
            return await new Promise<number>((resolve) => {
                let arrancado = false;

                const iniciarTodo = () => {
                    if (arrancado) return;
                    arrancado = true;

                    audio.removeEventListener('canplay', iniciarTodo);
                    audio.removeEventListener('loadeddata', iniciarTodo);
                    audio.removeEventListener('load', iniciarTodo);
                    window.clearTimeout(timeoutId);

                    registrarSyncCuandoSuene(audio);
                    iniciarSecuenciaDesdeTick(tickObjetivo);
                    audio.play().catch(() => {});
                    resolve(tickObjetivo);
                };

                const timeoutId = window.setTimeout(iniciarTodo, 3000);

                if (audio.readyState >= 2) {
                    iniciarTodo();
                    return;
                }

                audio.addEventListener('canplay', iniciarTodo);
                audio.addEventListener('loadeddata', iniciarTodo);
                audio.addEventListener('load', iniciarTodo);
            });
        }

        registrarSyncCuandoSuene(audio);

        try {
            await audio.play();
        } catch {
            // Si el navegador bloquea el audio, el replay visual sigue funcionando.
        }

        return tickObjetivo;
    };

    // ✅ Sincronizar estado de reproducción entre audio y reproductor
    useEffect(() => {
        const audio = audioFondoRef.current;
        if (!audio) return;

        if (!reproductor.reproduciendo) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, [reproductor.reproduciendo, reproductor.pausado]);

    useEffect(() => {
        if (!abierta) {
            reproductor.detenerReproduccion();
            audioFondoRef.current?.pause();
            return;
        }

        return () => {
            reproductor.detenerReproduccion();
            audioFondoRef.current?.pause();
            motorAudioPro.detenerTodo();
        };
    }, [abierta, reproductor.detenerReproduccion]);

    const reproducirOReanudar = async () => {
        if (!cancionReplay) return;

        await motorAudioPro.activarContexto();
        await precargarNotasReplay();

        const tickObjetivo = Math.max(0, Math.floor(tickActualRef.current));

        if (!reproductor.reproduciendo) {
            await reproducirAudioFondo(tickObjetivo, true);
            return;
        }

        if (reproductor.pausado) {
            const reanudacion = reproducirAudioFondo(tickObjetivo, false);
            reproductor.alternarPausa();
            await reanudacion;
        }
    };

    const pausar = () => {
        if (reproductor.reproduciendo && !reproductor.pausado) {
            const audio = audioFondoRef.current;
            if (audio) {
                audio.pause();
            }
            reproductor.alternarPausa();
        }
    };

    const buscarTick = (tick: number) => {
        const tickNormalizado = Math.max(0, Math.floor(tick));

        reproductor.buscarTick(tickNormalizado);

        const audio = audioFondoRef.current;
        if (audio) {
            sincronizarAudioConTick(tickNormalizado);
        }
    };

    const reiniciar = async () => {
        if (!cancionReplay) return;

        await precargarNotasReplay();
        reproductor.detenerReproduccion();

        const audio = audioFondoRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        await motorAudioPro.activarContexto();
        await reproducirAudioFondo(0, true);
    };

    if (!abierta || !grabacion) return null;

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
                        {urlAudioFondo && (
                            <span className="grabaciones-hero-badge audio">Con pista original</span>
                        )}
                        {grabacion.precision_porcentaje !== null && (
                            <span className="grabaciones-hero-badge precision">{Math.round(grabacion.precision_porcentaje)}%</span>
                        )}
                    </div>
                </div>

                <div className="grabaciones-hero-modal-metricas">
                    <div>
                        <span>BPM</span>
                        <strong>{bpm}</strong>
                    </div>
                    <div>
                        <span>Tonalidad</span>
                        <strong>{grabacion.tonalidad || 'N/D'}</strong>
                    </div>
                    <div>
                        <span>Notas</span>
                        <strong>{grabacion.notas_totales || grabacion.secuencia_grabada.length}</strong>
                    </div>
                    <div>
                        <span>Puntos</span>
                        <strong>{grabacion.puntuacion?.toLocaleString('es-CO') || 'N/D'}</strong>
                    </div>
                </div>

                <div className="grabaciones-hero-replay-layout">
                    <div className="grabaciones-hero-replay-escenario">
                        {logica.disenoCargado ? (
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
                        ) : (
                            <div className="grabaciones-hero-replay-cargando">
                                <Music2 size={24} />
                                <span>Cargando replay...</span>
                            </div>
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
