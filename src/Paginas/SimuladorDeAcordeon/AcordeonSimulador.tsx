import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { mapaTeclas } from './mapaTecladoYFrecuencias';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Move, Type, Maximize2, GripHorizontal, Mic, Music, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useGestionDeSonidos } from './hooks/useGestionDeSonidos';
import { useGrabadoraAudio } from './hooks/useGrabadoraAudio';
import {
    primeraFila,
    segundaFila,
    terceraFila,
    mapaTeclasBajos,
    disposicion,
    disposicionBajos,
    mapaBotonesPorId,
    filas,
    filasBajos,
    tonosFilas,
    cambiarFuelle
} from './notasAcordeonDiatonico';
import type { BotonNota } from './notasAcordeonDiatonico';
import './AcordeonSimulador.css';
import bgAcordeonDefault from './Acordeon PRO MAX.png';

// --- TIPOS Y COMPONENTES ---
export interface AcordeonSimuladorProps {
    direccion?: 'halar' | 'empujar';
    afinacion?: string;
    modoEditor?: boolean;
    grabando?: boolean;
    pausado?: boolean;
    reproduciendo?: boolean;
    deshabilitarInteraccion?: boolean;
    prefijoIdBoton?: string;
    imagenFondo?: string;
    anticipacionAcordeonGuia?: number;
    onGrabarNota?: (id: string, origen: string) => void;
    onFinalizarNota?: (id: string) => void;
    onCambiarFuelle?: (direccion: string, botonesActivos: Record<string, any>) => void;
    onNotaPresionada?: (data: { idBoton: string; nombre: string } | { id: string; tipo: string }) => void;
    onNotaLiberada?: (data: { idBoton: string; nombre: string } | { id: string; tipo: string }) => void;
    onCambioFuelle?: (data: { direccion: string; botonesActivos?: Record<string, any> }) => void;
}

export interface AcordeonSimuladorHandle {
    establecerCoordenadasAcordeonJugador: (fn: any) => void;
    establecerCallbackActivacionJugador: (fn: any) => void;
    resetearEstado: () => void;
    detenerTodosLosSonidos: () => void;
    limpiarBotonesActivos: () => void;
    cambiarDireccion: (nuevaDireccion: 'halar' | 'empujar') => void;
    forzarLiberacionTeclas: () => void;
    verificarNotasColgadas: () => number;
    iniciarLimpiezaAutomatica: () => void;
    detenerLimpiezaAutomatica: () => void;
    detenerTono: (id: string) => void;
    actualizarBotonActivo: (id: string, accion?: 'add' | 'remove') => void;
    manejarEventoTeclado: (e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => void;
    limpiarTodasLasNotas: () => void;
    reproducirTono: (id: string) => { oscillator?: OscillatorNode | OscillatorNode[] | null, source?: AudioBufferSourceNode | null };
    simularActivacionNota: (notaId: string, fuelleDireccion: 'halar' | 'empujar', duracionMs?: number) => void;
    simularDesactivacionNota: (notaId: string) => number;
}

const AcordeonSimulador = forwardRef<AcordeonSimuladorHandle, AcordeonSimuladorProps>(({
    direccion: direccionProp = 'halar',
    afinacion = 'FBE',
    modoEditor = false,
    grabando = false,
    pausado = false,
    deshabilitarInteraccion = false,
    prefijoIdBoton = '',
    imagenFondo = bgAcordeonDefault,
    onGrabarNota,
    onFinalizarNota,
    onCambiarFuelle,
    onNotaPresionada,
    onNotaLiberada,
    onCambioFuelle
}, ref) => {

    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);

    const audioRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const botonesActivosRef = useRef<Record<string, any>>({});
    const [modoAjuste, setModoAjuste] = useState(false);
    const [pestanaActiva, setPestanaActiva] = useState<'estilo' | 'grabacion'>('estilo');

    // Gestión de sonidos reales
    const {
        instrumentos,
        instrumentoSeleccionado,
        setInstrumentoSeleccionado,
        subirMuestraReal,
        crearInstrumento,
        eliminarInstrumento,
        estaProcesando,
        mensajeEstado,
        muestrasCargadas,
        recargarMuestras
    } = useGestionDeSonidos();

    const [botonParaGrabar, setBotonParaGrabar] = useState<string | null>(null);
    const [mostrarCrearIns, setMostrarCrearIns] = useState(false);
    const [nuevoNombreIns, setNuevoNombreIns] = useState('');
    const [nuevaAfinacionIns, setNuevaAfinacionIns] = useState('FBE');

    // --- NUEVOS ESTADOS DE VISUALIZACIÓN ---
    const [modoVista, setModoVista] = useState<'teclas' | 'numeros' | 'notas' | 'cifrado'>('notas');
    const [mostrarDobleNota, setMostrarDobleNota] = useState(false);

    // Estados para personalización de nota antes de subir/grabar
    const [nombreNotaPersonalizada, setNombreNotaPersonalizada] = useState('');
    const [octavaPersonalizada, setOctavaPersonalizada] = useState(4);
    const [tipoBajoPersonalizado, setTipoBajoPersonalizado] = useState<'ninguno' | 'M' | 'm'>('ninguno');
    const [ultimoBlobGrabado, setUltimoBlobGrabado] = useState<Blob | null>(null);

    // Integración de grabadora
    const callbackGrabacion = async (blob: Blob) => {
        setUltimoBlobGrabado(blob); // Guardamos para preview y confirmación
    };

    const subirNotaConfirmada = async () => {
        if (ultimoBlobGrabado && botonParaGrabar) {
            const btnData = mapaBotonesPorId[botonParaGrabar];
            const fuelleBoton = botonParaGrabar.includes('halar') ? 'halar' : 'empujar';

            const sufijo = tipoBajoPersonalizado !== 'ninguno' ? tipoBajoPersonalizado : '';
            let nombreFinal = nombreNotaPersonalizada || btnData.nombre;

            // Si el nombre ya termina en M o m, lo quitamos antes de añadir el sufijo para evitar duplicados como LabMM
            if (nombreFinal.endsWith('M') || nombreFinal.endsWith('m')) {
                nombreFinal = nombreFinal.slice(0, -1);
            }
            nombreFinal += sufijo;

            await subirMuestraReal(ultimoBlobGrabado, botonParaGrabar, {
                fuelle: fuelleBoton,
                esBajo: botonParaGrabar.includes('bajo'),
                nombreNota: nombreFinal,
                octava: octavaPersonalizada
            });
            setUltimoBlobGrabado(null);
            limpiarPreview(); // Limpiamos el hook también
            recargarMuestras?.();
        }
    };

    // 🔄 REINICIO TOTAL AL CAMBIAR DE INSTRUMENTO (Evita sonidos fantasma)
    useEffect(() => {
        limpiarTodasLasNotas();
        setBotonesActivos({});
        botonesActivosRef.current = {};
    }, [instrumentoSeleccionado]);

    const { iniciarGrabacion, detenerGrabacionManual, limpiarPreview, estaGrabando, segundosRestantes, conteoAtras, intensidad, historialIntensidad, urlPreview } = useGrabadoraAudio(callbackGrabacion);

    // 🔄 Sincronizar nota por defecto al seleccionar un botón para grabar
    useEffect(() => {
        if (botonParaGrabar) {
            const btnData = mapaBotonesPorId[botonParaGrabar];
            if (btnData) {
                const key = `${botonParaGrabar}_${botonParaGrabar.includes('halar') ? 'halar' : 'empujar'}`;
                const notaExistente = muestrasCargadas[key]?.nombre;

                let nombreLimpio = notaExistente || btnData.nombre.replace(/[0-9]/g, '');
                let tipoDetec: 'ninguno' | 'M' | 'm' = 'ninguno';

                // Detectar si ya tenía M o m al final y extraerlo para el selector
                if (nombreLimpio.endsWith('M')) {
                    tipoDetec = 'M';
                    nombreLimpio = nombreLimpio.slice(0, -1);
                } else if (nombreLimpio.endsWith('m')) {
                    tipoDetec = 'm';
                    nombreLimpio = nombreLimpio.slice(0, -1);
                }

                setNombreNotaPersonalizada(nombreLimpio);
                setTipoBajoPersonalizado(tipoDetec);

                const octaveMatch = (notaExistente || btnData.nombre).match(/\d+/);
                setOctavaPersonalizada(octaveMatch ? parseInt(octaveMatch[0]) : (botonParaGrabar.includes('bajo') ? 2 : 4));
            }
        }
    }, [botonParaGrabar]);

    // --- REFS PARA SINCRONIZACIÓN CRÍTICA ---
    const instrumentoRef = useRef(instrumentoSeleccionado);
    const muestrasRef = useRef(muestrasCargadas);

    useEffect(() => { instrumentoRef.current = instrumentoSeleccionado; }, [instrumentoSeleccionado]);
    useEffect(() => { muestrasRef.current = muestrasCargadas; }, [muestrasCargadas]);

    // Obtener info del instrumento actual para el UI
    const infoInsActual = instrumentoSeleccionado
        ? instrumentos.find(i => i.id === instrumentoSeleccionado)
        : { nombre: 'Acordeón Digital', afinacion: 'Fa-Sib-Mib (Base)' };

    // Ajustes del simulador
    const [ajustes, setAjustes] = useState({
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
        bajosTop: '28%'
    });

    // --- SOLUCIÓN MAESTRA PARA EL CURSOR ---
    useEffect(() => {
        if (modoAjuste) {
            document.body.classList.add('diseno-activo');
            document.body.classList.remove('cursor-personalizado-activo');
        } else {
            document.body.classList.remove('diseno-activo');
        }
        return () => {
            document.body.classList.remove('diseno-activo');
        };
    }, [modoAjuste]);

    useEffect(() => {
        const guardados = localStorage.getItem('ajustes_acordeon_vPRO');
        if (guardados) {
            try { setAjustes(JSON.parse(guardados)); } catch (e) { console.error(e); }
        }
    }, []);

    const guardarAjustes = () => {
        localStorage.setItem('ajustes_acordeon_vPRO', JSON.stringify(ajustes));
        setModoAjuste(false);
        alert('✅ ¡Diseño Pro Guardado!');
    };

    const resetearAjustes = () => {
        const defaults = { tamano: '82vh', x: '53.5%', y: '50%', pitosBotonTamano: '4.4vh', pitosFuenteTamano: '1.6vh', bajosBotonTamano: '4.4vh', bajosFuenteTamano: '1.6vh', teclasLeft: '5.05%', teclasTop: '13%', bajosLeft: '82.5%', bajosTop: '30%' };
        setAjustes(defaults);
        localStorage.removeItem('ajustes_acordeon_vPRO');
    };

    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);

