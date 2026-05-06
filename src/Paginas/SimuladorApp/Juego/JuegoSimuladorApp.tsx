import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import { usePointerAcordeon } from '../Hooks/usePointerAcordeon';
import MenuPausaProMax from '../../AcordeonProMax/Componentes/MenuPausaProMax';
import BarraMaestroMobile from './BarraMaestroMobile';
import HeaderJuegoSimulador from './HeaderJuegoSimulador';
import PantallaResultadosSimulador from './PantallaResultadosSimulador';
import PantallaGameOverSimulador from './PantallaGameOverSimulador';
import PistaNotasVertical from './PistaNotasVertical';
import PistaNotasBoxed from './PistaNotasBoxed';
import PistaNotasGuia from './PistaNotasGuia';
import PistaNotasFoco from './PistaNotasFoco';
import PistaNotasCarril from './PistaNotasCarril';
import HilerasPitos from './HilerasPitos';
import FuelleZonaJuego from './FuelleZonaJuego';
import SelectorModoVisual from './SelectorModoVisual';
import { useGuiaPitoObjetivo } from './useGuiaPitoObjetivo';
import { useModoVisualPersistido } from './useModoVisualPersistido';
import type { ConfigCancion, ModoJuego as ModoConfig } from './useConfigCancion';
import '../SimuladorApp.css';
import './JuegoSimuladorApp.css';

interface JuegoSimuladorAppProps {
    config: ConfigCancion;
    onSalir: () => void;
}

const MAPA_MODO: Record<ModoConfig, 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo'> = {
    competitivo: 'ninguno',
    libre: 'libre',
    synthesia: 'synthesia',
    maestro_solo: 'maestro_solo',
};

