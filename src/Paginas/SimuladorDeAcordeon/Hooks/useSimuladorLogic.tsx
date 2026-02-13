import { useState, useEffect, useRef, useCallback } from 'react';
console.log('🪗 useLogicaAcordeon.tsx cargado!');
import { motorAudio } from '../AudioEngine';
import { mapaTeclas, tono } from '../mapaTecladoYFrecuencias';
import {
    mapaTeclasBajos,
    TONALIDADES,
    cambiarFuelle
} from '../notasAcordeonDiatonico';
import { configuracionUsuario } from '../Datos/TonosUsuario';
import type { AjustesAcordeon, SonidoVirtual, ModoVista, AcordeonSimuladorProps } from '../TiposAcordeon';

import { supabase } from '../../../lib/supabase/clienteSupabase';
import type {
    MuestraAudio
} from '../UniversalSampler';
import {
    NOTAS_CROMATICAS,
    obtenerIndiceNota,
    encontrarMejorMuestra,
    calcularOffsetTonalidad
} from '../UniversalSampler';

const NOMBRES_INGLES: Record<string, string> = {
    'do': 'C', 'do#': 'Db', 'reb': 'Db', 're': 'D', 're#': 'Eb', 'mib': 'Eb', 'mi': 'E',
    'fa': 'F', 'fa#': 'Gb', 'solb': 'Gb', 'sol': 'G', 'sol#': 'Ab', 'lab': 'Ab', 'la': 'A', 'la#': 'Bb', 'sib': 'Bb', 'si': 'B'
};

const SAMPLES_BRILLANTE = [
    "A-4-cm.mp3", "A-5-cm.mp3", "Ab-4-cm.mp3", "Ab-5-cm.mp3", "Ab-6-cm.mp3", "B-4-cm.mp3",
    "Bb-3-cm.mp3", "Bb-4-cm.mp3", "Bb-5-cm.mp3", "Bb-6-cm.mp3", "C-4-cm.mp3", "C-5-cm.mp3",
    "C-6-cm.mp3", "C-7-cm.mp3", "D-4-cm.mp3", "D-5-cm.mp3", "D-6-cm.mp3", "Db-5-cm.mp3",
    "Db-6-cm.mp3", "E-4-cm.mp3", "E-5-cm.mp3", "Eb-4-cm.mp3", "Eb-5-cm.mp3", "Eb-6-cm.mp3",
    "F-4-cm.mp3", "F-5-cm.mp3", "F-6-cm.mp3", "G-4-cm.mp3", "G-5-cm.mp3", "G-6-cm.mp3",
    "Gb-4-cm.mp3", "Gb-5-cm.mp3"
];

const SAMPLES_BAJOS = [
    "BajoAb(acorde)-cm.mp3", "BajoAb-2-cm.mp3", "BajoAb-cm.mp3", "BajoBb(acorde)-cm.mp3",
    "BajoBb-cm.mp3", "BajoC(acorde)-cm.mp3", "BajoC-cm.mp3", "BajoCm(acorde)-cm.mp3",
    "BajoDb(acorde)-cm.mp3", "BajoDb-cm.mp3", "BajoEb(acorde)-cm.mp3", "BajoEb-cm.mp3",
    "BajoF(acorde)-cm.mp3", "BajoF-2-cm.mp3", "BajoF-cm.mp3", "BajoFm(acorde)-cm.mp3",
    "BajoG(acorde)-cm.mp3", "BajoG-2-(acorde)-cm.mp3", "BajoG-2-cm.mp3", "BajoG-cm.mp3"
];

const VOL_PITOS = 0.55;
const VOL_BAJOS = 0.35;
const FADE_OUT = 100;

// Layout por defecto para respuesta instantánea (offline)
const LAYOUT_DEFECTO: Record<string, any> = {};
[...TONALIDADES.FBE.primeraFila, ...TONALIDADES.FBE.segundaFila, ...TONALIDADES.FBE.terceraFila,
...TONALIDADES.FBE.disposicionBajos.una, ...TONALIDADES.FBE.disposicionBajos.dos].forEach(b => {
    LAYOUT_DEFECTO[b.id] = b;
});

