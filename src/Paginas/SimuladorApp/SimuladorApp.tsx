import React, { useEffect, useState, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { RotateCw, Eye, EyeOff, X as XIcon, Crown } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useLogicaAcordeon } from '../../Core/hooks/useLogicaAcordeon';
import { motorAudioPro } from '../../Core/audio/AudioEnginePro';
import { usePointerAcordeon } from './Hooks/usePointerAcordeon';
import { useReproductorLoops } from './Hooks/useReproductorLoops';
import { useMetronomo } from './Hooks/useMetronomo';
import { useEfectosAudio } from './Hooks/useEfectosAudio';
import { useReplaySimulador } from './Hooks/useReplaySimulador';
import { useGrabacionSimulador } from './Hooks/useGrabacionSimulador';
import ModalGuardarSimulador from './Componentes/ModalGuardarSimulador';
const ModalGrabacionAdmin = lazy(() => import('./Componentes/ModalGrabacionAdmin'));
import { obtenerTemaPorId, leerTemaGuardado, guardarTemaElegido } from './Datos/temasAcordeon';
import { useUsuario } from '../../contextos/UsuarioContext';
import PopupListaGrabaciones from './Componentes/PopupListaGrabaciones';
import PanelEfectosOverlay from './Componentes/PanelEfectosOverlay';
import OverlaysNavegacion from './Componentes/OverlaysNavegacion';
import ModalesBarraSimulador from './Componentes/ModalesBarraSimulador';
import { listarPistasPracticaLibre } from '../AcordeonProMax/PracticaLibre/Servicios/servicioPistasPracticaLibre';
import type { PistaPracticaLibre } from '../AcordeonProMax/PracticaLibre/TiposPracticaLibre';

import BarraHerramientas from './Componentes/BarraHerramientas/BarraHerramientas';
import ContenedorBajos from './Componentes/ContenedorBajos';
import type { ConfigCancion } from './Juego/Hooks/useConfigCancion';
const JuegoSimuladorApp = lazy(() => import('./Juego/JuegoSimuladorApp'));
import BarraGrabacionFlotante from './Componentes/BarraGrabacionFlotante';
import ToastGrabacionGuardada from './Componentes/ToastGrabacionGuardada';

import './SimuladorApp.css';

const MAPA_CIFRADO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
    'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
};