const JuegoSimuladorApp: React.FC<JuegoSimuladorAppProps> = ({ config, onSalir }) => {
    const hero: any = useLogicaProMax();
    const inicializadoRef = useRef(false);
    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const elementosCache = useRef<Map<string, { pito: Element | null; bajo: Element | null }>>(new Map());
    const [menuPausaAbierto, setMenuPausaAbierto] = useState(false);
    const { modoVisual, cambiar: cambiarModoVisual, toast: toastModo } = useModoVisualPersistido();

    // Marca el body para que el CSS local del menu de pausa (compacto) aplique
    // solo cuando estamos en el modo juego del simulador.
    useEffect(() => {
        document.body.classList.add('juego-sim-activo');
        return () => { document.body.classList.remove('juego-sim-activo'); };
    }, []);

    // Pre-unlock del AudioContext de iOS: sin un buffer reproducido antes del
    // primer toque, los toques aislados (sin gesto sostenido) tienen latencia
    // y throttling. Llamar setFuelleVirtual(true) al montar lo desbloquea de
    // inmediato y evita que el alumno tenga que mantener un dedo en la zona
    // del fuelle para que las notas rapidas suenen fluidas.
    useEffect(() => {
        if (hero?.logica?.setFuelleVirtual) hero.logica.setFuelleVirtual(true);
    }, [hero?.logica?.setFuelleVirtual]);

    // ─── Inicializar el juego (una vez) ─────────────────────
    useEffect(() => {
        if (inicializadoRef.current) return;
        if (!hero || typeof hero.iniciarJuego !== 'function') return;
        inicializadoRef.current = true;

        // Modo boxed fuerza synthesia (la cancion espera en cada nota; la
        // nota se enclava cortada en el borde inferior de la cajita).
        const modoPM = modoVisual === 'boxed' ? 'synthesia' : MAPA_MODO[config.modo];
        hero.setModoPractica(modoPM);
        hero.setMaestroSuena(config.guiaAudio);

        const tono = (config.cancion as any)?.tonalidad;
        if (tono && hero.logica?.setTonalidadSeleccionada) {
            hero.logica.setTonalidadSeleccionada(tono);
        }

        // Aplicar la seccion antes de iniciarJuego — sin esto siempre arranca
        // desde el inicio absoluto (Bug C). Replica el patron de ProMax.
        const seccionId = config.seccionId;
        if (seccionId && typeof hero.seleccionarSeccion === 'function') {
            const secciones: any[] = (config.cancion as any)?.secciones || [];
            const seccion = secciones.find((s: any) => s.id === seccionId);
            if (seccion) hero.seleccionarSeccion(seccion);
        } else if (typeof hero.seleccionarSeccion === 'function') {
            hero.seleccionarSeccion(null);
        }

        Promise.resolve(hero.iniciarJuego(config.cancion, false, modoPM)).catch((err: any) => {
            console.error('[JuegoSimuladorApp] iniciarJuego fallo:', err);
        });
    // modoVisual al primer init solamente; cambios posteriores los maneja el useEffect de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hero, config]);

    // Si el usuario cambia de modo visual mid-juego, ajusta el modoPractica.
    useEffect(() => {
        if (!inicializadoRef.current || typeof hero?.setModoPractica !== 'function') return;
        const modoPM = modoVisual === 'boxed' ? 'synthesia' : MAPA_MODO[config.modo];
        hero.setModoPractica(modoPM);
    }, [modoVisual, config.modo, hero]);

    // ─── Visualizacion imperativa de pitos (mismo patron que SimuladorApp)
    const actualizarVisualBoton = useCallback((pos: string, activo: boolean, esBajo: boolean) => {
        let cached = elementosCache.current.get(pos);
        if (!cached) {
            const pito = document.querySelector(`.pito-boton[data-pos="${pos}"]`);
            const bajo = document.querySelector(`.boton-bajo-contenedor[data-pos="${pos}"]`);
            cached = { pito, bajo };
            elementosCache.current.set(pos, cached);
        }
        if (esBajo && cached.bajo) {
            activo ? cached.bajo.classList.add('activo') : cached.bajo.classList.remove('activo');
        } else if (!esBajo && cached.pito) {
            activo ? cached.pito.classList.add('nota-activa') : cached.pito.classList.remove('nota-activa');
        }
    }, []);

    const logica = hero?.logica;

    const { limpiarGeometria, manejarCambioFuelle } = usePointerAcordeon({
        x,
        logica: logica || ({} as any),
        actualizarVisualBoton,
        registrarEvento: () => {},
        trenRef,
        desactivarAudio: hero?.estadoJuego === 'pausado',
    });

    // ─── Forzar tonalidad de la cancion (independencia total) ─
    // Los ajustes del usuario en la nube cargan async despues del mount y
    // sobreescriben la tonalidad. En modo juego el tono SIEMPRE debe ser el
    // de la cancion: si la nube intenta cambiarlo, lo revertimos.
    useEffect(() => {
        const tono = (config.cancion as any)?.tonalidad;
        if (!tono || !logica?.setTonalidadSeleccionada) return;
        if (logica.tonalidadSeleccionada !== tono) {
            logica.setTonalidadSeleccionada(tono);
        }
    }, [logica?.tonalidadSeleccionada, logica?.setTonalidadSeleccionada, config.cancion]);

    const tickActual: number = hero?.tickActual ?? 0;
    const cancionActual = hero?.cancionSeleccionada || config.cancion;
    const notasImpactadas: Set<string> = hero?.notasImpactadas || new Set();
    const { objetivosMap, posicionesObjetivoMaestro } = useGuiaPitoObjetivo({
        cancion: cancionActual,
        tickActual,
        notasImpactadas,
        notasImpactadasSize: notasImpactadas.size,
        botonesActivosMaestro: hero?.botonesActivosMaestro || {},
    });

    // Recalibrar geometria al cambiar tonalidad
    useEffect(() => {
        elementosCache.current.clear();
        limpiarGeometria();
    }, [logica?.tonalidadSeleccionada, limpiarGeometria]);

    const rangoSeccion = useMemo(() => (
        hero?.seccionSeleccionada
            ? { inicio: hero.seccionSeleccionada.tickInicio, fin: hero.seccionSeleccionada.tickFin }
            : null
    ), [hero?.seccionSeleccionada]);

    if (!hero) return null;

    const cancion = hero.cancionSeleccionada || config.cancion;
    const modoActual = hero.modoPractica;
    const esCompetitivo = modoActual === 'ninguno';
    const enJuego = hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado';
    const opacidadDano = esCompetitivo && enJuego
        ? Math.max(0, ((100 - (hero.estadisticas?.vida ?? 100)) / 100) * 0.88)
        : 0;

    const onPausarClick = () => {
        setMenuPausaAbierto(true);
        if (hero.estadoJuego === 'jugando' && typeof hero.alternarPausaReproduccion === 'function') {
            hero.alternarPausaReproduccion();
        }
    };
    const onReanudar = () => {
        setMenuPausaAbierto(false);
        if (hero.estadoJuego === 'pausado' && typeof hero.reanudarConConteo === 'function') {
            hero.reanudarConConteo();
        }
    };
    const reiniciar = () => {
        if (hero.cancionSeleccionada) hero.reiniciarDesdeGameOver(hero.cancionSeleccionada);
    };

    // Cambia el modo a maestro_solo y reinicia: el alumno practica la cancion
    // con barra de transporte (BPM, loop, scrubber) antes de competir de nuevo.
    const practicarEnModoMaestro = () => {
        if (!hero.cancionSeleccionada) return;
        hero.setModoPractica('maestro_solo');
        setTimeout(() => hero.iniciarJuego(hero.cancionSeleccionada, false, 'maestro_solo'), 80);
    };

    return (
        <div className={`juego-sim-root simulador-app-root modo-${logica?.direccion || 'halar'} ${objetivosMap.guia.size > 0 ? 'hay-objetivo' : ''}`}>
            <HeaderJuegoSimulador
                titulo={cancion?.titulo || 'Cargando...'}
                autor={cancion?.autor}
                puntos={hero.estadisticas?.puntos ?? 0}
                vida={hero.estadisticas?.vida ?? 100}
                racha={hero.estadisticas?.rachaActual ?? 0}
                multiplicador={hero.estadisticas?.multiplicador ?? 1}
                mostrarVida={esCompetitivo}
                onPausa={onPausarClick}
            />

            {hero.estadoJuego === 'contando' && hero.cuenta !== null && (
                <div className="juego-sim-cuenta-overlay">
                    <span key={hero.cuenta} className="juego-sim-cuenta-numero">{hero.cuenta}</span>
                </div>
            )}

            {hero.estadoJuego === 'seleccion' && (
                <div className="juego-sim-loader">
                    <div className="juego-sim-spinner" />
                    <p>Preparando canción...</p>
                </div>
            )}

            <div className="juego-sim-marca" aria-hidden="true">Acordeón Pro Max</div>

            <FuelleZonaJuego
                pausado={hero.estadoJuego === 'pausado'}
                manejarCambioFuelle={manejarCambioFuelle}
            />

            {/* Barra Maestro compacta solo cuando modo === 'maestro_solo'.
                Componente mobile-first con una sola fila de controles. */}
            {modoActual === 'maestro_solo' && (
                <div className="juego-sim-barra-maestro">
                    <BarraMaestroMobile
                        reproduciendo={hero.reproduciendo}
                        pausado={hero.pausado}
                        onAlternarPausa={hero.alternarPausa}
                        tickActual={hero.tickActual}
                        totalTicks={hero.totalTicks}
                        onBuscarTick={hero.buscarTick}
                        bpm={hero.bpm}
                        onCambiarBpm={hero.cambiarBpm}
                        loopAB={hero.loopAB}
                        onMarcarLoopInicio={hero.marcarLoopInicio}
                        onMarcarLoopFin={hero.marcarLoopFin}
                        onAlternarLoop={hero.alternarLoopAB}
                        onLimpiarLoop={hero.limpiarLoopAB}
                    />
                </div>
            )}

            {logica?.configTonalidad && (
                <div className="contenedor-acordeon-completo">
                    <div className="simulador-canvas">
                        <div className="diapason-marco">
                            <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x }}>
                                <HilerasPitos
                                    configTonalidad={logica.configTonalidad}
                                    direccion={logica.direccion || 'halar'}
                                    modoVista={logica.modoVista || 'notas'}
                                    objetivosMap={objetivosMap}
                                    posicionesObjetivoMaestro={posicionesObjetivoMaestro}
                                    direccionMaestro={hero?.direccionMaestro || 'halar'}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {(() => {
                const propsPista = {
                    cancion,
                    tickActual: hero.tickActual,
                    notasImpactadas: hero.notasImpactadas || new Set<string>(),
                    rangoSeccion,
                };
                switch (modoVisual) {
                    case 'boxed':  return <PistaNotasBoxed {...propsPista} />;
                    case 'guia':   return <PistaNotasGuia {...propsPista} />;
                    case 'foco':   return <PistaNotasFoco {...propsPista} />;
                    case 'carril': return <PistaNotasCarril {...propsPista} />;
                    case 'cayendo':
                    default:       return <PistaNotasVertical {...propsPista} />;
                }
            })()}

            <div className="juego-sim-switch-modo" data-touch-allow>
                <SelectorModoVisual modoActual={modoVisual} onCambiar={cambiarModoVisual} />
            </div>

            {toastModo && <div className="juego-sim-toast-modo" role="status">{toastModo}</div>}

            {opacidadDano > 0 && (
                <div className="juego-sim-dano-overlay" style={{ opacity: opacidadDano }} />
            )}

            {hero.estadoJuego === 'resultados' && cancion && (
                <PantallaResultadosSimulador
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    modo={esCompetitivo ? 'competencia' : modoActual}
                    mostrarGuardado={hero.grabaciones?.mostrarGuardadoResultado ?? false}
                    guardandoGrabacion={hero.grabaciones?.guardando ?? false}
                    errorGuardado={hero.grabaciones?.error ?? null}
                    tituloSugeridoGrabacion={hero.grabaciones?.tituloSugerido}
                    tituloGrabacionGuardada={hero.grabaciones?.ultimaGuardada?.tipo === 'competencia'
                        ? hero.grabaciones.ultimaGuardada.titulo
                        : null}
                    onGuardarGrabacion={hero.grabaciones?.guardarPendiente}
                    onJugarDeNuevo={() => hero.iniciarJuego(cancion)}
                    onVolverSeleccion={onSalir}
                    seccionSeleccionada={hero.seccionSeleccionada}
                    onJugarSiguienteSeccion={(s: any) => {
                        hero.seleccionarSeccion(s);
                        setTimeout(() => hero.iniciarJuego(cancion), 50);
                    }}
                    onPracticarMaestro={practicarEnModoMaestro}
                />
            )}

            {hero.estadoJuego === 'gameOver' && cancion && (
                <PantallaGameOverSimulador
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    onReintentar={() => hero.reiniciarDesdeGameOver(cancion)}
                    onVolverSeleccion={onSalir}
                    onPracticarMaestro={practicarEnModoMaestro}
                />
            )}

            <MenuPausaProMax
                visible={menuPausaAbierto}
                onReanudar={onReanudar}
                onReiniciar={() => { setMenuPausaAbierto(false); reiniciar(); }}
                maestroSuena={hero.maestroSuena}
                onToggleMaestroSuena={hero.setMaestroSuena}
                modoPractica={hero.modoPractica}
                modoAudioSynthesia={hero.modoAudioSynthesia}
                onCambiarModoAudioSynthesia={hero.setModoAudioSynthesia}
                bpm={hero.bpm}
                onCambiarBpm={hero.cambiarBpm}
                modoVista={hero.logica.modoVista}
                onCambiarVista={hero.logica.setModoVista}
                volumenMusica={hero.volumenMusica}
                onCambiarVolumenMusica={hero.setVolumenMusica}
                volumenAcordeon={hero.volumenAcordeon}
                onCambiarVolumenAcordeon={hero.setVolumenAcordeon}
                onSalir={onSalir}
            />
        </div>
    );
};

export default JuegoSimuladorApp;
