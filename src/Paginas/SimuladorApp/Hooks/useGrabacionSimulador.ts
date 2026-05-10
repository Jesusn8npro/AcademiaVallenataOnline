import { useCallback, useEffect, useRef, useState } from 'react';
import { useGrabacionProMax } from '../../AcordeonProMax/Hooks/useGrabacionProMax';
import { useMetronomo } from './useMetronomo';

type LoopsApi = {
    pistaActiva: any;
    velocidad: number;
    volumen: number;
    obtenerPosicion: () => number;
};
type MetronomoApi = ReturnType<typeof useMetronomo>;
type LogicaApi = any;

export type SnapshotMetronomoRec = {
    activo: boolean;
    bpm: number;
    compas: number;
    subdivision: number;
    sonido: any;
    volumen: number;
};

interface GrabacionParams {
    logica: LogicaApi;
    loops: LoopsApi;
    metronomoVivo: MetronomoApi;
    bpm: number;
    // Refs estables expuestos al useLogicaAcordeon antes de que este hook se
    // monte. Los rellenamos en el body con los handlers de la grabacion para
    // que la cadena press/release alimente la captura sin race conditions.
    registrarPresionRef: React.MutableRefObject<(idBoton: string, fuelle: 'abriendo' | 'cerrando') => void>;
    registrarLiberacionRef: React.MutableRefObject<(idBoton: string) => void>;
    direccionRefGrab: React.MutableRefObject<'halar' | 'empujar'>;
}

/**
 * Grabacion de practica libre del simulador. Lifted aqui para que (a) la
 * captura siga viva al cerrar modales y (b) podamos snapshot del metronomo
 * en REC y guardar metadata de loop al detener.
 *
 * En modo libre (fuera de juego) los refs de cancion/estadisticas/modo se
 * dejan vacios — el grabador solo usa la secuencia de presses/releases.
 */
