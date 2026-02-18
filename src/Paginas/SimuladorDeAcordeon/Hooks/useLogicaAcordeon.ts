import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/clienteSupabase';
import { motorAudioPro } from '../AudioEnginePro';
import { encontrarMejorMuestra, type Muestra } from '../UniversalSampler';
import { mapaTeclas, tono } from '../mapaTecladoYFrecuencias';
import {
    mapaTeclasBajos,
    TONALIDADES,
    cambiarFuelle
} from '../notasAcordeonDiatonico';
import { configuracionUsuario } from '../Datos/TonosUsuario';
import type { AjustesAcordeon, SonidoVirtual, ModoVista, AcordeonSimuladorProps } from '../TiposAcordeon';

const NOMBRES_INGLES: Record<string, string> = {
    'do': 'C', 'do#': 'Db', 'reb': 'Db', 're': 'D', 're#': 'Eb', 'mib': 'Eb', 'mi': 'E',
    'fa': 'F', 'fa#': 'Gb', 'solb': 'Gb', 'sol': 'G', 'sol#': 'Ab', 'lab': 'Ab', 'la': 'A', 'la#': 'Bb', 'sib': 'Bb', 'si': 'B'
};

const EXTRAER_NOTA_OCTAVA = (ruta: string) => {
    const filename = ruta.split('/').pop() || '';
    // Busca patrones como F-6 o Eb-4
    const match = filename.match(/([a-zA-Z#]+)-(\d+)/);
    if (match) {
        return { nota: match[1], octava: parseInt(match[2]) };
    }
    // Caso especial para Bajos: BajoC-3-cm.mp3
    if (filename.startsWith('Bajo')) {
        const notaMatch = filename.replace('Bajo', '').match(/([a-zA-Z#]+)/);
        const octMatch = filename.match(/-(\d+)-/);
        if (notaMatch) {
            return { nota: notaMatch[1], octava: octMatch ? parseInt(octMatch[1]) : 3 };
        }
    }
    return null;
};

const VOL_PITOS = 0.55;
const VOL_BAJOS = 0.35;
const FADE_OUT = 8; // ⚡ Sincronizado con AudioEnginePro V5 (8ms - mínimo sin click)



export const useLogicaAcordeon = (props: AcordeonSimuladorProps = {}) => {
    const {
        direccion: direccionProp = 'halar',
        deshabilitarInteraccion = false,
        onNotaPresionada,
        onNotaLiberada
    } = props;

    // --- 1. ESTADOS (Siempre al principio) ---
    const [instrumentoId, setInstrumentoId] = useState<string>('4e9f2a94-21c0-4029-872e-7cb1c314af69'); // Acordeón Original
    const [listaInstrumentos, setListaInstrumentos] = useState<any[]>([]);
    const [muestrasDB, setMuestrasDB] = useState<any[]>([]);
    const [muestrasLocalesDB, setMuestrasLocalesDB] = useState<Muestra[]>([]);
    const [cargandoCloud, setCargandoCloud] = useState(false);
    const [midiActivado, setMidiActivado] = useState(false);
    const [usuarioId, setUsuarioId] = useState<string | null>(null);
    const [samplesPitos, setSamplesPitos] = useState<string[]>([]);
    const [samplesBajos, setSamplesBajos] = useState<string[]>([]);

    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<ModoVista>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);
    const [botonSeleccionado, setBotonSeleccionado] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
    const [tonalidadSeleccionada, setTonalidadSeleccionada] = useState<string>('F-Bb-Eb');
    const [listaTonalidades, setListaTonalidades] = useState<string[]>([]);
    const [sonidosVirtuales, setSonidosVirtuales] = useState<SonidoVirtual[]>([]);

    // --- ESTADOS DE CONTROL DE CARGA Y VISIBILIDAD ---
    const [disenoCargado, setDisenoCargado] = useState(false);
    const isInitialLoad = useRef(true);

    // --- ESTADO PRINCIPAL DE DISEÑO CON CARGA INSTANTÁNEA (Lazy Initializer) ---
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
            // Intentamos recuperar el "Master Mirror" del diseño para carga inmediata
            const saved = localStorage.getItem('SIM_VISUAL_MASTER_V11'); // Incremento versión para limpieza
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validación de seguridad para evitar datos corruptos
                if (parsed.x && parsed.y) {
                    return { ...defaults, ...parsed };
                }
            }
        } catch (e) {
            console.warn('Error en carga inicial de localStorage:', e);
        }
        return defaults;
    });

    // --- 2. CALLBACKS Y EFECTOS ---
    const cargarMuestrasLocales = useCallback(async (manual = false) => {
        try {
            const res = await fetch('/muestrasLocales.json?t=' + Date.now());
            const data = await res.json();
            setSamplesPitos(data.pitos || []);
            setSamplesBajos(data.bajos || []);
            if (manual) {
                motorAudioPro.limpiarBanco(instrumentoId);
                alert(`✅ ¡Audios actualizados!\nSe encontraron ${data.pitos?.length || 0} pitos y ${data.bajos?.length || 0} bajos.`);
            }
        } catch (e) {
            console.warn('No se pudo cargar muestrasLocales.json');
        }
    }, [instrumentoId]);

    useEffect(() => {
        cargarMuestrasLocales();
    }, [cargarMuestrasLocales]);

    // Transformar nombres de archivos locales en objetos Muestra para el motor universal
    useEffect(() => {
        const mLocales: Muestra[] = [];

        // Procesar Pitos (Brillante)
        samplesPitos.forEach(file => {
            // Formato esperado: {Nota}-{Octava}-cm.mp3 (ej: C-4-cm.mp3)
            const parts = file.split('-');
            if (parts.length >= 2) {
                mLocales.push({
                    nota: parts[0],
                    octava: parseInt(parts[1]) || 4,
                    url_audio: `/audio/Muestras_Cromaticas/Brillante/${file}`
                });
            }
        });

        // Procesar Bajos
        samplesBajos.forEach(file => {
            // Formato esperado: Bajo{Nota}[-2][(acorde)]-cm.mp3
            let clean = file.replace('Bajo', '').replace('-cm.mp3', '');
            let octava = 3;
            if (clean.includes('-2')) {
                octava = 2;
                clean = clean.replace('-2', '');
            }

            // Los archivos (acorde) no se usan en el mapeo cromático individual
            if (clean.includes('(acorde)')) return;

            mLocales.push({
                nota: clean,
                octava,
                url_audio: `/audio/Muestras_Cromaticas/Bajos/${file}`
            });
        });

        setMuestrasLocalesDB(mLocales);
    }, [samplesPitos, samplesBajos]);

    // Activar AudioContext con el primer gesto del usuario
    useEffect(() => {
        const activarAudio = async () => {
            console.log("🔊 Intentando activar audio...");
            await motorAudioPro.activarContexto();
            window.removeEventListener('click', activarAudio);
            window.removeEventListener('keydown', activarAudio);
            window.removeEventListener('touchstart', activarAudio);
        };
        window.addEventListener('click', activarAudio);
        window.addEventListener('keydown', activarAudio);
        window.addEventListener('touchstart', activarAudio);
        return () => {
            window.removeEventListener('click', activarAudio);
            window.removeEventListener('keydown', activarAudio);
            window.removeEventListener('touchstart', activarAudio);
        };
    }, []);

    // 🚩 Referencia maestra para sincronizar con estados
    const ajustesRef = useRef(ajustes);
    useEffect(() => { ajustesRef.current = ajustes; }, [ajustes]);

    // --- REFS ---
    const botonesActivosRef = useRef<Record<string, any>>({});
    const soundsPerKeyRef = useRef<Record<string, string[]>>({});
    const basePitchesRef = useRef<Record<string, number>>({});
    const teclasFastMapRef = useRef<Record<string, any>>({});
    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);
    const previewNodeRef = useRef<any>(null);

    // --- CARGA INTEGRADA DE SUPABASE ---
    useEffect(() => {
        const checkUserAndLoad = async () => {
            // Cargar lista de instrumentos siempre
            const { data: instData } = await supabase.from('sim_instrumentos').select('*');
            if (instData) setListaInstrumentos(instData);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUsuarioId(user.id);

                // Cargar TODO el registro del usuario en un solo paso inicial
                const { data: ajustesData } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .maybeSingle();

                if (ajustesData) {
                    if (ajustesData.instrumento_id) setInstrumentoId(ajustesData.instrumento_id);
                    if (ajustesData.sonidos_personalizados) setSonidosVirtuales(ajustesData.sonidos_personalizados);

                    // Sincronizar lista de tonalidades
                    const guardadas = ajustesData.lista_tonalidades_activa || [];
                    const disponibles = Object.keys(TONALIDADES);
                    const listaFinal = Array.from(new Set([...guardadas, ...disponibles]));
                    setListaTonalidades(listaFinal);

                    // 🏁 ESTABLECER TONALIDAD ACTIVA (esto disparará cargarSpecificos con el usuario ya listo)
                    if (ajustesData.tonalidad_activa) {
                        setTonalidadSeleccionada(ajustesData.tonalidad_activa);
                    }
                } else {
                    setSonidosVirtuales(configuracionUsuario.sonidosVirtuales as SonidoVirtual[] || []);
                    setListaTonalidades(Object.keys(TONALIDADES));
                }
            } else {
                setSonidosVirtuales(configuracionUsuario.sonidosVirtuales as SonidoVirtual[] || []);
                setListaTonalidades(Object.keys(TONALIDADES));
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
                    .eq('instrumento_id', instrumentoId);

                if (error) throw error;
                setMuestrasDB(data || []);

                // Limpiar caché de sonidos para forzar recarga con el nuevo instrumento
                motorAudioPro.limpiarBanco(instrumentoId);
                soundsPerKeyRef.current = {};

            } catch (e) {
                console.warn('Error cargando muestras desde Supabase:', e);
            } finally {
                setCargandoCloud(false);
            }
        };
        cargarMuestras();
    }, [instrumentoId]);

    const obtenerOctava = (nombre: string, freq: number) => {
        // Normalizar nombre para búsqueda en tabla maestra
        const n = nombre.toLowerCase()
            .replace('do#', 'reb')
            .replace('re#', 'mib')
            .replace('fa#', 'solb')
            .replace('sol#', 'lab')
            .replace('la#', 'sib');

        const claveOriginal = Object.keys(tono).find(k => k.toLowerCase() === n) || 'Do';
        const freqs = (tono as any)[claveOriginal];

        // Buscamos el índice que tenga la frecuencia más cercana para determinar la octava real
        let mejorIdx = 4;
        let minDiff = Infinity;

        freqs.forEach((f: number, idx: number) => {
            const diff = Math.abs(f - freq);
            if (diff < minDiff) {
                minDiff = diff;
                mejorIdx = idx;
            }
        });

        return mejorIdx;
    };

    const encontrarMejorOctava = (nota: string, octavaDeseada: number) => {
        const existentes: Record<string, number[]> = {
            'A': [4, 5], 'Ab': [4, 5, 6], 'B': [4], 'Bb': [3, 4, 5, 6],
            'C': [4, 5, 6, 7], 'D': [4, 5, 6], 'Db': [5, 6], 'E': [4, 5],
            'Eb': [4, 5, 6], 'F': [4, 5, 6], 'G': [4, 5, 6], 'Gb': [4, 5]
        };
        const disponibles = existentes[nota] || [4];
        const candidatos = [octavaDeseada, octavaDeseada - 1, octavaDeseada + 1, octavaDeseada - 2, octavaDeseada + 2, 4];
        for (const c of candidatos) {
            if (disponibles.includes(c)) return c;
        }
        return disponibles[0];
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

        // --- 1. DETERMINAR QUÉ NOTA DEBE SONAR (Mapeo Manual o Definición) ---
        let notaTarget = btn.nombre;
        let octavaTarget = obtenerOctava(btn.nombre, btn.frecuencia as number);

        // Si hay un mapeo manual, lo usamos para definir qué nota buscar en otros instrumentos
        if (map[idBoton] && map[idBoton].length > 0) {
            const infoManual = EXTRAER_NOTA_OCTAVA(map[idBoton][0]);
            if (infoManual) {
                notaTarget = infoManual.nota;
                octavaTarget = infoManual.octava;
            }
        }

        // --- 2. PRIORIDAD: INSTRUMENTO PERSONALIZADO (Supabase) ---
        if (!esAcordeonOriginal && muestrasDB && muestrasDB.length > 0) {
            const filtrarMuestras = muestrasDB.filter(m => esBajo ? m.tipo === 'bajos' : m.tipo === 'pitos');
            if (filtrarMuestras.length > 0) {
                const nEng = NOMBRES_INGLES[notaTarget.toLowerCase()] || notaTarget;
                const best = encontrarMejorMuestra(nEng, octavaTarget, filtrarMuestras);
                if (best) return [`pitch:${best.pitch}|${best.url}`];
            }
        }

        // --- 3. FALLBACK: ACORDEÓN ORIGINAL (Solo si es el activo) ---
        if (esAcordeonOriginal) {
            if (map[idBoton]) return map[idBoton];

            if (muestrasLocalesDB.length > 0) {
                const filtrarLocales = muestrasLocalesDB.filter((m: Muestra) =>
                    esBajo ? m.url_audio.includes('Bajos') : m.url_audio.includes('Brillante')
                );
                const nEng = NOMBRES_INGLES[notaTarget.toLowerCase()] || notaTarget;
                const best = encontrarMejorMuestra(nEng, octavaTarget, filtrarLocales);
                if (best) return [`pitch:${best.pitch}|${best.url}`];
            }
        }

        return [];
    }, [muestrasDB, muestrasLocalesDB, instrumentoId]);

    // --- AUDIO ---
    const detenerTono = useCallback((id: string) => {
        const b = botonesActivosRef.current[id];
        if (!b?.instances) return;

        b.instances.forEach((inst: any) => {
            motorAudioPro.detener(inst, FADE_OUT / 1000); // Sincronizado con el motor pro
        });
    }, []);

    const reproducirTono = useCallback((id: string) => {
        const rawRutas = soundsPerKeyRef.current[id] || obtenerRutasAudio(id);
        if (rawRutas.length === 0) return { instances: [] };

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
            return motorAudioPro.reproducir(ruta, instrumentoId, volume, globalPitch + userPitch + pitchBase);
        }).filter(Boolean);

        return { instances: instances as any[] };
    }, [obtenerRutasAudio]);

    const stopPreview = useCallback(() => {
        if (previewNodeRef.current) {
            try {
                const { fuente, ganancia } = previewNodeRef.current;
                const ahora = motorAudioPro.tiempoActual;
                ganancia.gain.cancelScheduledValues(ahora);
                ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.1);
                fuente.stop(ahora + 0.15);
                setTimeout(() => { try { ganancia.disconnect(); } catch (e) { } }, 200);
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

    /**
     * @param silencioso Si es true, no dispara el estado de React (evita re-renders). 
     * Útil para trinos extremos donde el componente maneja su propia visual.
     */
    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add', instanciasExternas: any[] | null = null, silencioso: boolean = false) => {
        if (deshabilitarRef.current) return;

        if (accion === 'add') {
            // Detenemos cualquier rastro previo para evitar notas pegadas
            if (botonesActivosRef.current[id]) detenerTono(id);

            let instances = instanciasExternas || reproducirTono(id).instances;
            if (!instances || instances.length === 0) return;

            // 🚀 OPTIMIZACIÓN DE TRINOS: Si es silencioso, mutamos directamente para evitar Garbage Collection masiva
            if (silencioso) {
                botonesActivosRef.current[id] = { instances, ...mapaBotonesActual.current[id] };
            } else {
                const newState = { ...botonesActivosRef.current, [id]: { instances, ...mapaBotonesActual.current[id] } };
                botonesActivosRef.current = newState;
                setBotonesActivos(newState);
            }

            onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            detenerTono(id);

            if (silencioso) {
                delete botonesActivosRef.current[id];
            } else {
                const newState = { ...botonesActivosRef.current };
                delete newState[id];
                botonesActivosRef.current = newState;
                setBotonesActivos(newState);
            }

            onNotaLiberada?.({ idBoton: id, nombre: id });
        }
    }, [onNotaPresionada, onNotaLiberada, reproducirTono, detenerTono]);

    const limpiarTodasLasNotas = useCallback(() => {
        Object.keys(botonesActivosRef.current).forEach(id => detenerTono(id));
        botonesActivosRef.current = {};
        setBotonesActivos({});
    }, [detenerTono]);

    const manejarEventoTeclado = useCallback((e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;

        // 🚫 NO INTERFERIR SI EL USUARIO ESTÁ ESCRIBIENDO EN UN INPUT
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const tecla = e.key.toLowerCase();

        if (tecla === cambiarFuelle) {
            const nuevaDireccion = esPresionada ? 'empujar' : 'halar';
            if (nuevaDireccion !== direccionRef.current) {
                const prev = { ...botonesActivosRef.current };
                setDireccion(nuevaDireccion);
                direccionRef.current = nuevaDireccion;
                const next: Record<string, any> = {};
                Object.keys(prev).forEach(oldId => {
                    const parts = oldId.split('-');
                    const esBajo = oldId.includes('bajo');
                    const newId = `${parts[0]}-${parts[1]}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;
                    const { instances } = reproducirTono(newId);
                    if (instances && instances.length > 0) next[newId] = { instances, ...mapaBotonesActual.current[newId] };
                    detenerTono(oldId);
                });
                botonesActivosRef.current = next;
                setBotonesActivos(next);
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
    }, [actualizarBotonActivo, reproducirTono, detenerTono, modoAjuste, botonSeleccionado]);

    // --- EFECTOS DE SINCRONIZACIÓN ---
    useEffect(() => {
        const nuevaDireccion = direccion;
        if (nuevaDireccion !== direccionRef.current) {
            // 🔄 SWAP DE NOTAS ACTIVAS: Si hay notas sonando, las cambiamos a la nueva dirección
            const prev = { ...botonesActivosRef.current };
            const next: Record<string, any> = {};

            Object.keys(prev).forEach(oldId => {
                const parts = oldId.split('-');
                const esBajo = oldId.includes('bajo');
                // Construimos el nuevo ID manteniendo fila y columna pero cambiando dirección
                const newId = `${parts[0]}-${parts[1]}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;

                const { instances } = reproducirTono(newId);
                if (instances && instances.length > 0) {
                    next[newId] = { instances, ...mapaBotonesActual.current[newId] };
                }
                detenerTono(oldId);
            });

            botonesActivosRef.current = next;
            setBotonesActivos(next);
            direccionRef.current = nuevaDireccion;
        }
    }, [direccion, reproducirTono, detenerTono]);

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

    // Cargar ajustes por tonalidad (de Supabase o Local)
    // --- 3. CARGA DE CONFIGURACIÓN (Supabase) ---
    useEffect(() => {
        const mappingKey = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;

        const cargarTodo = async () => {
            if (usuarioId === null) return;
            // Carga totalmente silenciosa
            try {
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('ajustes_visuales, tonalidades_configuradas, instrumento_id')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                // 1. Cargamos el Diseño Global (Si existe)
                const disenoGlobalNube = data?.ajustes_visuales || {};
                const rawConfigMusical = data?.tonalidades_configuradas?.[mappingKey] || {};

                const configMusical: Partial<AjustesAcordeon> = {
                    mapeoPersonalizado: rawConfigMusical.mapeoPersonalizado,
                    pitchPersonalizado: rawConfigMusical.pitchPersonalizado,
                    pitchGlobal: rawConfigMusical.pitchGlobal,
                };

                // 🏗️ CONSTRUCCIÓN INTELIGENTE:
                // Priorizamos lo que el usuario YA tiene en pantalla (ajustesRef.current)
                // Solo usamos lo de la nube si el usuario no ha movido nada o es la carga inicial
                const ajustesFinales: AjustesAcordeon = {
                    ...ajustesRef.current, // Lo que ya ves en pantalla
                    ...configMusical,      // Notas musicales del nuevo tono
                };

                // Si es la carga inicial, o si el usuario no ha movido el acordeón, aplicamos el diseño de la nube.
                // Esto evita el "salto asqueroso" si el usuario ya ha movido el acordeón y luego cambia de tonalidad.
                if (isInitialLoad.current || (ajustesRef.current.x === '50%' && ajustesRef.current.y === '50%')) {
                    Object.assign(ajustesFinales, disenoGlobalNube);
                }

                // 🛑 FILTRO FINAL: Si por algún error la nube trae el valor "maldito" de 53.5%, lo corregimos al 50%
                if (ajustesFinales.x === '53.5%') ajustesFinales.x = '50%';

                setAjustes(ajustesFinales);
                ajustesRef.current = ajustesFinales;

                // Una vez que tenemos los datos de la nube, el diseño es oficial y "limpio"
                setDisenoCargado(true);
                isInitialLoad.current = false; // Ya no es la carga inicial

                if (data?.instrumento_id) setInstrumentoId(data.instrumento_id);

            } catch (e) {
                console.error('Error cargando ajustes:', e);
            }
        };

        cargarTodo();
    }, [tonalidadSeleccionada, usuarioId]);

    // Precarga de sonidos
    useEffect(() => {
        motorAudioPro.limpiarBanco(instrumentoId);
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
                // LLAMAMOS DIRECTAMENTE a obtenerRutasAudio para usar la protección anti-mezcla
                let rutas = obtenerRutasAudio(id);
                if (rutas.length > 0) {
                    soundsPerKeyRef.current[id] = rutas;
                    rutas.forEach(rRaw => {
                        const r = rRaw.startsWith('pitch:') ? rRaw.split('|')[1] : rRaw;
                        // Forzamos que la ruta sea absoluta para evitar errores de carga
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
    }, [ajustes, tonalidadSeleccionada, obtenerRutasAudio, muestrasDB, instrumentoId]);

    // --- MIDI ENGINE ---
    useEffect(() => {
        if (!navigator.requestMIDIAccess) return;

        let midiAccess: any = null;
        const midiToButtonMap: Record<number, string> = {}; // Cache de mapeo dinámico

        const onMIDIMessage = (msg: any) => {
            const [status, note, velocity] = msg.data;
            const command = status & 0xf0;
            const channel = status & 0x0f;

            // --- 🚨 DETERMINAR ID DEL BOTÓN (Mapeo de Espejo Secuencial) ---
            // Este mapeo asume una secuencia lógica común en acordeones MIDI:
            // Hilera 1 (Afuera): Notas 60-69
            // Hilera 2 (Medio): Notas 70-80
            // Hilera 3 (Adentro): Notas 81-91

            let idBoton: string | null = null;

            if (channel === 0) { // Canal MIDI 1 (Pitos)
                // Hilera 1: 10 botones (Mapeo: MIDI 60 -> 1-1)
                if (note >= 60 && note <= 69) {
                    idBoton = `1-${note - 59}-${direccion}`;
                }
                // Hilera 2: 11 botones (Mapeo: MIDI 70 -> 2-1)
                else if (note >= 70 && note <= 80) {
                    idBoton = `2-${note - 69}-${direccion}`;
                }
                // Hilera 3: 10 botones (Mapeo: MIDI 81 && note <= 90)
                else if (note >= 81 && note <= 90) {
                    idBoton = `3-${note - 80}-${direccion}`;
                }

                // Log para calibración técnica: 
                // "Brother, si presionas una tecla y no suena, abre la consola y dime qué número sale aquí"
                console.log(`MIDI Pitos -> Nota: ${note}, Canal: ${channel}, ID Sugerido: ${idBoton}`);
            }
            else if (channel === 1 || channel === 2) { // Bajos
                // Mapeo de bajos secuencial
                const bajoIndex = (note % 12) + 1;
                idBoton = `${channel === 1 ? '1' : '2'}-${bajoIndex}-${direccion}-bajo`;
                console.log(`MIDI Bajos -> Nota: ${note}, Canal: ${channel}, ID Sugerido: ${idBoton}`);
            }

            // Note ON
            if (command === 144 && velocity > 0 && idBoton) {
                reproducirTono(idBoton);
                actualizarBotonActivo(idBoton, 'add');
            }
            // Note OFF
            if ((command === 128 || (command === 144 && velocity === 0)) && idBoton) {
                detenerTono(idBoton);
                actualizarBotonActivo(idBoton, 'remove');
            }

            // Fuelle (Control Change)
            if (command === 176 && (note === 11 || note === 1)) {
                const nuevaDir = velocity > 64 ? 'halar' : 'empujar';
                if (nuevaDir !== direccion) setDireccion(nuevaDir);
            }
        };

        navigator.requestMIDIAccess().then((access) => {
            midiAccess = access;
            setMidiActivado(true);
            access.inputs.forEach((input) => {
                input.onmidimessage = onMIDIMessage;
            });
        }).catch(() => setMidiActivado(false));

        return () => {
            if (midiAccess) {
                midiAccess.inputs.forEach((input: any) => {
                    input.onmidimessage = null;
                });
            }
        };
    }, [direccion, reproducirTono, detenerTono, actualizarBotonActivo]);

    // --- ACCIONES ---
    const guardarAjustes = async () => {
        if (!usuarioId) return;

        const key = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;
        const cur = ajustesRef.current;

        // Separación de responsabilidades:
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
            bancoId: cur.bancoId
        };

        try {
            const { data } = await supabase
                .from('sim_ajustes_usuario')
                .select('tonalidades_configuradas')
                .eq('usuario_id', usuarioId)
                .maybeSingle();

            const nuevasTonalidades = {
                ...(data?.tonalidades_configuradas || {}),
                [key]: configMusical // Solo guardamos la parte musical aquí
            };

            const { error } = await supabase.from('sim_ajustes_usuario').upsert({
                usuario_id: usuarioId,
                tonalidad_activa: tonalidadSeleccionada,
                instrumento_id: instrumentoId,
                ajustes_visuales: disenoGlobal,
                tonalidades_configuradas: nuevasTonalidades,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            // 🪞 Guardamos una copia "espejo" del diseño visual para carga inmediata en el próximo refresh
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

            console.log('✨ Sincronización Global Exitosa');
        } catch (e) {
            console.error('Error en guardado:', e);
        }
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

    const guardarNuevoSonidoVirtual = async (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante') => {
        const nuevo: SonidoVirtual = { id: `custom_${Date.now()}`, nombre, rutaBase, pitch, tipo };
        const nuevaLista = [nuevo, ...sonidosVirtuales];
        setSonidosVirtuales(nuevaLista);

        // Nube (Única fuente de verdad persistente)
        if (usuarioId) {
            await supabase.from('sim_ajustes_usuario').upsert({
                usuario_id: usuarioId,
                sonidos_personalizados: nuevaLista,
                updated_at: new Date().toISOString()
            });
        }

        return nuevo;
    };

    const eliminarTonalidad = async (tonalidad: string) => {
        if (listaTonalidades.length <= 1) return alert('Debe conservar al menos una tonalidad.');
        if (confirm(`¿Eliminar configuración y acceso a la tonalidad ${tonalidad}?`)) {
            const nueva = listaTonalidades.filter(t => t !== tonalidad);
            setListaTonalidades(nueva);

            const key = `ajustes_acordeon_vPRO_${tonalidad}`;

            if (tonalidad === tonalidadSeleccionada) setTonalidadSeleccionada(nueva[0]);

            // Sincronizar en la nube (eliminar la entrada del JSON)
            if (usuarioId) {
                try {
                    const { data } = await supabase
                        .from('sim_ajustes_usuario')
                        .select('tonalidades_configuradas')
                        .eq('usuario_id', usuarioId)
                        .maybeSingle();

                    if (data?.tonalidades_configuradas) {
                        const nuevasConfigs = { ...data.tonalidades_configuradas };
                        delete nuevasConfigs[key];

                        await supabase.from('sim_ajustes_usuario').update({
                            tonalidades_configuradas: nuevasConfigs,
                            lista_tonalidades_activa: nueva,
                            updated_at: new Date().toISOString()
                        }).eq('usuario_id', usuarioId);
                    }
                } catch (e) {
                    console.error('Error al eliminar tonalidad en la nube:', e);
                }
            }
        }
    };

    return {
        botonesActivos, direccion, setDireccion, modoAjuste, setModoAjuste, modoVista, setModoVista,
        vistaDoble, setVistaDoble, ajustes, setAjustes, botonSeleccionado, setBotonSeleccionado,
        pestanaActiva, setPestanaActiva, tonalidadSeleccionada, setTonalidadSeleccionada,
        listaTonalidades, setListaTonalidades, sonidosVirtuales, setSonidosVirtuales,
        limpiarTodasLasNotas, actualizarBotonActivo, guardarAjustes, resetearAjustes,
        guardarNuevoSonidoVirtual, eliminarTonalidad, playPreview, stopPreview, reproduceTono: reproducirTono,
        configTonalidad, samplesBrillante: samplesPitos, samplesBajos: samplesBajos,
        sincronizarAudios: cargarMuestrasLocales,
        mapaBotonesActual: mapaBotonesActual.current, teclasFastMap: teclasFastMapRef.current,
        soundsPerKey: soundsPerKeyRef.current,
        basePitch: basePitchesRef.current,
        muestrasDB, obtenerRutasAudio,
        instrumentoId, setInstrumentoId, listaInstrumentos,
        cargando: cargandoCloud,
        midiActivado, disenoCargado
    };
};
