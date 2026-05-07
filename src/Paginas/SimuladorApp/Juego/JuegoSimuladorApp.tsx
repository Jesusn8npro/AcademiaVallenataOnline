import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import { usePointerAcordeon } from '../Hooks/usePointerAcordeon';
import MenuPausaProMax from '../../AcordeonProMax/Componentes/MenuPausaProMax';
import BarraMaestroMobile from './Piezas/BarraMaestroMobile';
import HeaderJuegoSimulador from './Piezas/HeaderJuegoSimulador';
import PantallaResultadosSimulador from './Pantallas/PantallaResultadosSimulador';
import PantallaGameOverSimulador from './Pantallas/PantallaGameOverSimulador';
import ModoVistaLibre from './ModosVista/ModoVistaLibre';
import PistaNotasBoxed from './ModosVista/PistaNotasBoxed';
import PistaNotasGuia from './ModosVista/PistaNotasGuia';
import PistaNotasFoco from './ModosVista/PistaNotasFoco';
import PistaNotasCarril from './ModosVista/PistaNotasCarril';
import HilerasPitos from './Piezas/HilerasPitos';
import FuelleZonaJuego from './Piezas/FuelleZonaJuego';
import SelectorModoVisual from './Piezas/SelectorModoVisual';
import JuicioJuego from './Piezas/JuicioJuego';
import { useGuiaPitoObjetivo } from './Hooks/useGuiaPitoObjetivo';
import { useModoVisualPersistido } from './Hooks/useModoVisualPersistido';
import type { ConfigCancion, ModoJuego as ModoConfig } from './Hooks/useConfigCancion';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
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

    // Si el usuario cambia de modo visual mid-juego, ajusta el modoPractica
    // y rebobina ~3 segundos para que la pista se acomode al nuevo modo y el
    // alumno tenga tiempo de procesar el cambio. Dependemos del setter
    // (estable, useCallback en useLogicaProMax) y NO de `hero` — useLogicaProMax
    // retorna un objeto literal nuevo cada render, asi que `hero` como dep haria
    // correr el effect cada render y pisaria setModoPractica('maestro_solo')
    // al hacer click en Practicar.
    const heroSetModoPractica = hero?.setModoPractica;
    const heroBuscarTick = hero?.buscarTick;
    const yaCambioVisualRef = useRef(false);
    useEffect(() => {
        if (!inicializadoRef.current || typeof heroSetModoPractica !== 'function') return;
        const modoPM = modoVisual === 'boxed' ? 'synthesia' : MAPA_MODO[config.modo];
        heroSetModoPractica(modoPM);

        // Saltar el primer disparo (mismo modoVisual con que arranco). Solo
        // rebobinar cuando el usuario cambia activamente desde el selector.
        if (!yaCambioVisualRef.current) {
            yaCambioVisualRef.current = true;
            return;
        }
        if (typeof heroBuscarTick === 'function') {
            const cancion = hero?.cancionSeleccionada || config.cancion;
            const bpmActual = hero?.bpm || cancion?.bpm || 120;
            const resolucion = (cancion as any)?.resolucion || 192;
            const ticksPorSegundo = (bpmActual * resolucion) / 60;
            const REWIND_SEGUNDOS = 3;
            const rewindTicks = Math.round(REWIND_SEGUNDOS * ticksPorSegundo);
            const tickActualNum = hero?.tickActual ?? 0;
            const seccion = hero?.seccionSeleccionada;
            const tickMinimo = seccion ? seccion.tickInicio : 0;
            const targetTick = Math.max(tickMinimo, tickActualNum - rewindTicks);
            heroBuscarTick(targetTick);
        }
    }, [modoVisual, config.modo, heroSetModoPractica, heroBuscarTick]);

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

    // Audio del acordeon gateado por estado: solo suena cuando 'jugando' o
    // 'pausado_synthesia'. En pausado_synthesia el motor pausa la pista pero
    // ESPERA que el alumno toque la nota correcta — los presses tactiles
    // tienen que pasar al motor o el modo Synth se siente "muerto" en mobile.
    // Resto de estados (resultados / gameOver / contando / seleccion / pausado
    // manual / menu de pausa abierto) silencian los pitos para que tocar al
    // fondo de un modal no produzca sonido.
    const audioPitosGateado = (
        hero?.estadoJuego !== 'jugando' &&
        hero?.estadoJuego !== 'pausado_synthesia'
    ) || menuPausaAbierto;
    const { limpiarGeometria, manejarCambioFuelle } = usePointerAcordeon({
        x,
        logica: logica || ({} as any),
        actualizarVisualBoton,
        registrarEvento: () => {},
        trenRef,
        desactivarAudio: audioPitosGateado,
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
    const modoEtiqueta: string =
        modoActual === 'maestro_solo' ? 'MAESTRO'
        : modoActual === 'synthesia'   ? 'SYNTH'
        : modoActual === 'libre'       ? 'LIBRE'
        : 'COMP';
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
    // Helper: ceba el HTMLAudio Maestro durante el gesto del usuario para
    // desbloquear iOS/Android. Idempotente — llamarlo en cada onClick que
    // pueda terminar en iniciarJuego con maestro_solo es seguro y barato.
    const cebarAudioSiMaestro = (cancion: any, modo?: string) => {
        const url = cancion?.audio_fondo_url || cancion?.audioFondoUrl;
        const modoEfectivo = modo || hero?.modoPractica;
        if (modoEfectivo === 'maestro_solo' && url) {
            try { motorAudioPro.cebarAudioMaestro(url); } catch (_) {}
        }
    };

    const reiniciar = () => {
        if (hero.cancionSeleccionada) {
            cebarAudioSiMaestro(hero.cancionSeleccionada);
            hero.reiniciarDesdeGameOver(hero.cancionSeleccionada);
        }
    };

    // Cambia el modo a maestro_solo y reinicia: el alumno practica la cancion
    // con barra de transporte (BPM, loop, scrubber) antes de competir de nuevo.
    // Re-aplica explicitamente la seccion seleccionada para que el reinicio
    // arranque desde la misma parte que estaba jugando (evita que el ref
    // interno quede desincronizado del state al pasar por Resultados/GameOver).
    const practicarEnModoMaestro = () => {
        const cancion = hero.cancionSeleccionada;
        if (!cancion) return;
        // Cebar PRIMERO (sincrono dentro del onClick) — el setTimeout posterior
        // rompe el gesto, asi el unlock de HTMLAudio tiene que pasar antes.
        cebarAudioSiMaestro(cancion, 'maestro_solo');
        hero.setModoPractica('maestro_solo');
        if (hero.seccionSeleccionada && typeof hero.seleccionarSeccion === 'function') {
            hero.seleccionarSeccion(hero.seccionSeleccionada);
        }
        setTimeout(() => hero.iniciarJuego(cancion, false, 'maestro_solo'), 80);
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
                modoEtiqueta={modoEtiqueta}
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
                    modoPractica: modoActual,
                };
                switch (modoVisual) {
                    case 'boxed':  return <PistaNotasBoxed {...propsPista} />;
                    case 'guia':   return <PistaNotasGuia {...propsPista} />;
                    case 'foco':   return <PistaNotasFoco {...propsPista} />;
                    case 'carril': return <PistaNotasCarril {...propsPista} />;
                    case 'cayendo':
                    default:       return <ModoVistaLibre {...propsPista} />;
                }
            })()}

            {/* Overlay de juicio: SOLO texto "PERFECTO/BIEN/TARDE" sobre el pito
                al impactar. El combo lo muestra el header (no duplicar — antes
                habia un combo gigante aqui que tapaba el titulo). */}
            {enJuego && (
                <JuicioJuego efectosVisuales={hero.efectosVisuales || []} />
            )}

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
                    onJugarDeNuevo={() => {
                        cebarAudioSiMaestro(cancion);
                        hero.iniciarJuego(cancion);
                    }}
                    onVolverSeleccion={onSalir}
                    seccionSeleccionada={hero.seccionSeleccionada}
                    onJugarSiguienteSeccion={(s: any) => {
                        cebarAudioSiMaestro(cancion);
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
                    onReintentar={() => {
                        cebarAudioSiMaestro(cancion);
                        hero.reiniciarDesdeGameOver(cancion);
                    }}
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