export const useGrabacionSimulador = ({
    logica,
    loops,
    metronomoVivo,
    bpm,
    registrarPresionRef,
    registrarLiberacionRef,
    direccionRefGrab,
}: GrabacionParams) => {
    // useGrabacionProMax requiere refs para cancion/estadisticas/modo/seccion.
    const cancionRefGrab = useRef<any>(null);
    const estadisticasRefGrab = useRef<any>({
        notasPerfecto: 0, notasBien: 0, notasFalladas: 0, notasPerdidas: 0,
        rachaActual: 0, rachaMasLarga: 0, multiplicador: 1, vida: 100, puntos: 0,
    });
    const modoPracticaRefGrab = useRef<any>('libre');
    const seccionRefGrab = useRef<any>(null);
    const grabacion = useGrabacionProMax({
        bpm,
        cancionRef: cancionRefGrab,
        estadisticasRef: estadisticasRefGrab,
        modoPracticaRef: modoPracticaRefGrab,
        seccionRef: seccionRefGrab,
    });

    // Sincronizar refs en el body (asignacion directa). Antes eran 6 useEffect
    // en cascada — pero todas estas son refs (no state) y el side-effect es
    // idempotente, asi que asignarlas durante el render es seguro.
    registrarPresionRef.current = grabacion.registrarPresionHero;
    registrarLiberacionRef.current = grabacion.registrarLiberacionHero;
    direccionRefGrab.current = logica.direccion;
    grabacion.tonalidadGrabacionRef.current = logica.tonalidadSeleccionada;
    grabacion.modoVistaGrabacionRef.current = logica.modoVista;
    grabacion.instrumentoGrabacionRef.current = logica.instrumentoId || null;
    grabacion.timbreGrabacionRef.current = (logica.ajustes as any)?.timbre || null;

    // Posicion del loop EN EL INSTANTE en que empezo la grabacion. Se usa
    // como offset al reproducir el replay: el audio_fondo seekea a este
    // valor antes de play() para que el primer tick coincida con el mismo
    // momento musical que el alumno escucho cuando dijo "empiezo a grabar".
    const loopOffsetAtRecordStartRef = useRef(0);

    // Snapshot del metronomo capturado al iniciar REC. Si estaba activo,
    // resetamos a beat 0 y lo guardamos en metadata al detener.
    const metronomoEnRecRef = useRef<SnapshotMetronomoRec | null>(null);

    const handleToggleGrabacion = useCallback(() => {
        if (!grabacion.grabandoHero) {
            // Capturamos la posicion del loop AHORA, justo antes de iniciar
            // la captura. La diferencia entre estas dos lineas es micro-segundos.
            loopOffsetAtRecordStartRef.current = loops.obtenerPosicion();

            // Metronomo: si esta activo, reseteamos a beat 0 para que el primer
            // click coincida con t=0 de la grabacion. Sin reset, los clicks caen
            // en momentos arbitrarios respecto al inicio de la captura -> el replay
            // no puede reconstruir el alineamiento.
            if (metronomoVivo.activo) {
                metronomoEnRecRef.current = {
                    activo: true,
                    bpm: metronomoVivo.bpm,
                    compas: metronomoVivo.compas,
                    subdivision: metronomoVivo.subdivision,
                    sonido: metronomoVivo.sonidoEfecto,
                    volumen: metronomoVivo.volumen,
                };
                metronomoVivo.detener();
                metronomoVivo.iniciar();
            } else {
                metronomoEnRecRef.current = null;
            }

            grabacion.iniciarGrabacionPracticaLibre('practica_libre');
        } else {
            // Si hay un loop sonando, lo guardamos en metadata para que el replay
            // pueda reproducirlo a la velocidad/volumen exacta que el alumno uso,
            // empezando desde el mismo offset musical (sync perfecto con las notas).
            const pista = loops.pistaActiva;
            const snapMet = metronomoEnRecRef.current;
            const metadata = {
                origen: 'simulador_app',
                vista_preferida: 'movil',
                ...(pista ? {
                    audio_fondo_url: pista.url,
                    pista_id: pista.id,
                    pista_nombre: pista.nombre,
                    pista_velocidad: loops.velocidad,
                    pista_volumen: loops.volumen,
                    pista_offset_segundos: loopOffsetAtRecordStartRef.current,
                } : {}),
                // Metronomo: snapshot tomado al iniciar REC. El replay arranca
                // un metronomo nuevo con esta config en sync con las notas.
                ...(snapMet ? { metronomo: snapMet } : {}),
            };
            metronomoEnRecRef.current = null;
            grabacion.detenerGrabacionPracticaLibre(metadata);
        }
    }, [grabacion, loops, metronomoVivo]);

    // Toast "Grabacion guardada": se dispara cuando ultimaGrabacionGuardada
    // cambia (de null a algo) y se auto-oculta a los 3 segundos.
    const [toastGuardadaVisible, setToastGuardadaVisible] = useState(false);
    useEffect(() => {
        if (!grabacion.ultimaGrabacionGuardada) return;
        setToastGuardadaVisible(true);
        const id = setTimeout(() => setToastGuardadaVisible(false), 3000);
        return () => clearTimeout(id);
    }, [grabacion.ultimaGrabacionGuardada]);

    const guardarPracticaLibre = useCallback(async (titulo: string, descripcion: string) => {
        return await grabacion.guardarGrabacionPendiente({ titulo, descripcion });
    }, [grabacion]);

    // "Re-grabar todo": descarta la grabacion pendiente y vuelve a arrancar la
    // captura — pensado para que el admin pueda corregir notas malas sin
    // guardarlas. Reseteamos tambien el offset del loop para que el primer
    // tick de la nueva grabacion coincida con el momento actual del MP3.
    const regrabarDesdeCero = useCallback(() => {
        grabacion.descartarGrabacionPendiente();
        // Pequeno delay para que el modal se desmonte antes de reiniciar REC
        // (evita race con el listener `grabacionPendiente` que reabre el modal).
        setTimeout(() => {
            loopOffsetAtRecordStartRef.current = loops.obtenerPosicion();
            if (metronomoVivo.activo) {
                metronomoVivo.detener();
                metronomoVivo.iniciar();
            }
            grabacion.iniciarGrabacionPracticaLibre('practica_libre');
        }, 50);
    }, [grabacion, loops, metronomoVivo]);

    const guardarComoCancionHero = useCallback(async (datos: {
        titulo: string;
        autor: string;
        bpm: number;
        tonalidad: string;
        dificultad: 'basico' | 'intermedio' | 'avanzado';
        tipo: 'cancion' | 'secuencia' | 'melodia';
        usoMetronomo: boolean;
        audioFondoFile?: File | null;
    }) => {
        return await grabacion.guardarComoCancionHero(datos);
    }, [grabacion]);

    return {
        grabacion,
        handleToggleGrabacion,
        guardarPracticaLibre,
        regrabarDesdeCero,
        guardarComoCancionHero,
        toastGuardadaVisible,
        setToastGuardadaVisible,
    };
};
