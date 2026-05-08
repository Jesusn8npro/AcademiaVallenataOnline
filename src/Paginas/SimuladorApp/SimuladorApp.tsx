import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useLogicaAcordeon } from '../../Core/hooks/useLogicaAcordeon';
import { useReproductorHero } from '../../Core/hooks/useReproductorHero';
import { motorAudioPro } from '../../Core/audio/AudioEnginePro';
import { usePointerAcordeon } from './Hooks/usePointerAcordeon';
import { useGrabacionProMax } from '../AcordeonProMax/Hooks/useGrabacionProMax';
import { obtenerGrabacion } from '../../servicios/grabacionesHeroService';
import { useReproductorLoops } from './Hooks/useReproductorLoops';
import { useMetronomo } from './Hooks/useMetronomo';
import ModalGuardarSimulador from './Componentes/ModalGuardarSimulador';
import ModalGrabacionAdmin from './Componentes/ModalGrabacionAdmin';
import { useUsuario } from '../../contextos/UsuarioContext';
import PopupListaGrabaciones from './Componentes/PopupListaGrabaciones';
import PanelEfectosSimulador from './Componentes/PanelEfectosSimulador';
import { listarPistasPracticaLibre } from '../AcordeonProMax/PracticaLibre/Servicios/servicioPistasPracticaLibre';
import type { PistaPracticaLibre } from '../AcordeonProMax/PracticaLibre/TiposPracticaLibre';

import BarraHerramientas from './Componentes/BarraHerramientas/BarraHerramientas';
import ContenedorBajos from './Componentes/ContenedorBajos';

import MenuOpciones from './Componentes/BarraHerramientas/MenuOpciones';
import ModalContacto from './Componentes/BarraHerramientas/ModalContacto';
import ModalTonalidades from './Componentes/BarraHerramientas/ModalTonalidades';
import ModalVista from './Componentes/BarraHerramientas/ModalVista';
import ModalMetronomo from './Componentes/BarraHerramientas/ModalMetronomo';
import ModalInstrumentos from './Componentes/BarraHerramientas/ModalInstrumentos';
import PantallaAprende from './Juego/Pantallas/PantallaAprende';
import type { ConfigCancion } from './Juego/Hooks/useConfigCancion';
import JuegoSimuladorApp from './Juego/JuegoSimuladorApp';
import BarraGrabacionFlotante from './Componentes/BarraGrabacionFlotante';
import ToastGrabacionGuardada from './Componentes/ToastGrabacionGuardada';
import ModalLoops from './Componentes/ModalLoops';

import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    const [juegoActivo, setJuegoActivo] = useState<ConfigCancion | null>(null);

    if (juegoActivo) {
        return (
            <JuegoSimuladorApp
                config={juegoActivo}
                onSalir={() => setJuegoActivo(null)}
            />
        );
    }

    return <SimuladorAppNormal onIniciarJuego={setJuegoActivo} />;
};

interface SimuladorAppNormalProps {
    onIniciarJuego: (config: ConfigCancion) => void;
}

