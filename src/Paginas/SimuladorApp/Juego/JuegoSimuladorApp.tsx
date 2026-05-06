import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import { useLogicaProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import { usePointerAcordeon } from '../Hooks/usePointerAcordeon';
import MenuPausaProMax from '../../AcordeonProMax/Componentes/MenuPausaProMax';
import HeaderJuegoSimulador from './HeaderJuegoSimulador';
import PantallaResultadosSimulador from './PantallaResultadosSimulador';
import PantallaGameOverSimulador from './PantallaGameOverSimulador';
import PistaNotasVertical from './PistaNotasVertical';
import PistaNotasBoxed from './PistaNotasBoxed';
import type { ConfigCancion, ModoJuego as ModoConfig } from './useConfigCancion';
import '../SimuladorApp.css';
import './JuegoSimuladorApp.css';

type ModoVisual = 'cayendo' | 'boxed';
const STORAGE_MODO_VISUAL = 'simulador_modo_visual';

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

    // Menu de pausa controlado explicitamente: el motor puede entrar en
    // 'pausado_synthesia' automaticamente al esperar una nota; eso no abre
    // el menu. Solo el click del usuario en el boton de pausa lo abre.
    const [menuPausaAbierto, setMenuPausaAbierto] = useState(false);

    // Marca el body para que el override CSS local del menu de pausa
    // (mas compacto) aplique solo cuando estamos en el modo juego del simulador.
    useEffect(() => {
        document.body.classList.add('juego-sim-activo');
        return () => { document.body.classList.remove('juego-sim-activo'); };
    }, []);

    const onPausarClick = () => {
        setMenuPausaAbierto(true);
        if (hero?.estadoJuego === 'jugando' && typeof hero?.alternarPausaReproduccion === 'function') {
            hero.alternarPausaReproduccion();
        }
    };

    const onReanudar = () => {
        setMenuPausaAbierto(false);
        if (hero?.estadoJuego === 'pausado' && typeof hero?.reanudarConConteo === 'function') {
            hero.reanudarConConteo();
        }
    };

    // Modo visual de la pista de notas: 'cayendo' (Metodo 1, default) o 'boxed'
    // (Metodo 2, Synthesia clasico). Persiste en localStorage por usuario.
    const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_MODO_VISUAL);
            return saved === 'boxed' ? 'boxed' : 'cayendo';
        } catch { return 'cayendo'; }
    });
    // Toast efimero que explica brevemente el modo activo cuando se cambia
    const [toastModo, setToastModo] = useState<string>('');
    const cambiarModoVisual = (m: ModoVisual) => {
        if (m === modoVisual) return;
        setModoVisual(m);
        try { localStorage.setItem(STORAGE_MODO_VISUAL, m); } catch { /* noop */ }
        setToastModo(m === 'cayendo'
            ? 'Modo libre · las notas caen sobre los pitos'
            : 'Modo Synthesia · la canción se pausa en cada nota'
        );
    };
    // Auto-ocultar el toast tras 2.5s
    useEffect(() => {
        if (!toastModo) return;
        const t = setTimeout(() => setToastModo(''), 2500);
        return () => clearTimeout(t);
    }, [toastModo]);

    // ─── Inicializar el juego (una vez) ─────────────────────
    useEffect(() => {
        if (inicializadoRef.current) return;
        if (!hero || typeof hero.iniciarJuego !== 'function') return;

        inicializadoRef.current = true;
        // Modo boxed fuerza synthesia para que la cancion espere en cada nota
        // (es la mecanica que hace que la nota "se enclave medio cortada" en el
        // borde inferior de la cajita hasta que el alumno pisa el boton correcto).
        const modoPM = modoVisual === 'boxed' ? 'synthesia' : MAPA_MODO[config.modo];
        hero.setModoPractica(modoPM);
        hero.setMaestroSuena(config.guiaAudio);

        // Aplica el tono de la cancion antes de iniciarJuego para que los pitos ya
        // se rendericen con la tonalidad correcta y las notas caigan alineadas.
        const tono = (config.cancion as any)?.tonalidad;
        if (tono && hero.logica?.setTonalidadSeleccionada) {
            hero.logica.setTonalidadSeleccionada(tono);
        }

        // Aplicar la seccion elegida antes de iniciarJuego — sin esto, iniciarJuego
        // siempre arranca desde el inicio absoluto (Bug C). Replica el patron de ProMax
        // que llama a seleccionarSeccion(s) antes de iniciar.
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
    // modoVisual al primer init solamente; cambios posteriores los maneja el useEffect de abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hero, config]);

    // Si el usuario cambia de modo visual mid-juego, ajusta el modoPractica
    // para que la mecanica de fondo coincida con lo que ve.
    useEffect(() => {
        if (!inicializadoRef.current || typeof hero?.setModoPractica !== 'function') return;
        const modoPM = modoVisual === 'boxed' ? 'synthesia' : MAPA_MODO[config.modo];
        hero.setModoPractica(modoPM);
    }, [modoVisual, config.modo, hero]);

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
    const { limpiarGeometria, manejarCambioFuelle } = usePointerAcordeon({
        x,
        logica: logica || ({} as any),
        actualizarVisualBoton,
        registrarEvento: () => {},
        trenRef,
        desactivarAudio: hero?.estadoJuego === 'pausado',
    });

    // ─── Forzar tonalidad de la cancion (independencia total) ─
    // Las ajustes del usuario en la nube cargan async despues del mount y
    // sobreescriben la tonalidad con la guardada. En modo juego el tono
    // SIEMPRE debe ser el de la cancion: si la nube (u otra fuente) intenta
    // cambiarlo, lo revertimos al de la cancion. Replica del patron de ProMax
    // (seleccionarCancion + iniciarJuego ambos llaman a setTonalidadSeleccionada).
    useEffect(() => {
        const tono = (config.cancion as any)?.tonalidad;
        if (!tono || !logica?.setTonalidadSeleccionada) return;
        if (logica.tonalidadSeleccionada !== tono) {
            logica.setTonalidadSeleccionada(tono);
        }
    }, [logica?.tonalidadSeleccionada, logica?.setTonalidadSeleccionada, config.cancion]);

    // ─── Guia visual: SOLO la nota mas cercana a impactar ───
    // El usuario quiere ver UNA sola nota resaltada (la que tiene que pisar a
    // continuacion), no todas las que vienen en camino. El highlight solo aparece
    // cuando la nota ya esta cerca del impacto (no toda la trayectoria).
    const tickActual: number = hero?.tickActual ?? 0;
    const cancionActual = hero?.cancionSeleccionada || config.cancion;
    const notasImpactadasSet: Set<string> = hero?.notasImpactadas || new Set();
    // El Set de notasImpactadas se MUTA sin cambiar la referencia, asi que
    // usamos su .size como dep adicional para forzar re-calculo (Bug A).
    const notasImpactadasSize = notasImpactadasSet.size;

    // Ventana de pre-highlight: solo los ultimos 40 ticks antes del impacto.
    // ~10% final de la trayectoria — el boton se enciende JUSTO cuando la nota
    // esta visualmente cerca del pito, no antes.
    const VENTANA_OBJETIVO = 40;
    // Notas dentro de este rango de ticks se consideran ACORDE (deben pisarse
    // simultaneamente). Mas amplio que el UMBRAL_ACORDE del motor (15) para
    // que la GUIA visual capture acordes con notas un poco desfasadas.
    const UMBRAL_ACORDE = 30;

    // Map data-pos -> fuelle de TODOS los pitos a pisar ahora.
    // Soporta acordes (multiples notas en el mismo tiempo) y sostenidos
    // (notas que se siguen mostrando mientras se pisan).
    const objetivosMap = useMemo<{
        guia: Map<string, 'halar' | 'empujar'>;
        sosteniendo: Set<string>;
    }>(() => {
        const guia = new Map<string, 'halar' | 'empujar'>();
        const sosteniendo = new Set<string>();
        const seq = cancionActual?.secuencia;
        if (!Array.isArray(seq)) return { guia, sosteniendo };

        // 1) Encontrar el tick de la nota mas proxima (no impactada, no pasada)
        let minTick: number | null = null;
        for (const nota of seq) {
            if (String(nota.botonId).includes('-bajo')) continue;
            const ticksHastaImpacto = nota.tick - tickActual;
            if (ticksHastaImpacto < -5 || ticksHastaImpacto > VENTANA_OBJETIVO) continue;
            const id = `${nota.tick}-${nota.botonId}`;
            if (notasImpactadasSet.has(id)) continue;
            if (minTick === null || nota.tick < minTick) minTick = nota.tick;
        }

        // 2) Agrupar TODAS las notas dentro de UMBRAL_ACORDE de la mas proxima.
        //    Asi el alumno ve los 2-3 botones que componen un acorde encendidos.
        if (minTick !== null) {
            for (const nota of seq) {
                if (String(nota.botonId).includes('-bajo')) continue;
                if (Math.abs(nota.tick - minTick) > UMBRAL_ACORDE) continue;
                const id = `${nota.tick}-${nota.botonId}`;
                if (notasImpactadasSet.has(id)) continue;
                const m = nota.botonId.match(/^([A-Z])-?(\d+)/) || nota.botonId.match(/^(\d+)-(\d+)/);
                if (!m) continue;
                const pos = `${m[1]}-${m[2]}`;
                guia.set(pos, nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
            }
        }

        // 3) Notas impactadas: sostenidos en curso (duracion >= 15) muestran
        //    halo "cargando energia" mientras dura el sustain + 12 ticks de
        //    cola para no cortar abrupto. Notas cortas reciben after-glow de
        //    20 ticks despues del impacto: el pito conserva el highlight de
        //    color (no salta al gris feo de nota-activa) confirmando al alumno
        //    que su pisada fue valida.
        for (const nota of seq) {
            if (String(nota.botonId).includes('-bajo')) continue;
            const id = `${nota.tick}-${nota.botonId}`;
            if (!notasImpactadasSet.has(id)) continue;
            const dur = Number(nota.duracion) || 0;
            const esSostenida = dur >= 15;
            const tickFin = esSostenida
                ? nota.tick + dur + 12
                : nota.tick + 20;
            if (tickActual >= tickFin) continue;
            if (tickActual < nota.tick - 5) continue;
            const m = nota.botonId.match(/^([A-Z])-?(\d+)/) || nota.botonId.match(/^(\d+)-(\d+)/);
            if (!m) continue;
            const pos = `${m[1]}-${m[2]}`;
            guia.set(pos, nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
            if (esSostenida) sosteniendo.add(pos);
        }

        return { guia, sosteniendo };
    }, [cancionActual, tickActual, notasImpactadasSize]);

    // ─── Resaltado de pitos por maestro (synthesia/maestro) ──
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
                const fuelleGuia = objetivosMap.guia.get(pos);
                const esSosteniendo = objetivosMap.sosteniendo.has(pos);
                const esObjetivoMaestro = posicionesObjetivo.has(pos);
                // Prioridad: la guia (notas inminentes + sostenidos) sobre el
                // highlight del maestro. Soporta acordes (multiples pitos a la vez).
                const claseObjetivo = fuelleGuia
                    ? `objetivo-${fuelleGuia}${esSosteniendo ? ' objetivo-sosteniendo' : ''}`
                    : esObjetivoMaestro
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

            {/* Marca de agua del acordeon — texto sutil estilo "Cassoto" en el
                area superior, detras de la pista de notas. */}
            <div className="juego-sim-marca" aria-hidden="true">Acordeón Pro Max</div>

            {/* Zona tactil para invertir el fuelle (cierra al presionar, abre al soltar).
                Negra, sin imagen, sobre el espacio vacio entre el header y la pista de notas.
                Permite tocar para cerrar el fuelle en modo competencia donde el maestro no toca. */}
            <div
                className="juego-sim-fuelle-zona"
                onPointerDown={(e) => {
                    if (hero?.estadoJuego === 'pausado') return;
                    if (e.cancelable) e.preventDefault();
                    e.stopPropagation();
                    manejarCambioFuelle('empujar', motorAudioPro);
                }}
                onPointerUp={(e) => {
                    if (hero?.estadoJuego === 'pausado') return;
                    e.stopPropagation();
                    manejarCambioFuelle('halar', motorAudioPro);
                }}
                onPointerCancel={() => manejarCambioFuelle('halar', motorAudioPro)}
                style={{ touchAction: 'manipulation' }}
                aria-hidden="true"
            />

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

            {/* Pista de notas — Metodo 1 (cayendo libre) o Metodo 2 (boxed Synthesia) */}
            {modoVisual === 'cayendo' ? (
                <PistaNotasVertical
                    cancion={cancion}
                    tickActual={hero.tickActual}
                    notasImpactadas={hero.notasImpactadas || new Set()}
                    rangoSeccion={rangoSeccion}
                />
            ) : (
                <PistaNotasBoxed
                    cancion={cancion}
                    tickActual={hero.tickActual}
                    notasImpactadas={hero.notasImpactadas || new Set()}
                    rangoSeccion={rangoSeccion}
                />
            )}

            {/* Switch de modo visual — dos opciones visibles, una sola activa.
                Cambia entre Metodo 1 (cayendo libre) y Metodo 2 (boxed Synthesia). */}
            <div className="juego-sim-switch-modo" data-touch-allow role="group" aria-label="Modo visual">
                <button
                    type="button"
                    className={modoVisual === 'cayendo' ? 'activo' : ''}
                    onClick={() => cambiarModoVisual('cayendo')}
                    title="Notas cayendo sobre los pitos (libre)"
                >
                    ↓ Libre
                </button>
                <button
                    type="button"
                    className={modoVisual === 'boxed' ? 'activo' : ''}
                    onClick={() => cambiarModoVisual('boxed')}
                    title="Cajita Synthesia (espera en cada nota)"
                >
                    ☐ Synth
                </button>
            </div>

            {/* Toast efimero al cambiar modo: explica brevemente como funciona */}
            {toastModo && (
                <div className="juego-sim-toast-modo" role="status">{toastModo}</div>
            )}

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
                />
            )}

            {hero.estadoJuego === 'gameOver' && cancion && (
                <PantallaGameOverSimulador
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    onReintentar={() => hero.reiniciarDesdeGameOver(cancion)}
                    onVolverSeleccion={onSalir}
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
