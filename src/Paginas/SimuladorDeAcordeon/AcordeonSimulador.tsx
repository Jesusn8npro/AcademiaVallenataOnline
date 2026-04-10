import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Music } from 'lucide-react';
import './AcordeonSimulador.css';

// Hooks
import { useLogicaAcordeon } from './Hooks/useLogicaAcordeon';
import { useGrabadorHero } from './Hooks/useGrabadorHero';
import { useReproductorHero } from './Hooks/useReproductorHero'; // Importante

// Componentes
import BotonesControl from './Componentes/BotonesControl';
import CuerpoAcordeon from './Componentes/CuerpoAcordeon';
import PanelAjustes from './Componentes/PanelAjustes/PanelAjustes';
import ModalMetronomo from '../SimuladorApp/Componentes/ModalMetronomo';
import ModalGuardarHero from './Componentes/ModalGuardarHero';
import ModalListaHero from './Componentes/ModalListaHero';
import { GestorPistasHero } from './Componentes/GestorPistasHero';
import { LoadingHero } from './Componentes/LoadingHero';
import ReproductorSecuencia from './Componentes/ReproductorSecuencia';
import ModalCreadorAcordes from './Componentes/ModalCreadorAcordes';
import ModalListaAcordes from './Componentes/ModalListaAcordes';

// Tipos
import type { AcordeonSimuladorProps, AcordeonSimuladorHandle } from './TiposAcordeon';
import type { CancionHero } from './videojuego_acordeon/tipos_Hero';

// Assets
const bgAcordeonDefault = '/AcordeonJugador.png';

/**
 * 🪗 ACORDEÓN SIMULADOR V-PRO
 * El componente principal rediseñado y refactorizado para máxima legibilidad y rendimiento.
 */