const SimuladorAppNormal: React.FC<SimuladorAppNormalProps> = ({ onIniciarJuego }) => {
    // Refs estables para que useLogicaAcordeon (que se monta antes que useGrabacionProMax)
    // pueda delegar press/release al grabador sin race conditions de inicializacion.
    const registrarPresionRef = useRef<(idBoton: string, fuelle: 'abriendo' | 'cerrando') => void>(() => {});
    const registrarLiberacionRef = useRef<(idBoton: string) => void>(() => {});
    const direccionRefGrab = useRef<'halar' | 'empujar'>('halar');

    const logica = useLogicaAcordeon({
        onNotaPresionada: (data) => {
            const esBajo = data.idBoton.includes('-bajo');
            const pos = data.idBoton.split('-').slice(0, 2).join('-');
            actualizarVisualBoton(pos, true, esBajo);
            // Captura para grabacion (no-op si no hay grabacion activa).
            registrarPresionRef.current(
                data.idBoton,
                direccionRefGrab.current === 'halar' ? 'abriendo' : 'cerrando'
            );
        },
        onNotaLiberada: (data) => {
            const esBajo = data.idBoton.includes('-bajo');
            const pos = data.idBoton.split('-').slice(0, 2).join('-');
            actualizarVisualBoton(pos, false, esBajo);
            registrarLiberacionRef.current(data.idBoton);
        }
    });

    const [escala, setEscala] = useState(1.0);
    const [config, setConfig] = useState({
        modoVista: 'notas' as 'notas' | 'cifrado' | 'numeros' | 'teclas',
        mostrarOctavas: false,
        vistaDoble: false
    });

    const [modales, setModales] = useState({
        menu: false,
        tonalidades: false,
        vista: false,
        metronomo: false,
        instrumentos: false,
        contacto: false,
        aprende: false,
        loops: false,
        efectos: false,
    });

    // ─── Panel de Efectos de Audio ──────────────────────────────────────────
    // Estados controlados que mapean al motor de audio. Reverb arranca apagado
    // por defecto (mantiene latencia mínima en Android: directBus activo).
    const [reverbActivo, setReverbActivo] = useState(false);
    const [reverbIntensidad, setReverbIntensidad] = useState(20);
    const [reverbPreset, setReverbPreset] = useState<
        | 'habitacion' | 'estudio' | 'cuarto_mediano' | 'garaje'
        | 'sala_ensayo' | 'cuarto_grande' | 'club'
        | 'vestibulo_mediano' | 'iglesia' | 'vestibulo_grande' | 'catedral' | 'cueva' | 'arena'
        | 'escenario_abierto' | 'canon' | 'bosque'
        | 'tunel' | 'cabina' | 'plate' | 'spring' | 'tape_vintage' | 'shimmer'
    >('cuarto_grande');
    // Eco: intensidad 0..100 = wet+feedback; tiempo 0..100 mapea a 50..800ms.
    const [ecoActivo, setEcoActivo] = useState(false);
    const [ecoIntensidad, setEcoIntensidad] = useState(30);
    const [ecoTiempo, setEcoTiempo] = useState(40);
    // Distorsión: intensidad 0..100 = mezcla del path distorsionado;
    // preset selecciona curva (tanh/hardclip/fuzz/etc) + EQ tonal pre/post.
    const [distorsActivo, setDistorsActivo] = useState(false);
    const [distorsIntensidad, setDistorsIntensidad] = useState(40);
    const [distorsPreset, setDistorsPreset] = useState<
        | 'tubo_calido' | 'tubo_cremoso' | 'vintage_drive' | 'lofi_tape'
        | 'crunch_clasico' | 'overdrive_blues' | 'rock_70s'
        | 'distorsion_dura' | 'heavy_metal' | 'thrash' | 'death_metal'
        | 'fuzz_muff' | 'fuzz_tone' | 'octave_fuzz'
        | 'bit_crusher' | 'megafono' | 'telefono' | 'wave_folder'
    >('crunch_clasico');
    const [graves, setGraves] = useState(0);
    const [medios, setMedios] = useState(0);
    const [agudos, setAgudos] = useState(0);
    // Volúmenes y panning independientes para teclado y bajos. El motor tiene
    // sub-buses busTeclado/busBajos cada uno con su GainNode + StereoPannerNode,
    // así el slider TECLADO solo afecta pitos y BAJOS solo afecta el lado bajos.
    const [volumenTeclado, setVolumenTeclado] = useState(85);
    const [volumenBajos, setVolumenBajos] = useState(85);
    // Pan stereo: -50 = izquierda, 0 = centro, 50 = derecha (UI). El motor
    // recibe el rango -1..1 estándar de StereoPannerNode.
    const [panTeclado, setPanTeclado] = useState(0);
    const [panBajos, setPanBajos] = useState(0);
    // Loops y metrónomo aún no tienen pan en su pipeline propio (placeholder UI).
    const [panLoops, setPanLoops] = useState(0);
    const [panMetronomo, setPanMetronomo] = useState(0);

    // Lista de pistas disponibles para usar como preview del slider LOOPS.
    // Buscamos "chande sabor" como default; si no, la primera disponible.
    const [pistasDisponibles, setPistasDisponibles] = useState<PistaPracticaLibre[]>([]);
    useEffect(() => {
        listarPistasPracticaLibre()
            .then((pistas) => setPistasDisponibles(pistas || []))
            .catch(() => { /* silencioso: si falla la red el preview de loops queda en noop */ });
    }, []);
    const pistaPreviewLoops = useMemo(() => {
        const chande = pistasDisponibles.find((p) =>
            p.nombre?.toLowerCase().includes('chande sabor')
        );
        return chande || pistasDisponibles[0] || null;
    }, [pistasDisponibles]);

    // Sincroniza Reverb con el motor: cuando el toggle está apagado mandamos 0
    // (el motor se pasa al directBus sin filtros — latencia mínima en Android).
    useEffect(() => {
        const cantidad = reverbActivo ? reverbIntensidad / 100 : 0;
        motorAudioPro.actualizarReverb(cantidad);
    }, [reverbActivo, reverbIntensidad]);

    // Cambiar preset regenera el impulse response del ConvolverNode → cambia
    // la "personalidad" del espacio (cuarto vs vestíbulo vs escenario abierto).
    useEffect(() => {
        motorAudioPro.cargarPresetReverb(reverbPreset);
    }, [reverbPreset]);

    // Eco: cuando está apagado se manda intensidad=0 (silencia wet+feedback).
    // Tiempo 0..100 UI → 50..800ms (cubre slap-back, delay clásico y dub).
    useEffect(() => {
        const intensidadFinal = ecoActivo ? ecoIntensidad / 100 : 0;
        const tiempoSeg = 0.05 + (ecoTiempo / 100) * 0.75;
        motorAudioPro.actualizarEco(intensidadFinal, tiempoSeg);
    }, [ecoActivo, ecoIntensidad, ecoTiempo]);

    // Distorsión: el preset define curva + EQ; el knob controla wet mix.
    useEffect(() => {
        const intensidadFinal = distorsActivo ? distorsIntensidad / 100 : 0;
        motorAudioPro.actualizarDistorsion(intensidadFinal);
    }, [distorsActivo, distorsIntensidad]);

    useEffect(() => {
        motorAudioPro.cargarPresetDistorsion(distorsPreset);
    }, [distorsPreset]);

    useEffect(() => {
        motorAudioPro.actualizarEQ(graves, medios, agudos);
    }, [graves, medios, agudos]);

    // Sub-buses con volumen + pan independientes (TECLADO y BAJOS).
    useEffect(() => {
        motorAudioPro.setVolumenBusTeclado(volumenTeclado / 100);
    }, [volumenTeclado]);
    useEffect(() => {
        motorAudioPro.setVolumenBusBajos(volumenBajos / 100);
    }, [volumenBajos]);
    useEffect(() => {
        motorAudioPro.setPanTeclado(panTeclado / 50);
    }, [panTeclado]);
    useEffect(() => {
        motorAudioPro.setPanBajos(panBajos / 50);
    }, [panBajos]);

    const restaurarEfectos = useCallback(() => {
        setReverbActivo(false);
        setReverbIntensidad(20);
        setEcoActivo(false);
        setEcoIntensidad(30);
        setEcoTiempo(40);
        setDistorsActivo(false);
        setDistorsIntensidad(40);
        setGraves(0);
        setMedios(0);
        setAgudos(0);
    }, []);

    const [bajosVisible, setBajosVisible] = useState(false);
    const [bpmMetronomo, setBpmMetronomo] = useState(80);
    const [grabando, setGrabando] = useState(false);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const audioContextIniciadoRef = useRef(false);
    const [audioListo, setAudioListo] = useState(false);
    const refsModales = {
        menu: useRef(null),
        tonalidades: useRef(null),
        metronomo: useRef(null),
        instrumentos: useRef(null),
        vista: useRef(null),
        aprende: useRef(null)
    };
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);

    const elementosCache = useRef<Map<string, { pito: Element | null; bajo: Element | null }>>(new Map());

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

    const registrarEvento = useCallback((tipo: string, data: any) => {
        if (grabando) secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    }, [grabando]);

    const formatearNombreNota = (notaObj: any, modo: string, mostrarOctavas: boolean) => {
        if (!notaObj) return '';

        let nombre = notaObj.nombre || '';
        const partes = nombre.split(' ');
        let notaBase = partes[0];
        const octava = partes[1] || '';

        if (modo === 'cifrado') {
            const MAPA_CIFRADO: Record<string, string> = {
                'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
                'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
            };
            notaBase = MAPA_CIFRADO[notaBase] || notaBase;
        }

        return mostrarOctavas ? `${notaBase}${octava}` : notaBase;
    };

    // Estado de reproduccion inline. Lo declaramos arriba para que pueda
    // alimentar `desactivarAudio` (que se pasa a usePointerAcordeon).
    const [enReproduccion, setEnReproduccion] = useState(false);
    const [errorReproduccion, setErrorReproduccion] = useState<string | null>(null);
    // Si la grabacion en curso de replay traia metronomo, prendemos/apagamos
    // metronomoReplay siguiendo el estado del reproductor.
    const [replayConMetronomo, setReplayConMetronomo] = useState(false);

    // Hook de loops/pistas: el audio vive aqui (no en el modal) para que
    // siga sonando aunque el modal se cierre. La barra de herramientas usa
    // `pistaActiva` para mostrar un indicador en el icono LOOPS.
    const loops = useReproductorLoops();

    // Metronomo en VIVO: lifted aqui para que (a) siga sonando al cerrar el modal
    // y (b) podamos resetearlo al iniciar REC y capturar su snapshot al detener.
    // Sin esto, useMetronomo vivia dentro de ModalMetronomo → al cerrar el modal
    // se desmontaba y el metronomo callaba.
    const metronomoVivo = useMetronomo(bpmMetronomo);
    useEffect(() => { metronomoVivo.setBpm(bpmMetronomo); }, [bpmMetronomo]);

    // Pan de loops y metrónomo (van por sus propios StereoPannerNode dentro
    // del hook respectivo, no por el motor principal).
    useEffect(() => {
        loops.setPan(panLoops / 50);
    }, [panLoops, loops]);
    useEffect(() => {
        metronomoVivo.setPan(panMetronomo / 50);
    }, [panMetronomo, metronomoVivo]);

    // ─── Previews del Panel de Efectos ──────────────────────────────────────
    // Tocan un sonido mientras el alumno mantiene presionado un slider de
    // volumen. Cada handler es estable (useCallback) para evitar arranques
    // fantasma por re-creación de funciones entre renders.
    const PREVIEW_TECLADO_ID = '1-3-halar';
    const PREVIEW_BAJOS_ID = '1-1-halar-bajo';

    const previewTecladoIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        logica.actualizarBotonActivo(PREVIEW_TECLADO_ID, 'add');
    }, [logica.actualizarBotonActivo]);
    const previewTecladoDetener = useCallback(() => {
        logica.actualizarBotonActivo(PREVIEW_TECLADO_ID, 'remove');
    }, [logica.actualizarBotonActivo]);

    const previewBajosIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        logica.actualizarBotonActivo(PREVIEW_BAJOS_ID, 'add');
    }, [logica.actualizarBotonActivo]);
    const previewBajosDetener = useCallback(() => {
        logica.actualizarBotonActivo(PREVIEW_BAJOS_ID, 'remove');
    }, [logica.actualizarBotonActivo]);

    // Loops: arrancamos "Pista de chande sabor" (o la primera disponible) si
    // todavía no hay pista sonando, y la silenciamos al soltar — solo si fuimos
    // nosotros quienes la activamos. Si el alumno ya tenía una pista corriendo
    // por su cuenta, no la tocamos para no interrumpir la práctica.
    const loopsActivadoPorPreviewRef = useRef(false);
    const previewLoopsIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        if (loops.pistaActiva || !pistaPreviewLoops) return;
        // precargarPistas es idempotente: si ya está en cache no descarga;
        // si no, descarga + decodifica antes del play (silencio breve la primera vez).
        loops.precargarPistas([pistaPreviewLoops]);
        loopsActivadoPorPreviewRef.current = true;
        loops.reproducir(pistaPreviewLoops);
    }, [loops, pistaPreviewLoops]);
    const previewLoopsDetener = useCallback(() => {
        if (loopsActivadoPorPreviewRef.current) {
            loopsActivadoPorPreviewRef.current = false;
            loops.detener();
        }
    }, [loops]);

    // Metrónomo: lo encendemos al tocar el slider y guardamos un flag para
    // saber si fuimos nosotros (así no apagamos un metrónomo que el alumno
    // ya había activado por su cuenta).
    const metronomoEncendidoPorPreviewRef = useRef(false);
    const previewMetronomoIniciar = useCallback(() => {
        motorAudioPro.activarContexto();
        if (!metronomoVivo.activo) {
            metronomoEncendidoPorPreviewRef.current = true;
            void metronomoVivo.iniciar();
        }
    }, [metronomoVivo]);
    const previewMetronomoDetener = useCallback(() => {
        if (metronomoEncendidoPorPreviewRef.current) {
            metronomoEncendidoPorPreviewRef.current = false;
            metronomoVivo.detener();
        }
    }, [metronomoVivo]);

    // Metronomo de REPLAY: instancia independiente para reproducir el metronomo
    // de una grabacion sin pisar el estado del metronomo vivo del usuario.
    const metronomoReplay = useMetronomo(120);

    // Snapshot del metronomo capturado al iniciar REC. Si estaba activo,
    // resetamos a beat 0 y lo guardamos en metadata al detener.
    const metronomoEnRecRef = useRef<{
        activo: boolean; bpm: number; compas: number; subdivision: number;
        sonido: any; volumen: number;
    } | null>(null);

    // El panel FX se diseñó para no bloquear el simulador (drawer lateral con
    // pointer-events: none en el overlay). Lo excluimos de la lista que apaga
    // el audio para que el alumno pueda seguir tocando los pitos visibles
    // mientras ajusta efectos. Otros modales sí siguen apagando el audio.
    const desactivarAudio = useMemo(
        () => enReproduccion || Object.entries(modales).some(([key, v]) => v && key !== 'efectos'),
        [modales, enReproduccion]
    );

    // Cuando el panel FX está abierto, ocupa la mitad derecha de la pantalla.
    // Pasamos su rect como "bloqueador" para que `usePointerAcordeon` ignore
    // hits que caen tapados por el panel (evita que el slide del dedo desde
    // un pito visible al lado active los pitos detrás del panel).
    const obtenerRectsBloqueadores = useCallback((): DOMRect[] => {
        if (!modales.efectos) return [];
        const panel = document.querySelector('.peas-modal-contenido') as HTMLElement | null;
        if (!panel) return [];
        return [panel.getBoundingClientRect()];
    }, [modales.efectos]);

    const { manejarCambioFuelle, limpiarGeometria, actualizarGeometria } = usePointerAcordeon({
        x,
        logica,
        actualizarVisualBoton,
        registrarEvento,
        trenRef,
        desactivarAudio,
        obtenerRectsBloqueadores
    });

    // ─── Grabador de practica libre del simulador ────────────────────────
    // useGrabacionProMax requiere refs para cancion/estadisticas/modo/seccion.
    // En modo libre (fuera de juego) los dejamos vacios — el grabador solo usa
    // la secuencia de presses/releases. La metadata se sincroniza desde logica
    // mas abajo para que el replay sepa tonalidad/instrumento/modeloVisual.
    const cancionRefGrab = useRef<any>(null);
    const estadisticasRefGrab = useRef<any>({
        notasPerfecto: 0, notasBien: 0, notasFalladas: 0, notasPerdidas: 0,
        rachaActual: 0, rachaMasLarga: 0, multiplicador: 1, vida: 100, puntos: 0,
    });
    const modoPracticaRefGrab = useRef<any>('libre');
    const seccionRefGrab = useRef<any>(null);
    const grabacion = useGrabacionProMax({
        bpm: bpmMetronomo,
        cancionRef: cancionRefGrab,
        estadisticasRef: estadisticasRefGrab,
        modoPracticaRef: modoPracticaRefGrab,
        seccionRef: seccionRefGrab,
    });

    // Sincronizar las refs estables que usaron los callbacks de useLogicaAcordeon
    // arriba con las funciones reales del grabador. Sin esto los callbacks
    // tendrian un no-op permanente.
    useEffect(() => {
        registrarPresionRef.current = grabacion.registrarPresionHero;
        registrarLiberacionRef.current = grabacion.registrarLiberacionHero;
    }, [grabacion.registrarPresionHero, grabacion.registrarLiberacionHero]);

    useEffect(() => { direccionRefGrab.current = logica.direccion; }, [logica.direccion]);

    // Sincronizar metadata para que el replay reconstruya la grabacion con
    // la misma tonalidad/instrumento/vista que tenia el alumno al grabar.
    useEffect(() => { grabacion.tonalidadGrabacionRef.current = logica.tonalidadSeleccionada; }, [logica.tonalidadSeleccionada, grabacion.tonalidadGrabacionRef]);
    useEffect(() => { grabacion.modoVistaGrabacionRef.current = logica.modoVista; }, [logica.modoVista, grabacion.modoVistaGrabacionRef]);
    useEffect(() => { grabacion.instrumentoGrabacionRef.current = logica.instrumentoId || null; }, [logica.instrumentoId, grabacion.instrumentoGrabacionRef]);
    useEffect(() => { grabacion.timbreGrabacionRef.current = (logica.ajustes as any)?.timbre || null; }, [logica.ajustes, grabacion.timbreGrabacionRef]);

    // ─── Reproductor inline para replay de grabaciones ────────────────────
    // Reusa la misma `logica` (acordeon visual). Cuando se reproduce una
    // grabacion: el reproductor llama a `actualizarBotonActivo` para
    // resaltar las teclas + `reproduceTono` para el audio. Los pitos se
    // bloquean a touch via la clase root .reproduciendo (CSS pointer-events).
    const [bpmReproduccion, setBpmReproduccion] = useState(120);
    const [resolucionReproduccion, setResolucionReproduccion] = useState(192);
    // Audio de fondo del replay inline via Web Audio API. iOS Safari rechaza
    // HTMLAudio + Supabase Storage (Content-Type incorrecto) — el unico camino
    // confiable es decodificar el MP3 nosotros y reproducirlo via AudioBuffer.
    // Mantenemos el buffer + gain + el source actual + estado de offset para
    // pause/resume (los AudioBufferSourceNode no se pueden reusar tras stop).
    const audioFondoReplayRef = useRef<{
        buffer: AudioBuffer;
        gain: GainNode;
        source: AudioBufferSourceNode | null;
        startContextTime: number;  // ctx.currentTime cuando arranco la fuente
        offsetActual: number;      // offset en el buffer al arrancar la fuente
        velocidad: number;
    } | null>(null);
    const reproductor = useReproductorHero(
        logica.actualizarBotonActivo,
        logica.setDireccionSinSwap,
        logica.reproduceTono,
        bpmReproduccion,
    );

    // Detectar fin de reproduccion (el reproductor cambia reproduciendo a false).
    useEffect(() => {
        if (enReproduccion && !reproductor.reproduciendo) {
            setEnReproduccion(false);
        }
    }, [enReproduccion, reproductor.reproduciendo]);

    // ─── Modo "vino a reproducir desde Grabaciones" ──────────────────────────
    // Si la URL tiene ?reproducir=<id>, auto-disparamos el replay y mostramos
    // un overlay con boton Volver. Cuando termina la reproduccion, countdown
    // 3s + boton "Quedarme aqui" para cancelar el regreso. Si el usuario elige
    // quedarse, removemos el flag y desaparecen los botones para siempre.
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const reproducirIdParam = searchParams.get('reproducir');
    // Cuando el alumno entró al simulador desde una clase móvil, llega con
    // ?volverA=<url-de-la-clase>&t=<segundos>. Mostramos un botón flotante para
    // regresar al video en el mismo segundo donde lo dejó.
    const volverAClaseParam = searchParams.get('volverA');
    const tiempoVideoClaseParam = searchParams.get('t');
    const [vinoDeGrabaciones, setVinoDeGrabaciones] = useState(false);
    const [autoArrancado, setAutoArrancado] = useState(false);
    const [countdownVolver, setCountdownVolver] = useState<number | null>(null);
    const [usuarioEligioQuedarse, setUsuarioEligioQuedarse] = useState(false);

    const volverALaClase = useCallback(() => {
        if (!volverAClaseParam) return;
        // En Android entramos en fullscreen al primer touch (ver useEffect de
        // intentarFullscreen). Si navegamos sin salir, la clase queda atrapada
        // en fullscreen con el scroll bloqueado. Salimos primero y después
        // navegamos para que la clase aparezca normal.
        const doc: any = document;
        if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            try {
                const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
                if (typeof exit === 'function') exit.call(doc);
            } catch { /* noop */ }
        }
        document.body.classList.remove('bloquear-scroll-simulador');
        const sep = volverAClaseParam.includes('?') ? '&' : '?';
        const tiempoSeguro = tiempoVideoClaseParam && /^\d+$/.test(tiempoVideoClaseParam)
            ? tiempoVideoClaseParam
            : null;
        const url = tiempoSeguro
            ? `${volverAClaseParam}${sep}t=${tiempoSeguro}`
            : volverAClaseParam;
        navigate(url);
    }, [navigate, volverAClaseParam, tiempoVideoClaseParam]);
    // Tiempo (performance.now) en que arranco el replay y duracion total de
    // la grabacion en ms. Sirve para esperar a que termine TODA la grabacion
    // (no solo la ultima nota) antes de mostrar el countdown.
    const replayStartTimeRef = useRef<number | null>(null);
    const duracionReplayMsRef = useRef<number | null>(null);
    // Timer del fin real del replay; lo cancelamos en stop manual.
    const finReplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref siempre fresca a `logica` (que es un objeto que React recrea en
    // cada render). La usamos en reproducirGrabacion para chequear/esperar
    // a que tonalidad+samples se hayan aplicado tras el setTonalidadSeleccionada.
    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    // Detener el audio de fondo del replay (Web Audio).
    const detenerAudioFondoReplay = useCallback(() => {
        const data = audioFondoReplayRef.current;
        if (data) {
            if (data.source) {
                try { data.source.stop(); } catch { /* noop */ }
                try { data.source.disconnect(); } catch { /* noop */ }
            }
            try { data.gain.disconnect(); } catch { /* noop */ }
            audioFondoReplayRef.current = null;
        }
    }, []);

    const reproducirGrabacion = useCallback(async (id: string) => {
        try {
            setErrorReproduccion(null);
            const g: any = await obtenerGrabacion(id);
            if (!g) { setErrorReproduccion('Grabacion no encontrada.'); return; }
            const sec = g.secuencia_grabada || g.secuencia || [];
            if (!Array.isArray(sec) || sec.length === 0) {
                setErrorReproduccion('Esta grabacion no tiene notas.');
                return;
            }
            // Capturamos la duracion real (en ms) de la grabacion para saber
            // cuando "termino" de verdad — no solo cuando suena la ultima nota.
            duracionReplayMsRef.current = typeof g.duracion_ms === 'number' && g.duracion_ms > 0 ? g.duracion_ms : null;
            // replayStartTimeRef se setea mas abajo, justo antes de reproducirSecuencia,
            // para que no incluya el tiempo del preload en el calculo de "elapsed".
            if (finReplayTimerRef.current) {
                clearTimeout(finReplayTimerRef.current);
                finReplayTimerRef.current = null;
            }
            // Si hay un loop sonando ahora, lo paramos antes (no queremos
            // dos audios encimados si la grabacion tambien trae uno).
            if (loops.pistaActiva) loops.detener();
            detenerAudioFondoReplay();

            // Si el usuario tenia el metronomo en vivo prendido, lo apagamos
            // para no encimar con el del replay.
            if (metronomoVivo.activo) metronomoVivo.detener();

            // Aplicar tonalidad de la grabacion para que los pitos coincidan.
            if (g.tonalidad) logica.setTonalidadSeleccionada(g.tonalidad);
            const bpm = g.bpm || 120;
            const resolucion = g.resolucion || 192;
            setBpmReproduccion(bpm);
            setResolucionReproduccion(resolucion);
            const cancionFake = { secuencia: sec, bpm, resolucion } as any;
            await motorAudioPro.activarContexto();

            // ─── Precarga de samples antes de disparar la secuencia ─────────
            // Sin este paso, las notas se MARCAN visualmente pero NO SUENAN:
            // setTonalidadSeleccionada dispara una recarga de samples interna
            // (useEffect con debounce 80ms en useLogicaAcordeon). Si
            // reproducirSecuencia corre antes de que el banco se llene,
            // motorAudioPro.reproducir devuelve null silencioso.
            //
            // Esperamos a que (a) la tonalidad se aplique en logicaRef y
            // (b) precargamos manualmente los samples que el recording necesita.
            const tonalidadObjetivo = g.tonalidad || logicaRef.current.tonalidadSeleccionada;
            // Wait hasta que React commitee setTonalidadSeleccionada
            // (logicaRef.current se actualiza en useEffect post-render).
            const tInicio = performance.now();
            while (
                logicaRef.current.tonalidadSeleccionada !== tonalidadObjetivo &&
                performance.now() - tInicio < 1500
            ) {
                await new Promise((r) => setTimeout(r, 30));
            }
            // Damos otro pequeno respiro al useEffect interno que carga samples
            // (debounce 80ms + algun fetch). Esto evita race con el motorAudio
            // si la red es lenta.
            await new Promise((r) => setTimeout(r, 200));

            // Precarga manual de los samples de los botones del recording.
            // motorAudioPro.cargarSonidoEnBanco es idempotente (cache interno);
            // si ya estan, retorna inmediato. Awaiteamos para garantizar que
            // el banco esta lleno antes de reproducirSecuencia.
            try {
                const obtenerRutas = (logicaRef.current as any).obtenerRutasAudio;
                if (typeof obtenerRutas === 'function') {
                    const botonIdsUnicos = Array.from(new Set(sec.map((n: any) => n.botonId).filter(Boolean)));
                    const rutasUnicas = new Map<string, string>();
                    botonIdsUnicos.forEach((botonId: any) => {
                        const rutas: string[] = obtenerRutas(botonId) || [];
                        rutas.forEach((rutaRaw: string) => {
                            const ruta = rutaRaw.startsWith('pitch:') ? rutaRaw.split('|')[1] : rutaRaw;
                            const rutaFinal = ruta.startsWith('http') || ruta.startsWith('/') ? ruta : `/${ruta}`;
                            rutasUnicas.set(ruta, rutaFinal);
                        });
                    });
                    if (rutasUnicas.size > 0) {
                        await Promise.allSettled(
                            Array.from(rutasUnicas.entries()).map(([ruta, rutaFinal]) =>
                                motorAudioPro.cargarSonidoEnBanco(
                                    logicaRef.current.instrumentoId,
                                    ruta,
                                    rutaFinal,
                                ),
                            ),
                        );
                    }
                }
            } catch (e) {
                console.warn('[Replay] precarga manual de samples fallo:', e);
            }

            // Audio de fondo: si la grabacion guardo una pista, la cargamos
            // con el OFFSET correcto (la posicion en que estaba el loop cuando
            // el alumno empezo a grabar) y la arrancamos en sync con las notas.
            // Sin pista, arrancamos las notas directamente (caso simple).
            const meta = g.metadata || {};
            const audioFondoUrl: string | null = meta.audio_fondo_url || null;
            const metMeta = meta.metronomo || null;

            // Aplicar config del metronomo de la grabacion al instance de replay.
            // El arranque (setActivo) lo maneja el effect que lo sincroniza con
            // reproductor.reproduciendo + !pausado.
            if (metMeta) {
                if (typeof metMeta.bpm === 'number') metronomoReplay.setBpm(metMeta.bpm);
                if (typeof metMeta.compas === 'number') metronomoReplay.setCompas(metMeta.compas);
                if (typeof metMeta.subdivision === 'number') metronomoReplay.setSubdivision(metMeta.subdivision);
                if (typeof metMeta.volumen === 'number') metronomoReplay.setVolumen(metMeta.volumen);
                if (typeof metMeta.sonido === 'string') metronomoReplay.setSonidoEfecto(metMeta.sonido);
                setReplayConMetronomo(true);
            } else {
                setReplayConMetronomo(false);
            }
            console.log('[Replay] metadata leida:', meta);
            console.log('[Replay] audio_fondo_url:', audioFondoUrl, '| velocidad:', meta.pista_velocidad, '| offset:', meta.pista_offset_segundos);
            console.log('[Replay] metronomo:', metMeta);
            if (audioFondoUrl) {
                const volumenGuardado = typeof meta.pista_volumen === 'number' ? meta.pista_volumen : 0.85;
                const velocidadGuardada = typeof meta.pista_velocidad === 'number' ? meta.pista_velocidad : 1.0;
                const offset = typeof meta.pista_offset_segundos === 'number' ? meta.pista_offset_segundos : 0;

                // Web Audio: descargamos + decodificamos el MP3 (HTMLAudio falla
                // en iOS por el Content-Type incorrecto de Supabase). decodeAudioData
                // sample-accurate -> el seek al offset es exacto, sin events ni jitter.
                try {
                    const response = await fetch(audioFondoUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const arrayBuf = await response.arrayBuffer();
                    const ctx = motorAudioPro.contextoAudio;
                    const buffer = await ctx.decodeAudioData(arrayBuf);

                    if (ctx.state === 'suspended') {
                        try { await ctx.resume(); } catch { /* noop */ }
                    }

                    const gain = ctx.createGain();
                    gain.gain.value = volumenGuardado;
                    gain.connect(ctx.destination);

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.loop = true;
                    source.playbackRate.value = velocidadGuardada;
                    source.connect(gain);

                    // Arranque sample-accurate: source.start(when, offset) en el
                    // mismo instante que reproductor.reproducirSecuencia. No hay
                    // jitter de seek/canplay/playing como con HTMLAudio.
                    const offsetSeguro = isFinite(offset) && offset > 0
                        ? offset % buffer.duration
                        : 0;
                    source.start(0, offsetSeguro);

                    audioFondoReplayRef.current = {
                        buffer,
                        gain,
                        source,
                        startContextTime: ctx.currentTime,
                        offsetActual: offsetSeguro,
                        velocidad: velocidadGuardada,
                    };

                    // Notas arrancan SINCRONO con la fuente -> tick 0 == offset.
                    replayStartTimeRef.current = performance.now();
                    reproductor.reproducirSecuencia(cancionFake);
                    setEnReproduccion(true);
                    return;
                } catch (err: any) {
                    console.error('[Replay] audio_fondo Web Audio fallo:', err?.name, err?.message || err);
                    setErrorReproduccion(`No se pudo cargar el audio de fondo: ${err?.message || err}`);
                    // Caemos al path sin audio para que las notas igual suenen.
                }
            }

            // Sin audio de fondo: arrancar las notas directamente.
            replayStartTimeRef.current = performance.now();
            reproductor.reproducirSecuencia(cancionFake);
            setEnReproduccion(true);
        } catch (e: any) {
            setErrorReproduccion(e?.message || 'Error al cargar la grabacion.');
        }
    }, [logica, reproductor, loops, detenerAudioFondoReplay]);

    const detenerReproduccion = useCallback(() => {
        reproductor.detenerReproduccion();
        detenerAudioFondoReplay();
        if (metronomoReplay.activo) metronomoReplay.detener();
        setReplayConMetronomo(false);
        setEnReproduccion(false);
    }, [reproductor, detenerAudioFondoReplay, metronomoReplay]);

    // Marcamos vinoDeGrabaciones apenas detectamos ?reproducir=<id> para que
    // el overlay "Volver" aparezca de una (independiente del landscape).
    useEffect(() => {
        if (!reproducirIdParam || vinoDeGrabaciones || usuarioEligioQuedarse) return;
        setVinoDeGrabaciones(true);
    }, [reproducirIdParam, vinoDeGrabaciones, usuarioEligioQuedarse]);

    // Auto-arrancar el replay SOLO cuando:
    //   1. Hay ?reproducir=<id> en la URL.
    //   2. El telefono esta en horizontal (sin esto el alumno no ve nada).
    //   3. La config + samples del acordeon YA bajaron de la nube
    //      (logica.disenoCargado === true).
    //
    // El (3) es CRITICO: en manual play (boton Play en simulador) funciona
    // porque el alumno ya esta en el simulador hace rato y disenoCargado es
    // true. En auto-play sin este guard, disparabamos reproducirGrabacion
    // antes de que las muestras del acordeon estuvieran listas — las notas
    // se marcaban visualmente pero motorAudioPro.reproducir devolvia null
    // porque el banco aun estaba vacio. Mismo flag que usa el modal de
    // /grabaciones para esperar antes de reproducir.
    useEffect(() => {
        if (!reproducirIdParam || autoArrancado) return;
        if (!isLandscape) return;
        if (!logica.disenoCargado) return;
        setAutoArrancado(true);
        // Activamos el contexto en paralelo (no awaiteamos: si la activation
        // todavia esta viva, el motor lo aprovecha; si no, queda en suspended
        // y el primer pointerdown lo activa).
        void motorAudioPro.activarContexto();
        // Marcamos audioListo nosotros mismos para no esperar el primer
        // pointerdown (ya tenemos un gesto previo de Grabaciones).
        if (!audioContextIniciadoRef.current) {
            audioContextIniciadoRef.current = true;
            setAudioListo(true);
        }
        void reproducirGrabacion(reproducirIdParam);
    }, [reproducirIdParam, autoArrancado, reproducirGrabacion, isLandscape, logica.disenoCargado]);

    // Volver inmediatamente a /grabaciones (cancela cualquier countdown).
    const volverAGrabaciones = useCallback(() => {
        if (finReplayTimerRef.current) {
            clearTimeout(finReplayTimerRef.current);
            finReplayTimerRef.current = null;
        }
        setCountdownVolver(null);
        navigate('/grabaciones');
    }, [navigate]);

    // El usuario eligio quedarse. Removemos el flag y limpiamos el query param
    // para que el simulador quede en modo normal (sin overlay nunca mas).
    const quedarseEnSimulador = useCallback(() => {
        if (finReplayTimerRef.current) {
            clearTimeout(finReplayTimerRef.current);
            finReplayTimerRef.current = null;
        }
        setUsuarioEligioQuedarse(true);
        setCountdownVolver(null);
        setVinoDeGrabaciones(false);
        // Limpiar ?reproducir= sin recargar, mantiene el estado actual.
        const params = new URLSearchParams(searchParams);
        params.delete('reproducir');
        setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // Countdown solo cuando termina la grabacion REAL (la duracion completa
    // que se grabo, no solo hasta la ultima nota). Si la ultima nota suena en
    // el segundo 8 pero la grabacion es de 30s, el countdown debe esperar
    // hasta el segundo 30. Sin esto, el alumno se siente sacado a medias.
    useEffect(() => {
        if (!vinoDeGrabaciones || usuarioEligioQuedarse) return;
        if (!autoArrancado || enReproduccion) return;
        if (countdownVolver !== null) return;
        // Guard race condition: setAutoArrancado(true) corre antes de que
        // reproducirGrabacion (async) llegue a setear replayStartTimeRef.
        // Si todavia no se seteo, NO arrancar el countdown — hay que esperar
        // a que el replay realmente arranque y termine.
        const startedAt = replayStartTimeRef.current;
        if (startedAt === null) return;
        const dur = duracionReplayMsRef.current;
        if (dur === null || dur <= 0) {
            // Replay arranco pero sin info de duracion -> countdown inmediato.
            setCountdownVolver(3);
            return;
        }
        const elapsed = performance.now() - startedAt;
        const restante = Math.max(0, dur - elapsed);
        if (finReplayTimerRef.current) clearTimeout(finReplayTimerRef.current);
        finReplayTimerRef.current = setTimeout(() => {
            setCountdownVolver(3);
            finReplayTimerRef.current = null;
        }, restante);
        return () => {
            if (finReplayTimerRef.current) {
                clearTimeout(finReplayTimerRef.current);
                finReplayTimerRef.current = null;
            }
        };
    }, [vinoDeGrabaciones, usuarioEligioQuedarse, autoArrancado, enReproduccion, countdownVolver]);

    // Tick del countdown: cada 1s decrementa, al llegar a 0 navega.
    useEffect(() => {
        if (countdownVolver === null) return;
        if (countdownVolver <= 0) {
            navigate('/grabaciones');
            return;
        }
        const id = window.setTimeout(() => setCountdownVolver((c) => (c === null ? null : c - 1)), 1000);
        return () => window.clearTimeout(id);
    }, [countdownVolver, navigate]);

    // Sincroniza el metronomo de replay con el reproductor: arranca cuando empieza
    // la reproduccion (en sync con la primera nota), se apaga al pausar/terminar.
    // Igual que useReproductorReplay (Mis Grabaciones), al pausar+resumir el
    // metronomo reinicia desde beat 0 — es la misma limitacion del patron, lo
    // aceptamos porque el alumno rara vez pausa mid-replay del simulador.
    useEffect(() => {
        if (!replayConMetronomo) {
            if (metronomoReplay.activo) metronomoReplay.detener();
            return;
        }
        const debeSonar = enReproduccion && !reproductor.pausado;
        if (debeSonar && !metronomoReplay.activo) metronomoReplay.iniciar();
        else if (!debeSonar && metronomoReplay.activo) metronomoReplay.detener();
    }, [replayConMetronomo, enReproduccion, reproductor.pausado, metronomoReplay]);

    // Si la reproduccion termina sola (no por click en stop), tambien
    // cortar el audio de fondo. El useEffect de detectar fin se encarga
    // de poner enReproduccion=false; aprovechamos ese momento.
    useEffect(() => {
        if (!enReproduccion && audioFondoReplayRef.current) {
            detenerAudioFondoReplay();
        }
    }, [enReproduccion, detenerAudioFondoReplay]);

    // Sincronizar pause/resume del audio de fondo con el reproductor.
    // Web Audio: no hay pause/resume nativo en AudioBufferSourceNode, hay que
    // detener la fuente y crear una nueva al reanudar (con el offset guardado).
    useEffect(() => {
        const data = audioFondoReplayRef.current;
        if (!data) return;
        const ctx = motorAudioPro.contextoAudio;

        if (reproductor.pausado && data.source) {
            // Calcular cuanto avanzo desde que arranco esta fuente y guardar.
            const elapsed = (ctx.currentTime - data.startContextTime) * data.velocidad;
            const nuevoOffset = (data.offsetActual + elapsed) % data.buffer.duration;
            try { data.source.stop(); } catch { /* noop */ }
            try { data.source.disconnect(); } catch { /* noop */ }
            data.source = null;
            data.offsetActual = nuevoOffset;
        } else if (!reproductor.pausado && enReproduccion && !data.source) {
            // Reanudar: nueva fuente desde el offset guardado.
            const source = ctx.createBufferSource();
            source.buffer = data.buffer;
            source.loop = true;
            source.playbackRate.value = data.velocidad;
            source.connect(data.gain);
            source.start(0, data.offsetActual);
            data.source = source;
            data.startContextTime = ctx.currentTime;
        }
    }, [reproductor.pausado, enReproduccion]);

    // Saltar 5 segundos atras o adelante. Convertimos segundos a ticks usando
    // la formula inversa: tick = (segundos * bpm * resolucion) / 60.
    const saltarSegundos = useCallback((segundos: number) => {
        const ticksASaltar = (segundos * bpmReproduccion * resolucionReproduccion) / 60;
        const tickObjetivo = Math.max(0, Math.min(
            reproductor.totalTicks || Number.MAX_SAFE_INTEGER,
            reproductor.tickActual + ticksASaltar
        ));
        reproductor.buscarTick(tickObjetivo);
    }, [bpmReproduccion, resolucionReproduccion, reproductor]);

    const retrocederReproduccion = useCallback(() => saltarSegundos(-5), [saltarSegundos]);
    const adelantarReproduccion = useCallback(() => saltarSegundos(5), [saltarSegundos]);

    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        document.body.classList.add('bloquear-scroll-simulador');
        return () => {
            window.removeEventListener('resize', check);
            document.body.classList.remove('bloquear-scroll-simulador');
        };
    }, []);

    useEffect(() => {
        const inicializarAudio = () => {
            if (audioContextIniciadoRef.current) return;
            audioContextIniciadoRef.current = true;
            motorAudioPro.activarContexto();
            actualizarGeometria();
            setAudioListo(true);

            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
        document.addEventListener('pointerdown', inicializarAudio, { capture: true });
        return () => {
            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
    }, [actualizarGeometria]);

    // Fullscreen en Android: requestFullscreen requiere user activation valida.
    // Lo disparamos en touchend/mouseup (no en pointerdown) porque el preventDefault
    // que aplicamos en touchstart consume la activation y Chrome Android rechaza
    // requestFullscreen llamado desde pointerdown. touchend no tiene preventDefault
    // y el browser aun considera el gesto valido.
    useEffect(() => {
        const esMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!esMobile) return;

        const intentarFullscreen = () => {
            const noEsPWA = !window.matchMedia('(display-mode: standalone)').matches;
            const yaEnFullscreen = !!document.fullscreenElement;
            const esAndroid = /android/i.test(navigator.userAgent);
            if (esAndroid && noEsPWA && !yaEnFullscreen) {
                document.documentElement.requestFullscreen?.().catch(() => { /* fallback silencioso */ });
            }
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };

        document.addEventListener('touchend', intentarFullscreen);
        document.addEventListener('mouseup', intentarFullscreen);
        return () => {
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };
    }, []);

    useEffect(() => {
        elementosCache.current.clear();
        limpiarGeometria();
    }, [logica.tonalidadSeleccionada, config.modoVista, config.vistaDoble, config.mostrarOctavas]);

    useEffect(() => {
        document.documentElement.style.setProperty('--escala-acordeon', escala.toString());
        // Esperar a que termine la transición CSS (200ms) antes de recalcular geometría
        const id = setTimeout(() => limpiarGeometria(), 250);
        return () => clearTimeout(id);
    }, [escala, limpiarGeometria]);

    const toggleModal = (nombre: keyof typeof modales) => {
        setModales(prev => ({ menu: false, tonalidades: false, vista: false, metronomo: false, instrumentos: false, contacto: false, aprende: false, loops: false, efectos: false, [nombre]: !prev[nombre] }));
    };

    // Posicion del loop EN EL INSTANTE en que empezo la grabacion. Se usa
    // como offset al reproducir el replay: el audio_fondo seekea a este
    // valor antes de play() para que el primer tick coincida con el mismo
    // momento musical que el alumno escucho cuando dijo "empiezo a grabar".
    const loopOffsetAtRecordStartRef = useRef(0);

    const handleToggleGrabacion = () => {
        if (!grabacion.grabandoHero) {
            // Capturamos la posicion del loop AHORA, justo antes de iniciar
            // la captura. La diferencia entre estas dos lineas es micro-segundos.
            loopOffsetAtRecordStartRef.current = loops.obtenerPosicion();

            // Metronomo: si esta activo, reseteamos a beat 0 para que el primer
            // click coincida con t=0 de la grabacion. Sin reset, los clicks caen
            // en momentos arbitrarios respecto al inicio de la captura → el replay
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
    };

    // Mantener el estado legacy `grabando` en sync con el grabador real
    // para que la barra de herramientas siga mostrando el indicador correcto.
    useEffect(() => { setGrabando(grabacion.grabandoHero); }, [grabacion.grabandoHero]);

    // Popup inline con la lista de grabaciones (en lugar de navegar a /grabaciones).
    const [popupGrabacionesAbierto, setPopupGrabacionesAbierto] = useState(false);
    const abrirListaGrabaciones = useCallback(() => setPopupGrabacionesAbierto(true), []);
    const cerrarListaGrabaciones = useCallback(() => setPopupGrabacionesAbierto(false), []);

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

    // Solo admins ven el modal expandido con opción de publicar como Canción Hero
    // y subir MP3 de fondo. El resto de roles ve el modal normal de Práctica Libre.
    const { usuario, esAdmin } = useUsuario();

    // "Re-grabar todo": descarta la grabación pendiente y vuelve a arrancar la
    // captura — pensado para que el admin pueda corregir notas malas sin
    // guardarlas. Reseteamos también el offset del loop para que el primer
    // tick de la nueva grabación coincida con el momento actual del MP3.
    const regrabarDesdeCero = useCallback(() => {
        grabacion.descartarGrabacionPendiente();
        // Pequeño delay para que el modal se desmonte antes de reiniciar REC
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

    const renderHilera = (fila: any[]) => {
        const p: Record<string, any> = {};
        fila?.forEach(n => {
            const pos = n.id.split('-').slice(0, 2).join('-');
            if (!p[pos]) p[pos] = { halar: null, empujar: null };
            n.id.includes('halar') ? p[pos].halar = n : p[pos].empujar = n;
        });

        return Object.entries(p).sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1])).map(([pos, n]) => {
            const labelHalar = formatearNombreNota(n.halar, config.modoVista, config.mostrarOctavas);
            const labelEmpujar = formatearNombreNota(n.empujar, config.modoVista, config.mostrarOctavas);
            const esDoble = config.vistaDoble;
            const esHalar = logica.direccion === 'halar';

            return (
                <div key={pos} className={`pito-boton ${esDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                    {(esDoble || esHalar) && <span className="nota-etiqueta label-halar">{labelHalar}</span>}
                    {(esDoble || !esHalar) && <span className="nota-etiqueta label-empujar">{labelEmpujar}</span>}
                </div>
            );
        });
    };

    return (
        <div className={`simulador-app-root modo-${logica.direccion} ${enReproduccion ? 'reproduciendo' : ''}`}>
            <ContenedorBajos
                visible={bajosVisible}
                onOpen={() => setBajosVisible(true)}
                onClose={() => setBajosVisible(false)}
                logica={logica}
                escala={escala}
                manejarCambioFuelle={manejarCambioFuelle}
                desactivarAudio={desactivarAudio}
                vistaDoble={config.vistaDoble}
            />

            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas
                        logica={logica} x={x} escala={escala} setEscala={setEscala}
                        modoVista={config.modoVista} grabando={grabando} toggleGrabacion={handleToggleGrabacion}
                        bpmMetronomo={bpmMetronomo} modalesVisibles={modales}
                        onToggleMenu={() => toggleModal('menu')} onToggleTonalidades={() => toggleModal('tonalidades')}
                        onToggleMetronomo={() => toggleModal('metronomo')} onToggleInstrumentos={() => toggleModal('instrumentos')}
                        onToggleVista={() => toggleModal('vista')} onToggleAprende={() => toggleModal('aprende')}
                        onToggleLoops={() => toggleModal('loops')}
                        onToggleEfectos={() => toggleModal('efectos')}
                        loopActivo={!!loops.pistaActiva}
                        refs={refsModales as any}
                    />

                    <div className="diapason-marco" style={{ touchAction: 'manipulation' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'manipulation' }}>
                            <div className="hilera-pitos hilera-adentro">{renderHilera(logica.configTonalidad?.terceraFila)}</div>
                            <div className="hilera-pitos hilera-medio">{renderHilera(logica.configTonalidad?.segundaFila)}</div>
                            <div className="hilera-pitos hilera-afuera">{renderHilera(logica.configTonalidad?.primeraFila)}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <MenuOpciones
                visible={modales.menu}
                onCerrar={() => toggleModal('menu')}
                botonRef={refsModales.menu as any}
                onAbrirContacto={() => toggleModal('contacto')}
            />

            <ModalTonalidades visible={modales.tonalidades} onCerrar={() => toggleModal('tonalidades')} tonalidadSeleccionada={logica.tonalidadSeleccionada} onSeleccionarTonalidad={logica.setTonalidadSeleccionada} listaTonalidades={logica.listaTonalidades} botonRef={refsModales.tonalidades as any} />

            <ModalVista
                visible={modales.vista}
                onCerrar={() => toggleModal('vista')}
                modoVista={config.modoVista}
                setModoVista={(v) => setConfig(c => ({ ...c, modoVista: v }))}
                mostrarOctavas={config.mostrarOctavas}
                setMostrarOctavas={(v) => setConfig(c => ({ ...c, mostrarOctavas: v }))}
                vistaDoble={config.vistaDoble}
                setVistaDoble={(v) => setConfig(c => ({ ...c, vistaDoble: v }))}
                botonRef={refsModales.vista as any}
            />

            <ModalMetronomo visible={modales.metronomo} onCerrar={() => toggleModal('metronomo')} bpm={bpmMetronomo} setBpm={setBpmMetronomo} met={metronomoVivo} />

            <ModalLoops
                visible={modales.loops}
                onCerrar={() => toggleModal('loops')}
                pistaActivaId={loops.pistaActiva?.id || null}
                volumen={loops.volumen}
                velocidad={loops.velocidad}
                onVolumenChange={loops.setVolumen}
                onVelocidadChange={loops.setVelocidad}
                onSeleccionarPista={loops.reproducir}
                velocidadBloqueada={grabacion.grabandoHero}
                errorReproduccion={loops.errorReproduccion}
                pistasListas={loops.pistasListas}
                onPrecargarPistas={loops.precargarPistas}
            />

            <ModalInstrumentos visible={modales.instrumentos} onCerrar={() => toggleModal('instrumentos')} listaInstrumentos={logica.listaInstrumentos} instrumentoId={logica.instrumentoId} onSeleccionarInstrumento={logica.setInstrumentoId} cargando={logica.cargandoCloud} botonRef={refsModales.instrumentos as any} />

            {modales.efectos && (
                <div className="peas-modal-overlay" onClick={() => toggleModal('efectos')}>
                    <div className="peas-modal-contenido" onClick={(e) => e.stopPropagation()}>
                        <PanelEfectosSimulador
                            reverbActivo={reverbActivo}
                            reverbIntensidad={reverbIntensidad}
                            reverbPreset={reverbPreset}
                            onCambiarReverbActivo={setReverbActivo}
                            onCambiarReverbIntensidad={setReverbIntensidad}
                            onCambiarReverbPreset={setReverbPreset}
                            ecoActivo={ecoActivo}
                            ecoIntensidad={ecoIntensidad}
                            ecoTiempo={ecoTiempo}
                            onCambiarEcoActivo={setEcoActivo}
                            onCambiarEcoIntensidad={setEcoIntensidad}
                            onCambiarEcoTiempo={setEcoTiempo}
                            distorsActivo={distorsActivo}
                            distorsIntensidad={distorsIntensidad}
                            distorsPreset={distorsPreset}
                            onCambiarDistorsActivo={setDistorsActivo}
                            onCambiarDistorsIntensidad={setDistorsIntensidad}
                            onCambiarDistorsPreset={setDistorsPreset}
                            graves={graves}
                            medios={medios}
                            agudos={agudos}
                            onCambiarGraves={setGraves}
                            onCambiarMedios={setMedios}
                            onCambiarAgudos={setAgudos}
                            volumenTeclado={volumenTeclado}
                            volumenBajos={volumenBajos}
                            volumenLoops={Math.round(loops.volumen * 100)}
                            volumenMetronomo={Math.round(metronomoVivo.volumen * 100)}
                            onCambiarVolumenTeclado={setVolumenTeclado}
                            onCambiarVolumenBajos={setVolumenBajos}
                            onCambiarVolumenLoops={(v) => loops.setVolumen(v / 100)}
                            onCambiarVolumenMetronomo={(v) => metronomoVivo.setVolumen(v / 100)}
                            panTeclado={panTeclado}
                            panBajos={panBajos}
                            panLoops={panLoops}
                            panMetronomo={panMetronomo}
                            onCambiarPanTeclado={setPanTeclado}
                            onCambiarPanBajos={setPanBajos}
                            onCambiarPanLoops={setPanLoops}
                            onCambiarPanMetronomo={setPanMetronomo}
                            onPreviewTecladoIniciar={previewTecladoIniciar}
                            onPreviewTecladoDetener={previewTecladoDetener}
                            onPreviewBajosIniciar={previewBajosIniciar}
                            onPreviewBajosDetener={previewBajosDetener}
                            onPreviewLoopsIniciar={previewLoopsIniciar}
                            onPreviewLoopsDetener={previewLoopsDetener}
                            onPreviewMetronomoIniciar={previewMetronomoIniciar}
                            onPreviewMetronomoDetener={previewMetronomoDetener}
                            onCerrar={() => toggleModal('efectos')}
                            onRestaurar={restaurarEfectos}
                        />
                    </div>
                </div>
            )}

            <ModalContacto visible={modales.contacto} onCerrar={() => toggleModal('contacto')} />

            <PantallaAprende
                visible={modales.aprende}
                onCerrar={() => toggleModal('aprende')}
                tonalidadActual={logica.tonalidadSeleccionada}
                onEmpezarCancion={(config: ConfigCancion) => {
                    onIniciarJuego(config);
                }}
            />

            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>HORIZONTAL</h2></div>)}

            {!audioListo && (
                <div className="overlay-audio-inicio" aria-hidden="true">
                    Toca para comenzar
                </div>
            )}

            <BarraGrabacionFlotante
                grabando={grabacion.grabandoHero}
                tiempoMs={grabacion.tiempoGrabacionMs}
                onAlternarGrabacion={handleToggleGrabacion}
                onAbrirLista={abrirListaGrabaciones}
                enReproduccion={enReproduccion}
                pausado={reproductor.pausado}
                tickActual={reproductor.tickActual}
                totalTicks={reproductor.totalTicks}
                bpmReproduccion={bpmReproduccion}
                resolucionReproduccion={resolucionReproduccion}
                onAlternarPausa={reproductor.alternarPausa}
                onDetenerReproduccion={detenerReproduccion}
                onRetroceder={retrocederReproduccion}
                onAdelantar={adelantarReproduccion}
            />

            <PopupListaGrabaciones
                visible={popupGrabacionesAbierto}
                onCerrar={cerrarListaGrabaciones}
                onSeleccionar={(id) => {
                    cerrarListaGrabaciones();
                    reproducirGrabacion(id);
                }}
            />

            {/* Admin: modal expandido con Canción Hero + re-grabar + MP3 fondo.
                Resto de roles: modal simple original. */}
            {esAdmin ? (
                <ModalGrabacionAdmin
                    visible={!!grabacion.grabacionPendiente && grabacion.grabacionPendiente.tipo === 'practica_libre'}
                    guardando={grabacion.guardandoGrabacion}
                    error={grabacion.errorGuardadoGrabacion}
                    tituloSugerido={grabacion.grabacionPendiente?.tituloSugerido || 'Mi grabación'}
                    autorDefault={usuario?.nombre || 'Jesus Gonzalez'}
                    usoMetronomo={!!grabacion.grabacionPendiente?.metadata?.metronomo}
                    resumen={grabacion.grabacionPendiente ? {
                        duracionMs: grabacion.grabacionPendiente.duracionMs,
                        bpm: grabacion.grabacionPendiente.bpm,
                        tonalidad: grabacion.grabacionPendiente.tonalidad,
                        notas: grabacion.grabacionPendiente.secuencia.length,
                    } : null}
                    onCancelar={grabacion.descartarGrabacionPendiente}
                    onRegrabar={regrabarDesdeCero}
                    onGuardarPersonal={guardarPracticaLibre}
                    onGuardarCancionHero={guardarComoCancionHero}
                />
            ) : (
                <ModalGuardarSimulador
                    visible={!!grabacion.grabacionPendiente && grabacion.grabacionPendiente.tipo === 'practica_libre'}
                    guardando={grabacion.guardandoGrabacion}
                    error={grabacion.errorGuardadoGrabacion}
                    tituloSugerido={grabacion.grabacionPendiente?.tituloSugerido || 'Practica libre'}
                    resumen={grabacion.grabacionPendiente ? {
                        duracionMs: grabacion.grabacionPendiente.duracionMs,
                        bpm: grabacion.grabacionPendiente.bpm,
                        tonalidad: grabacion.grabacionPendiente.tonalidad,
                        notas: grabacion.grabacionPendiente.secuencia.length,
                    } : null}
                    onCancelar={grabacion.descartarGrabacionPendiente}
                    onGuardar={guardarPracticaLibre}
                />
            )}

            <ToastGrabacionGuardada
                visible={toastGuardadaVisible}
                onCerrar={() => setToastGuardadaVisible(false)}
            />

            {/* Overlay "vine de la clase": botón siempre visible que regresa al video
                en el mismo segundo donde el alumno lo dejó. Independiente del flujo
                de Grabaciones — pueden coexistir aunque en la práctica no se da. */}
            {volverAClaseParam && (
                <button
                    type="button"
                    className="sim-volver-clase"
                    onClick={volverALaClase}
                    aria-label="Volver a la clase"
                >
                    <ArrowLeft size={16} />
                    <span>Volver a la clase</span>
                </button>
            )}

            {/* Overlay de "vine de Grabaciones": boton Volver siempre visible
                durante la reproduccion. Al terminar el replay, countdown 3s
                + opcion de quedarse en el simulador. Solo aparecen si llego
                con ?reproducir=<id> y NO eligio quedarse. */}
            {vinoDeGrabaciones && !usuarioEligioQuedarse && (
                <>
                    <button
                        type="button"
                        className="sim-volver-grabaciones"
                        onClick={volverAGrabaciones}
                        aria-label="Volver a Grabaciones"
                    >
                        <ArrowLeft size={16} />
                        <span>Volver</span>
                    </button>

                    {countdownVolver !== null && (
                        <div className="sim-countdown-volver" role="dialog" aria-live="polite">
                            <p>
                                <strong>Replay terminado.</strong>
                                <br />
                                Volviendo a Grabaciones en <strong>{countdownVolver}s</strong>…
                            </p>
                            <div className="sim-countdown-volver-acciones">
                                <button type="button" onClick={volverAGrabaciones}>
                                    Volver ahora
                                </button>
                                <button type="button" className="primaria" onClick={quedarseEnSimulador}>
                                    Quedarme aquí
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SimuladorApp;