    useEffect(() => { direccionRef.current = direccion; }, [direccion]);
    useEffect(() => { deshabilitarRef.current = deshabilitarInteraccion; }, [deshabilitarInteraccion]);
    useEffect(() => { if (direccionProp !== direccion) setDireccion(direccionProp); }, [direccionProp]);
    useEffect(() => { botonesActivosRef.current = botonesActivos; }, [botonesActivos]);

    useEffect(() => {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
            audioRef.current = new AudioCtor({ latencyHint: 'interactive' });
            gainNodeRef.current = audioRef.current.createGain();
            gainNodeRef.current.gain.value = 0.8; // Volumen puro sin compresión
            gainNodeRef.current.connect(audioRef.current.destination);
        }
        const hKD = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
        const hKU = (e: KeyboardEvent) => manejarEventoTeclado(e, false);
        window.addEventListener('keydown', hKD);
        window.addEventListener('keyup', hKU);
        return () => {
            window.removeEventListener('keydown', hKD);
            window.removeEventListener('keyup', hKU);
            if (audioRef.current) audioRef.current.close();
        };
    }, []);

    const reproducirTono = (id: string) => {
        if (!audioRef.current || !gainNodeRef.current) return { oscillator: null, source: null };
        if (audioRef.current.state === 'suspended') audioRef.current.resume();

        // 🔍 1. DETERMINAR SONIDO REAL (PRIORIDAD ABSOLUTA)
        const keyMuestra = `${id}_${direccionRef.current}`;
        const muestraReal = muestrasRef.current?.[keyMuestra];
        const bufferReal = muestraReal?.buffer;

        // SI HAY UN INSTRUMENTO SELECCIONADO -> BLOQUEAR SINTETIZADOR
        const hayInstrumento = !!instrumentoRef.current;

        if (hayInstrumento) {
            if (bufferReal) {
                const source = audioRef.current.createBufferSource();
                source.buffer = bufferReal;
                source.loop = true;
                source.connect(gainNodeRef.current);
                source.start();
                return { source };
            } else {
                // Si el instrumento está activo pero no hay grabación para este botón, silencio total (evita sonar digital por accidente)
                return { oscillator: null, source: null };
            }
        }

        // --- MODO DIGITAL (Solo si no hay instrumento real seleccionado) ---
        if (!mapaBotonesPorId[id]) return { oscillator: null };
        const { frecuencia } = mapaBotonesPorId[id];
        let oscillator: OscillatorNode | OscillatorNode[];

        if (Array.isArray(frecuencia)) {
            oscillator = frecuencia.map(hz => {
                const osc = audioRef.current!.createOscillator();
                osc.type = hayInstrumento ? 'sawtooth' : 'sawtooth'; // Mantener sawtooth pero dejar claro el flujo
                osc.connect(gainNodeRef.current!);
                osc.frequency.value = hz;
                osc.start();
                return osc;
            });
        } else {
            oscillator = audioRef.current.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.connect(gainNodeRef.current);
            oscillator.frequency.value = frecuencia as number;
            oscillator.start();
        }
        return { oscillator };
    };

    const detenerTono = (id: string) => {
        const b = botonesActivosRef.current[id];
        if (!b) return;

        try {
            // Detener muestras reales
            if (b.source) {
                b.source.stop();
            }
            // Detener osciladores sintetizados
            if (b.oscillator) {
                if (Array.isArray(b.oscillator)) b.oscillator.forEach((o: any) => o?.stop());
                else b.oscillator.stop();
            }
        } catch (e) { }
    };

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add') => {
        if (deshabilitarRef.current || (modoAjuste && pestanaActiva === 'grabacion')) return;
        if (accion === 'add') {
            if (botonesActivosRef.current[id]) return;
            const { oscillator, source } = reproducirTono(id);
            // Solo añadir si realmente está sonando algo (evitar estados vacíos por silencio de usuario)
            if (!oscillator && !source) return;

            const newState = { ...botonesActivosRef.current, [id]: { oscillator, source, ...mapaBotonesPorId[id] } };
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
            onNotaPresionada?.({ idBoton: id, nombre: id });
        } else {
            detenerTono(id);
            const newState = { ...botonesActivosRef.current };
            delete newState[id];
            setBotonesActivos(newState);
            onNotaLiberada?.({ idBoton: id, nombre: id });
        }
    }, [modoAjuste, pestanaActiva, onNotaPresionada, onNotaLiberada]);

    const limpiarTodasLasNotas = () => {
        Object.keys(botonesActivosRef.current).forEach(id => detenerTono(id));
        botonesActivosRef.current = {};
        setBotonesActivos({});
    };

    const manejarEventoTeclado = (e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;
        const tecla = e.key.toLowerCase();

        // --- LÓGICA DE FUELLE MOMENTÁNEO (Q = CERRAR / SOLTAR = ABRIR) ---
        if (tecla === cambiarFuelle) {
            const nuevaDireccion = esPresionada ? 'empujar' : 'halar';

            if (nuevaDireccion !== direccionRef.current) {
                // 🔄 MIGRACIÓN DE NOTAS (Fluidez Total)
                const botonesPrevios = { ...botonesActivosRef.current };

                // 1. Efectuar el cambio de dirección global
                setDireccion(nuevaDireccion);
                direccionRef.current = nuevaDireccion;

                // 2. Encender automáticamente las notas equivalentes en la nueva dirección (PRIMERO)
                const nuevosBotones: Record<string, any> = {};
                Object.keys(botonesPrevios).forEach(idViejo => {
                    const esBajo = idViejo.includes('bajo');
                    const partes = idViejo.split('-'); // [fila, col, dir, (bajo)]
                    const idNuevo = `${partes[0]}-${partes[1]}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;

                    const { oscillator, source } = reproducirTono(idNuevo);
                    if (oscillator || source) {
                        nuevosBotones[idNuevo] = { oscillator, source, ...mapaBotonesPorId[idNuevo] };
                        onNotaPresionada?.({ idBoton: idNuevo, nombre: idNuevo });
                    }
                });

                // 3. Apagar sonidos de la dirección anterior (DESPUÉS)
                Object.keys(botonesPrevios).forEach(id => {
                    detenerTono(id);
                    onNotaLiberada?.({ idBoton: id, nombre: id });
                });

                botonesActivosRef.current = nuevosBotones;
                setBotonesActivos(nuevosBotones);
            }
            return;
        }
        const d = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
        if (!d) return;
        const id = `${d.fila}-${d.columna}-${direccionRef.current}${mapaTeclasBajos[tecla] ? '-bajo' : ''}`;
        if (esPresionada) actualizarBotonActivo(id, 'add');
        else actualizarBotonActivo(id, 'remove');
    };

    // --- UTILIDADES DE CONVERSIÓN DE NOTAS ---
    const notasPosibles = ['Do', 'Do#', 'Reb', 'Re', 'Re#', 'Mib', 'Mi', 'Fa', 'Fa#', 'Solb', 'Sol', 'Sol#', 'Lab', 'La', 'La#', 'Sib', 'Si'];

    const cifradoAmericano: Record<string, string> = {
        'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
        'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
    };

    const formatearNota = (nombre: string) => {
        if (!nombre) return '';

        const base = nombre.trim();
        const lowerBase = base.toLowerCase();

        // 1. EXTRAER LA NOTA BASE (ej: "Sol" de "sol menor")
        let notaPura = base.split(' ')[0];
        if (lowerBase.startsWith('la bemol')) notaPura = 'Lab';
        else if (lowerBase.startsWith('si bemol')) notaPura = 'Sib';
        else if (lowerBase.startsWith('mi bemol')) notaPura = 'Mib';
        else if (lowerBase.startsWith('re bemol')) notaPura = 'Reb';
        else if (lowerBase.startsWith('sol bemol')) notaPura = 'Solb';
        else if (lowerBase.startsWith('do bemol')) notaPura = 'Dob';

        // Asegurar que la nota base empiece con Mayúscula (Sol, Do, Reb...)
        notaPura = notaPura.charAt(0).toUpperCase() + notaPura.slice(1).toLowerCase();

        // 2. DETECTAR SI ES MAYOR O MENOR (Para Bajos) - Sensible a Mayúsculas
        const esMenor = lowerBase.includes('menor') || base.endsWith('m') || lowerBase.includes(' m');
        const esMayor = lowerBase.includes('mayor') || base.endsWith('M') || lowerBase.includes(' M');

        // IMPORTANTE: Si ya detectamos Mayor/Menor, limpiamos la nota base de la letra extra para el visual
        if (notaPura.endsWith('M') || notaPura.endsWith('m')) {
            notaPura = notaPura.slice(0, -1);
        }

        const cifrado = cifradoAmericano[notaPura] || notaPura;

        if (modoVista === 'cifrado') {
            let resultado = cifrado;
            if (esMenor) resultado += 'm';
            else if (esMayor) resultado += 'M';
            return resultado;
        }

        if (modoVista === 'notas') {
            let resultado = notaPura;
            if (esMenor) resultado += 'm';
            else if (esMayor) resultado += 'M';
            return resultado;
        }

        // Para la vista por defecto, si tiene sufijo M/m, lo formateamos bonito
        if (esMenor || esMayor) {
            const tempBase = (base.endsWith('M') || base.endsWith('m')) ? base.slice(0, -1) : base;
            return tempBase.charAt(0).toUpperCase() + tempBase.slice(1).toLowerCase() + (esMenor ? 'm' : 'M');
        }
    };

    const getContenidoBoton = (idOriginal: string, esHalar: boolean) => {
        const key = `${idOriginal}_${esHalar ? 'halar' : 'empujar'}`;
        const muestra = muestrasCargadas[key];

        // Si hay una nota grabada con nombre personalizado, tiene prioridad máxima
        if (muestra?.nombre) {
            return formatearNota(muestra.nombre);
        }

        // Fallback al mapa base
        const btnBase = mapaBotonesPorId[idOriginal];
        return formatearNota(btnBase?.nombre || '');
    };

    // --- COMPONENTE SELECTOR DE NOTAS VISUAL ---
    const SelectorDeNotas = () => (
        <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '10px', color: '#aaa', display: 'block', textAlign: 'left', marginBottom: '8px' }}>SELECCIONAR NOTA (CIFRADO AMERICANO DISPONIBLE)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '12px' }}>
                {notasPosibles.map(n => (
                    <button
                        key={n}
                        onClick={() => setNombreNotaPersonalizada(n)}
                        style={{
                            background: nombreNotaPersonalizada === n ? '#3b82f6' : '#1a1a1a',
                            color: 'white', border: '1px solid #333', borderRadius: '4px',
                            padding: '6px 0', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {n}
                        <div style={{ fontSize: '8px', opacity: 0.6 }}>{cifradoAmericano[n]}</div>
                    </button>
                ))}
            </div>

            {/* SELECTOR DE TIPO PARA BAJOS */}
            <label style={{ fontSize: '10px', color: '#aaa', display: 'block', textAlign: 'left', marginBottom: '8px' }}>TIPO DE ARMONÍA (PARA BAJOS)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                {[
                    { val: 'ninguno', label: 'SOLO NOTA', desc: 'Nota Única' },
                    { val: 'M', label: 'MAYOR (M)', desc: 'Acorde Mayor' },
                    { val: 'm', label: 'MENOR (m)', desc: 'Acorde Menor' }
                ].map(tipo => (
                    <button
                        key={tipo.val}
                        onClick={() => setTipoBajoPersonalizado(tipo.val as any)}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #333',
                            background: tipoBajoPersonalizado === tipo.val ? 'linear-gradient(45deg, #3b82f6, #6366f1)' : '#1a1a1a',
                            color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{tipo.label}</div>
                        <div style={{ fontSize: '8px', opacity: 0.5 }}>{tipo.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    // --- COMPONENTE DE BARRA DE VISTA (AHORA PARA EL LATERAL) ---
    const ToolbarVisualizacion = () => (
        <div style={{
            background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '18px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            width: '100%'
        }}>
            <p style={{ margin: 0, fontSize: '9px', color: '#888', fontWeight: '900', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>Configuración de Vista</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => setModoVista('teclas')} style={{ ...estiloIconoVista, background: modoVista === 'teclas' ? '#3b82f6' : '#222' }}>
                        <Type size={16} color="white" />
                    </button>
                    <span style={{ fontSize: '7px', color: '#aaa', fontWeight: 'bold' }}>TEC.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => setModoVista('numeros')} style={{ ...estiloIconoVista, background: modoVista === 'numeros' ? '#3b82f6' : '#222' }}>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '11px' }}>123</span>
                    </button>
                    <span style={{ fontSize: '7px', color: '#aaa', fontWeight: 'bold' }}>POS.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => setModoVista('notas')} style={{ ...estiloIconoVista, background: modoVista === 'notas' ? '#3b82f6' : '#222' }}>
                        <Music size={16} color="white" />
                    </button>
                    <span style={{ fontSize: '7px', color: '#aaa', fontWeight: 'bold' }}>NOT.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => setModoVista('cifrado')} style={{ ...estiloIconoVista, background: modoVista === 'cifrado' ? '#3b82f6' : '#222' }}>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '11px' }}>ABC</span>
                    </button>
                    <span style={{ fontSize: '7px', color: '#aaa', fontWeight: 'bold' }}>CIF.</span>
                </div>
            </div>

            <button
                onClick={() => setMostrarDobleNota(!mostrarDobleNota)}
                style={{
                    border: '1px solid rgba(255,255,255,0.2)', background: mostrarDobleNota ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)' : '#222',
                    color: 'white', padding: '8px', borderRadius: '12px', fontSize: '9px', fontWeight: '900',
                    cursor: 'pointer', boxShadow: mostrarDobleNota ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
                    transition: 'all 0.3s', textTransform: 'uppercase'
                }}
            >
                {mostrarDobleNota ? '✅ Vista Doble ON' : '❌ Vista Doble OFF'}
            </button>
        </div>
    );

    const estiloIconoVista = {
        width: '38px', height: '38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
    };

    useImperativeHandle(ref, () => ({
        establecerCoordenadasAcordeonJugador: () => { },
        establecerCallbackActivacionJugador: () => { },
        resetearEstado: limpiarTodasLasNotas,
        detenerTodosLosSonidos: limpiarTodasLasNotas,
        limpiarBotonesActivos: () => setBotonesActivos({}),
        cambiarDireccion: (d) => setDireccion(d),
        forzarLiberacionTeclas: limpiarTodasLasNotas,
        verificarNotasColgadas: () => 0,
        iniciarLimpiezaAutomatica: () => { },
        detenerLimpiezaAutomatica: () => { },
        detenerTono,
        actualizarBotonActivo,
        manejarEventoTeclado,
        limpiarTodasLasNotas,
        reproducirTono,
        simularActivacionNota: () => { },
        simularDesactivacionNota: () => 0
    }));

    const getFilaDisplay = (f: string) => f === 'primeraFila' ? 'Afuera (1)' : f === 'segundaFila' ? 'Medio (2)' : f === 'terceraFila' ? 'Adentro (3)' : f;

    // --- COMPONENTE SELECTOR RÁPIDO ---
    const SelectorAcordeonRapido = () => (
        <div style={{
            background: 'rgba(0,0,0,0.85)', padding: '12px', borderRadius: '18px',
            borderLeft: '4px solid #3b82f6', backdropFilter: 'blur(15px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '240px'
        }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🪗 ACORDEÓN ACTIVO
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                    value={instrumentoSeleccionado || ''}
                    onChange={(e) => setInstrumentoSeleccionado(e.target.value === '' ? null : e.target.value)}
                    style={{
                        width: '100%', background: '#111', color: 'white', border: '1px solid #333',
                        padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                        cursor: 'pointer', outline: 'none'
                    }}
                >
                    <option value="">🎹 Acordeón Digital (Base)</option>
                    {instrumentos.map(ins => (
                        <option key={ins.id} value={ins.id}>{ins.nombre}</option>
                    ))}
                </select>

                {instrumentoSeleccionado && (
                    <div style={{ fontSize: '10px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 5px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 5px #22c55e' }} />
                        SONIDOS REALES ACTIVOS
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={modoAjuste ? 'modo-diseno-activo' : ''} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>

            {/* 🔘 BOTÓN FLOTANTE PRINCIPAL (GESTOR) */}
            <button
                onClick={() => setModoAjuste(!modoAjuste)}
                style={{
                    position: 'fixed', top: '90px', right: '40px', zIndex: 9999999,
                    background: modoAjuste ? '#ef4444' : '#3b82f6', color: 'white',
                    border: '3px solid white', borderRadius: '50%', width: '80px', height: '80px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', transition: 'all 0.2s'
                }}
            >
                <Settings size={30} style={{ animation: (modoAjuste || estaProcesando) ? 'spin 3s linear infinite' : 'none' }} />
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>GESTOR</span>
            </button>

            {/* 🆕 SELECTOR INSTANTÁNEO DE ACORDEÓN (ACCESO DIRECTO) */}
            <div style={{
                position: 'fixed', top: '180px', right: '40px', zIndex: 999999,
                textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px',
                alignItems: 'flex-end'
            }}>
                <SelectorAcordeonRapido />

                <button
                    onClick={() => {
                        const nDir = direccion === 'halar' ? 'empujar' : 'halar';
                        setDireccion(nDir);
                        direccionRef.current = nDir;
                        limpiarTodasLasNotas();
                    }}
                    style={{
                        background: direccion === 'halar' ? 'linear-gradient(to right, #ef4444, #991b1b)' : 'linear-gradient(to right, #22c55e, #166534)',
                        color: 'white', border: '2px solid white', borderRadius: '15px',
                        padding: '12px', fontWeight: '900', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.4)', transition: 'all 0.3s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                >
                    <RotateCcw size={20} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase' }}>Fuelle Actual</div>
                        <div style={{ fontSize: '12px' }}>{direccion === 'halar' ? 'ABRIENDO (HALAR)' : 'CERRANDO (EMPUJAR)'}</div>
                    </div>
                </button>

                {/* BOTÓN RÁPIDO PARA TECLAS */}
                <button
                    onClick={() => setModoVista(modoVista === 'teclas' ? 'notas' : 'teclas')}
                    style={{
                        background: modoVista === 'teclas' ? '#3b82f6' : 'rgba(0,0,0,0.5)',
                        color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
                        padding: '10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(5px)'
                    }}
                >
                    <Type size={14} />
                    {modoVista === 'teclas' ? 'OCULTAR TECLADO' : 'MOSTRAR TECLADO'}
                </button>
                {/* BARRA DE VISTA (INYECTADA EN SIDEBAR) */}
                <ToolbarVisualizacion />
            </div>

            {/* 🛠️ PANEL DE CONFIGURACIÓN MOVIBLE */}
            {modoAjuste && (
                <motion.div
                    drag
                    dragMomentum={false}
                    className="panel-ajustes visible"
                    style={{
                        position: 'fixed', top: '140px', right: '140px', zIndex: 9999999,
                        background: '#0a0a0ae6', padding: '25px', borderRadius: '24px',
                        color: 'white', width: '360px', border: '1px solid #3b82f6',
                        boxShadow: '0 0 80px rgba(0,0,0,1)', backdropFilter: 'blur(20px)'
                    }}
                >
                    {/* ZONA DE ARRASTRE DEL PANEL */}
                    <div style={{ width: '100%', height: '24px', cursor: 'move', display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <GripHorizontal color="#3b82f6" />
                    </div>

                    {/* SELECTOR DE PESTAÑAS */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px' }}>
                        <button
                            onClick={() => setPestanaActiva('estilo')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                background: pestanaActiva === 'estilo' ? '#3b82f6' : 'transparent',
                                color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >🎨 ESTILO</button>
                        <button
                            onClick={() => setPestanaActiva('grabacion')}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                background: pestanaActiva === 'grabacion' ? '#ef4444' : 'transparent',
                                color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >🎙️ GRABACIÓN</button>
                    </div>

                    {pestanaActiva === 'estilo' ? (
                        <>
                            <h3 style={{ marginBottom: '20px', color: '#3b82f6', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>HERRAMIENTAS DE ESTILO</h3>

                            <div className="grupo-ajuste" style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', color: '#aaa', display: 'block' }}>ESCALA ACORDEÓN: {ajustes.tamano}</label>
                                <input type="range" min="40" max="110" value={parseFloat(ajustes.tamano)} onChange={(e) => setAjustes({ ...ajustes, tamano: `${e.target.value}vh` })} style={{ width: '100%' }} />

                                <div style={{ display: 'flex', gap: '15px', marginTop: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '10px' }}>HORIZONTAL (X)</label>
                                        <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.x)} onChange={(e) => setAjustes({ ...ajustes, x: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '10px' }}>VERTICAL (Y)</label>
                                        <input type="range" min="0" max="100" step="0.1" value={parseFloat(ajustes.y)} onChange={(e) => setAjustes({ ...ajustes, y: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '15px', borderRadius: '18px', marginBottom: '15px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold' }}>🎹 PITOS (DERECHA)</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>BOTÓN</label>
                                        <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.pitosBotonTamano)} onChange={(e) => setAjustes({ ...ajustes, pitosBotonTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>LETRA</label>
                                        <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.pitosFuenteTamano)} onChange={(e) => setAjustes({ ...ajustes, pitosFuenteTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>POS. H</label>
                                        <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasLeft)} onChange={(e) => setAjustes({ ...ajustes, teclasLeft: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>POS. V</label>
                                        <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.teclasTop)} onChange={(e) => setAjustes({ ...ajustes, teclasTop: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '15px', borderRadius: '18px', marginBottom: '20px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                <p style={{ color: '#eab308', fontSize: '11px', fontWeight: 'bold' }}>🎸 BAJOS (IZQUIERDA)</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>BOTÓN</label>
                                        <input type="range" min="1" max="10" step="0.1" value={parseFloat(ajustes.bajosBotonTamano)} onChange={(e) => setAjustes({ ...ajustes, bajosBotonTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>LETRA</label>
                                        <input type="range" min="0.5" max="5" step="0.1" value={parseFloat(ajustes.bajosFuenteTamano)} onChange={(e) => setAjustes({ ...ajustes, bajosFuenteTamano: `${e.target.value}vh` })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>POS. H</label>
                                        <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosLeft)} onChange={(e) => setAjustes({ ...ajustes, bajosLeft: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '9px' }}>POS. V</label>
                                        <input type="range" min="-100" max="200" step="0.1" value={parseFloat(ajustes.bajosTop)} onChange={(e) => setAjustes({ ...ajustes, bajosTop: `${e.target.value}%` })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '15px', color: '#ef4444', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>GESTOR DE SONIDOS REALES</h3>

                            {/* SELECTOR Y CREACIÓN DE INSTRUMENTOS */}
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <label style={{ fontSize: '10px', color: '#aaa' }}>ACORDEÓN ACTUAL:</label>
                                    <button
                                        onClick={() => setMostrarCrearIns(!mostrarCrearIns)}
                                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    >
                                        {mostrarCrearIns ? <X size={12} /> : <Plus size={12} />}
                                        {mostrarCrearIns ? 'CANCELAR' : 'NUEVO ACORDEÓN'}
                                    </button>
                                </div>

                                {mostrarCrearIns ? (
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #333' }}>
                                        <input
                                            placeholder="Nombre (ej. Corona III)"
                                            value={nuevoNombreIns}
                                            onChange={(e) => setNuevoNombreIns(e.target.value)}
                                            style={{ width: '100%', background: '#111', color: 'white', border: '1px solid #444', padding: '6px', borderRadius: '5px', fontSize: '11px', marginBottom: '5px' }}
                                        />
                                        <input
                                            placeholder="Afinación (ej. GCF)"
                                            value={nuevaAfinacionIns}
                                            onChange={(e) => setNuevaAfinacionIns(e.target.value)}
                                            style={{ width: '100%', background: '#111', color: 'white', border: '1px solid #444', padding: '6px', borderRadius: '5px', fontSize: '11px', marginBottom: '8px' }}
                                        />
                                        <button
                                            disabled={estaProcesando || !nuevoNombreIns}
                                            onClick={async () => {
                                                const res = await crearInstrumento(nuevoNombreIns, nuevaAfinacionIns);
                                                if (res) {
                                                    setNuevoNombreIns('');
                                                    setMostrarCrearIns(false);
                                                }
                                            }}
                                            style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            {estaProcesando ? 'CREANDO...' : 'CONFIRMAR CREACIÓN'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            value={instrumentoSeleccionado || ''}
                                            onChange={(e) => setInstrumentoSeleccionado(e.target.value === '' ? null : e.target.value)}
                                            style={{ flex: 1, background: '#222', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            <option value="">🎹 Acordeón Digital (Base)</option>
                                            {instrumentos.map(ins => <option key={ins.id} value={ins.id}>{ins.nombre} ({ins.afinacion})</option>)}
                                        </select>

                                        {instrumentoSeleccionado && (
                                            <button
                                                onClick={() => eliminarInstrumento(instrumentoSeleccionado)}
                                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Eliminar este acordeón"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '15px' }}>
                                <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginBottom: '10px' }}>📋 PASOS PARA GRABAR:</p>
                                <ul style={{ fontSize: '10px', color: '#ccc', paddingLeft: '15px' }}>
                                    <li>Toca un botón del simulador.</li>
                                    <li>Presiona el botón de micrófono.</li>
                                    <li>¡Toca tu acordeón real al terminar el conteo!</li>
                                </ul>
                            </div>

                            {botonParaGrabar ? (
                                <div style={{ background: '#22c55e22', padding: '15px', borderRadius: '15px', border: '2px dashed #22c55e', textAlign: 'center' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>CONFIGURANDO: {botonParaGrabar}</p>

                                    {/* CAMPOS DE PERSONALIZACIÓN DE NOTA */}
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '10px', color: '#aaa', display: 'block', textAlign: 'left', marginBottom: '5px' }}>NOTA ACTUAL</label>
                                                <div style={{ background: '#000', padding: '10px', borderRadius: '6px', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: '900', fontSize: '16px', textAlign: 'center' }}>
                                                    {nombreNotaPersonalizada || '—'}
                                                    {tipoBajoPersonalizado !== 'ninguno' ? tipoBajoPersonalizado : ''}
                                                    {cifradoAmericano[nombreNotaPersonalizada] && (
                                                        <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '5px' }}>
                                                            ({cifradoAmericano[nombreNotaPersonalizada]}{tipoBajoPersonalizado !== 'ninguno' ? tipoBajoPersonalizado : ''})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ width: '80px' }}>
                                                <label style={{ fontSize: '10px', color: '#aaa', display: 'block', textAlign: 'left', marginBottom: '5px' }}>OCTAVA</label>
                                                <input
                                                    type="number" min="1" max="8"
                                                    value={octavaPersonalizada}
                                                    onChange={(e) => setOctavaPersonalizada(parseInt(e.target.value))}
                                                    style={{ width: '100%', background: '#111', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}
                                                />
                                            </div>
                                        </div>

                                        <SelectorDeNotas />
                                    </div>

                                    {/* INDICADORES DE GRABACIÓN */}
                                    {conteoAtras > 0 && (
                                        <div style={{ background: '#ef4444', color: 'white', padding: '10px', borderRadius: '10px', marginBottom: '10px', animation: 'pulse 1s infinite' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 'bold' }}>¡CONCENTRACIÓN! Grabando en {conteoAtras}...</p>
                                        </div>
                                    )}

                                    {estaGrabando && (
                                        <div style={{ background: '#1a1a1a', color: 'white', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #22c55e' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>🔴 CAPTURANDO AUDIO...</p>
                                                <p style={{ fontSize: '14px', fontWeight: '900', color: '#22c55e', margin: 0 }}>{segundosRestantes}s</p>
                                            </div>

                                            {/* LÍNEA DE TIEMPO / WAVEFORM DE INTENSIDAD */}
                                            <div style={{
                                                width: '100%', height: '60px', background: '#000', borderRadius: '8px',
                                                marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '1px',
                                                padding: '0 5px', overflow: 'hidden'
                                            }}>
                                                {historialIntensidad.map((val, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(2, val)}%` }}
                                                        style={{
                                                            flex: 1,
                                                            background: val > 80 ? '#ef4444' : '#22c55e',
                                                            borderRadius: '1px'
                                                        }}
                                                    />
                                                ))}
                                                {/* Espaciador para empujar hacia la izquierda */}
                                                <div style={{ flex: 100 - historialIntensidad.length }} />
                                            </div>

                                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <motion.div
                                                    style={{ height: '100%', background: '#22c55e' }}
                                                    animate={{ width: `${intensidad}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* MODO PREVIEW / CONFIRMACIÓN */}
                                    {urlPreview && !estaGrabando && (
                                        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '15px', border: '1px solid #3b82f6', marginBottom: '10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '10px' }}>👂 REVISAR GRABACIÓN</p>

                                            <audio src={urlPreview} controls style={{ width: '100%', marginBottom: '10px', height: '35px' }} />

                                            {/* ✅ NOTA DE CONSULTA TÉCNICA APLICADA */}
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                                                <p style={{ fontSize: '9px', color: '#888', fontStyle: 'italic', margin: 0 }}>
                                                    ℹ️ <strong>Verificado:</strong> Se aplica normalización a -1.0dB para mantener el "headroom" profesional, permitiendo polifonía sin distorsión digital.
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setUltimoBlobGrabado(null);
                                                        limpiarPreview();
                                                    }}
                                                    style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                >
                                                    DESCARTAR
                                                </button>
                                                <button
                                                    onClick={subirNotaConfirmada}
                                                    disabled={estaProcesando}
                                                    style={{ flex: 2, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                >
                                                    {estaProcesando ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                                    CONFIRMAR Y GUARDAR
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button
                                            onClick={iniciarGrabacion}
                                            disabled={estaProcesando || estaGrabando || conteoAtras > 0}
                                            style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Mic size={18} /> {estaGrabando ? 'GRABANDO' : 'GRABAR MIC'}
                                        </button>

                                        <button
                                            onClick={() => document.getElementById('subir-audio')?.click()}
                                            disabled={estaProcesando || estaGrabando}
                                            style={{ flex: 1, padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Plus size={18} /> SUBIR AUDIO
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        accept="audio/*"
                                        id="subir-audio"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && botonParaGrabar) {
                                                const btnData = mapaBotonesPorId[botonParaGrabar];
                                                const fuelleBoton = botonParaGrabar.includes('halar') ? 'halar' : 'empujar';

                                                const sufijo = tipoBajoPersonalizado !== 'ninguno' ? tipoBajoPersonalizado : '';
                                                let nombreFinal = nombreNotaPersonalizada || btnData.nombre;

                                                if (nombreFinal.endsWith('M') || nombreFinal.endsWith('m')) {
                                                    nombreFinal = nombreFinal.slice(0, -1);
                                                }
                                                nombreFinal += sufijo;

                                                await subirMuestraReal(file, botonParaGrabar, {
                                                    fuelle: fuelleBoton,
                                                    esBajo: botonParaGrabar.includes('bajo'),
                                                    nombreNota: nombreFinal,
                                                    octava: octavaPersonalizada
                                                });
                                                recargarMuestras?.();
                                            }
                                        }}
                                    />

                                    {mensajeEstado && (
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                            <Loader2 size={12} className="anima-spin" />
                                            <p style={{ fontSize: '9px', color: '#aaa' }}>{mensajeEstado}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #444', borderRadius: '15px' }}>
                                    <Mic size={30} color="#444" style={{ marginBottom: '10px' }} />
                                    <p style={{ fontSize: '11px', color: '#888' }}>Haz clic en un pito o bajo para seleccionarlo...</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                        <button onClick={guardarAjustes} className="boton-accion-panel" style={{ background: '#22c55e', color: 'white' }}>GUARDAR CAMBIOS</button>
                        <button onClick={resetearAjustes} className="boton-accion-panel" style={{ background: '#444', color: 'white' }}>REINICIAR</button>
                    </div>
                </motion.div>
            )}

            {/* 🪗 CUERPO DEL ACORDEÓN (SIMULADOR) */}
            <motion.div
                className={`disposicion-acordeon ${modoAjuste ? 'en-ajuste' : ''}`}
                style={{
                    '--imagen-fondo-acordeon': `url('${imagenFondo}')`,
                    '--sim-tamano': ajustes.tamano,
                    '--sim-x': ajustes.x,
                    '--sim-y': ajustes.y,
                    '--sim-pitos-boton-tamano': ajustes.pitosBotonTamano,
                    '--sim-pitos-fuente-tamano': ajustes.pitosFuenteTamano,
                    '--sim-bajos-boton-tamano': ajustes.bajosBotonTamano,
                    '--sim-bajos-fuente-tamano': ajustes.bajosFuenteTamano,
                    '--sim-teclas-left': ajustes.teclasLeft,
                    '--sim-teclas-top': ajustes.teclasTop,
                    '--sim-bajos-left': ajustes.bajosLeft,
                    '--sim-bajos-top': ajustes.bajosTop
                } as any}
            >
                {/* 🎹 LADO PITOS (DERECHA) */}
                <div className={`lado-teclas ${modoAjuste ? 'en-ajuste' : ''}`}>
                    {filas.map(f => (
                        <div key={f} className={`fila ${f === 'primeraFila' ? 'tres' : f === 'segundaFila' ? 'dos' : 'uno'}`}>
                            {disposicion[f].filter(b => b.id.includes(direccion)).map(b => (
                                <div
                                    key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion}`}
                                    onMouseDown={() => {
                                        if (modoAjuste && pestanaActiva === 'grabacion') {
                                            setBotonParaGrabar(b.id);
                                        } else {
                                            actualizarBotonActivo(b.id, 'add');
                                        }
                                    }}
                                    onMouseUp={() => actualizarBotonActivo(b.id, 'remove')}
                                    onMouseLeave={() => actualizarBotonActivo(b.id, 'remove')}
                                >
                                    {mostrarDobleNota ? (() => {
                                        const idHalar = b.id.replace(direccion, 'halar');
                                        const idEmpujar = b.id.replace(direccion, 'empujar');

                                        // Filtrar notas que no existan en el instrumento grabado (basura visual)
                                        const tieneHalar = !instrumentoSeleccionado || muestrasCargadas[`${idHalar}_halar`];
                                        const tieneEmpujar = !instrumentoSeleccionado || muestrasCargadas[`${idEmpujar}_empujar`];

                                        if (!tieneHalar && !tieneEmpujar) return null;

                                        return (
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', height: '100%',
                                                justifyContent: 'center', gap: '2px', fontSize: '0.7em', lineHeight: '1'
                                            }}>
                                                {tieneHalar && (
                                                    <span style={{ color: '#3b82f6', fontWeight: '900', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                                                        {getContenidoBoton(idHalar, true)}
                                                    </span>
                                                )}

                                                {tieneHalar && tieneEmpujar && (
                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '60%', margin: '0 auto' }} />
                                                )}

                                                {tieneEmpujar && (
                                                    <span style={{ color: '#f97316', fontWeight: '900', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                                                        {getContenidoBoton(idEmpujar, false)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <span style={{
                                            color: direccion === 'halar' ? '#3b82f6' : '#f97316',
                                            fontWeight: '900', letterSpacing: '-0.3px'
                                        }}>
                                            {(modoVista === 'teclas') ? (Object.keys(mapaTeclas).find(k => mapaTeclas[k].fila === parseInt(b.id.split('-')[0]) && mapaTeclas[k].columna === parseInt(b.id.split('-')[1])) || '').toUpperCase() :
                                                (modoVista === 'numeros') ? b.id.split('-')[1] :
                                                    (!instrumentoSeleccionado || muestrasCargadas[`${b.id}_${direccion}`]) ? getContenidoBoton(b.id, direccion === 'halar') : ''}
                                        </span>
                                    )}
                                </div>
                            ))}
                            <span style={{ fontSize: '9px', fontWeight: 'bold', textShadow: '1px 1px 2px #000', color: 'white', opacity: 0.9 }}>{getFilaDisplay(f)}</span>
                        </div>
                    ))}
                </div>

                {/* 🎸 LADO BAJOS (IZQUIERDA) */}
                <div className={`lado-bajos ${modoAjuste ? 'en-ajuste' : ''}`}>
                    {filasBajos.map(f => (
                        <div key={f} className={`fila ${f}`}>
                            {disposicionBajos[f].filter(b => b.id.includes(direccion)).map(b => (
                                <div
                                    key={b.id}
                                    className={`boton ${botonesActivos[b.id] ? 'activo' : ''} ${direccion}`}
                                    onMouseDown={() => {
                                        if (modoAjuste && pestanaActiva === 'grabacion') {
                                            setBotonParaGrabar(b.id);
                                        } else {
                                            actualizarBotonActivo(b.id, 'add');
                                        }
                                    }}
                                    onMouseUp={() => actualizarBotonActivo(b.id, 'remove')}
                                    onMouseLeave={() => actualizarBotonActivo(b.id, 'remove')}
                                >
                                    {mostrarDobleNota ? (() => {
                                        const idHalar = b.id.replace(direccion, 'halar');
                                        const idEmpujar = b.id.replace(direccion, 'empujar');

                                        // Filtrar notas de bajos inexistentes
                                        const tieneHalar = !instrumentoSeleccionado || muestrasCargadas[`${idHalar}_halar`];
                                        const tieneEmpujar = !instrumentoSeleccionado || muestrasCargadas[`${idEmpujar}_empujar`];

                                        if (!tieneHalar && !tieneEmpujar) return null;

                                        return (
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', height: '100%',
                                                justifyContent: 'center', gap: '0px', lineHeight: '0.9'
                                            }}>
                                                {tieneHalar && (
                                                    <span style={{ color: '#3b82f6', fontWeight: '900', fontSize: '0.55em' }}>
                                                        {getContenidoBoton(idHalar, true)}
                                                    </span>
                                                )}

                                                {tieneHalar && tieneEmpujar && (
                                                    <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.15)', width: '40%', margin: '1px auto' }} />
                                                )}

                                                {tieneEmpujar && (
                                                    <span style={{ color: '#f97316', fontWeight: '900', fontSize: '0.55em' }}>
                                                        {getContenidoBoton(idEmpujar, false)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <span style={{
                                            color: direccion === 'halar' ? '#3b82f6' : '#f97316',
                                            fontWeight: '900', letterSpacing: '-0.3px'
                                        }}>
                                            {(modoVista === 'teclas') ? (Object.keys(mapaTeclasBajos).find(k => mapaTeclasBajos[k].fila === parseInt(b.id.split('-')[0]) && mapaTeclasBajos[k].columna === parseInt(b.id.split('-')[1])) || '').toUpperCase() :
                                                (modoVista === 'numeros') ? b.id.split('-')[1] :
                                                    (!instrumentoSeleccionado || muestrasCargadas[`${b.id}_${direccion}`]) ? getContenidoBoton(b.id, direccion === 'halar') : ''}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
});

export default AcordeonSimulador;
