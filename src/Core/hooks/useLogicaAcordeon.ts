import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../servicios/clienteSupabase';
import { motorAudioPro } from '../audio/AudioEnginePro';
import { encontrarMejorMuestra, type Muestra } from '../audio/UniversalSampler';
import { mapaTeclas, tono } from '../acordeon/mapaTecladoYFrecuencias';
import { mapaTeclasBajos, TONALIDADES } from '../acordeon/notasAcordeonDiatonico';
import type { AjustesAcordeon, SonidoVirtual, ModoVista, AcordeonSimuladorProps } from '../acordeon/TiposAcordeon';
import {
    NOMBRES_INGLES, SAMPLES_BRILLANTE_DEFAULT, SAMPLES_ARMONIZADO_DEFAULT,
    EXTRAER_NOTA_OCTAVA, VOL_PITOS, VOL_BAJOS, FADE_OUT
} from './_utilidadesAcordeon';
import { useAcordeonHardware } from './LogicaAcordeon/useAcordeonHardware';
import { useAcordeonPersistencia } from './LogicaAcordeon/useAcordeonPersistencia';
import { useAcordeonSamples } from './LogicaAcordeon/useAcordeonSamples';
import {
    botonesActivosStore,
    useBotonesActivosSnapshot,
} from '../../Paginas/SimuladorApp/store/botonesActivosStore';

