import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import { usePointerAcordeon } from '../Hooks/usePointerAcordeon';
import MenuPausaProMax from '../../AcordeonProMax/Componentes/MenuPausaProMax';
import PantallaResultados from '../../AcordeonProMax/Componentes/PantallaResultados';
import PantallaGameOverProMax from '../../AcordeonProMax/Componentes/PantallaGameOverProMax';
import HeaderJuegoSimulador from './HeaderJuegoSimulador';
import PistaNotasVertical from './PistaNotasVertical';
import type { ConfigCancion, ModoJuego as ModoConfig } from '../Aprende/useConfigCancion';
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

const MAPA_CIFRADO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb',
    'Mi': 'E', 'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#',
    'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
};

const formatearNombreNota = (notaObj: any, modo: string): string => {
    if (!notaObj) return '';
    const partes = String(notaObj.nombre || '').split(' ');
    const notaBase = partes[0];
    if (modo === 'cifrado') return MAPA_CIFRADO[notaBase] || notaBase;
    return notaBase;
};

const JuegoSimuladorApp: React.FC<JuegoSimuladorAppProps> = ({ config, onSalir }) => {
    const hero: any = useLogicaProMax();
    const inicializadoRef = useRef(false);

    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const elementosCache = useRef<Map<string, { pito: Element | null; bajo: Element | null }>>(new Map());

    // ─── Inicializar el juego (una vez) ─────────────────────
    useEffect(() => {
        if (inicializadoRef.current) return;
        if (!hero || typeof hero.iniciarJuego !== 'function') return;

        inicializadoRef.current = true;
        const modoPM = MAPA_MODO[config.modo];
        hero.setModoPractica(modoPM);
        hero.setMaestroSuena(config.guiaAudio);

        Promise.resolve(hero.iniciarJuego(config.cancion, false, modoPM)).catch((err: any) => {
            console.error('[JuegoSimuladorApp] iniciarJuego fallo:', err);
        });
    }, [hero, config]);

    // ─── Visualizacion de pitos (mismo patron que SimuladorApp) ─
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

    // Conecta los pointer events de los pitos a hero.logica (mismo motor que ProMax)
    const { limpiarGeometria } = usePointerAcordeon({
        x,
        logica: logica || ({} as any),
        actualizarVisualBoton,
        registrarEvento: () => {},
        trenRef,
        desactivarAudio: hero?.estadoJuego === 'pausado',
    });

    // ─── Resaltado de pitos objetivo (cuando nota cae cerca) ──
    // Calculamos las posiciones objetivo (formato "A-1") via React props,
    // no via document.querySelector — mas confiable y reactivo.
    const botonesActivos = hero?.botonesActivosMaestro || {};
    const direccionMaestro: 'halar' | 'empujar' = hero?.direccionMaestro || 'halar';

    const posicionesObjetivo = useMemo<Set<string>>(() => {
        const set = new Set<string>();
        Object.keys(botonesActivos).forEach((botonId) => {
            // Soporta "A1-halar", "A-1-halar", "1-3-halar".
            // El data-pos del pito siempre es "A-1" (con guion).
            const m = botonId.match(/^([A-Z])-?(\d+)/);
            if (m) {
                set.add(`${m[1]}-${m[2]}`);
            } else {
                const m2 = botonId.match(/^(\d+)-(\d+)/);
                if (m2) set.add(`${m2[1]}-${m2[2]}`);
            }
        });
        return set;
    }, [botonesActivos]);

    // ─── Recalibrar geometria al cambiar tonalidad ──────────
    useEffect(() => {
        elementosCache.current.clear();
        limpiarGeometria();
    }, [logica?.tonalidadSeleccionada, limpiarGeometria]);

    // ─── Render hilera de pitos (mismo formato que SimuladorApp) ─
    const renderHilera = (fila: any[]) => {
        const p: Record<string, { halar: any; empujar: any }> = {};
        fila?.forEach((n: any) => {
            const pos = n.id.split('-').slice(0, 2).join('-');
            if (!p[pos]) p[pos] = { halar: null, empujar: null };
            n.id.includes('halar') ? p[pos].halar = n : p[pos].empujar = n;
        });

        const direccionUsuario = logica?.direccion || 'halar';

        return Object.entries(p)
            .sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]))
            .map(([pos, n]) => {
                const labelHalar = formatearNombreNota(n.halar, logica?.modoVista || 'notas');
                const labelEmpujar = formatearNombreNota(n.empujar, logica?.modoVista || 'notas');
                const esHalar = direccionUsuario === 'halar';
                const esObjetivo = posicionesObjetivo.has(pos);
                const claseObjetivo = esObjetivo
                    ? (direccionMaestro === 'halar' ? 'objetivo-halar' : 'objetivo-empujar')
                    : '';
                return (
                    <div key={pos} className={`pito-boton ${claseObjetivo}`} data-pos={pos}>
                        {esHalar
                            ? <span className="nota-etiqueta label-halar">{labelHalar}</span>
                            : <span className="nota-etiqueta label-empujar">{labelEmpujar}</span>}
                    </div>
                );
            });
    };

    if (!hero) return null;

    const cancion = hero.cancionSeleccionada || config.cancion;
    const modoActual = hero.modoPractica;
    const esCompetitivo = modoActual === 'ninguno';
    const enJuego = hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado';
    const opacidadDano = esCompetitivo && enJuego
        ? Math.max(0, ((100 - (hero.estadisticas?.vida ?? 100)) / 100) * 0.88)
        : 0;

    const reiniciar = () => {
        if (hero.cancionSeleccionada) hero.reiniciarDesdeGameOver(hero.cancionSeleccionada);
    };

    const rangoSeccion = useMemo(() => (
        hero.seccionSeleccionada
            ? { inicio: hero.seccionSeleccionada.tickInicio, fin: hero.seccionSeleccionada.tickFin }
            : null
    ), [hero.seccionSeleccionada]);

    return (
        <div className={`juego-sim-root simulador-app-root modo-${logica?.direccion || 'halar'}`}>
            <HeaderJuegoSimulador
                titulo={cancion?.titulo || 'Cargando...'}
                autor={cancion?.autor}
                puntos={hero.estadisticas?.puntos ?? 0}
                vida={hero.estadisticas?.vida ?? 100}
                racha={hero.estadisticas?.rachaActual ?? 0}
                multiplicador={hero.estadisticas?.multiplicador ?? 1}
                mostrarVida={esCompetitivo}
                onPausa={hero.alternarPausaReproduccion}
                onSalir={onSalir}
            />

            {hero.estadoJuego === 'contando' && hero.cuenta !== null && (
                <div className="juego-sim-cuenta-overlay">
                    <span key={hero.cuenta} className="juego-sim-cuenta-numero">
                        {hero.cuenta}
                    </span>
                </div>
            )}

            {hero.estadoJuego === 'seleccion' && (
                <div className="juego-sim-loader">
                    <div className="juego-sim-spinner" />
                    <p>Preparando canción...</p>
                </div>
            )}

            {/* Acordeon (pitos del SimuladorApp) - tamano natural, sin overrides */}
            {logica?.configTonalidad && (
                <div className="contenedor-acordeon-completo">
                    <div className="simulador-canvas">
                        <div className="diapason-marco" style={{ touchAction: 'manipulation' }}>
                            <motion.div
                                ref={trenRef}
                                className="tren-botones-deslizable"
                                style={{ x, touchAction: 'manipulation' }}
                            >
                                <div className="hilera-pitos hilera-adentro">
                                    {renderHilera(logica.configTonalidad?.terceraFila)}
                                </div>
                                <div className="hilera-pitos hilera-medio">
                                    {renderHilera(logica.configTonalidad?.segundaFila)}
                                </div>
                                <div className="hilera-pitos hilera-afuera">
                                    {renderHilera(logica.configTonalidad?.primeraFila)}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {/* Carriles verticales guia (overlay fixed encima del acordeon) */}
            <div className="juego-sim-carriles" aria-hidden="true">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="juego-sim-carril"
                        style={{ left: `${((i + 0.5) / 10) * 100}%` }}
                    />
                ))}
            </div>

            {/* Pista de notas cayendo (fixed encima de TODO, debajo del header) */}
            <PistaNotasVertical
                cancion={cancion}
                tickActual={hero.tickActual}
                notasImpactadas={hero.notasImpactadas || new Set()}
                rangoSeccion={rangoSeccion}
            />

            {/* Linea de impacto pulsante */}
            <div className="juego-sim-linea-impacto" aria-hidden="true" />

            {opacidadDano > 0 && (
                <div className="juego-sim-dano-overlay" style={{ opacity: opacidadDano }} />
            )}

            {hero.estadoJuego === 'resultados' && cancion && (
                <PantallaResultados
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    esModoCompetencia={esCompetitivo}
                    modo={esCompetitivo ? 'competencia' : modoActual}
                    mostrarGuardado={hero.grabaciones?.mostrarGuardadoResultado ?? false}
                    guardandoGrabacion={hero.grabaciones?.guardando ?? false}
                    errorGuardado={hero.grabaciones?.error}
                    tituloSugeridoGrabacion={hero.grabaciones?.tituloSugerido}
                    tituloGrabacionGuardada={hero.grabaciones?.ultimaGuardada?.tipo === 'competencia'
                        ? hero.grabaciones.ultimaGuardada.titulo
                        : null}
                    onGuardarGrabacion={hero.grabaciones?.guardarPendiente}
                    onDescartarGuardado={hero.grabaciones?.descartarPendiente}
                    onJugarDeNuevo={() => hero.iniciarJuego(cancion)}
                    onVolverSeleccion={onSalir}
                    seccionSeleccionada={hero.seccionSeleccionada}
                    onJugarSiguienteSeccion={(s: any) => {
                        hero.seleccionarSeccion(s);
                        setTimeout(() => hero.iniciarJuego(cancion), 50);
                    }}
                />
            )}

            {hero.estadoJuego === 'gameOver' && cancion && (
                <PantallaGameOverProMax
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    onReintentar={() => hero.reiniciarDesdeGameOver(cancion)}
                    onVolverSeleccion={onSalir}
                />
            )}

            <MenuPausaProMax
                visible={hero.estadoJuego === 'pausado'}
                onReanudar={hero.reanudarConConteo}
                onReiniciar={reiniciar}
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