const AcordeonSimulador = forwardRef<AcordeonSimuladorHandle, AcordeonSimuladorProps>((props, ref) => {
    const {
        imagenFondo = bgAcordeonDefault,
    } = props;

    // --- ESTADOS DE HERO & METRÓNOMO ---
    const [bpm, setBpm] = React.useState(120);
    const [metronomoVisible, setMetronomoVisible] = React.useState(false);
    const [metronomoActivo, setMetronomoActivo] = React.useState(false);
    const [forzarDetencionMetronomo, setForzarDetencionMetronomo] = React.useState(false);
    const [modalGuardarVisible, setModalGuardarVisible] = React.useState(false);
    const [modalListaVisible, setModalListaVisible] = React.useState(false);
    const [pistaUrl, setPistaUrl] = React.useState<string | null>(null);
    const [pistaFile, setPistaFile] = React.useState<File | null>(null);
    const [bpmGrabacion, setBpmGrabacion] = React.useState(bpm);
    const [cuentaRegresiva, setCuentaRegresiva] = React.useState<number | null>(null);
    const [modalAcordesVisible, setModalAcordesVisible] = React.useState(false);
    const [modalListaAcordesVisible, setModalListaAcordesVisible] = React.useState(false);
    const [acordeAEditar, setAcordeAEditar] = React.useState<any | null>(null);
    const [acordeMaestroActivo, setAcordeMaestroActivo] = React.useState(false);
    const [idSonandoCiclo, setIdSonandoCiclo] = React.useState<string | null>(null);
    const cicloActivoRef = React.useRef<boolean>(false);
    const timerAutostopRef = React.useRef<any>(null);
    
    // Rastreador inteligente de uso de metrónomo durante la grabación
    const usoMetronomoRef = React.useRef(false);

    const grabador = useGrabadorHero(bpm);

    // Extraemos toda la lógica pesada al hook personalizado
    const logica = useLogicaAcordeon({
        ...props,
        onNotaPresionada: (data) => {
            const dirHero = logica.direccion === 'halar' ? 'abriendo' : 'cerrando';
            grabador.registrarPresion(data.idBoton, dirHero);
            if (props.onNotaPresionada) props.onNotaPresionada(data);
        },
        onNotaLiberada: (data) => {
            grabador.registrarLiberacion(data.idBoton);
            if (props.onNotaLiberada) props.onNotaLiberada(data);
        }
    });

    const reproductor = useReproductorHero(
        logica.actualizarBotonActivo,
        logica.setDireccionSinSwap,
        logica.reproduceTono,
        bpm // Enviamos el BPM actual para sincronización en tiempo real
    );

    // Efecto para abrir el modal cuando se detiene la grabación
    const [lastGrabando, setLastGrabando] = React.useState(false);
    const [tipoSugerido, setTipoSugerido] = React.useState<'secuencia' | 'cancion' | 'ejercicio'>('secuencia');

    React.useEffect(() => {
        if (grabador.grabando) {
            usoMetronomoRef.current = metronomoActivo;
            setForzarDetencionMetronomo(false); // Reseteamos flag al empezar
            reproductor.detenerReproduccion(); // No grabar mientras se reproduce
        }

        if (lastGrabando && !grabador.grabando && grabador.secuencia.length > 0) {
            // Determinar tipo sugerido
            if (usoMetronomoRef.current) setTipoSugerido('secuencia');
            else setTipoSugerido('ejercicio');
            
            setModalGuardarVisible(true);
        }
        setLastGrabando(grabador.grabando);
    }, [grabador.grabando, metronomoActivo, lastGrabando]);

    // Detener el metrónomo automáticamente cuando se acabe una canción reproducida
    const reproduciendoAnterior = React.useRef(reproductor.reproduciendo);
    React.useEffect(() => {
        if (reproduciendoAnterior.current && !reproductor.reproduciendo) {
            setForzarDetencionMetronomo(true);
            setTimeout(() => setForzarDetencionMetronomo(false), 200);
        }
        reproduciendoAnterior.current = reproductor.reproduciendo;
    }, [reproductor.reproduciendo]);

    // Actualizar usoMetronomoRef si se activa el metrónomo MIENTRAS se graba
    React.useEffect(() => {
        if (grabador.grabando && metronomoActivo) {
            usoMetronomoRef.current = true;
        }
    }, [metronomoActivo, grabador.grabando]);

    const handleGuardar = async (datos: any) => {
        setForzarDetencionMetronomo(true); // ⬅️ DETENER METRÓNOMO AL GUARDAR
        setTimeout(() => setForzarDetencionMetronomo(false), 200);
        
        const { error } = await grabador.guardarSecuencia({
            ...datos,
            usoMetronomo: usoMetronomoRef.current,
            pistaFile: pistaFile,
            tonalidad: logica.tonalidadSeleccionada
        });
        if (error) {
            alert("❌ Error al guardar: " + (error as any).message || "Error desconocido");
        } else {
            alert("✅ ¡Se grabó correctamente en la nube!");
            setModalGuardarVisible(false);
        }
    };

    const handleEscuchar = (cancion: CancionHero) => {
        setModalListaVisible(false);
        
        if (cancion.bpm) {
            setBpm(cancion.bpm);
        }
        
        // Magia para cargar pista si existe:
        if ((cancion as any).audio_fondo_url) {
            setPistaUrl((cancion as any).audio_fondo_url);
            setPistaFile(null);
            setBpmGrabacion(cancion.bpm || bpm);
        } else {
            setPistaUrl(null);
            setPistaFile(null);
        }

        reproductor.reproducirSecuencia(cancion);
    };

    const handlePistaChange = (url: string | null, file: File | null) => {
        setPistaUrl(url);
        setPistaFile(file);
        if (url) {
            setBpmGrabacion(bpm);
        }
    };

    // Efecto para manejar la visibilidad del cursor
    React.useEffect(() => {
        if (logica.modoAjuste || modalAcordesVisible) {
            document.body.style.setProperty('cursor', 'default', 'important'); // Forzar cursor visible real
            if (logica.modoAjuste) document.body.classList.add('diseno-activo');
        } else {
            document.body.style.cursor = '';
            document.body.classList.remove('diseno-activo');
        }
        return () => {
            document.body.style.cursor = '';
            document.body.classList.remove('diseno-activo');
        };
    }, [logica.modoAjuste, modalAcordesVisible]);

    // Exponemos métodos al exterior usando el ref
    useImperativeHandle(ref, () => ({
        limpiarTodasLasNotas: logica.limpiarTodasLasNotas,
        cambiarDireccion: (nuevaDireccion: 'halar' | 'empujar') => {
            logica.setDireccion(nuevaDireccion);
            logica.limpiarTodasLasNotas();
        },
        // Meta-data para el grabador
        grabador
    }));

    return (
        <div className="simulador-acordeon-root" style={{
            width: '100%',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000',
            userSelect: 'none',
            cursor: (logica.modoAjuste || modalAcordesVisible) ? 'default' : 'auto'
        }}>
            {/* 🔥 FUERZA BRUTA PARA VISIBILIDAD DEL MOUSE */}
            <style>{`
                html, body, #root, .simulador-acordeon-root {
                    cursor: ${(logica.modoAjuste || modalAcordesVisible) ? 'default !important' : 'auto'} !important;
                }
                * {
                    cursor: ${(logica.modoAjuste || modalAcordesVisible) ? 'default !important' : 'auto'};
                }
                .boton, .boton-fuelle-control, .boton-gestor-flotante, select, input, button {
                    cursor: pointer !important;
                }
            `}</style>

            {/* ✨ CARGADOR PREMIUM (Carga Inicial) */}
            <AnimatePresence>
                {!logica.disenoCargado && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 10000000,
                            background: '#0a0a0af2', backdropFilter: 'blur(30px)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '20px', color: 'white'
                        }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Music size={60} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 20px #3b82f6)' }} />
                            <Loader2 size={100} className="animate-spin" style={{ position: 'absolute', opacity: 0.2, color: '#3b82f6' }} />
                        </motion.div>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '5px', letterSpacing: '2px', color: '#3b82f6' }}>SIMULADOR V-PRO</h2>
                            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Sincronizando con la nube...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🆕 BARRA DE ESTADO MAESTRO: FUELLE + TONALIDAD */}
            <div style={{
                position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '20px', zIndex: 100, pointerEvents: 'none'
            }}>
                {/* Indicador de Fuelle */}
                <div style={{
                    padding: '12px 30px', borderRadius: '24px',
                    backgroundColor: logica.direccion === 'halar' ? '#ef4444' : '#22c55e',
                    color: 'white', fontWeight: '900', fontSize: '1.2rem',
                    border: '4px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', gap: '15px'
                }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'white', animation: 'pulse 1.5s infinite' }}></div>
                    {logica.direccion === 'halar' ? 'ABRIENDO' : 'CERRANDO'}
                </div>

                {/* Indicador de Tonalidad (NUEVO) */}
                <div style={{
                    padding: '12px 30px', borderRadius: '24px',
                    backgroundColor: '#18181b', color: '#3b82f6',
                    fontWeight: '900', fontSize: '1.2rem',
                    border: '4px solid #3b82f6', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', gap: '15px'
                }}>
                    <span style={{ color: '#71717a', fontSize: '0.8rem' }}>TONO:</span>
                    {logica.tonalidadSeleccionada.toUpperCase()}
                </div>

                <style>{`
                    @keyframes pulse {
                        0% { opacity: 0.5; transform: scale(0.8); }
                        50% { opacity: 1; transform: scale(1.2); }
                        100% { opacity: 0.5; transform: scale(0.8); }
                    }
                `}</style>
            </div>

            {/* Cuenta Regresiva de Grabación */}
            <AnimatePresence>
                {cuentaRegresiva !== null && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)', pointerEvents: 'none'
                        }}
                    >
                        <h1 style={{ fontSize: '150px', fontWeight: '900', color: '#ef4444', textShadow: '0 0 50px rgba(239, 68, 68, 0.8)', margin: 0 }}>
                            {cuentaRegresiva}
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. Botones de Control Flotantes (Lado Derecho) */}
            <BotonesControl
                {...logica}
                grabando={grabador.grabando}
                setGrabando={(val) => {
                    if (val) {
                        setCuentaRegresiva(3);
                        let cuenta = 3;
                        const interval = setInterval(() => {
                            cuenta--;
                            if (cuenta > 0) {
                                setCuentaRegresiva(cuenta);
                            } else {
                                clearInterval(interval);
                                setCuentaRegresiva(null);
                                grabador.iniciarGrabacion();
                            }
                        }, 1000);
                    } else {
                        grabador.detenerGrabacion();
                    }
                }}
                metronomoVisible={metronomoVisible}
                setMetronomoVisible={setMetronomoVisible}
                bpm={bpm}
                onAbrirLista={() => setModalListaVisible(true)}
                onAbrirCreadorAcordes={() => setModalAcordesVisible(true)}
                onAbrirListaAcordes={() => setModalListaAcordesVisible(true)}
                reproduciendo={reproductor.reproduciendo}
                conectarESP32={logica.conectarESP32}
                esp32Conectado={logica.esp32Conectado}
            />

            {/* Metrónomo */}
            <ModalMetronomo
                visible={metronomoVisible}
                onCerrar={() => setMetronomoVisible(false)}
                onActivoChange={setMetronomoActivo}
                forzarDetencion={forzarDetencionMetronomo}
                forzarInicio={reproductor.reproduciendo && !!reproductor.cancionActual?.usoMetronomo}
                botonRef={null as any}
                bpm={bpm}
                setBpm={setBpm}
            />

            {/* Modal de Guardado Premium (Hero) */}
            <ModalGuardarHero
                visible={modalGuardarVisible}
                onCerrar={() => setModalGuardarVisible(false)}
                onGuardar={handleGuardar}
                bpm={bpm}
                totalNotas={grabador.secuencia.length}
                sugerenciaTipo={tipoSugerido}
                tonalidadActual={logica.tonalidadSeleccionada}
            />

            {/* Modal de Lista de Grabaciones (Biblioteca) */}
            <ModalListaHero
                visible={modalListaVisible}
                onCerrar={() => setModalListaVisible(false)}
                onReproducir={handleEscuchar}
            />

            {/* 🎹 MODAL CREADOR DE ACORDES (ADMIN) */}
            <ModalCreadorAcordes
                visible={modalAcordesVisible}
                onCerrar={() => {
                    setModalAcordesVisible(false);
                    // Si estábamos editando (acordeAEditar no es nulo), re-abrimos la biblioteca al cerrar
                    if (acordeAEditar) setModalListaAcordesVisible(true);
                    setAcordeAEditar(null);
                }}
                botonesSeleccionados={Object.keys(logica.botonesActivos)}
                fuelleActual={logica.direccion === 'halar' ? 'abriendo' : 'cerrando'}
                tonalidadActual={logica.tonalidadSeleccionada}
                acordeAEditar={acordeAEditar}
                onExitoUpdate={() => {
                    // Si estábamos editando desde la biblioteca, la re-abrimos tras el éxito
                    setModalListaAcordesVisible(true);
                }}
            />

            <ModalListaAcordes
                visible={modalListaAcordesVisible}
                onCerrar={() => setModalListaAcordesVisible(false)}
                tonalidadActual={logica.tonalidadSeleccionada}
                onReproducirAcorde={(botones, fuelle, id) => {
                    logica.limpiarTodasLasNotas();
                    if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);

                    const dirNueva = fuelle === 'abriendo' ? 'halar' : 'empujar';
                    logica.setDireccion(dirNueva); 
                    setAcordeMaestroActivo(true);
                    if (id) setIdSonandoCiclo(id);
                    
                    setTimeout(() => {
                        botones.forEach(idNote => {
                            const originalParts = idNote.split('-');
                            const esBajo = idNote.includes('bajo');
                            const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
                            logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
                        });
                    }, 50);

                    // 🕒 AUTO-DETENCIÓN EN 5 SEGUNDOS
                    timerAutostopRef.current = setTimeout(() => {
                        logica.limpiarTodasLasNotas();
                        setAcordeMaestroActivo(false);
                        setIdSonandoCiclo(null);
                    }, 5000); // 5 Segundos de "demostración"
                }}
                onDetener={() => {
                    if (timerAutostopRef.current) clearTimeout(timerAutostopRef.current);
                    cicloActivoRef.current = false; // Detenemos ciclo si existe
                    logica.limpiarTodasLasNotas();
                    setAcordeMaestroActivo(false);
                    setIdSonandoCiclo(null);
                }}
                idSonando={idSonandoCiclo || (acordeMaestroActivo ? 'activo' : null)}
                onEditarAcorde={(acorde) => {
                    setModalListaAcordesVisible(false);
                    setAcordeAEditar(acorde);
                    setModalAcordesVisible(true);
                }}
                onNuevoAcordeEnCirculo={(tonalidad, modalidad) => {
                    setModalListaAcordesVisible(false);
                    setAcordeAEditar({
                        grado: tonalidad || '',
                        modalidad_circulo: modalidad || 'Mayor'
                    });
                    setModalAcordesVisible(true);
                }}
                onReproducirCirculoCompleto={async (acordes) => {
                    if (cicloActivoRef.current) {
                        cicloActivoRef.current = false;
                        logica.limpiarTodasLasNotas();
                        setAcordeMaestroActivo(false);
                        return;
                    }

                    cicloActivoRef.current = true;
                    setAcordeMaestroActivo(true);

                    for (const ac of acordes) {
                        setIdSonandoCiclo(ac.id);

                        // Reproducir Acorde
                        logica.limpiarTodasLasNotas();
                        const dirNueva = ac.fuelle === 'abriendo' ? 'halar' : 'empujar';
                        logica.setDireccion(dirNueva); 
                        
                        await new Promise(r => setTimeout(r, 50));
                        if (!cicloActivoRef.current) break;

                        ac.botones.forEach((id: string) => {
                            const originalParts = id.split('-');
                            const esBajo = id.includes('bajo');
                            const idFinal = `${originalParts[0]}-${originalParts[1]}-${dirNueva}${esBajo ? '-bajo' : ''}`;
                            logica.actualizarBotonActivo(idFinal, 'add', null, false, undefined, true);
                        });

                        // Esperar 3 segundos antes del próximo o fin
                        await new Promise(r => {
                            timerAutostopRef.current = setTimeout(r, 3000);
                        });
                    }

                    cicloActivoRef.current = false;
                    logica.limpiarTodasLasNotas();
                    setAcordeMaestroActivo(false);
                    setIdSonandoCiclo(null);
                }}
            />

            {/* 🆕 REPRODUCTOR V-PRO (Controles de Reproducción) */}
            <ReproductorSecuencia
                reproducionActive={reproductor.reproduciendo}
                pausado={reproductor.pausado}
                cancionActual={reproductor.cancionActual}
                tickActual={reproductor.tickActual}
                totalTicks={reproductor.totalTicks}
                bpm={bpm}
                setBpm={setBpm}
                onAlternarPausa={reproductor.alternarPausa}
                onDetener={reproductor.detenerReproduccion}
                onBuscarTick={reproductor.buscarTick}
                onSetLoop={reproductor.setLoopPoints}
            />

            {/* 🎧 GESTOR DE PISTA DE FONDO */}
            <div style={{ position: 'absolute', left: '20px', bottom: '150px', zIndex: 1000 }}>
                <GestorPistasHero
                    pistaActualUrl={pistaUrl}
                    onPistaChange={handlePistaChange}
                    reproduciendo={reproductor.reproduciendo && !reproductor.pausado}
                    bpmSecuencia={bpm}
                    bpmGrabacion={bpmGrabacion}
                    enGrabacion={grabador.grabando}
                    tickActual={reproductor.tickActual || 0}
                />
            </div>

            {/* 2. Panel de Ajustes (Gestor de Diseño y Sonido) */}
            {logica.disenoCargado && <PanelAjustes {...logica} mapaBotonesActual={logica.mapaBotonesActual} />}

            {/* 3. El Acordeón (Cuerpo, Pitos y Bajos) */}
            {logica.ajustes && logica.configTonalidad ? (
                <CuerpoAcordeon
                    imagenFondo={imagenFondo}
                    ajustes={logica.ajustes}
                    direccion={logica.direccion}
                    configTonalidad={logica.configTonalidad}
                    botonesActivos={logica.botonesActivos}
                    modoAjuste={logica.modoAjuste}
                    botonSeleccionado={logica.botonSeleccionado}
                    modoVista={logica.modoVista}
                    vistaDoble={logica.vistaDoble}
                    setBotonSeleccionado={logica.setBotonSeleccionado}
                    actualizarBotonActivo={logica.actualizarBotonActivo}
                    listo={logica.disenoCargado}
                />
            ) : (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
                    Error al cargar configuración. Refresca la página (F5).
                </div>
            )}


            {/* Overlay para modo ajuste (Feedback visual global) */}
            {logica.modoAjuste && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none',
                    border: '4px solid #3b82f6', zIndex: 999999,
                    boxShadow: 'inset 0 0 100px rgba(59,130,246,0.1)',
                    animation: 'pulse-border 2s infinite'
                }}>
                    <style>{`
                        @keyframes pulse-border {
                            0% { border-color: rgba(59, 130, 246, 0.5); }
                            50% { border-color: rgba(59, 130, 246, 1); }
                            100% { border-color: rgba(59, 130, 246, 0.5); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
});

// Le damos un nombre para que las herramietas de dev lo reconozcan
AcordeonSimulador.displayName = 'AcordeonSimulador';

export default AcordeonSimulador;
