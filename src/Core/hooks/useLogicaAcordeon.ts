import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../servicios/clienteSupabase';
import { motorAudioPro } from '../audio/AudioEnginePro';
import { encontrarMejorMuestra, type Muestra } from '../audio/UniversalSampler';
import { mapaTeclas, tono } from '../acordeon/mapaTecladoYFrecuencias';
import {
    mapaTeclasBajos,
    TONALIDADES,
    cambiarFuelle
} from '../acordeon/notasAcordeonDiatonico';
import type { AjustesAcordeon, SonidoVirtual, ModoVista, AcordeonSimuladorProps } from '../acordeon/TiposAcordeon';
import {
    NOMBRES_INGLES, SAMPLES_BRILLANTE_DEFAULT, SAMPLES_ARMONIZADO_DEFAULT,
    EXTRAER_NOTA_OCTAVA, VOL_PITOS, VOL_BAJOS, FADE_OUT
} from './_utilidadesAcordeon';

export const useLogicaAcordeon = (props: AcordeonSimuladorProps = {}) => {
    const {
        direccion: direccionProp = 'halar',
        deshabilitarInteraccion = false,
        onNotaPresionada,
        onNotaLiberada
    } = props;

    const [instrumentoId, setInstrumentoId] = useState<string>('4e9f2a94-21c0-4029-872e-7cb1c314af69');
    const [listaInstrumentos, setListaInstrumentos] = useState<any[]>([]);
    const [muestrasDB, setMuestrasDB] = useState<any[]>([]);
    const [muestrasLocalesDB, setMuestrasLocalesDB] = useState<any[]>([]);
    const [cargandoCloud, setCargandoCloud] = useState(false);
    const [midiActivado, setMidiActivado] = useState(false);
    const [esp32Conectado, setEsp32Conectado] = useState(false);
    const esp32PortRef = useRef<any>(null);
    const [usuarioId, setUsuarioId] = useState<string | null>(null);
    const [samplesPitos, setSamplesPitos] = useState<string[]>(SAMPLES_BRILLANTE_DEFAULT);
    const [samplesBajos, setSamplesBajos] = useState<string[]>([]);
    const [samplesArmonizado, setSamplesArmonizado] = useState<string[]>(SAMPLES_ARMONIZADO_DEFAULT);

    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<ModoVista>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);
    const [botonSeleccionado, setBotonSeleccionado] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
    const [tonalidadSeleccionada, setTonalidadSeleccionada] = useState<string>('F-Bb-Eb');
    const [listaTonalidades, setListaTonalidades] = useState<string[]>([]);
    const [nombresTonalidades, setNombresTonalidades] = useState<Record<string, string>>({});
    const [sonidosVirtuales, setSonidosVirtuales] = useState<SonidoVirtual[]>([]);
    const [tipoFuelleActivo, setTipoFuelleActivo] = useState<'US' | 'SL'>('US');

    const [disenoCargado, setDisenoCargado] = useState(false);
    const isInitialLoad = useRef(true);

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

    // Ref espejo de muestrasLocalesDB: evita stale closure en obtenerRutasAudio al cambiar timbre.
    const muestrasLocalesDBRef = useRef<Muestra[]>([]);
    const cargarMuestrasLocales = useCallback(async (manual = false) => {
        try {
            const res = await fetch('/muestrasLocales.json?t=' + Date.now());
            const data = await res.json();
            // No sobreescribir defaults hardcodeados si el JSON viene vacío.
            if (data.pitos?.length > 0) setSamplesPitos(data.pitos);
            if (data.bajos?.length > 0) setSamplesBajos(data.bajos);
            if (data.armonizado?.length > 0) setSamplesArmonizado(data.armonizado);
            else setSamplesBajos(data.bajos || []);
            if (manual) motorAudioPro.limpiarBanco(instrumentoId);
        } catch (e) { }
    }, [instrumentoId]);

    useEffect(() => { cargarMuestrasLocales(); }, [cargarMuestrasLocales]);

    // Reconstruye Muestra[] del banco local cada vez que cambia timbre o lista de muestras.
    useEffect(() => {
        const mLocales: Muestra[] = [];
        // Leer de ajustes.timbre (reactivo), NO de ajustesRef.current — la ref puede estar stale dentro de un useEffect.
        const timbreActivo = ajustes.timbre || 'Brillante';
        const carpetaPitos = timbreActivo === 'Armonizado' ? 'ArmonizadoPro' : 'Brillante';
        const listaActivePitos = timbreActivo === 'Armonizado' ? samplesArmonizado : samplesPitos;

        // Pitos: formato esperado {Nota}-{Octava}-cm.mp3
        listaActivePitos.forEach(file => {
            const parts = file.split('-');
            if (parts.length >= 2) {
                mLocales.push({
                    nota: parts[0],
                    octava: parseInt(parts[1]) || 4,
                    url_audio: `/audio/Muestras_Cromaticas/${carpetaPitos}/${file}`
                });
            }
        });

        // Bajos: formato Bajo{Nota}[-2][(acorde)]-cm.mp3
        samplesBajos.forEach(file => {
            let clean = file.replace('Bajo', '').replace('-cm.mp3', '');
            let octava = 3;
            let esAcorde = false;
            let cualidad: 'mayor' | 'menor' = 'mayor';

            if (clean.includes('(acorde)')) {
                esAcorde = true;
                clean = clean.replace('(acorde)', '');
            }

            if (clean.includes('-2')) {
                octava = 2;
                clean = clean.replace('-2', '');
            }

            if (clean.endsWith('m') && clean.length > 1 && !clean.endsWith('bm')) {
                cualidad = 'menor';
                clean = clean.substring(0, clean.length - 1);
            }

            mLocales.push({
                nota: clean,
                octava,
                url_audio: `/audio/Muestras_Cromaticas/Bajos/${file}`,
                tipo_bajo: esAcorde ? 'acorde' : 'nota',
                cualidad: esAcorde ? cualidad : undefined
            });
        });

        // Actualizar la ref SÍNCRONAMENTE antes de setState — evita que obtenerRutasAudio lea el DB viejo.
        muestrasLocalesDBRef.current = mLocales;
        setMuestrasLocalesDB(mLocales);

        motorAudioPro.limpiarBanco(instrumentoId);
        motorAudioPro.limpiarBanco('4e9f2a94-21c0-4029-872e-7cb1c314af69');
        motorAudioPro.limpiarBanco('acordeon');
        soundsPerKeyRef.current = {};
    }, [samplesPitos, samplesArmonizado, samplesBajos, ajustes.timbre, instrumentoId]);

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

    useEffect(() => {
        const checkUserAndLoad = async () => {
            setCargandoCloud(true);
            try {
                const { data: instData } = await (supabase.from('sim_instrumentos').select('*') as any);
                if (instData) setListaInstrumentos(instData);

                const { data: userData } = await supabase.auth.getUser();
                const user = userData.user;
                if (user) {
                    setUsuarioId(user.id);
                    const { data: ajustesData } = await (supabase
                        .from('sim_ajustes_usuario')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .maybeSingle() as any);

                    if (ajustesData) {
                        if (ajustesData.instrumento_id) setInstrumentoId(ajustesData.instrumento_id as string);
                        if (ajustesData.sonidos_personalizados) setSonidosVirtuales(ajustesData.sonidos_personalizados as SonidoVirtual[]);

                        if (ajustesData.ajustes_visuales) {
                            setAjustes(prev => ({ ...prev, ...(ajustesData.ajustes_visuales as any) }));
                        }

                        if (ajustesData.tonalidades_configuradas) {
                            const configs = ajustesData.tonalidades_configuradas as any;
                            const nombres: Record<string, string> = {};
                            Object.entries(configs).forEach(([key, val]: [string, any]) => {
                                if (val?.nombrePersonalizado) {
                                    const id = key.replace('ajustes_acordeon_vPRO_', '');
                                    nombres[id] = val.nombrePersonalizado;
                                }
                            });
                            setNombresTonalidades(nombres);
                        }

                        if (ajustesData.lista_tonalidades_activa && Array.isArray(ajustesData.lista_tonalidades_activa) && ajustesData.lista_tonalidades_activa.length > 0) {
                            setListaTonalidades(ajustesData.lista_tonalidades_activa as string[]);
                        } else {
                            setListaTonalidades(Object.keys(TONALIDADES));
                        }

                        if (ajustesData.tonalidad_activa) {
                            setTonalidadSeleccionada(ajustesData.tonalidad_activa as string);
                        }
                    } else {
                        setListaTonalidades(Object.keys(TONALIDADES));
                    }
                } else {
                    setListaTonalidades(Object.keys(TONALIDADES));
                }
            } catch (error) {
                setListaTonalidades(Object.keys(TONALIDADES));
            } finally {
                setCargandoCloud(false);
            }
        };
        checkUserAndLoad();
    }, []);

    useEffect(() => {
        const cargarMuestras = async () => {
            if (!instrumentoId) return;
            setCargandoCloud(true);
            try {
                const { data, error } = await supabase
                    .from('sim_muestras')
                    .select('*')
                    .eq('instrumento_id', instrumentoId) as any;

                if (error) throw error;
                setMuestrasDB(data || []);

                motorAudioPro.limpiarBanco(instrumentoId);
                soundsPerKeyRef.current = {};
            } catch (e) {
            } finally {
                setCargandoCloud(false);
            }
        };
        cargarMuestras();
    }, [instrumentoId]);

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

        const volume = id.includes('bajo') ? VOL_BAJOS : VOL_PITOS;
        const userPitch = ajustesRef.current.pitchPersonalizado?.[id] || 0;

        const instances = rawRutas.map(rutaRaw => {
            let ruta = rutaRaw;
            let pitchBase = 0;
            if (rutaRaw.startsWith('pitch:')) {
                const parts = rutaRaw.replace('pitch:', '').split('|');
                pitchBase = parseInt(parts[0]);
                ruta = parts[1];
            }
            const globalPitch = ajustesRef.current.pitchGlobal || 0;
            return motorAudioPro.reproducir(ruta, instrumentoId, volume, globalPitch + userPitch + pitchBase, loop, tiempoProgramado, duracionSec);
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

            if (silencioso) {
                botonesActivosRef.current[id] = { instances, ...mapaBotonesActual.current[id] };
            } else {
                const newState = { ...botonesActivosRef.current, [id]: { instances, ...mapaBotonesActual.current[id] } };
                botonesActivosRef.current = newState;
                setBotonesActivos(newState);
            }

            if (!silencioso) onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            if (!botonesActivosRef.current[id]) return;

            detenerTono(id, tiempoProgramado);

            if (silencioso) {
                delete botonesActivosRef.current[id];
            } else {
                const newState = { ...botonesActivosRef.current };
                delete newState[id];
                botonesActivosRef.current = newState;
                setBotonesActivos(newState);
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
        setBotonesActivos({});
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
            setBotonesActivos(next);
        }
    }, [reproducirTono, onNotaLiberada, onNotaPresionada]);

    const manejarEventoTeclado = useCallback((e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

        const tecla = e.key.toLowerCase();

        if (tecla === cambiarFuelle) {
            const nuevaDireccion = esPresionada ? 'empujar' : 'halar';
            if (nuevaDireccion !== direccionRef.current) {
                ejecutarSwapDireccion(nuevaDireccion);
            }
            return;
        }

        const d = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
        if (!d) return;
        const esBajo = !!mapaTeclasBajos[tecla];
        const id = `${d.fila}-${d.columna}-${direccionRef.current}${esBajo ? '-bajo' : ''}`;

        if (esPresionada && !e.repeat) {
            if (modoAjuste) setBotonSeleccionado(id);

            const fastData = teclasFastMapRef.current[tecla];
            if (fastData) {
                const dir = direccionRef.current;
                const rawRutas = dir === 'halar' ? fastData.rutasHalar : fastData.rutasEmpujar;
                const userPitch = dir === 'halar' ? fastData.userPitchHalar : fastData.userPitchEmpujar;
                const vol = fastData.esBajo ? VOL_BAJOS : VOL_PITOS;

                const instanciasFast = rawRutas.map((rRaw: string) => {
                    let r = rRaw; let pBase = 0;
                    if (rRaw.startsWith('pitch:')) {
                        const parts = rRaw.replace('pitch:', '').split('|');
                        pBase = parseInt(parts[0]); r = parts[1];
                    }
                    const gPitch = ajustesRef.current.pitchGlobal || 0;
                    return motorAudioPro.reproducir(r, instrumentoId, vol, gPitch + userPitch + pBase);
                }).filter(Boolean);

                actualizarBotonActivo(id, 'add', instanciasFast);
            } else {
                actualizarBotonActivo(id, 'add');
            }
        } else if (!esPresionada) {
            actualizarBotonActivo(id, 'remove');
        }
    }, [actualizarBotonActivo, reproducirTono, detenerTono, modoAjuste, botonSeleccionado, ejecutarSwapDireccion, cambiarFuelle]);

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

    useEffect(() => {
        const handleInteraction = () => {
            motorAudioPro.activarContexto();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    useEffect(() => {
        const hKD = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
        const hKU = (e: KeyboardEvent) => manejarEventoTeclado(e, false);
        window.addEventListener('keydown', hKD);
        window.addEventListener('keyup', hKU);
        return () => {
            window.removeEventListener('keydown', hKD);
            window.removeEventListener('keyup', hKU);
        };
    }, [manejarEventoTeclado]);

    useEffect(() => {
        const mappingKey = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;

        const cargarTodo = async () => {
            if (usuarioId === null) return;
            try {
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('ajustes_visuales, tonalidades_configuradas, instrumento_id')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                const disenoGlobalNube = (data as any)?.ajustes_visuales || {};
                const rawConfigMusical = (data as any)?.tonalidades_configuradas?.[mappingKey] || {};

                const configMusical: Partial<AjustesAcordeon> = {
                    mapeoPersonalizado: rawConfigMusical.mapeoPersonalizado,
                    pitchPersonalizado: rawConfigMusical.pitchPersonalizado,
                    pitchGlobal: rawConfigMusical.pitchGlobal,
                    bancoId: rawConfigMusical.bancoId,
                    timbre: rawConfigMusical.timbre,
                };

                // Priorizamos lo que el usuario ya tiene en pantalla; sólo aplicamos diseño de la nube en carga inicial
                // o si el acordeón está en su posición default (evita "salto asqueroso" si el usuario ya lo movió).
                const ajustesFinales: AjustesAcordeon = { ...ajustesRef.current, ...configMusical };
                if (isInitialLoad.current || (ajustesRef.current.x === '50%' && ajustesRef.current.y === '50%')) {
                    Object.assign(ajustesFinales, disenoGlobalNube);
                }

                // Corrige valor "maldito" 53.5% que aparecía esporádicamente desde la nube.
                if (ajustesFinales.x === '53.5%') ajustesFinales.x = '50%';

                setAjustes(ajustesFinales);
                ajustesRef.current = ajustesFinales;
                setDisenoCargado(true);
                isInitialLoad.current = false;

                if ((data as any)?.instrumento_id) setInstrumentoId((data as any).instrumento_id);
            } catch (e) { }
        };

        cargarTodo();
    }, [tonalidadSeleccionada, usuarioId]);

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

    // Web Serial API: conexión directa al ESP32 (sin Hairless ni loopMIDI).
    const conectarESP32 = useCallback(async () => {
        if (!(navigator as any).serial) {
            return;
        }
        try {
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 115200 });
            esp32PortRef.current = port;
            setEsp32Conectado(true);

            const decoder = new TextDecoderStream();
            port.readable.pipeTo(decoder.writable);
            const reader = decoder.readable.getReader();

            const activeTimeouts: Record<string, any> = {};
            let partialLine = "";

            const readLoop = async () => {
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        const lines = (partialLine + value).split("\n");
                        partialLine = lines.pop() || "";

                        let huboCambio = false;

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed) continue;


                            const parts = trimmed.split(",");
                            if (parts.length < 2) continue;

                            const tipo = parts[0];
                            const val = parts[1];
                            const estadoStr = parts[2];

                            if (tipo === "F_US" || tipo === "F_SL" || tipo === "FUELLE") {
                                // F_US/F_SL respetan la opción de UI; "FUELLE" viejo pasa libre.
                                if ((tipo === "F_US" && tipoFuelleActivoRef.current !== 'US') ||
                                    (tipo === "F_SL" && tipoFuelleActivoRef.current !== 'SL')) {
                                    continue;
                                }

                                const nuevaDir = val === "ABRIR" ? "halar" : "empujar";
                                if (nuevaDir !== direccionRef.current) {
                                    const prev = { ...botonesActivosRef.current };
                                    const next: Record<string, any> = {};

                                    Object.keys(prev).forEach(oldId => {
                                        const parts = oldId.split('-');
                                        if (parts.length < 3) return;
                                        const esBajo = oldId.includes('bajo');
                                        const newId = `${parts[0]}-${parts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`;
                                        if (newId !== oldId) {
                                            detenerTono(oldId);
                                            const { instances } = reproducirTono(newId);
                                            if (instances?.length) next[newId] = { instances, ...mapaBotonesActual.current[newId] };
                                        } else next[oldId] = prev[oldId];
                                    });

                                    hardwareMapRef.current.forEach((logicalId, physicalKey) => {
                                        const parts = logicalId.split('-');
                                        if (parts.length >= 3) {
                                            const esBajo = logicalId.includes('bajo');
                                            const newLogicalId = `${parts[0]}-${parts[1]}-${nuevaDir}${esBajo ? '-bajo' : ''}`;
                                            hardwareMapRef.current.set(physicalKey, newLogicalId);
                                        }
                                    });

                                    direccionRef.current = nuevaDir;
                                    botonesActivosRef.current = next;
                                    setDireccion(nuevaDir);
                                    huboCambio = true;
                                }
                            } else if (["H1", "H2", "BA"].includes(tipo)) {
                                const idx = parseInt(val);
                                const physicalKey = `${tipo}-${idx}`;
                                let note = 0;

                                if (tipo === "H1") note = (idx < 6) ? 48 + (5 - idx) : 60 + (idx - 6);
                                else if (tipo === "H2") note = (idx >= 11) ? 54 + (15 - idx) : 71 + (10 - idx);
                                else if (tipo === "BA") note = (idx <= 11) ? 30 + idx : (idx === 12 ? 81 : 0);

                                if (note === 0) continue;

                                if (estadoStr !== undefined) {
                                    const isOn = estadoStr === "1";

                                    if (isOn) {
                                        let idBoton: string | null = null;
                                        if (note >= 60 && note <= 70) idBoton = `1-${note - 59}-${direccionRef.current}`;
                                        else if (note >= 48 && note <= 59) idBoton = `2-${note - 47}-${direccionRef.current}`;
                                        else if (note >= 71 && note <= 82) idBoton = `3-${note - 70}-${direccionRef.current}`;

                                        if (note >= 30 && note <= 41) {
                                            const map: Record<number, string> = {
                                                30: '2-6', 31: '2-5', 32: '2-4', 33: '2-3', 34: '1-2', 35: '1-1',
                                                36: '1-6', 37: '1-5', 38: '1-4', 39: '1-3', 40: '2-2', 41: '2-1'
                                            };
                                            const base = map[note];
                                            if (base) idBoton = `${base}-${direccionRef.current}-bajo`;
                                        } else if (note === 81) idBoton = `3-11-${direccionRef.current}`;

                                        if (idBoton) {
                                            hardwareMapRef.current.set(physicalKey, idBoton);
                                            actualizarBotonActivo(idBoton, 'add', null, true);
                                            huboCambio = true;
                                        }
                                    } else {
                                        // Soltar: recuperamos el ID actualizado del ref (puede haber cambiado por swap de fuelle).
                                        const logicalId = hardwareMapRef.current.get(physicalKey);
                                        if (logicalId) {
                                            actualizarBotonActivo(logicalId, 'remove', null, true);
                                            hardwareMapRef.current.delete(physicalKey);
                                            huboCambio = true;
                                        }
                                    }
                                } else {
                                    // Modo compatibilidad: hardware viejo manda pulsos sin estado on/off.
                                    let idBoton: string | null = null;
                                    if (note >= 60 && note <= 70) idBoton = `1-${note - 59}-${direccionRef.current}`;
                                    else if (note >= 48 && note <= 59) idBoton = `2-${note - 47}-${direccionRef.current}`;
                                    else if (note >= 71 && note <= 82) idBoton = `3-${note - 70}-${direccionRef.current}`;

                                    if (note >= 30 && note <= 41) {
                                        const base = { 30: '2-6', 31: '2-5', 32: '2-4', 33: '2-3', 34: '1-2', 35: '1-1', 36: '1-6', 37: '1-5', 38: '1-4', 39: '1-3', 40: '2-2', 41: '2-1' }[note];
                                        if (base) idBoton = `${base}-${direccionRef.current}-bajo`;
                                    } else if (note === 81) idBoton = `3-11-${direccionRef.current}`;

                                    if (idBoton) {
                                        if (activeTimeouts[idBoton]) {
                                            clearTimeout(activeTimeouts[idBoton]);
                                        } else {
                                            actualizarBotonActivo(idBoton, 'add', null, true);
                                            huboCambio = true;
                                        }

                                        const currentId = idBoton;
                                        activeTimeouts[idBoton] = setTimeout(() => {
                                            actualizarBotonActivo(currentId, 'remove');
                                            delete activeTimeouts[currentId];
                                        }, 400);
                                    }
                                }
                            }
                        }

                        // Sync único por paquete serial.
                        if (huboCambio) setBotonesActivos({ ...botonesActivosRef.current });
                    }
                } catch (err) {
                    setEsp32Conectado(false);
                } finally {
                    reader.releaseLock();
                }
            };

            readLoop();
        } catch (err) {
            setEsp32Conectado(false);
        }
    }, [actualizarBotonActivo, limpiarTodasLasNotas]);

    const guardarAjustes = async () => {
        if (!usuarioId) return;

        const key = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;
        const cur = ajustesRef.current;

        const disenoGlobal = {
            x: cur.x, y: cur.y, tamano: cur.tamano,
            pitosBotonTamano: cur.pitosBotonTamano, pitosFuenteTamano: cur.pitosFuenteTamano,
            bajosBotonTamano: cur.bajosBotonTamano, bajosFuenteTamano: cur.bajosFuenteTamano,
            teclasLeft: cur.teclasLeft, teclasTop: cur.teclasTop,
            bajosLeft: cur.bajosLeft, bajosTop: cur.bajosTop
        };

        const configMusical = {
            mapeoPersonalizado: cur.mapeoPersonalizado,
            pitchPersonalizado: cur.pitchPersonalizado,
            pitchGlobal: cur.pitchGlobal,
            bancoId: cur.bancoId,
            timbre: cur.timbre || 'Brillante',
        };

        try {
            const { data } = await supabase
                .from('sim_ajustes_usuario')
                .select('tonalidades_configuradas')
                .eq('usuario_id', usuarioId)
                .maybeSingle() as any;

            const nuevasTonalidades = {
                ...((data as any)?.tonalidades_configuradas || {}),
                [key]: configMusical
            };

            const { error } = await (supabase.from('sim_ajustes_usuario').upsert({
                usuario_id: usuarioId,
                tonalidad_activa: tonalidadSeleccionada,
                instrumento_id: instrumentoId,
                ajustes_visuales: disenoGlobal,
                tonalidades_configuradas: nuevasTonalidades,
                updated_at: new Date().toISOString()
            } as any) as any);

            if (error) throw error;

            // Espejo en localStorage del diseño visual: permite carga inmediata sin esperar a Supabase.
            localStorage.setItem('SIM_VISUAL_MASTER_V11', JSON.stringify({
                tamano: ajustes.tamano,
                x: ajustes.x,
                y: ajustes.y,
                pitosBotonTamano: ajustes.pitosBotonTamano,
                pitosFuenteTamano: ajustes.pitosFuenteTamano,
                bajosBotonTamano: ajustes.bajosBotonTamano,
                bajosFuenteTamano: ajustes.bajosFuenteTamano,
                teclasLeft: ajustes.teclasLeft,
                teclasTop: ajustes.teclasTop,
                bajosLeft: ajustes.bajosLeft,
                bajosTop: ajustes.bajosTop
            }));
        } catch (e) { }
    };

    const resetearAjustes = () => {
        localStorage.removeItem('SIM_VISUAL_MASTER_V11');
        setAjustes({
            tamano: '88vh', x: '50%', y: '50%',
            pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh',
            bajosBotonTamano: '4.2vh', bajosFuenteTamano: '1.3vh',
            teclasLeft: '5.05%', teclasTop: '13%',
            bajosLeft: '82.5%', bajosTop: '28%',
            mapeoPersonalizado: {}, pitchPersonalizado: {}, pitchGlobal: 0,
            bancoId: 'acordeon'
        });
    };

    const guardarNuevoSonidoVirtual = async (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante' | 'Armonizado') => {
        const nuevo: SonidoVirtual = { id: `custom_${Date.now()}`, nombre, rutaBase, pitch, tipo };
        const nuevaLista = [nuevo, ...sonidosVirtuales];
        setSonidosVirtuales(nuevaLista);

        // Nube (Única fuente de verdad persistente)
        if (usuarioId) {
            await (supabase.from('sim_ajustes_usuario').upsert({
                usuario_id: usuarioId,
                sonidos_personalizados: nuevaLista,
                updated_at: new Date().toISOString()
            } as any) as any);
        }

        return nuevo;
    };

    const actualizarNombreTonalidad = async (tonalidadId: string, nuevoNombre: string) => {
        setNombresTonalidades(prev => ({ ...prev, [tonalidadId]: nuevoNombre }));

        if (usuarioId) {
            try {
                const key = `ajustes_acordeon_vPRO_${tonalidadId}`;
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('tonalidades_configuradas')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle() as any;

                const nuevasConfigs = {
                    ...(data?.tonalidades_configuradas || {}),
                    [key]: {
                        ...(data?.tonalidades_configuradas?.[key] || {}),
                        nombrePersonalizado: nuevoNombre
                    }
                };

                await ((supabase.from('sim_ajustes_usuario') as any).update({
                    tonalidades_configuradas: nuevasConfigs,
                    updated_at: new Date().toISOString()
                } as any).eq('usuario_id', usuarioId) as any);
            } catch (e) { }
        }
    };

    useEffect(() => {
        if (!usuarioId || isInitialLoad.current || listaTonalidades.length === 0) return;
        // 1.5s debounce: permite reordenar varias veces antes de pegarle a Supabase.
        const timer = setTimeout(async () => {
            await ((supabase.from('sim_ajustes_usuario') as any).update({
                lista_tonalidades_activa: listaTonalidades,
                updated_at: new Date().toISOString()
            } as any).eq('usuario_id', usuarioId) as any);
        }, 1500);

        return () => clearTimeout(timer);
    }, [listaTonalidades, usuarioId]);

    useEffect(() => {
        const persistir = async () => {
            if (!usuarioId || listaTonalidades.length === 0) return;

            try {
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('tonalidades_configuradas')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle() as any;

                const configuracionesActuales = (data as any)?.tonalidades_configuradas || {};
                const siguientesConfiguraciones: Record<string, any> = { ...configuracionesActuales };

                listaTonalidades.forEach(tonalidadId => {
                    const key = `ajustes_acordeon_vPRO_${tonalidadId}`;
                    siguientesConfiguraciones[key] = {
                        ...(configuracionesActuales[key] || {}),
                        nombrePersonalizado: nombresTonalidades[tonalidadId] || null
                    };
                });

                const { error } = await supabase
                    .from('sim_ajustes_usuario')
                    .upsert({
                        usuario_id: usuarioId,
                        tonalidades_configuradas: siguientesConfiguraciones,
                        lista_tonalidades_activa: listaTonalidades,
                        updated_at: new Date().toISOString()
                    } as any, { onConflict: 'usuario_id' }) as any;
            } catch (error) { }
        };
        persistir();
    }, [nombresTonalidades, listaTonalidades, usuarioId]);

    const eliminarTonalidad = async (tonalidad: string) => {
        if (listaTonalidades.length <= 1) return;
        const nueva = listaTonalidades.filter(t => t !== tonalidad);

        setListaTonalidades(nueva);

        if (tonalidad === tonalidadSeleccionada) {
            setTonalidadSeleccionada(nueva[0]);
        }

        if (usuarioId) {
            try {
                const key = `ajustes_acordeon_vPRO_${tonalidad}`;

                const { data } = await (supabase
                    .from('sim_ajustes_usuario')
                    .select('tonalidades_configuradas')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle() as any);

                const nuevasConfigs = { ...((data as any)?.tonalidades_configuradas || {}) };
                delete nuevasConfigs[key];

                await ((supabase.from('sim_ajustes_usuario') as any).update({
                    tonalidades_configuradas: nuevasConfigs,
                    lista_tonalidades_activa: nueva,
                    updated_at: new Date().toISOString()
                } as any).eq('usuario_id', usuarioId) as any);
            } catch (e) { }
        }
    };

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

    return {
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
    };
};
