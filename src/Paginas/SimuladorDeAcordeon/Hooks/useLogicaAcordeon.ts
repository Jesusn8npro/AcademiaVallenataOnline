import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/clienteSupabase';
import { motorAudio } from '../AudioEngine';
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

const VOL_PITOS = 0.55;
const VOL_BAJOS = 0.35;
const FADE_OUT = 20; // Reducido para respuesta instantánea



export const useLogicaAcordeon = (props: AcordeonSimuladorProps) => {
    const {
        direccion: direccionProp = 'halar',
        deshabilitarInteraccion = false,
        onNotaPresionada,
        onNotaLiberada
    } = props;

    const [samplesPitos, setSamplesPitos] = useState<string[]>([]);
    const [samplesBajos, setSamplesBajos] = useState<string[]>([]);

    const cargarMuestrasLocales = useCallback(async (manual = false) => {
        try {
            const res = await fetch('/muestrasLocales.json?t=' + Date.now());
            const data = await res.json();
            setSamplesPitos(data.pitos || []);
            setSamplesBajos(data.bajos || []);
            if (manual) {
                motorAudio.limpiar();
                alert(`✅ ¡Audios actualizados!\nSe encontraron ${data.pitos?.length || 0} pitos y ${data.bajos?.length || 0} bajos.`);
            }
        } catch (e) {
            console.warn('No se pudo cargar muestrasLocales.json');
        }
    }, []);

    useEffect(() => {
        cargarMuestrasLocales();
    }, [cargarMuestrasLocales]);

    // --- ESTADOS NUBE/SAMPLER ---
    const [instrumentoId, setInstrumentoId] = useState<string>('e0586623-722d-4770-bce4-e01ab4009ec9'); // Acordeón original V-PRO
    const [muestrasDB, setMuestrasDB] = useState<any[]>([]);
    const [muestrasLocalesDB, setMuestrasLocalesDB] = useState<Muestra[]>([]);
    const [cargandoCloud, setCargandoCloud] = useState(false);
    const [usuarioId, setUsuarioId] = useState<string | null>(null);

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
        const resumeAudio = () => {
            motorAudio.resume();
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
        };
        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
        return () => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
        };
    }, []);

    // --- ESTADOS UI ---
    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<ModoVista>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);
    const [botonSeleccionado, setBotonSeleccionado] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
    const [tonalidadSeleccionada, setTonalidadSeleccionada] = useState<string>('F-Bb-Eb');
    const [listaTonalidades, setListaTonalidades] = useState<string[]>([]);

    const [ajustes, setAjustes] = useState<AjustesAcordeon>({
        tamano: '82vh',
        x: '53.5%',
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
        pitchPersonalizado: {}
    });

    const [sonidosVirtuales, setSonidosVirtuales] = useState<SonidoVirtual[]>([]);

    // --- REFS ---
    const botonesActivosRef = useRef<Record<string, any>>({});
    const soundsPerKeyRef = useRef<Record<string, string[]>>({});
    const basePitchesRef = useRef<Record<string, number>>({});
    const teclasFastMapRef = useRef<Record<string, any>>({});
    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);
    const ajustesRef = useRef(ajustes);
    const previewNodeRef = useRef<any>(null);

    // --- CARGA DE SUPABASE ---
    useEffect(() => {
        const checkUserAndLoad = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUsuarioId(user.id);
                // Cargar ajustes del usuario
                const { data: ajustesData } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .maybeSingle();

                if (ajustesData) {
                    if (ajustesData.tonalidad_activa) setTonalidadSeleccionada(ajustesData.tonalidad_activa);
                    if (ajustesData.instrumento_id) setInstrumentoId(ajustesData.instrumento_id);
                    if (ajustesData.sonidos_personalizados) setSonidosVirtuales(ajustesData.sonidos_personalizados);

                    // Cargar lista de tonalidades persistente y mezclar con nuevas disponibles
                    const guardadas = ajustesData.lista_tonalidades_activa || [];
                    const disponibles = Object.keys(TONALIDADES);

                    // Unir ambas listas sin duplicados para asegurar que aparezcan las nuevas (como ADG)
                    const listaFinal = Array.from(new Set([...guardadas, ...disponibles]));
                    setListaTonalidades(listaFinal);
                } else {
                    setListaTonalidades(Object.keys(TONALIDADES));
                }
            } else {
                // Fallback local
                const guardados = JSON.parse(localStorage.getItem('sonidos_virtuales_acordeon') || '[]');
                setSonidosVirtuales(guardados.length > 0 ? guardados : (configuracionUsuario.sonidosVirtuales as SonidoVirtual[] || []));

                // Cargar lista local de tonalidades
                const keysLocales = Object.keys(localStorage)
                    .filter(k => k.startsWith('ajustes_acordeon_vPRO_'))
                    .map(k => k.replace('ajustes_acordeon_vPRO_', ''));

                setListaTonalidades(keysLocales.length > 0 ? keysLocales : Object.keys(TONALIDADES));
            }
        };
        checkUserAndLoad();
    }, []);

    useEffect(() => {
        const cargarMuestras = async () => {
            if (!instrumentoId) return;
            setCargandoCloud(true);
            try {
                const { data } = await supabase
                    .from('sim_muestras')
                    .select('*')
                    .eq('instrumento_id', instrumentoId);
                if (data) setMuestrasDB(data);
            } catch (e) {
                console.warn('Error cargando muestras desde Supabase, usando locales.');
            } finally {
                setCargandoCloud(false);
            }
        };
        cargarMuestras();
    }, [instrumentoId]);

    // --- UTILIDADES ---
    const obtenerOctava = (nombre: string, freq: number) => {
        const n = nombre.toLowerCase();
        const claveOriginal = Object.keys(tono).find(k => k.toLowerCase() === n);
        if (!claveOriginal) return 4;
        const freqs = (tono as any)[claveOriginal];
        const idx = freqs.findIndex((f: number) => Math.abs(f - freq) < 1.5);
        return idx !== -1 ? idx : 4;
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

    const obtenerRutasAudio = useCallback((id: string, ajustesOverride?: AjustesAcordeon) => {
        const map = (ajustesOverride || ajustesRef.current).mapeoPersonalizado || {};
        if (map[id]) return map[id];

        const btn = mapaBotonesActual.current[id];
        if (!btn) return [];

        const esBajo = id.includes('bajo');

        // --- LÓGICA UNIVERSAL SAMPLER (Prioridad Supabase) ---
        if (muestrasDB.length > 0) {
            const filtrarMuestras = muestrasDB.filter(m => esBajo ? m.tipo === 'bajos' : m.tipo === 'pitos');

            if (Array.isArray(btn.frecuencia)) {
                // Acordes de bajos - necesitamos múltiples muestras o una muestra de acorde
                const nombreLower = btn.nombre.toLowerCase();
                const notaBase = nombreLower.includes('sol') ? 'G' : nombreLower.includes('re') ? 'D' : nombreLower.includes('do') ? 'C' : nombreLower.includes('fa') ? 'F' : nombreLower.includes('si') ? 'Bb' : nombreLower.includes('mi') ? 'Eb' : nombreLower.includes('la') ? 'Ab' : 'C';

                // Buscar si existe un acorde grabado directamente
                const mAcorde = filtrarMuestras.find(m => m.url_audio.toLowerCase().includes(`${notaBase.toLowerCase()}(acorde)`));
                if (mAcorde) return [`pitch:0|${mAcorde.url_audio}`];

                // Si no, construirlo nota por nota del sampler
                const rutas: string[] = [];
                btn.nombre.split(' ').forEach((nRaw: string) => {
                    const n = nRaw.toLowerCase();
                    const nEng = NOMBRES_INGLES[n] || 'C';
                    const best = encontrarMejorMuestra(nEng, 3, filtrarMuestras);
                    if (best) rutas.push(`pitch:${best.pitch}|${best.url}`);
                });
                return rutas;
            } else {
                const n = btn.nombre.toLowerCase();
                const nEng = NOMBRES_INGLES[n] || 'C';
                const oct = obtenerOctava(btn.nombre, btn.frecuencia);
                const best = encontrarMejorMuestra(nEng, oct, filtrarMuestras);
                if (best) return [`pitch:${best.pitch}|${best.url}`];
            }
        }

        // --- FALLBACK LOCAL INTELIGENTE ---
        const rutas: string[] = [];
        const samplesLocalesCompatibles = esBajo ? samplesBajos : samplesPitos;
        const filtrarMuestrasLocales = muestrasLocalesDB.filter(m => esBajo ? m.url_audio.includes('/Bajos/') : m.url_audio.includes('/Brillante/'));

        if (Array.isArray(btn.frecuencia)) {
            // Lógica para acordes de bajos
            const nombreLower = btn.nombre.toLowerCase();
            const notaBase = nombreLower.includes('sol') ? 'G' : nombreLower.includes('re') ? 'D' : nombreLower.includes('do') ? 'C' : nombreLower.includes('fa') ? 'F' : nombreLower.includes('si') ? 'Bb' : nombreLower.includes('mi') ? 'Eb' : nombreLower.includes('la') ? 'Ab' : 'C';

            const esMenor = nombreLower.includes('menor');
            const fileSuffix = esMenor ? 'm(acorde)-cm.mp3' : '(acorde)-cm.mp3';
            const fileNameBajo = `Bajo${notaBase}${fileSuffix}`;

            // Verificar si el archivo exacto existe en la lista local
            if (samplesLocalesCompatibles.includes(fileNameBajo)) {
                rutas.push(`/audio/Muestras_Cromaticas/Bajos/${fileNameBajo}`);
            } else {
                // Si no hay acorde pregrabado, usar el sampler local para construirlo
                btn.nombre.split(' ').forEach((nRaw: string) => {
                    const n = nRaw.toLowerCase();
                    const nEng = NOMBRES_INGLES[n] || 'C';
                    const best = encontrarMejorMuestra(nEng, 3, filtrarMuestrasLocales);
                    if (best) rutas.push(`pitch:${best.pitch}|${best.url}`);
                });
            }
        } else {
            // Lógica para notas individuales (Pitos o Bajos simples)
            const n = btn.nombre.toLowerCase();
            const nEng = NOMBRES_INGLES[n] || 'C';
            const oct = esBajo ? 3 : obtenerOctava(btn.nombre, btn.frecuencia);

            const best = encontrarMejorMuestra(nEng, oct, filtrarMuestrasLocales);
            if (best) {
                rutas.push(`pitch:${best.pitch}|${best.url}`);
            }
        }

        return rutas;
    }, [muestrasDB]);

    // --- AUDIO ---
    const detenerTono = useCallback((id: string) => {
        const b = botonesActivosRef.current[id];
        if (!b?.instances) return;

        b.instances.forEach((inst: any) => {
            try {
                const { source, gain } = inst;
                const now = gain.context.currentTime;
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + (FADE_OUT / 1000));
                source.stop(now + (FADE_OUT / 1000) + 0.01);
            } catch (e) { }
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
            return motorAudio.reproducir(ruta, volume, userPitch + pitchBase);
        }).filter(Boolean);

        return { instances: instances as any[] };
    }, [obtenerRutasAudio]);

    const stopPreview = useCallback(() => {
        if (previewNodeRef.current) {
            try {
                const { source, gain } = previewNodeRef.current;
                const now = gain.context.currentTime;
                gain.gain.cancelScheduledValues(now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                source.stop(now + 0.15);
                setTimeout(() => { try { gain.disconnect(); } catch (e) { } }, 200);
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
        const instance = motorAudio.reproducir(ruta, 0.6, pitch + pBase, loop);
        if (instance) {
            previewNodeRef.current = instance;
            instance.source.onended = () => {
                if (previewNodeRef.current === instance) previewNodeRef.current = null;
            };
        }
    }, [stopPreview]);

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add', instanciasExternas: any[] | null = null) => {
        if (deshabilitarRef.current) return;

        if (accion === 'add') {
            // Detenemos cualquier rastro previo para evitar notas pegadas y permitir re-disparar con un solo clic
            if (botonesActivosRef.current[id]) detenerTono(id);

            let instances = instanciasExternas || reproducirTono(id).instances;
            if (!instances || instances.length === 0) return;

            const newState = { ...botonesActivosRef.current, [id]: { instances, ...mapaBotonesActual.current[id] } };
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
            onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            detenerTono(id);
            const newState = { ...botonesActivosRef.current };
            delete newState[id];
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
            onNotaLiberada?.({ idBoton: id, nombre: id });
        }
    }, [modoAjuste, onNotaPresionada, onNotaLiberada, reproducirTono, detenerTono]);

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

                // Sincronizar selección con el cambio de fuelle
                if (botonSeleccionado) {
                    const parts = botonSeleccionado.split('-');
                    const esBajo = botonSeleccionado.includes('bajo');
                    const newSel = `${parts[0]}-${parts[1]}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;
                    setBotonSeleccionado(newSel);
                }
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
                    return motorAudio.reproducir(r, vol, userPitch + pBase);
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
    useEffect(() => { direccionRef.current = direccion; }, [direccion]);
    useEffect(() => { deshabilitarRef.current = deshabilitarInteraccion; }, [deshabilitarInteraccion]);
    useEffect(() => { ajustesRef.current = ajustes; }, [ajustes]);
    useEffect(() => { botonesActivosRef.current = botonesActivos; }, [botonesActivos]);
    useEffect(() => { if (direccionProp !== direccion) setDireccion(direccionProp); }, [direccionProp]);

    useEffect(() => {
        const handleInteraction = () => {
            motorAudio.resume();
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
    useEffect(() => {
        const mappingKey = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;

        const cargarSpecificos = async () => {
            if (usuarioId) {
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('tonalidades_configuradas')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                if (data?.tonalidades_configuradas?.[mappingKey]) {
                    setAjustes(data.tonalidades_configuradas[mappingKey]);
                    return;
                }
            }

            // Fallback localStorage
            const guardados = localStorage.getItem(mappingKey);
            if (guardados) {
                try {
                    setAjustes(JSON.parse(guardados));
                } catch {
                    setAjustes(prev => ({ ...prev, mapeoPersonalizado: {} }));
                }
            } else {
                const defaultAjustes = configuracionUsuario.tonalidades?.[mappingKey as keyof typeof configuracionUsuario.tonalidades] as any;
                if (defaultAjustes) setAjustes(defaultAjustes);
                else setAjustes(prev => ({ ...prev, mapeoPersonalizado: {} }));
            }
        };
        cargarSpecificos();
    }, [tonalidadSeleccionada, usuarioId]);

    // Precarga de sonidos
    useEffect(() => {
        motorAudio.limpiar();
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
                let rutas = ajustes.mapeoPersonalizado[id] || obtenerRutasAudio(id);
                if (rutas.length > 0) {
                    soundsPerKeyRef.current[id] = rutas;
                    rutas.forEach(rRaw => {
                        const r = rRaw.startsWith('pitch:') ? rRaw.split('|')[1] : rRaw;
                        motorAudio.cargarSonido(r, r);
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
    }, [ajustes, tonalidadSeleccionada, obtenerRutasAudio, muestrasDB]);

    // --- ACCIONES ---
    const guardarAjustes = async () => {
        const key = `ajustes_acordeon_vPRO_${tonalidadSeleccionada}`;

        // Guardar Local
        localStorage.setItem(key, JSON.stringify(ajustes));

        // Guardar Supabase
        if (usuarioId) {
            try {
                // Primero obtener lo que hay para no sobrescribir otras tonalidades
                const { data } = await supabase
                    .from('sim_ajustes_usuario')
                    .select('tonalidades_configuradas')
                    .eq('usuario_id', usuarioId)
                    .maybeSingle();

                const nuevasTonalidades = { ...(data?.tonalidades_configuradas || {}), [key]: ajustes };

                await supabase.from('sim_ajustes_usuario').upsert({
                    usuario_id: usuarioId,
                    tonalidad_activa: tonalidadSeleccionada,
                    instrumento_id: instrumentoId,
                    ajustes_visuales: { tamano: ajustes.tamano, x: ajustes.x, y: ajustes.y },
                    tonalidades_configuradas: nuevasTonalidades,
                    sonidos_personalizados: sonidosVirtuales,
                    lista_tonalidades_activa: listaTonalidades,
                    updated_at: new Date().toISOString()
                });
                // Guardado silencioso en la nube
            } catch (e) {
                console.error('Error al sincronizar con Supabase:', e);
            }
        } else {
            // Guardado silencioso local
        }
        // El panel se mantiene abierto para seguir editando
    };

    const resetearAjustes = () => {
        const defaults = {
            tamano: '82vh', x: '53.5%', y: '50%', pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh',
            bajosBotonTamano: '4.2vh', bajosFuenteTamano: '1.3vh', teclasLeft: '5.05%', teclasTop: '13%',
            bajosLeft: '82.5%', bajosTop: '28%', mapeoPersonalizado: {}, pitchPersonalizado: {}
        };
        setAjustes(defaults as any);
        localStorage.removeItem(`ajustes_acordeon_vPRO_${tonalidadSeleccionada}`);
        // Nota: El reset no los borra de Supabase automáticamente para evitar pérdidas accidentales.
    };

    const guardarNuevoSonidoVirtual = async (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante') => {
        const nuevo: SonidoVirtual = { id: `custom_${Date.now()}`, nombre, rutaBase, pitch, tipo };
        const nuevaLista = [nuevo, ...sonidosVirtuales];
        setSonidosVirtuales(nuevaLista);

        // Local
        localStorage.setItem('sonidos_virtuales_acordeon', JSON.stringify(nuevaLista));

        // Nube
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
            localStorage.removeItem(key);

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
        soundsPerKey: soundsPerKeyRef.current, cargando: cargandoCloud, muestrasDB, obtenerRutasAudio
    };

};
