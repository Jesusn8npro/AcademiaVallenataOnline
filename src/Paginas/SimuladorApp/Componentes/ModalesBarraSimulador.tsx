import React, { lazy, Suspense } from 'react';

import MenuOpciones from './BarraHerramientas/MenuOpciones';
import ModalContacto from './BarraHerramientas/ModalContacto';
import ModalTonalidades from './BarraHerramientas/ModalTonalidades';
import ModalVista from './BarraHerramientas/ModalVista';
import ModalMetronomo from './BarraHerramientas/ModalMetronomo';
import ModalInstrumentos from './BarraHerramientas/ModalInstrumentos';
import GaleriaAcordeones from './GaleriaAcordeones';

import type { useReproductorLoops } from '../Hooks/useReproductorLoops';
import type { useMetronomo } from '../Hooks/useMetronomo';
import type { ConfigCancion } from '../Juego/Hooks/useConfigCancion';

const ModalLoops = lazy(() => import('./ModalLoops'));
const PantallaAprende = lazy(() => import('../Juego/Pantallas/PantallaAprende'));

type LoopsApi = ReturnType<typeof useReproductorLoops>;
type MetronomoApi = ReturnType<typeof useMetronomo>;

type ModalesState = {
    menu: boolean;
    tonalidades: boolean;
    vista: boolean;
    metronomo: boolean;
    instrumentos: boolean;
    contacto: boolean;
    aprende: boolean;
    loops: boolean;
    efectos: boolean;
};

type ConfigVista = {
    modoVista: 'notas' | 'cifrado' | 'numeros' | 'teclas';
    mostrarOctavas: boolean;
    vistaDoble: boolean;
};

interface ModalesBarraSimuladorProps {
    modales: ModalesState;
    onToggleModal: (nombre: keyof ModalesState) => void;
    refsModales: {
        menu: React.RefObject<any>;
        tonalidades: React.RefObject<any>;
        metronomo: React.RefObject<any>;
        instrumentos: React.RefObject<any>;
        vista: React.RefObject<any>;
        aprende: React.RefObject<any>;
    };
    logica: any;
    config: ConfigVista;
    setConfig: React.Dispatch<React.SetStateAction<ConfigVista>>;
    bpmMetronomo: number;
    setBpmMetronomo: (bpm: number) => void;
    metronomoVivo: MetronomoApi;
    loops: LoopsApi;
    grabandoHero: boolean;
    galeriaAbierta: boolean;
    onCerrarGaleria: () => void;
    onAbrirGaleria: () => void;
    temaAcordeonId: string;
    seleccionarTema: (id: string) => void;
    esPremium: boolean;
    onIniciarJuego: (config: ConfigCancion) => void;
}

/**
 * Agrupa los modales/popups disparables desde la barra de herramientas:
 * Menu, Galeria, Tonalidades, Vista, Metronomo, Loops, Instrumentos,
 * Contacto y PantallaAprende (Juego). Mantiene el comportamiento lazy
 * para Loops y PantallaAprende (modulos pesados que no se cargan hasta
 * que el alumno los abre).
 */
const ModalesBarraSimulador: React.FC<ModalesBarraSimuladorProps> = ({
    modales,
    onToggleModal,
    refsModales,
    logica,
    config,
    setConfig,
    bpmMetronomo,
    setBpmMetronomo,
    metronomoVivo,
    loops,
    grabandoHero,
    galeriaAbierta,
    onCerrarGaleria,
    onAbrirGaleria,
    temaAcordeonId,
    seleccionarTema,
    esPremium,
    onIniciarJuego,
}) => {
    return (
        <>
            <MenuOpciones
                visible={modales.menu}
                onCerrar={() => onToggleModal('menu')}
                botonRef={refsModales.menu as any}
                onAbrirContacto={() => onToggleModal('contacto')}
                onAbrirGaleria={onAbrirGaleria}
            />

            <GaleriaAcordeones
                visible={galeriaAbierta}
                temaActivoId={temaAcordeonId}
                esPremium={esPremium}
                onCerrar={onCerrarGaleria}
                onSeleccionar={seleccionarTema}
            />

            <ModalTonalidades
                visible={modales.tonalidades}
                onCerrar={() => onToggleModal('tonalidades')}
                tonalidadSeleccionada={logica.tonalidadSeleccionada}
                onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
                listaTonalidades={logica.listaTonalidades}
                botonRef={refsModales.tonalidades as any}
            />

            <ModalVista
                visible={modales.vista}
                onCerrar={() => onToggleModal('vista')}
                modoVista={config.modoVista}
                setModoVista={(v) => setConfig((c) => ({ ...c, modoVista: v }))}
                mostrarOctavas={config.mostrarOctavas}
                setMostrarOctavas={(v) => setConfig((c) => ({ ...c, mostrarOctavas: v }))}
                vistaDoble={config.vistaDoble}
                setVistaDoble={(v) => setConfig((c) => ({ ...c, vistaDoble: v }))}
                botonRef={refsModales.vista as any}
            />

            <ModalMetronomo
                visible={modales.metronomo}
                onCerrar={() => onToggleModal('metronomo')}
                bpm={bpmMetronomo}
                setBpm={setBpmMetronomo}
                met={metronomoVivo}
            />

            <Suspense fallback={null}>
                <ModalLoops
                    visible={modales.loops}
                    onCerrar={() => onToggleModal('loops')}
                    pistaActivaId={loops.pistaActiva?.id || null}
                    volumen={loops.volumen}
                    velocidad={loops.velocidad}
                    onVolumenChange={loops.setVolumen}
                    onVelocidadChange={loops.setVelocidad}
                    onSeleccionarPista={loops.reproducir}
                    velocidadBloqueada={grabandoHero}
                    errorReproduccion={loops.errorReproduccion}
                    pistasListas={loops.pistasListas}
                    onPrecargarPistas={loops.precargarPistas}
                />
            </Suspense>

            <ModalInstrumentos
                visible={modales.instrumentos}
                onCerrar={() => onToggleModal('instrumentos')}
                listaInstrumentos={logica.listaInstrumentos}
                instrumentoId={logica.instrumentoId}
                onSeleccionarInstrumento={logica.setInstrumentoId}
                cargando={logica.cargandoCloud}
                botonRef={refsModales.instrumentos as any}
            />

            <ModalContacto visible={modales.contacto} onCerrar={() => onToggleModal('contacto')} />

            {modales.aprende && (
                <Suspense fallback={null}>
                    <PantallaAprende
                        visible={modales.aprende}
                        onCerrar={() => onToggleModal('aprende')}
                        tonalidadActual={logica.tonalidadSeleccionada}
                        onEmpezarCancion={onIniciarJuego}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ModalesBarraSimulador;