export const useLogicaAcordeon = (props: AcordeonSimuladorProps) => {
    const {
        direccion: direccionProp = 'halar',
        deshabilitarInteraccion = false,
        onNotaPresionada,
        onNotaLiberada
    } = props;

    // --- ESTADOS ---
    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);
    const [modoAjuste, setModoAjuste] = useState(false);
    const [modoVista, setModoVista] = useState<ModoVista>('notas');
    const [vistaDoble, setVistaDoble] = useState(false);
    const [botonSeleccionado, setBotonSeleccionado] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
    const [tonalidadSeleccionada, setTonalidadSeleccionada] = useState<string>('FBE');
    const [listaTonalidades, setListaTonalidades] = useState<string[]>(Object.keys(TONALIDADES));

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
    const [muestrasInstrumento, setMuestrasInstrumento] = useState<MuestraAudio[]>([]);
    const [instrumentoId, setInstrumentoId] = useState<string>('e0586623-722d-4770-bce4-e01ab4009ec9');
    const [layoutActual, setLayoutActual] = useState<any>(LAYOUT_DEFECTO);
    const [cargando, setCargando] = useState(false);

    // --- REFS ---
    const botonesActivosRef = useRef<Record<string, any>>({});
    const soundsPerKeyRef = useRef<Record<string, string[]>>({});
    const teclasFastMapRef = useRef<Record<string, any>>({});
    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);
    const ajustesRef = useRef(ajustes);
    const basePitchRef = useRef<Record<string, number>>({});
    const previewNodeRef = useRef<any>(null);

    // --- UTILIDADES ---
    const configTonalidad = TONALIDADES[tonalidadSeleccionada as keyof typeof TONALIDADES] || TONALIDADES['FBE'];
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

    const obtenerRutasAudio = useCallback((id: string) => {
        const map = ajustesRef.current.mapeoPersonalizado || {};
        if (map[id]) return map[id];

        const infoBoton = layoutActual?.[id] || mapaBotonesActual.current[id];
        if (!infoBoton) return [];

        if (muestrasInstrumento.length > 0) {
            const offsetTonalidad = calcularOffsetTonalidad('FBE', tonalidadSeleccionada);
            const indiceBase = obtenerIndiceNota(infoBoton.nota, infoBoton.octava);
            const indiceTranspuesto = indiceBase + offsetTonalidad;

            const octavaTranspue = Math.floor(indiceTranspuesto / 12);
            const notaTranspue = NOTAS_CROMATICAS[indiceTranspuesto % 12];
            const mejor = encontrarMejorMuestra(notaTranspue, octavaTranspue, muestrasInstrumento);

            if (mejor) return [`pitch:${mejor.pitch}|${mejor.url}`];
        }

        const n = infoBoton.nota || 'C';
        const o = infoBoton.octava || 5;
        const notaEng = NOMBRES_INGLES[n.toLowerCase()] || 'C';

        if (id.includes('bajo')) {
            return [`/audio/Muestras_Cromaticas/Bajos/Bajo${notaEng}-cm.mp3`];
        }
        return [`/audio/Muestras_Cromaticas/Brillante/${notaEng}-${o}-cm.mp3`];
    }, [layoutActual, muestrasInstrumento, tonalidadSeleccionada]);

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
        const rutas = soundsPerKeyRef.current[id] || obtenerRutasAudio(id);
        if (!rutas || rutas.length === 0) return { instances: [] };

        const volume = id.includes('bajo') ? VOL_BAJOS : VOL_PITOS;
        const userPitch = ajustesRef.current.pitchPersonalizado?.[id] || 0;
        const basePitchValue = basePitchRef.current[id] || 0;
        const totalPitch = userPitch + basePitchValue;

        const instances = rutas.map(ruta => motorAudio.reproducir(ruta, volume, totalPitch)).filter(Boolean);
        return { instances: instances as any[] };
    }, [obtenerRutasAudio]);

    const playPreview = useCallback((ruta: string, pitch: number) => {
        if (previewNodeRef.current) {
            try {
                previewNodeRef.current.source.stop();
                previewNodeRef.current.gain.disconnect();
            } catch (e) { }
        }
        const instance = motorAudio.reproducir(ruta, 0.6, pitch);
        if (instance) {
            previewNodeRef.current = instance;
            instance.source.onended = () => {
                if (previewNodeRef.current === instance) previewNodeRef.current = null;
            };
        }
    }, []);

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add', instanciasExternas: any[] | null = null) => {
        if (deshabilitarRef.current || (modoAjuste && accion === 'add')) {
            if (modoAjuste && accion === 'add') {
                const { instances } = reproducirTono(id);
                setTimeout(() => instances.forEach((inst: any) => inst.source.stop()), 500);
            }
            return;
        }

        if (accion === 'add') {
            if (botonesActivosRef.current[id]) return;
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

    const manejarEventoTeclado = useCallback((e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;
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
                    if (instances?.length > 0) next[newId] = { instances, ...mapaBotonesActual.current[newId] };
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

        if (esPresionada && !e.repeat && !modoAjuste) {
            const fastData = teclasFastMapRef.current[tecla];
            if (fastData) {
                const dir = direccionRef.current;
                const rutas = dir === 'halar' ? fastData.rutasHalar : fastData.rutasEmpujar;
                if (rutas?.length > 0) {
                    const pitch = dir === 'halar' ? fastData.pitchHalar : fastData.pitchEmpujar;
                    const vol = fastData.esBajo ? VOL_BAJOS : VOL_PITOS;
                    const instanciasFast = rutas.map((r: string) => motorAudio.reproducir(r, vol, pitch)).filter(Boolean);
                    actualizarBotonActivo(id, 'add', instanciasFast);
                    return;
                }
            }
            actualizarBotonActivo(id, 'add');
        } else if (!esPresionada) {
            actualizarBotonActivo(id, 'remove');
        }
    }, [actualizarBotonActivo, reproducirTono, detenerTono, modoAjuste]);

    // --- SINCRONIZACIÓN ---
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resMuestras, resLayouts, { data: authData }] = await Promise.all([
                    supabase.from('sim_muestras').select('*').eq('instrumento_id', instrumentoId),
                    supabase.from('sim_layouts').select('*').limit(1),
                    supabase.auth.getUser()
                ]);

                if (resMuestras.data) setMuestrasInstrumento(resMuestras.data);
                if (resLayouts.data && resLayouts.data[0]) setLayoutActual(resLayouts.data[0].definicion);

                if (authData.user) {
                    const { data: perfil } = await supabase.from('sim_ajustes_usuario').select('*').eq('usuario_id', authData.user.id).maybeSingle();
                    if (perfil) {
                        if (perfil.ajustes_visuales) setAjustes(perfil.ajustes_visuales);
                        if (perfil.tonalidad_activa) setTonalidadSeleccionada(perfil.tonalidad_activa);
                    }
                }
            } catch (e) { console.warn('Sync falló.'); }
        };
        cargarDatos();
    }, [instrumentoId]);

    // --- REFS ---
    useEffect(() => { direccionRef.current = direccion; }, [direccion]);
    useEffect(() => { deshabilitarRef.current = deshabilitarInteraccion; }, [deshabilitarInteraccion]);
    useEffect(() => { ajustesRef.current = ajustes; }, [ajustes]);
    useEffect(() => { botonesActivosRef.current = botonesActivos; }, [botonesActivos]);

    // --- TECLADO ---
    useEffect(() => {
        const hKD = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
        const hKU = (e: KeyboardEvent) => manejarEventoTeclado(e, false);
        window.addEventListener('keydown', hKD);
        window.addEventListener('keyup', hKU);
        return () => { window.removeEventListener('keydown', hKD); window.removeEventListener('keyup', hKU); };
    }, [manejarEventoTeclado]);

    // --- PRECARGA ---
    useEffect(() => {
        motorAudio.limpiar();
        soundsPerKeyRef.current = {};
        basePitchRef.current = {};

        const timer = setTimeout(() => {
            const procesarRuta = (rutaRaw: string, idBoton: string): string => {
                if (rutaRaw.startsWith('pitch:')) {
                    const [p, r] = rutaRaw.replace('pitch:', '').split('|');
                    basePitchRef.current[idBoton] = parseInt(p);
                    return r;
                }
                return rutaRaw;
            };

            Object.keys(mapaBotonesActual.current).forEach(id => {
                const baseId = id.split('-')[0] + '-' + id.split('-')[1];
                const esBajo = id.includes('bajo');
                ['halar', 'empujar'].forEach(dir => {
                    const fullId = `${baseId}-${dir}${esBajo ? '-bajo' : ''}`;
                    let rutas = ajustes.mapeoPersonalizado[fullId] || obtenerRutasAudio(fullId);
                    rutas = rutas.map(r => procesarRuta(r, fullId));
                    if (rutas.length > 0) {
                        soundsPerKeyRef.current[fullId] = rutas;
                        rutas.forEach(r => motorAudio.cargarSonido(r, r));
                    }
                });
            });

            const nuevoFastMap: Record<string, any> = {};
            [...Object.entries(mapaTeclas), ...Object.entries(mapaTeclasBajos)].forEach(([key, data]) => {
                const esBajo = key in mapaTeclasBajos;
                const idBase = `${data.fila}-${data.columna}`;
                const suf = esBajo ? '-bajo' : '';
                const idH = `${idBase}-halar${suf}`;
                const idE = `${idBase}-empujar${suf}`;
                nuevoFastMap[key] = {
                    rutasHalar: soundsPerKeyRef.current[idH] || [],
                    rutasEmpujar: soundsPerKeyRef.current[idE] || [],
                    pitchHalar: (ajustes.pitchPersonalizado[idH] || 0) + (basePitchRef.current[idH] || 0),
                    pitchEmpujar: (ajustes.pitchPersonalizado[idE] || 0) + (basePitchRef.current[idE] || 0),
                    esBajo
                };
            });
            teclasFastMapRef.current = nuevoFastMap;
        }, 10);
        return () => clearTimeout(timer);
    }, [ajustes, tonalidadSeleccionada, obtenerRutasAudio, muestrasInstrumento]);

    // --- ACCIONES ---
    const guardarAjustes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert('Inicia sesión.');
            await supabase.from('sim_ajustes_usuario').upsert({
                usuario_id: user.id, tonalidad_activa: tonalidadSeleccionada,
                instrumento_id: instrumentoId, ajustes_visuales: ajustes, updated_at: new Date().toISOString()
            });
            alert('✅ Guardado');
        } catch (e) { alert('❌ Error'); }
    };

    const resetearAjustes = () => {
        setAjustes({
            tamano: '82vh', x: '53.5%', y: '50%', pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh',
            bajosBotonTamano: '4.2vh', bajosFuenteTamano: '1.3vh', teclasLeft: '5.05%', teclasTop: '13%',
            bajosLeft: '82.5%', bajosTop: '28%', mapeoPersonalizado: {}, pitchPersonalizado: {}
        } as any);
    };

    const limpiarTodasLasNotas = useCallback(() => {
        Object.keys(botonesActivosRef.current).forEach(id => detenerTono(id));
        botonesActivosRef.current = {};
        setBotonesActivos({});
    }, [detenerTono]);

    return {
        botonesActivos, direccion, setDireccion, modoAjuste, setModoAjuste, modoVista, setModoVista,
        vistaDoble, setVistaDoble, ajustes, setAjustes, botonSeleccionado, setBotonSeleccionado,
        pestanaActiva, setPestanaActiva, tonalidadSeleccionada, setTonalidadSeleccionada,
        listaTonalidades, setListaTonalidades, sonidosVirtuales, setSonidosVirtuales,
        limpiarTodasLasNotas, actualizarBotonActivo, guardarAjustes, resetearAjustes,
        guardarNuevoSonidoVirtual: (nombre: string, ruta: string, p: number, t: any) => { },
        eliminarTonalidad: (t: string) => { },
        playPreview,
        reproduceTono: reproducirTono,
        configTonalidad,
        samplesBrillante: SAMPLES_BRILLANTE,
        samplesBajos: SAMPLES_BAJOS,
        mapaBotonesActual: mapaBotonesActual.current,
        soundsPerKey: soundsPerKeyRef.current,
        basePitch: basePitchRef.current,
        cargando: false
    };
};