const SimuladorApp: React.FC = () => {
    const [juegoActivo, setJuegoActivo] = useState<ConfigCancion | null>(null);

    if (juegoActivo) {
        return (
            <Suspense fallback={null}>
                <JuegoSimuladorApp
                    config={juegoActivo}
                    onSalir={() => setJuegoActivo(null)}
                />
            </Suspense>
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

    // Modo Foco: oculta la barra de herramientas para dejar todo el espacio
    // visible al acordeón. Premium oculta TODO (incluido el banner). Free
    // sigue viendo el banner Hero (gatillo de venta — los anuncios al
    // alumno no premium no se ocultan).
    const [modoFoco, setModoFoco] = useState(false);
    const [toastUpgradeVisible, setToastUpgradeVisible] = useState(false);

    // Galería de modelos visuales del acordeón. Persiste la elección en
    // localStorage — al volver a abrir el simulador, el alumno conserva
    // su modelo. Default: 'pro_max' (lo que se ve hoy).
    const [galeriaAbierta, setGaleriaAbierta] = useState(false);
    const [temaAcordeonId, setTemaAcordeonId] = useState<string>(() => leerTemaGuardado());
    const temaAcordeon = useMemo(() => obtenerTemaPorId(temaAcordeonId), [temaAcordeonId]);
    const seleccionarTema = useCallback((id: string) => {
        setTemaAcordeonId(id);
        guardarTemaElegido(id);
        setGaleriaAbierta(false);
    }, []);

    // ─── Panel de Efectos de Audio ──────────────────────────────────────────
    // Estado controlado del panel + wiring al motor (reverb/eco/distorsion/EQ
    // /sub-buses teclado/bajos). Toda la sincronizacion al motor vive dentro
    // del hook; aqui solo conectamos los setters al PanelEfectosSimulador.
    const efectos = useEfectosAudio();

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

    const [bajosVisible, setBajosVisible] = useState(false);
    const [bpmMetronomo, setBpmMetronomo] = useState(80);
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

    const formatearNombreNota = (notaObj: any, modo: string, mostrarOctavas: boolean) => {
        if (!notaObj) return '';

        let nombre = notaObj.nombre || '';
        const partes = nombre.split(' ');
        let notaBase = partes[0];
        const octava = partes[1] || '';

        if (modo === 'cifrado') {
            notaBase = MAPA_CIFRADO[notaBase] || notaBase;
        }

        return mostrarOctavas ? `${notaBase}${octava}` : notaBase;
    };

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
        loops.setPan(efectos.panLoops / 50);
    }, [efectos.panLoops, loops]);
    useEffect(() => {
        metronomoVivo.setPan(efectos.panMetronomo / 50);
    }, [efectos.panMetronomo, metronomoVivo]);

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

    // ─── URL params: ?reproducir=<id> (auto-replay) y ?volverA=&t= (clase)
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const reproducirIdParam = searchParams.get('reproducir');
    // Cuando el alumno entró al simulador desde una clase móvil, llega con
    // ?volverA=<url-de-la-clase>&t=<segundos>. Mostramos un botón flotante para
    // regresar al video en el mismo segundo donde lo dejó.
    const volverAClaseParam = searchParams.get('volverA');
    const tiempoVideoClaseParam = searchParams.get('t');

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

    // ─── Replay inline + flujo "vino de Grabaciones" ────────────────────────
    // Reusa la `logica` (acordeon visual). Al reproducir una grabacion: el
    // reproductor llama a `actualizarBotonActivo` para resaltar las teclas +
    // `reproduceTono` para el audio. Los pitos se bloquean a touch via la
    // clase root .reproduciendo (CSS pointer-events).
    const replay = useReplaySimulador({
        logica,
        loops,
        metronomoVivo,
        isLandscape,
        disenoCargado: logica.disenoCargado,
        audioContextIniciadoRef,
        setAudioListo,
        reproducirIdParam,
        searchParams,
        setSearchParams,
        navigate,
    });

    // El panel FX se diseñó para no bloquear el simulador (drawer lateral con
    // pointer-events: none en el overlay). Lo excluimos de la lista que apaga
    // el audio para que el alumno pueda seguir tocando los pitos visibles
    // mientras ajusta efectos. Otros modales sí siguen apagando el audio.
    const desactivarAudio = useMemo(
        () => replay.enReproduccion || Object.entries(modales).some(([key, v]) => v && key !== 'efectos'),
        [modales, replay.enReproduccion]
    );

    // Cuando el panel FX está abierto, ocupa la mitad derecha de la pantalla.
    // Pasamos su rect + el del botón FOCO como "bloqueadores" para que
    // `usePointerAcordeon` ignore hits que caen sobre ellos (evita que tocar
    // el botón FOCO active el pito que queda debajo, o que el slide del dedo
    // desde un pito visible active los pitos tapados por el panel FX).
    const obtenerRectsBloqueadores = useCallback((): DOMRect[] => {
        const rects: DOMRect[] = [];
        if (modales.efectos) {
            const panel = document.querySelector('.peas-modal-contenido') as HTMLElement | null;
            if (panel) rects.push(panel.getBoundingClientRect());
        }
        const btnFoco = document.querySelector('.btn-modo-foco') as HTMLElement | null;
        if (btnFoco) rects.push(btnFoco.getBoundingClientRect());
        return rects;
    }, [modales.efectos]);

    const { manejarCambioFuelle, limpiarGeometria, actualizarGeometria } = usePointerAcordeon({
        x,
        logica,
        actualizarVisualBoton,
        trenRef,
        desactivarAudio,
        obtenerRectsBloqueadores
    });

    // ─── Grabador de practica libre del simulador ────────────────────────
    // En modo libre (fuera de juego) la metadata se sincroniza desde logica
    // dentro del hook para que el replay sepa tonalidad/instrumento/modeloVisual.
    const {
        grabacion,
        handleToggleGrabacion,
        guardarPracticaLibre,
        regrabarDesdeCero,
        guardarComoCancionHero,
        toastGuardadaVisible,
        setToastGuardadaVisible,
    } = useGrabacionSimulador({
        logica,
        loops,
        metronomoVivo,
        bpm: bpmMetronomo,
        registrarPresionRef,
        registrarLiberacionRef,
        direccionRefGrab,
    });

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

    // Popup inline con la lista de grabaciones (en lugar de navegar a /grabaciones).
    const [popupGrabacionesAbierto, setPopupGrabacionesAbierto] = useState(false);
    const abrirListaGrabaciones = useCallback(() => setPopupGrabacionesAbierto(true), []);
    const cerrarListaGrabaciones = useCallback(() => setPopupGrabacionesAbierto(false), []);

    // Solo admins ven el modal expandido con opción de publicar como Canción Hero
    // y subir MP3 de fondo. El resto de roles ve el modal normal de Práctica Libre.
    const { usuario, esAdmin } = useUsuario();
    // Premium = admin por ahora. Cuando se agregue `plan_activo` u otro
    // campo en la tabla `perfiles`, ampliar esta condición. Free incluye
    // estudiantes y usuarios sin sesión.
    const esPremium = esAdmin || (usuario as any)?.plan_activo === true;

    // Timer del modo foco para usuarios FREE: 60s gratis y luego se sale
    // automáticamente con un toast invitando a Plus. Premium queda siempre
    // activo. Idea: el alumno prueba la sensación de "pantalla limpia"
    // pero solo Plus tiene uso ilimitado — gatillo de venta concreto.
    const SEGUNDOS_FOCO_FREE = 60;
    useEffect(() => {
        if (!modoFoco || esPremium) return;
        const id = window.setTimeout(() => {
            setModoFoco(false);
            setToastUpgradeVisible(true);
        }, SEGUNDOS_FOCO_FREE * 1000);
        return () => window.clearTimeout(id);
    }, [modoFoco, esPremium]);

    // Toast upgrade auto-cierra después de 8s.
    useEffect(() => {
        if (!toastUpgradeVisible) return;
        const id = window.setTimeout(() => setToastUpgradeVisible(false), 8000);
        return () => window.clearTimeout(id);
    }, [toastUpgradeVisible]);

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
        <div className={`simulador-app-root modo-${logica.direccion} ${replay.enReproduccion ? 'reproduciendo' : ''}`}>
            <ContenedorBajos
                visible={bajosVisible}
                onOpen={() => setBajosVisible(true)}
                onClose={() => setBajosVisible(false)}
                logica={logica}
                escala={escala}
                manejarCambioFuelle={manejarCambioFuelle}
                desactivarAudio={desactivarAudio}
                vistaDoble={config.vistaDoble}
                imagenBajosUrl={temaAcordeon.bajos}
            />

            <div className="contenedor-acordeon-completo">
                <div
                    className={`simulador-canvas ${modoFoco ? 'modo-foco' : ''}`}
                    style={{ '--imagen-diapason': `url("${temaAcordeon.diapason}")` } as React.CSSProperties}
                >
                    <BarraHerramientas
                        logica={logica} x={x} escala={escala} setEscala={setEscala}
                        modoVista={config.modoVista} grabando={grabacion.grabandoHero} toggleGrabacion={handleToggleGrabacion}
                        bpmMetronomo={bpmMetronomo} modalesVisibles={modales}
                        onToggleMenu={() => toggleModal('menu')} onToggleTonalidades={() => toggleModal('tonalidades')}
                        onToggleMetronomo={() => toggleModal('metronomo')} onToggleInstrumentos={() => toggleModal('instrumentos')}
                        onToggleVista={() => toggleModal('vista')} onToggleAprende={() => toggleModal('aprende')}
                        onToggleLoops={() => toggleModal('loops')}
                        onToggleEfectos={() => toggleModal('efectos')}
                        loopActivo={!!loops.pistaActiva}
                        refs={refsModales as any}
                        modoFoco={modoFoco}
                        esPremium={esPremium}
                    />

                    {/* Modo Foco: pestaña vertical slim pegada al borde
                        izquierdo. Cuando está activo se muestra solo el ojo
                        (sin texto) — minimalismo total mientras se toca. */}
                    <button
                        type="button"
                        className={`btn-modo-foco ${modoFoco ? 'activo' : ''} ${esPremium ? 'premium' : 'free'}`}
                        onClick={() => setModoFoco(v => !v)}
                        title={modoFoco ? 'Salir de modo foco' : 'Modo foco — esconder herramientas'}
                        aria-label={modoFoco ? 'Salir de modo foco' : 'Activar modo foco'}
                    >
                        {modoFoco ? <EyeOff size={14} /> : <Eye size={14} />}
                        {!modoFoco && <span>FOCO</span>}
                    </button>

                    {/* Toast que aparece cuando un usuario FREE consumió sus
                        60s gratuitos de modo foco. Aparece arriba del simulador
                        sin bloquear la jugabilidad, auto-cierra en 8s. */}
                    {toastUpgradeVisible && (
                        <div className="toast-upgrade-premium" role="status">
                            <div className="toast-icono">
                                <Crown size={14} />
                            </div>
                            <div className="toast-mensaje">
                                <strong>Modo Foco gratuito terminó</strong>
                                Hazte Plus y disfrutalo sin límites
                            </div>
                            <button
                                type="button"
                                className="toast-cta"
                                onClick={() => {
                                    setToastUpgradeVisible(false);
                                    navigate('/paquetes');
                                }}
                            >
                                Ver Plus
                            </button>
                            <button
                                type="button"
                                className="toast-cerrar"
                                onClick={() => setToastUpgradeVisible(false)}
                                aria-label="Cerrar"
                            >
                                <XIcon size={14} />
                            </button>
                        </div>
                    )}

                    <div className="diapason-marco" style={{ touchAction: 'manipulation' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'manipulation' }}>
                            <div className="hilera-pitos hilera-adentro">{renderHilera(logica.configTonalidad?.terceraFila)}</div>
                            <div className="hilera-pitos hilera-medio">{renderHilera(logica.configTonalidad?.segundaFila)}</div>
                            <div className="hilera-pitos hilera-afuera">{renderHilera(logica.configTonalidad?.primeraFila)}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <ModalesBarraSimulador
                modales={modales}
                onToggleModal={toggleModal}
                refsModales={refsModales as any}
                logica={logica}
                config={config}
                setConfig={setConfig}
                bpmMetronomo={bpmMetronomo}
                setBpmMetronomo={setBpmMetronomo}
                metronomoVivo={metronomoVivo}
                loops={loops}
                grabandoHero={grabacion.grabandoHero}
                galeriaAbierta={galeriaAbierta}
                onCerrarGaleria={() => setGaleriaAbierta(false)}
                onAbrirGaleria={() => setGaleriaAbierta(true)}
                temaAcordeonId={temaAcordeonId}
                seleccionarTema={seleccionarTema}
                esPremium={esPremium}
                onIniciarJuego={onIniciarJuego}
            />

            <PanelEfectosOverlay
                visible={modales.efectos}
                efectos={efectos}
                loops={loops}
                metronomoVivo={metronomoVivo}
                onCerrar={() => toggleModal('efectos')}
                onPreviewTecladoIniciar={previewTecladoIniciar}
                onPreviewTecladoDetener={previewTecladoDetener}
                onPreviewBajosIniciar={previewBajosIniciar}
                onPreviewBajosDetener={previewBajosDetener}
                onPreviewLoopsIniciar={previewLoopsIniciar}
                onPreviewLoopsDetener={previewLoopsDetener}
                onPreviewMetronomoIniciar={previewMetronomoIniciar}
                onPreviewMetronomoDetener={previewMetronomoDetener}
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
                enReproduccion={replay.enReproduccion}
                pausado={replay.reproductor.pausado}
                tickActual={replay.reproductor.tickActual}
                totalTicks={replay.reproductor.totalTicks}
                bpmReproduccion={replay.bpmReproduccion}
                resolucionReproduccion={replay.resolucionReproduccion}
                onAlternarPausa={replay.reproductor.alternarPausa}
                onDetenerReproduccion={replay.detenerReproduccion}
                onRetroceder={replay.retrocederReproduccion}
                onAdelantar={replay.adelantarReproduccion}
            />

            <PopupListaGrabaciones
                visible={popupGrabacionesAbierto}
                onCerrar={cerrarListaGrabaciones}
                onSeleccionar={(id) => {
                    cerrarListaGrabaciones();
                    replay.reproducirGrabacion(id);
                }}
            />

            {/* Admin: modal expandido con Canción Hero + re-grabar + MP3 fondo.
                Resto de roles: modal simple original. */}
            {esAdmin ? (
                <Suspense fallback={null}>
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
                </Suspense>
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

            <OverlaysNavegacion
                volverAClaseParam={volverAClaseParam}
                onVolverALaClase={volverALaClase}
                vinoDeGrabaciones={replay.vinoDeGrabaciones}
                usuarioEligioQuedarse={replay.usuarioEligioQuedarse}
                countdownVolver={replay.countdownVolver}
                onVolverAGrabaciones={replay.volverAGrabaciones}
                onQuedarseEnSimulador={replay.quedarseEnSimulador}
            />
        </div>
    );
};

export default SimuladorApp;