export const useLogicaAcordeon = (props: AcordeonSimuladorProps = {}) => {
    const {
        direccion: direccionProp = 'halar',
        deshabilitarInteraccion = false,
        onNotaPresionada,
        onNotaLiberada
    } = props;

    const [instrumentoId, setInstrumentoId] = useState<string>('4e9f2a94-21c0-4029-872e-7cb1c314af69');
    const [listaInstrumentos, setListaInstrumentos] = useState<any[]>([]);
    const [cargandoCloud, setCargandoCloud] = useState(false);

    // `botonesActivos` ahora vive en un store externo. Este hook expone el
    // snapshot vía useSyncExternalStore para los consumidores que lo necesiten,
    // pero las escrituras (setBoton/removeBoton) NO disparan re-render del
    // árbol — solo notifican a quien esté suscrito al id afectado.
    const botonesActivos = useBotonesActivosSnapshot();
    const setBotonesActivos = useCallback((next: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
        const nuevo = typeof next === 'function'
            ? (next as (p: Record<string, any>) => Record<string, any>)(botonesActivosStore.getSnapshot())
            : next;
        botonesActivosStore.setSnapshot(nuevo);
    }, []);
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<ModoVista>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);
    const [botonSeleccionado, setBotonSeleccionado] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
    const [tonalidadSeleccionada, setTonalidadSeleccionada] = useState<string>('F-Bb-Eb');
    const [sonidosVirtuales, setSonidosVirtuales] = useState<SonidoVirtual[]>([]);
    const [tipoFuelleActivo, setTipoFuelleActivo] = useState<'US' | 'SL'>('US');

    // Lazy initializer: lee el "Master Mirror" de localStorage para render inmediato sin esperar Supabase.
    const [ajustes, setAjustes] = useState<AjustesAcordeon>(() => {
        const defaults: AjustesAcordeon = {
            tamano: '88vh',
            x: '50%',
            y: '50%',
            pitosBotonTamano: '4.4vh',
            pitosFuenteTamano: '1.6vh',
            bajosBotonTamano: '4.2vh',
            bajosFuenteTamano: '1.3vh',
            teclasLeft: '5.05%',
            teclasTop: '13%',
            bajosLeft: '82.5%',
            bajosTop: '28%',
            mapeoPersonalizado: {},
            pitchPersonalizado: {},
            pitchGlobal: 0,
            bancoId: 'acordeon'
        };

        try {
            const saved = localStorage.getItem('SIM_VISUAL_MASTER_V11');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.x && parsed.y) return { ...defaults, ...parsed };
            }
        } catch (e) { }
        return defaults;
    });

    useEffect(() => {
        const activarAudio = async () => {
            try {
                await motorAudioPro.activarContexto();
                window.removeEventListener('mousedown', activarAudio);
                window.removeEventListener('keydown', activarAudio);
                window.removeEventListener('touchstart', activarAudio);
            } catch (err) { }
        };
        window.addEventListener('mousedown', activarAudio);
        window.addEventListener('keydown', activarAudio);
        window.addEventListener('touchstart', activarAudio);
        return () => {
            window.removeEventListener('mousedown', activarAudio);
            window.removeEventListener('keydown', activarAudio);
            window.removeEventListener('touchstart', activarAudio);
        };
    }, []);

    const ajustesRef = useRef(ajustes);
    useEffect(() => { ajustesRef.current = ajustes; }, [ajustes]);

    const botonesActivosRef = useRef<Record<string, any>>({});
    const soundsPerKeyRef = useRef<Record<string, string[]>>({});
    const basePitchesRef = useRef<Record<string, number>>({});
    const teclasFastMapRef = useRef<Record<string, any>>({});
    const direccionRef = useRef(direccion);
    useEffect(() => { direccionRef.current = direccion; }, [direccion]);
    const hardwareMapRef = useRef(new Map<string, string>());
    const deshabilitarRef = useRef(deshabilitarInteraccion);
    const previewNodeRef = useRef<any>(null);
    const tipoFuelleActivoRef = useRef(tipoFuelleActivo);
    useEffect(() => { tipoFuelleActivoRef.current = tipoFuelleActivo; }, [tipoFuelleActivo]);

    // Marca un cambio de dirección para que el efecto de sync NO dispare swap (evita doble swap cuando el reproductor lo controla).
    const skipNextSwapRef = useRef(false);
    const setDireccionSinSwap = useCallback((d: 'halar' | 'empujar') => {
        skipNextSwapRef.current = true;
        setDireccion(d);
    }, []);

    // Persistencia Supabase: usuario, ajustes, tonalidades, sonidos virtuales.
    const {
        usuarioId, listaTonalidades, setListaTonalidades, nombresTonalidades,
        disenoCargado, isInitialLoad,
        guardarAjustes, resetearAjustes, guardarNuevoSonidoVirtual,
        actualizarNombreTonalidad, eliminarTonalidad,
    } = useAcordeonPersistencia({
        ajustes, setAjustes, ajustesRef,
        tonalidadSeleccionada, setTonalidadSeleccionada,
        instrumentoId, setInstrumentoId, setListaInstrumentos, setCargandoCloud,
        setSonidosVirtuales, sonidosVirtuales,
    });

    // Samples: JSON local + Supabase + reconstruccion Muestra[]. Extraido a useAcordeonSamples.
    const {
        samplesPitos, samplesBajos, samplesArmonizado,
        muestrasDB, muestrasLocalesDB, muestrasLocalesDBRef,
        cargarMuestrasLocales,
    } = useAcordeonSamples({
        instrumentoId, timbreActivo: ajustes.timbre,
        setCargandoCloud, soundsPerKeyRef,
    });

    const obtenerOctava = (nombre: string, freq: number) => {
        const n = nombre.toLowerCase()
            .replace('do#', 'reb')
            .replace('re#', 'mib')
            .replace('fa#', 'solb')
            .replace('sol#', 'lab')
            .replace('la#', 'sib');

        const claveOriginal = Object.keys(tono).find(k => k.toLowerCase() === n) || 'Do';
        const freqs = (tono as any)[claveOriginal];

        let mejorIdx = 4;
        let minDiff = Infinity;
        freqs.forEach((f: number, idx: number) => {
            const diff = Math.abs(f - freq);
            if (diff < minDiff) { minDiff = diff; mejorIdx = idx; }
        });
        return mejorIdx;
    };

    const configTonalidad = TONALIDADES[tonalidadSeleccionada as keyof typeof TONALIDADES] || TONALIDADES['F-Bb-Eb'];
    const mapaBotonesActual = useRef<Record<string, any>>({});

    useEffect(() => {
        const todos = [
            ...configTonalidad.primeraFila,
            ...configTonalidad.segundaFila,
            ...configTonalidad.terceraFila,
            ...configTonalidad.disposicionBajos.una,
            ...configTonalidad.disposicionBajos.dos
        ];
        mapaBotonesActual.current = todos.reduce((acc, btn) => ({ ...acc, [btn.id]: btn }), {});
    }, [configTonalidad]);

    const obtenerRutasAudio = useCallback((idBoton: string, ajustesOverride?: AjustesAcordeon) => {
        const currentAjustes = ajustesOverride || ajustesRef.current;
        const map = currentAjustes.mapeoPersonalizado || {};
        const btn = mapaBotonesActual.current[idBoton];
        if (!btn) return [];

        const esAcordeonOriginal = instrumentoId === '4e9f2a94-21c0-4029-872e-7cb1c314af69';
        const esBajo = idBoton.includes('bajo');

        let notaTarget = btn.nombre;
        if (esBajo) notaTarget = notaTarget.replace(/M$|m$/, '');

        const fTarget = Array.isArray(btn.frecuencia) ? btn.frecuencia[0] : btn.frecuencia;
        let octavaTarget = obtenerOctava(notaTarget, fTarget as number);
        const nEng = NOMBRES_INGLES[notaTarget.toLowerCase()] || notaTarget;

        // Mapeo manual define qué nota buscar en otros instrumentos.
        if (map[idBoton] && map[idBoton].length > 0) {
            const infoManual = EXTRAER_NOTA_OCTAVA(map[idBoton][0]);
            if (infoManual) {
                notaTarget = infoManual.nota;
                octavaTarget = infoManual.octava;
            }
        }

        // Prioridad 1: instrumento personalizado (Supabase).
        if (!esAcordeonOriginal && muestrasDB && muestrasDB.length > 0) {
            const filtrarMuestras = muestrasDB.filter(m => esBajo ? m.tipo === 'bajos' : m.tipo === 'pitos');
            if (filtrarMuestras.length > 0) {
                const nEng = NOMBRES_INGLES[notaTarget.toLowerCase()] || notaTarget;
                const best = encontrarMejorMuestra(nEng, octavaTarget, filtrarMuestras);
                if (best) return [`pitch:${best.pitch}|${best.url}`];
            }
        }

        // Prioridad 2: acordeón original (banco local). Si hay mapeo manual, notaTarget ya viene resuelta arriba.
        if (esAcordeonOriginal) {
            if (muestrasLocalesDBRef.current.length > 0) {
                const tipoDeseado = (btn.tipo === 'mayor' || btn.tipo === 'menor') ? 'acorde' : 'nota';
                const cualidadDeseada = (btn.tipo === 'mayor' || btn.tipo === 'menor') ? btn.tipo : undefined;

                const filtrarLocales = muestrasLocalesDBRef.current.filter((m: Muestra) => {
                    const deBajo = m.url_audio.includes('Bajos');
                    if (esBajo) {
                        return deBajo && m.tipo_bajo === tipoDeseado && (tipoDeseado === 'nota' || m.cualidad === cualidadDeseada);
                    }
                    return !deBajo;
                });

                const nEng = NOMBRES_INGLES[notaTarget.toLowerCase()] || notaTarget;
                let best = encontrarMejorMuestra(nEng, octavaTarget, filtrarLocales);

                // Preferir pitch shifting pequeño (≤2 semitonos) sobre saltos de octava.
                if (best && (Math.abs(best.pitch) > 2)) {
                    const octavasEscaneo = esBajo ? [2, 3, 4, 1] : [4, 5, 6, 7, 3];
                    let mejorOpcionGlobal = best;
                    let menorPitchAbs = Math.abs(best.pitch);

                    for (const oct of octavasEscaneo) {
                        const prueba = encontrarMejorMuestra(nEng, oct, filtrarLocales);
                        if (prueba) {
                            const pitchCorregido = prueba.pitch + ((octavaTarget - oct) * 12);
                            if (Math.abs(pitchCorregido) < menorPitchAbs) {
                                menorPitchAbs = Math.abs(pitchCorregido);
                                mejorOpcionGlobal = { ...prueba, pitch: pitchCorregido };
                            }
                        }
                    }
                    best = mejorOpcionGlobal;
                }

                // Pitos altos: si el pitch sigue >3, intentar octava abajo + 12 semitonos.
                if (!esBajo && best && best.pitch > 3) {
                    const fallbackGordo = encontrarMejorMuestra(nEng, octavaTarget - 1, filtrarLocales);
                    if (fallbackGordo) {
                        const pitchCorregido = fallbackGordo.pitch + 12;
                        if (Math.abs(pitchCorregido) < Math.abs(best.pitch)) {
                            best = { ...fallbackGordo, pitch: pitchCorregido };
                        }
                    }
                }

                if (best) return [`pitch:${best.pitch}|${best.url}`];

                // Fallback: si pidieron acorde y no hay, usar nota normal del bajo.
                if (esBajo && tipoDeseado === 'acorde') {
                    const fallback = encontrarMejorMuestra(nEng, octavaTarget, muestrasLocalesDBRef.current.filter(m => m.url_audio.includes('Bajos') && m.tipo_bajo === 'nota'));
                    if (fallback) return [`pitch:${fallback.pitch}|${fallback.url}`];
                }
            }
        }

        return [];
        // muestrasLocalesDB no va en deps: usamos la ref para evitar stale closures.
    }, [muestrasDB, instrumentoId]);

    const detenerTono = useCallback((id: string, tiempoProgramado?: number) => {
        const b = botonesActivosRef.current[id];
        if (!b?.instances) return;

        b.instances.forEach((inst: any) => {
            motorAudioPro.detener(inst, FADE_OUT / 1000, tiempoProgramado);
        });
    }, []);

    const reproducirTono = useCallback((id: string, tiempoProgramado?: number, duracionSec?: number, loop: boolean = false) => {
        const rawRutas = soundsPerKeyRef.current[id] || obtenerRutasAudio(id);

        const esBajo = id.includes('bajo');
        const volume = esBajo ? VOL_BAJOS : VOL_PITOS;
        const userPitch = ajustesRef.current.pitchPersonalizado?.[id] || 0;
        // Routing al sub-bus correcto del motor: el slider TECLADO afecta solo
        // pitos y el slider BAJOS afecta solo los del lado bajos. Antes ambos
        // compartían el nodoGananciaPrincipal y se movían juntos.
        const seccion: 'teclado' | 'bajos' = esBajo ? 'bajos' : 'teclado';

        const instances = rawRutas.map(rutaRaw => {
            let ruta = rutaRaw;
            let pitchBase = 0;
            if (rutaRaw.startsWith('pitch:')) {
                const parts = rutaRaw.replace('pitch:', '').split('|');
                pitchBase = parseInt(parts[0]);
                ruta = parts[1];
            }
            const globalPitch = ajustesRef.current.pitchGlobal || 0;
            return motorAudioPro.reproducir(ruta, instrumentoId, volume, globalPitch + userPitch + pitchBase, loop, tiempoProgramado, duracionSec, seccion);
        }).filter(Boolean);

        soundsPerKeyRef.current[id] = rawRutas;
        return { instances: instances as any[] };
    }, [obtenerRutasAudio, instrumentoId]);

    const preprogramarTono = useCallback((id: string, delayInicioSec: number, delayFinSec: number) => {
        const { instances } = reproducirTono(id, delayInicioSec, delayFinSec - delayInicioSec);
        return instances;
    }, [reproducirTono]);

    const stopPreview = useCallback(() => {
        if (previewNodeRef.current) {
            try {
                const { fuente, ganancia } = previewNodeRef.current;
                const ahora = motorAudioPro.tiempoActual;
                ganancia.gain.cancelScheduledValues(ahora);
                ganancia.gain.setTargetAtTime(0, ahora, 0.05);
                fuente.stop(ahora + 0.1);
            } catch (e) { }
            previewNodeRef.current = null;
        }
    }, []);

    const playPreview = useCallback((rutaRaw: string, pitch: number, loop: boolean = true) => {
        stopPreview();
        let ruta = rutaRaw;
        let pBase = 0;
        if (rutaRaw.startsWith('pitch:')) {
            const parts = rutaRaw.replace('pitch:', '').split('|');
            pBase = parseInt(parts[0]);
            ruta = parts[1];
        }
        const instance = motorAudioPro.reproducir(ruta, instrumentoId, 0.6, pitch + pBase, loop);
        if (instance) {
            previewNodeRef.current = instance;
            instance.fuente.onended = () => {
                if (previewNodeRef.current === instance) previewNodeRef.current = null;
            };
        }
    }, [stopPreview]);

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add', instanciasExternas: any[] | null = null, silencioso: boolean = false, tiempoProgramado?: number, loop: boolean = false) => {
        if (deshabilitarRef.current) return;

        if (accion === 'add') {
            // Re-trigger limpio: si ya hay nota activa con el mismo id (caso de trino rápido
            // donde el remove anterior no completó el ciclo de React aún), detener la anterior
            // y reemplazar por la nueva en lugar de ignorar el add. Sin esto, en trinos a alta
            // velocidad las notas se pierden silenciosamente.
            const existente = botonesActivosRef.current[id];
            if (instanciasExternas === null && existente?.instances) {
                existente.instances.forEach((inst: any) => motorAudioPro.detener(inst, 0.005));
            }

            let instances: any[] = [];
            if (instanciasExternas !== null) {
                instances = instanciasExternas;
            } else {
                instances = reproducirTono(id, tiempoProgramado, undefined, loop).instances;
            }

            const valor = { instances, ...mapaBotonesActual.current[id] };
            if (silencioso) {
                botonesActivosRef.current = { ...botonesActivosRef.current, [id]: valor };
            } else {
                botonesActivosStore.setBoton(id, valor);
                botonesActivosRef.current = botonesActivosStore.getSnapshot();
            }

            if (!silencioso) onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            if (!botonesActivosRef.current[id]) return;

            detenerTono(id, tiempoProgramado);

            if (silencioso) {
                const sinId = { ...botonesActivosRef.current };
                delete sinId[id];
                botonesActivosRef.current = sinId;
            } else {
                botonesActivosStore.removeBoton(id);
                botonesActivosRef.current = botonesActivosStore.getSnapshot();
            }

            if (!silencioso) onNotaLiberada?.({ idBoton: id, nombre: id });
        }
    }, [onNotaPresionada, onNotaLiberada, reproducirTono, detenerTono]);

    const limpiarTodasLasNotas = useCallback(() => {
        motorAudioPro.detenerTodo(0.02);
        Object.keys(botonesActivosRef.current).forEach(id => {
            onNotaLiberada?.({ idBoton: id, nombre: id });
        });
        botonesActivosRef.current = {};
        botonesActivosStore.clear();
    }, [onNotaLiberada]);

    const ejecutarSwapDireccion = useCallback((nuevaDir: 'halar' | 'empujar') => {
        if (nuevaDir === direccionRef.current) return;

        const prev = { ...botonesActivosRef.current };
        const next: Record<string, any> = {};
        let huboCambio = false;

        Object.keys(prev).forEach(oldId => {
            const parts = oldId.split('-');
            if (parts.length < 3) return;
            const esBajo = oldId.includes('bajo');
            const newId = `${parts[0]}-${parts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`;

            if (newId !== oldId) {
                // Notas del secuenciador (instances: []) no se swapean.
                if (prev[oldId].instances && prev[oldId].instances.length === 0) {
                    next[oldId] = prev[oldId];
                    return;
                }

                huboCambio = true;
                const bOld = prev[oldId];
                if (bOld.instances) {
                    bOld.instances.forEach((inst: any) => motorAudioPro.detener(inst, 0.005));
                }
                onNotaLiberada?.({ idBoton: oldId, nombre: oldId });

                const { instances } = reproducirTono(newId);
                onNotaPresionada?.({ idBoton: newId, nombre: newId });

                if (instances && instances.length > 0) {
                    next[newId] = { instances, ...mapaBotonesActual.current[newId] };
                }
            } else {
                next[oldId] = prev[oldId];
            }
        });

        const currentHardware = hardwareMapRef.current;
        currentHardware.forEach((logicalId, physicalKey) => {
            const parts = logicalId.split('-');
            if (parts.length >= 3) {
                const esBajo = logicalId.includes('bajo');
                currentHardware.set(physicalKey, `${parts[0]}-${parts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`);
            }
        });

        direccionRef.current = nuevaDir;
        setDireccion(nuevaDir);

        if (huboCambio) {
            botonesActivosRef.current = next;
            botonesActivosStore.setSnapshot(next);
        }
    }, [reproducirTono, onNotaLiberada, onNotaPresionada]);

    useEffect(() => {
        if (skipNextSwapRef.current) {
            skipNextSwapRef.current = false;
            direccionRef.current = direccion;
            return;
        }
        if (direccion !== direccionRef.current) ejecutarSwapDireccion(direccion);
    }, [direccion, ejecutarSwapDireccion]);

    useEffect(() => { deshabilitarRef.current = deshabilitarInteraccion; }, [deshabilitarInteraccion]);
    useEffect(() => { ajustesRef.current = ajustes; }, [ajustes]);
    useEffect(() => { botonesActivosRef.current = botonesActivos; }, [botonesActivos]);
    useEffect(() => { if (direccionProp !== direccion) setDireccion(direccionProp); }, [direccionProp]);

    // (Listener de gesto-para-activar-audio fusionado arriba — antes había dos
    // useEffect duplicados haciendo lo mismo sobre window.)

    useEffect(() => {
        // Vaciamos solo el mapa de rutas rápidas; NO limpiamos el banco de audio para no forzar redescargas en cada cambio.
        soundsPerKeyRef.current = {};

        const timer = setTimeout(() => {
            const todosLosIds: string[] = [];
            Object.values(mapaBotonesActual.current).forEach((btn: any) => {
                const baseId = btn.id.split('-')[0] + '-' + btn.id.split('-')[1];
                const esBajo = btn.id.includes('bajo');
                todosLosIds.push(`${baseId}-halar${esBajo ? '-bajo' : ''}`);
                todosLosIds.push(`${baseId}-empujar${esBajo ? '-bajo' : ''}`);
            });

            todosLosIds.forEach(id => {
                let rutas = obtenerRutasAudio(id);
                if (rutas.length > 0) {
                    soundsPerKeyRef.current[id] = rutas;
                    rutas.forEach(rRaw => {
                        const r = rRaw.startsWith('pitch:') ? rRaw.split('|')[1] : rRaw;
                        const rutaFinal = r.startsWith('http') || r.startsWith('/') ? r : `/${r}`;
                        motorAudioPro.cargarSonidoEnBanco(instrumentoId, r, rutaFinal);
                    });
                }
            });

            const nuevoFastMap: Record<string, any> = {};
            const pMap = ajustes.pitchPersonalizado || {};

            const procesarTecla = (key: string, data: any, esBajo: boolean) => {
                const idBase = `${data.fila}-${data.columna}`;
                const suf = esBajo ? '-bajo' : '';
                const idH = `${idBase}-halar${suf}`;
                const idE = `${idBase}-empujar${suf}`;
                const rH = soundsPerKeyRef.current[idH] || [];
                const rE = soundsPerKeyRef.current[idE] || [];
                if (rH.length > 0 || rE.length > 0) {
                    nuevoFastMap[key] = {
                        idH, idE, rutasHalar: rH, rutasEmpujar: rE,
                        userPitchHalar: pMap[idH] || 0, userPitchEmpujar: pMap[idE] || 0,
                        esBajo
                    };
                }
            };

            Object.entries(mapaTeclas).forEach(([k, v]) => procesarTecla(k, v, false));
            Object.entries(mapaTeclasBajos).forEach(([k, v]) => procesarTecla(k, v, true));
            teclasFastMapRef.current = nuevoFastMap;
        }, 80);

        return () => clearTimeout(timer);
    }, [ajustes, tonalidadSeleccionada, obtenerRutasAudio, muestrasDB, instrumentoId, muestrasLocalesDB]);

    // Hardware: ESP32 (Web Serial) + teclado físico. Extraído a useAcordeonHardware.
    const { midiActivado, esp32Conectado, conectarESP32 } = useAcordeonHardware({
        botonesActivosRef, direccionRef, hardwareMapRef, deshabilitarRef, tipoFuelleActivoRef,
        mapaBotonesActualRef: mapaBotonesActual, ajustesRef, teclasFastMapRef,
        modoAjuste, setDireccion, setBotonesActivos, setBotonSeleccionado,
        actualizarBotonActivo, ejecutarSwapDireccion, reproducirTono, detenerTono,
        instrumentoId,
    });

    useEffect(() => { soundsPerKeyRef.current = {}; }, [instrumentoId]);

    const iOSUnlockRef = useRef(false);
    const setFuelleVirtual = useCallback((activo: boolean) => {
        if (!activo) return;
        motorAudioPro.activarContexto();
        // Unlock iOS: reproduce un buffer vacío de 1 muestra para pasar la sesión de "ambient" (silenciable) a "playback".
        if (!iOSUnlockRef.current) {
            iOSUnlockRef.current = true;
            try {
                const ctx = motorAudioPro.contextoAudio;
                const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                src.start(0);
            } catch (_) {}
        }
    }, []);

    // Memoizado: mantener referencia estable del objeto retornado salvo cuando
    // CAMBIA un valor real. Los callbacks ya son estables vía useCallback;
    // listamos solo los state/values primitivos como dependencias. Esto evita
    // que cada render del componente padre cause cascada en hijos memoizados.
    return useMemo(() => ({
        botonesActivos, direccion, setDireccion, modoAjuste, setModoAjuste, modoVista, setModoVista,
        vistaDoble, setVistaDoble, ajustes, setAjustes, botonSeleccionado, setBotonSeleccionado,
        pestanaActiva, setPestanaActiva, tonalidadSeleccionada, setTonalidadSeleccionada,
        listaTonalidades, setListaTonalidades, nombresTonalidades, actualizarNombreTonalidad, sonidosVirtuales, setSonidosVirtuales,
        limpiarTodasLasNotas, actualizarBotonActivo, ejecutarSwapDireccion, guardarAjustes, resetearAjustes,
        setDireccionSinSwap, muestrasDB, obtenerRutasAudio, sincronizarAudios: cargarMuestrasLocales,
        guardarNuevoSonidoVirtual, eliminarTonalidad,
        playPreview, stopPreview, reproduceTono: reproducirTono,
        configTonalidad, muestrasInstrumento: muestrasLocalesDBRef.current,
        soundsPerKey: soundsPerKeyRef.current, teclasFastMap: teclasFastMapRef.current,
        midiActivado, esp32Conectado, conectarESP32,
        listaInstrumentos,
        instrumentoId, setInstrumentoId, cargando: cargandoCloud, disenoCargado,
        tipoFuelleActivo, setTipoFuelleActivo,
        samplesBrillante: samplesPitos, samplesBajos, samplesArmonizado,
        mapaBotonesActual: mapaBotonesActual.current,
        preprogramarTono, setFuelleVirtual
    }), [
        botonesActivos, direccion, modoAjuste, modoVista, vistaDoble, ajustes,
        botonSeleccionado, pestanaActiva, tonalidadSeleccionada, listaTonalidades,
        nombresTonalidades, sonidosVirtuales, muestrasDB, configTonalidad,
        midiActivado, esp32Conectado, listaInstrumentos, instrumentoId,
        cargandoCloud, disenoCargado, tipoFuelleActivo,
        samplesPitos, samplesBajos, samplesArmonizado,
        // Callbacks (estables, pero los listamos por correctness):
        setListaTonalidades, actualizarNombreTonalidad, setSonidosVirtuales,
        limpiarTodasLasNotas, actualizarBotonActivo, ejecutarSwapDireccion,
        guardarAjustes, resetearAjustes, setDireccionSinSwap, obtenerRutasAudio,
        cargarMuestrasLocales, guardarNuevoSonidoVirtual, eliminarTonalidad,
        playPreview, stopPreview, reproducirTono, conectarESP32,
        preprogramarTono, setFuelleVirtual,
    ]);
};
