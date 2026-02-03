import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { mapaTeclas } from './mapaTecladoYFrecuencias';
import {
    mapaTeclasBajos,
    disposicion,
    disposicionBajos,
    mapaBotonesPorId,
    filas,
    filasBajos,
    tonosFilas,
    cambiarFuelle,
    type BotonNota
} from './notasAcordeonDiatonico';
import './AcordeonSimulador.css';
import bgAcordeonDefault from './Acordeon PRO MAX.png'; // Import default image

// Tipos
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
    reproducirTono: (id: string) => { oscillator: OscillatorNode | OscillatorNode[] | null };
    simularActivacionNota: (notaId: string, fuelleDireccion: 'halar' | 'empujar', duracionMs?: number) => void;
    simularDesactivacionNota: (notaId: string) => number;
}

const AcordeonSimulador = forwardRef<AcordeonSimuladorHandle, AcordeonSimuladorProps>(({
    direccion: direccionProp = 'halar',
    afinacion = 'FBE',
    modoEditor = false,
    grabando = false,
    pausado = false,
    // reproduciendo = false,
    deshabilitarInteraccion = false,
    prefijoIdBoton = '',
    imagenFondo = bgAcordeonDefault,
    anticipacionAcordeonGuia = 2000,
    onGrabarNota,
    onFinalizarNota,
    onCambiarFuelle,
    onNotaPresionada,
    onNotaLiberada,
    onCambioFuelle
}, ref) => {

    // Estado local para UI
    const [botonesActivos, setBotonesActivos] = useState<Record<string, any>>({});
    const [direccion, setDireccion] = useState<'halar' | 'empujar'>(direccionProp);

    // Refs para lógica interna (mutable sin re-render)
    const audioRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const ultimasTeclasPulsadas = useRef<Map<string, number>>(new Map());
    const botonesActivosRef = useRef<Record<string, any>>({}); // Espejo de estado para acceso síncrono
    const teclasFisicasPresionadas = useRef<Set<string>>(new Set());
    const mousePresionado = useRef<boolean>(false);
    const ultimoCambioFuelle = useRef<number>(0);
    const contenedorNotasVoladorasRef = useRef<HTMLDivElement>(null);
    const intervalLimpiezaRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Refs para estado "fresco" en event listeners y callbacks
    const direccionRef = useRef(direccion);
    const deshabilitarRef = useRef(deshabilitarInteraccion);

    // Callbacks externos
    const funcionObtenerCoordenadasJugador = useRef<any>(null);
    const funcionActivarNotaEnJugador = useRef<any>(null);

    // Sincronizar refs
    useEffect(() => {
        direccionRef.current = direccion;
    }, [direccion]);

    useEffect(() => {
        deshabilitarRef.current = deshabilitarInteraccion;
    }, [deshabilitarInteraccion]);

    // Sincronizar prop direccion con estado si cambia externamente (pero cuidado con loops)
    useEffect(() => {
        if (direccionProp !== direccion) {
            setDireccion(direccionProp);
        }
    }, [direccionProp]);

    // Sincronizar ref con estado
    useEffect(() => {
        botonesActivosRef.current = botonesActivos;
    }, [botonesActivos]);


    // --- Inicialización de Audio ---
    useEffect(() => {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
            audioRef.current = new AudioCtor();
            gainNodeRef.current = audioRef.current.createGain();
            gainNodeRef.current.gain.value = 0.1;
            gainNodeRef.current.connect(audioRef.current.destination);
        }

        if (modoEditor) {
            iniciarLimpiezaAutomatica();
        }

        // Event listeners globales
        const handleKeyDown = (e: KeyboardEvent) => manejarEventoTeclado(e, true);
        const handleKeyUp = (e: KeyboardEvent) => manejarEventoTeclado(e, false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // window.addEventListener('keyup', manejarTeclaGlobalLiberada); // redundancy check: manejarEventoTeclado handles keyup logic too? No, separated logic for global release.
        window.addEventListener('keyup', manejarTeclaGlobalLiberada);
        window.addEventListener('mouseup', manejarMouseGlobalLiberado);
        window.addEventListener('blur', manejarPerdidaFoco);

        return () => {
            detenerLimpiezaAutomatica();
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('keyup', manejarTeclaGlobalLiberada);
            window.removeEventListener('mouseup', manejarMouseGlobalLiberado);
            window.removeEventListener('blur', manejarPerdidaFoco);
            if (audioRef.current) {
                audioRef.current.close();
            }
        };
    }, []);

    // --- Funciones Helper ---

    const getFilaClase = (filaNombre: string) => ({
        'primeraFila': 'tres',
        'segundaFila': 'dos',
        'terceraFila': 'uno'
    }[filaNombre] || filaNombre);

    const obtenerNombreBoton = (id: string) => {
        return mapaBotonesPorId[id]?.nombre || id;
    };

    // --- Lógica de Negocio ---

    const detenerTono = (id: string) => {
        const botonActivo = botonesActivosRef.current[id];
        if (!botonActivo?.oscillator) return;

        try {
            if (Array.isArray(botonActivo.oscillator)) {
                botonActivo.oscillator.forEach((osc: any) => {
                    if (osc && osc.stop) osc.stop();
                });
            } else {
                if (botonActivo.oscillator && botonActivo.oscillator.stop) {
                    botonActivo.oscillator.stop();
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error al detener tono ${id}:`, error);
        }
    };

    const reproducirTono = (id: string): { oscillator: OscillatorNode | OscillatorNode[] | null } => {
        if (!audioRef.current || !gainNodeRef.current || !mapaBotonesPorId[id]) return { oscillator: null };

        // Resume audio context if suspended (browser autoplay policy)
        if (audioRef.current.state === 'suspended') {
            audioRef.current.resume();
        }

        const { frecuencia } = mapaBotonesPorId[id];
        let oscillator: OscillatorNode | OscillatorNode[];

        if (Array.isArray(frecuencia)) {
            oscillator = frecuencia.map(hz => {
                const osc = audioRef.current!.createOscillator();
                osc.type = 'sawtooth';
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

    const actualizarBotonActivo = useCallback((id: string, accion: 'add' | 'remove' = 'add') => {
        if (deshabilitarRef.current) return;

        const ahora = Date.now();
        const dirActual = direccionRef.current; // Usar ref para evitar estado stale

        if (accion === 'add') {
            if (ahora - ultimoCambioFuelle.current < 100) {
                console.log(`🚫 Ignorando activación muy cerca del cambio de fuelle: ${id}`);
                return;
            }

            if (botonesActivosRef.current[id]) return; // Ya activo

            // Finalizar nota previa si existe y modo editor
            if (botonesActivosRef.current[id] && modoEditor) {
                onNotaLiberada?.({ idBoton: id, nombre: obtenerNombreBoton(id) });
                if (onFinalizarNota) onFinalizarNota(id);
                detenerTono(id);
            }

            const { oscillator } = reproducirTono(id);
            const colorFuelle = dirActual === 'empujar' ? 'verde' : 'rojo';

            const nuevaNota = {
                oscillator,
                ...mapaBotonesPorId[id],
                colorFuelle,
                direccionFuelle: dirActual,
                tiempoActivacion: ahora
            };

            // update state and ref
            const newState = { ...botonesActivosRef.current, [id]: nuevaNota };
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);

            mousePresionado.current = true;

            onNotaPresionada?.({ idBoton: id, nombre: obtenerNombreBoton(id) });
            if (modoEditor && onGrabarNota) onGrabarNota(id, 'mouse');

        } else if (accion === 'remove' && botonesActivosRef.current[id]) {
            onNotaLiberada?.({ idBoton: id, nombre: obtenerNombreBoton(id) });
            if (modoEditor && onFinalizarNota) onFinalizarNota(id);

            detenerTono(id);

            const newState = { ...botonesActivosRef.current };
            delete newState[id];
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);
        }
    }, [deshabilitarInteraccion, modoEditor, onFinalizarNota, onGrabarNota, onNotaLiberada, onNotaPresionada]); // Deps still relevant for callback identity, but internal logic uses refs.


    const detenerTodosLosSonidos = () => {
        Object.keys(botonesActivosRef.current).forEach(id => detenerTono(id));
        botonesActivosRef.current = {};
        setBotonesActivos({});
    };

    const limpiarBotonesActivos = () => {
        botonesActivosRef.current = {};
        setBotonesActivos({});
    }

    const cambiarDireccionFunc = (nuevaDireccion: 'halar' | 'empujar') => {
        if (direccionRef.current === nuevaDireccion) return;

        const notasActivas = Object.keys(botonesActivosRef.current);
        if (notasActivas.length > 0) {
            detenerTodosLosSonidos();
        }

        setDireccion(nuevaDireccion); // This triggers ref update in useEffect
        direccionRef.current = nuevaDireccion; // Immediate update for synchronous logic following calling code
        ultimoCambioFuelle.current = Date.now();

        onCambioFuelle?.({ direccion: nuevaDireccion });

        teclasFisicasPresionadas.current.clear();
        mousePresionado.current = false;
    };

    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (direccionRef.current === nuevaDireccion) return;

        if (deshabilitarRef.current) {
            setDireccion(nuevaDireccion);
            return;
        }

        setDireccion(nuevaDireccion);
        const nuevosBotonesActivos: Record<string, any> = {};

        for (const [keyId, keyValues] of Object.entries(botonesActivosRef.current)) {
            if (modoEditor && grabando && !pausado) {
                onFinalizarNota?.(keyId);
            }

            // Detener osciladores viejos
            const val = keyValues as any;
            if (Array.isArray(val.oscillator)) {
                val.oscillator.forEach((hz: any) => { try { hz?.stop() } catch (e) { } })
            } else {
                try { val.oscillator?.stop() } catch (e) { }
            }

            // Calcular nueva nota equivalente
            // const parts = keyId.split('-');
            // [fila, columna, direccion, opcional 'bajo']
            // keyId format: "1-1-halar" or "1-1-halar-bajo"

            // Reconstruir ID invirtiendo dirección
            // Esto asume formato estricto: fila-columna-DIR[-bajo]
            const esBajo = keyId.includes('-bajo');
            const baseId = keyId.replace('-halar', '').replace('-empujar', '').replace('-bajo', '');
            // baseId might be "1-1"

            const nuevoKeyId = `${baseId}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;

            if (mapaBotonesPorId[nuevoKeyId]) {
                const { oscillator } = reproducirTono(nuevoKeyId);
                nuevosBotonesActivos[nuevoKeyId] = { oscillator, ...mapaBotonesPorId[nuevoKeyId] };

                if (modoEditor && grabando && !pausado) {
                    onGrabarNota?.(nuevoKeyId, 'fuelle');
                }
            }
        }

        botonesActivosRef.current = nuevosBotonesActivos;
        setBotonesActivos(nuevosBotonesActivos);

        onCambioFuelle?.({ direccion: nuevaDireccion, botonesActivos: nuevosBotonesActivos });
        if (onCambiarFuelle) onCambiarFuelle(nuevaDireccion, nuevosBotonesActivos);
    };


    const manejarEventoTeclado = (e: KeyboardEvent | React.KeyboardEvent, esPresionada: boolean) => {
        if (deshabilitarRef.current) return;
        if (!e.target) return;
        const target = e.target as HTMLElement;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

        const tecla = e.key.toLowerCase();

        if (tecla === cambiarFuelle) {
            manejarCambioFuelle(esPresionada ? 'empujar' : 'halar');
            return;
        }

        const datoBoton = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
        if (!datoBoton) return;

        const { fila, columna } = datoBoton;
        const esBajo = !!mapaTeclasBajos[tecla];
        const dirActual = direccionRef.current;
        const id = `${fila}-${columna}-${dirActual}${esBajo ? '-bajo' : ''}`;

        if (modoEditor && esPresionada) {
            // Debounce simple
            const ahora = Date.now();
            const ultimaTecla = ultimasTeclasPulsadas.current.get(tecla);
            if (ultimaTecla && (ahora - ultimaTecla) < 20) return;
            ultimasTeclasPulsadas.current.set(tecla, ahora);

            if (botonesActivosRef.current[id]) {
                onFinalizarNota?.(id);
                detenerTono(id);
            }

            const { oscillator } = reproducirTono(id);
            const newState = {
                ...botonesActivosRef.current,
                [id]: { oscillator, ...mapaBotonesPorId[id] }
            };
            botonesActivosRef.current = newState;
            setBotonesActivos(newState);

            onNotaPresionada?.({ id, tipo: 'teclado' });
            onGrabarNota?.(id, 'teclado');
            e.preventDefault();

        } else {
            // Modo normal
            if (esPresionada) {
                onNotaPresionada?.({ id, tipo: 'teclado' });
                actualizarBotonActivo(id, 'add');
            } else {
                onNotaLiberada?.({ id, tipo: 'teclado' });
                actualizarBotonActivo(id, 'remove');
            }
        }
    };

    const limpiarTodasLasNotas = () => {
        if (deshabilitarRef.current) return;

        Object.values(botonesActivosRef.current).forEach((keyValues: any) => {
            if (Array.isArray(keyValues.oscillator)) {
                keyValues.oscillator.forEach((hz: any) => hz?.stop());
            } else {
                keyValues.oscillator?.stop();
            }
        });

        botonesActivosRef.current = {};
        setBotonesActivos({});
    };

    function manejarTeclaGlobalLiberada(event: KeyboardEvent) {
        if (!modoEditor || !grabando) return;
        if (event.key === 'Escape') forzarLiberacionTeclas();
    }

    function manejarMouseGlobalLiberado(event: MouseEvent) {
        if (!modoEditor || !grabando) return;
        mousePresionado.current = false;
        const acordeonElement = document.querySelector('.disposicion-acordeon');
        if (acordeonElement && !acordeonElement.contains(event.target as Node)) {
            forzarLiberacionTeclas();
        }
    }

    function manejarPerdidaFoco() {
        if (!modoEditor || !grabando) return;
        console.log('🔍 Pérdida de foco detectada - Liberando teclas');
        forzarLiberacionTeclas();
    }

    const forzarLiberacionTeclas = () => {
        Object.keys(botonesActivosRef.current).forEach(id => {
            actualizarBotonActivo(id, 'remove');
        });
        teclasFisicasPresionadas.current.clear();
        mousePresionado.current = false;
    };

    const verificarNotasColgadas = () => {
        const ahora = Date.now();
        const tiempoMaximo = 5000;
        const notasColgadas = Object.entries(botonesActivosRef.current).filter(([_, nota]: [string, any]) => {
            return nota.tiempoActivacion && (ahora - nota.tiempoActivacion) > tiempoMaximo;
        });

        if (notasColgadas.length > 0) {
            console.log(`🧹 Limpiando ${notasColgadas.length} notas colgadas`);
            notasColgadas.forEach(([id]) => actualizarBotonActivo(id, 'remove'));
        }
        return notasColgadas.length;
    };

    const iniciarLimpiezaAutomatica = () => {
        if (intervalLimpiezaRef.current) clearInterval(intervalLimpiezaRef.current);
        intervalLimpiezaRef.current = setInterval(() => {
            if (modoEditor && grabando) verificarNotasColgadas();
        }, 1000);
    };

    const detenerLimpiezaAutomatica = () => {
        if (intervalLimpiezaRef.current) {
            clearInterval(intervalLimpiezaRef.current);
            intervalLimpiezaRef.current = null;
        }
    };

    // --- Funciones para Botones Voladores ---

    const encontrarNotaCompleta = (notaId: string, fuelleDireccion: string) => {
        // Intenta encontrar la ID exacta en el mapa
        const posiblesIds = Object.keys(mapaBotonesPorId).filter(id =>
            id.includes(notaId) && id.includes(fuelleDireccion)
        );
        if (posiblesIds.length > 0) return posiblesIds[0];

        // búsqueda laxa
        const idsSinDireccion = Object.keys(mapaBotonesPorId).filter(id => id.includes(notaId));
        return idsSinDireccion[0] || null;
    };

    const crearBotonVolador = (notaCompleta: string, colorFuelle: string, fuelleDireccion: string, duracionMs: number = 300, anticipacionGuia: number = 2000) => {
        if (!contenedorNotasVoladorasRef.current) return;

        try {
            const idBusqueda = prefijoIdBoton ? `${prefijoIdBoton}-${notaCompleta}` : notaCompleta;
            const botonOriginal = document.getElementById(idBusqueda);

            if (!botonOriginal) {
                console.warn('⚠️ Botón original no encontrado:', idBusqueda);
                return;
            }

            const rectBoton = botonOriginal.getBoundingClientRect();

            // Clonar
            const botonClon = botonOriginal.cloneNode(true) as HTMLElement;
            botonClon.style.position = 'fixed';
            botonClon.style.left = `${rectBoton.left}px`;
            botonClon.style.top = `${rectBoton.top}px`;
            botonClon.style.width = `${rectBoton.width}px`;
            botonClon.style.height = `${rectBoton.height}px`;
            botonClon.style.zIndex = '9999';
            botonClon.style.pointerEvents = 'none';
            botonClon.style.transform = 'scale(1)';
            botonClon.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
            botonClon.style.border = `3px solid ${colorFuelle === 'verde' ? '#4ade80' : '#ef4444'}`;
            botonClon.style.backgroundColor = colorFuelle === 'verde' ? '#22c55e' : '#dc2626';
            botonClon.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            contenedorNotasVoladorasRef.current.appendChild(botonClon);

            // Calcular destino
            let posicionFinal = {
                left: window.innerWidth - 200,
                top: rectBoton.top
            };

            if (funcionObtenerCoordenadasJugador.current) {
                const coords = funcionObtenerCoordenadasJugador.current(notaCompleta);
                if (coords) {
                    posicionFinal = {
                        left: coords.centerX - (rectBoton.width / 2),
                        top: coords.centerY - (rectBoton.height / 2)
                    };
                }
            }

            requestAnimationFrame(() => {
                if (botonClon) {
                    botonClon.style.left = `${posicionFinal.left}px`;
                    botonClon.style.top = `${posicionFinal.top}px`;
                    botonClon.style.transform = 'scale(0.8)';
                    botonClon.style.opacity = '0.8';
                }
            });

            // Timing
            const tiempoAnimacion = 1500;
            const retrasoCorrector = anticipacionGuia - tiempoAnimacion; // Puede ser negativo si la anticipación es corta

            setTimeout(() => {
                if (funcionActivarNotaEnJugador.current) {
                    funcionActivarNotaEnJugador.current(notaCompleta, fuelleDireccion, duracionMs);
                }
                if (botonClon && botonClon.parentNode) {
                    botonClon.parentNode.removeChild(botonClon);
                }
            }, tiempoAnimacion + retrasoCorrector);


        } catch (error) {
            console.error('💥 Error creando botón volador:', error);
        }
    };


    const simularActivacionNota = (notaId: string, fuelleDireccion: 'halar' | 'empujar', duracionMs: number = 400) => {
        // Force short duration to avoid sticking
        const duracion = Math.min(duracionMs || 400, 800);

        console.log('🎮 ACTIVANDO NOTA:', notaId, fuelleDireccion, 'Duración:', duracion, 'ms');

        simularDesactivacionNota(notaId);

        if (fuelleDireccion && fuelleDireccion !== direccionRef.current) {
            setDireccion(fuelleDireccion);
            // Ojo: cambiarDireccion aquí es async en React, pero `direccion` se usa abajo?
            // En Svelte era síncrono.
            // Aquí `direccion` variable local no cambiará a tiempo para logic abajo si depende de estado.
            // Pero `fuelleDireccion` se pasa explicitamente a `crearBotonVolador` etc.
        }

        const notaCompleta = encontrarNotaCompleta(notaId, fuelleDireccion);
        if (!notaCompleta) return;

        const colorFuelle = fuelleDireccion === 'empujar' ? 'verde' : 'rojo';
        let oscillator: OscillatorNode | OscillatorNode[] | null = null;

        if (!deshabilitarRef.current) {
            const res = reproducirTono(notaCompleta);
            oscillator = res.oscillator;
        }

        const nuevaNota = {
            oscillator,
            ...mapaBotonesPorId[notaCompleta],
            colorFuelle,
            direccionFuelle: fuelleDireccion,
            duracionMs: duracion,
            tiempoActivacion: Date.now()
        };

        const newState = { ...botonesActivosRef.current, [notaCompleta]: nuevaNota };
        botonesActivosRef.current = newState;
        setBotonesActivos(newState);

        if (deshabilitarRef.current) {
            crearBotonVolador(notaCompleta, colorFuelle, fuelleDireccion, duracion, anticipacionAcordeonGuia);
        }

        if (!deshabilitarRef.current) {
            setTimeout(() => {
                simularDesactivacionNota(notaId);
            }, duracion);
        }
    };

    const simularDesactivacionNota = (notaId: string) => {
        let notasADesactivar: string[] = [];
        if (botonesActivosRef.current[notaId]) notasADesactivar.push(notaId);

        if (notasADesactivar.length === 0) {
            notasADesactivar = Object.keys(botonesActivosRef.current).filter(id => {
                const notaBase = notaId.replace(/-empujar|-halar/g, '');
                const idBase = id.replace(/-empujar|-halar/g, '');
                return idBase === notaBase;
            });
        }

        notasADesactivar.forEach(notaCompleta => {
            if (!deshabilitarRef.current && botonesActivosRef.current[notaCompleta]) {
                detenerTono(notaCompleta);
            }
        });

        const newState = { ...botonesActivosRef.current };
        notasADesactivar.forEach(id => delete newState[id]);
        botonesActivosRef.current = newState;
        setBotonesActivos(newState);

        return notasADesactivar.length;
    };


    // Exponer métodos
    useImperativeHandle(ref, () => ({
        establecerCoordenadasAcordeonJugador: (fn) => { funcionObtenerCoordenadasJugador.current = fn; },
        establecerCallbackActivacionJugador: (fn) => { funcionActivarNotaEnJugador.current = fn; },
        resetearEstado: () => {
            detenerTodosLosSonidos();
            botonesActivosRef.current = {};
            setBotonesActivos({});
            teclasFisicasPresionadas.current.clear();
            mousePresionado.current = false;
            ultimasTeclasPulsadas.current.clear();
        },
        detenerTodosLosSonidos,
        limpiarBotonesActivos,
        cambiarDireccion: cambiarDireccionFunc,
        forzarLiberacionTeclas,
        verificarNotasColgadas,
        iniciarLimpiezaAutomatica,
        detenerLimpiezaAutomatica,
        detenerTono,
        actualizarBotonActivo,
        manejarEventoTeclado,
        limpiarTodasLasNotas,
        reproducirTono,
        simularActivacionNota,
        simularDesactivacionNota
    }));

    // --- Render ---

    return (
        <>
            {/* Event Listeners en el body no funcionan en React igual que Svelte:body, 
          usamos useEffect global ya definido. */}

            <div
                className="disposicion-acordeon"
                style={{ '--imagen-fondo-acordeon': `url('${imagenFondo}')` } as React.CSSProperties}
                onMouseUp={limpiarTodasLasNotas} // Global mouse up en el contendor
            >
                {/* Teclado lado derecho */}
                <div className="lado-teclas">
                    {filas.map(filaNombre => (
                        <div key={filaNombre} className={`fila ${getFilaClase(filaNombre)}`}>
                            {disposicion[filaNombre].map(boton => {
                                const esActivo = botonesActivos[boton.id];
                                const direccionBoton = esActivo?.direccionFuelle || direccion;
                                const colorFuelle = esActivo?.colorFuelle || (direccionBoton === 'empujar' ? 'verde' : 'rojo');

                                if (!boton.id.includes(direccion)) return null;

                                return (
                                    <div
                                        key={boton.id}
                                        className={`boton ${esActivo ? 'activo' : ''} ${direccionBoton} color-${colorFuelle} ${deshabilitarInteraccion ? 'no-interaccion' : ''} ${direccionBoton === 'empujar' ? 'fuelle-empujar' : ''} ${direccionBoton === 'halar' ? 'fuelle-halar' : ''}`}
                                        id={prefijoIdBoton ? `${prefijoIdBoton}-${boton.id}` : boton.id}
                                        onMouseDown={() => !deshabilitarInteraccion && actualizarBotonActivo(boton.id, 'add')}
                                        onMouseUp={() => !deshabilitarInteraccion && modoEditor ? actualizarBotonActivo(boton.id, 'remove') : undefined}
                                        role="button"
                                        tabIndex={deshabilitarInteraccion ? -1 : 0}
                                        aria-pressed={!!esActivo}
                                        aria-label={`Nota: ${boton.nombre} - ${direccionBoton} - ${colorFuelle}`}
                                    >
                                        {boton.nombre}
                                    </div>
                                );
                            })}
                            <h4>{tonosFilas[afinacion] && tonosFilas[afinacion][filaNombre]}<br />{filaNombre}</h4>
                        </div>
                    ))}
                </div>

                {/* Bajos lado izquierdo */}
                <div className="lado-bajos">
                    {filasBajos.map(filaBajoNombre => (
                        <div key={filaBajoNombre} className={`fila ${filaBajoNombre}`}>
                            {disposicionBajos[filaBajoNombre].map(botonBajo => {
                                const esActivoBajo = botonesActivos[botonBajo.id];
                                const direccionBotonBajo = esActivoBajo?.direccionFuelle || direccion;
                                const colorFuelleBajo = esActivoBajo?.colorFuelle || (direccionBotonBajo === 'empujar' ? 'verde' : 'rojo');

                                if (!botonBajo.id.includes(direccion)) return null;

                                return (
                                    <div
                                        key={botonBajo.id}
                                        className={`boton ${esActivoBajo ? 'activo' : ''} ${direccionBotonBajo} color-${colorFuelleBajo} ${deshabilitarInteraccion ? 'no-interaccion' : ''} ${direccionBotonBajo === 'empujar' ? 'fuelle-empujar' : ''} ${direccionBotonBajo === 'halar' ? 'fuelle-halar' : ''}`}
                                        id={prefijoIdBoton ? `${prefijoIdBoton}-${botonBajo.id}` : botonBajo.id}
                                        onMouseDown={() => !deshabilitarInteraccion && actualizarBotonActivo(botonBajo.id, 'add')}
                                        onMouseUp={() => !deshabilitarInteraccion && modoEditor ? actualizarBotonActivo(botonBajo.id, 'remove') : undefined}
                                        role="button"
                                        tabIndex={deshabilitarInteraccion ? -1 : 0}
                                        aria-pressed={!!esActivoBajo}
                                        aria-label={`Bajo: ${botonBajo.nombre} - ${direccionBotonBajo}`}
                                    >
                                        {botonBajo.nombre}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contenedor notas voladoras */}
            <div ref={contenedorNotasVoladorasRef} className="notas-voladoras-container"></div>
        </>
    );
});

export default AcordeonSimulador;
