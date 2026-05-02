import React, { useEffect, useRef } from 'react';
import { useLogicaProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import ModoJuego from '../../AcordeonProMax/Modos/ModoJuego';
import ModoSynthesia from '../../AcordeonProMax/Modos/ModoSynthesia';
import ModoMaestroSolo from '../../AcordeonProMax/Modos/ModoMaestroSolo';
import MenuPausaProMax from '../../AcordeonProMax/Componentes/MenuPausaProMax';
import PantallaResultados from '../../AcordeonProMax/Componentes/PantallaResultados';
import PantallaGameOverProMax from '../../AcordeonProMax/Componentes/PantallaGameOverProMax';
import HeaderJuegoSimulador from './HeaderJuegoSimulador';
import type { ConfigCancion, ModoJuego as ModoConfig } from '../Aprende/useConfigCancion';
import '../../AcordeonProMax/Modos/_BaseSimulador.css';
import './JuegoSimuladorApp.css';

interface JuegoSimuladorAppProps {
    config: ConfigCancion;
    onSalir: () => void;
}

const IMG_ALUMNO = '/Acordeon PRO MAX.png';

const MAPA_MODO: Record<ModoConfig, 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo'> = {
    competitivo: 'ninguno',
    libre: 'libre',
    synthesia: 'synthesia',
    maestro_solo: 'maestro_solo',
};

const JuegoSimuladorApp: React.FC<JuegoSimuladorAppProps> = ({ config, onSalir }) => {
    const hero: any = useLogicaProMax();
    const inicializadoRef = useRef(false);

    // Inicializa el juego con la config recibida (una sola vez al montar)
    useEffect(() => {
        if (inicializadoRef.current) return;
        if (!hero || !hero.iniciarJuego) return;

        inicializadoRef.current = true;
        hero.setModoPractica(MAPA_MODO[config.modo]);
        hero.setMaestroSuena(config.guiaAudio);
        hero.iniciarJuego(config.cancion);
    }, [hero, config]);

    // Si la lógica vuelve a 'seleccion' (cancelación interna), salimos al simulador.
    useEffect(() => {
        if (inicializadoRef.current && hero?.estadoJuego === 'seleccion') {
            onSalir();
        }
    }, [hero?.estadoJuego, onSalir]);

    if (!hero) return null;

    const cancion = hero.cancionSeleccionada || config.cancion;
    const modoActual = hero.modoPractica;
    const esCompetitivo = modoActual === 'ninguno';
    const enJuego = hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado';
    const opacidadDano = esCompetitivo && enJuego
        ? Math.max(0, ((100 - (hero.estadisticas?.vida ?? 100)) / 100) * 0.88)
        : 0;

    const reiniciar = () => {
        if (hero.cancionSeleccionada) {
            hero.reiniciarDesdeGameOver(hero.cancionSeleccionada);
        }
    };

    return (
        <div className="juego-sim-root">
            <HeaderJuegoSimulador
                titulo={cancion?.titulo || 'Cargando...'}
                autor={cancion?.autor}
                puntos={hero.estadisticas?.puntos ?? 0}
                vida={hero.estadisticas?.vida ?? 100}
                racha={hero.estadisticas?.rachaActual ?? 0}
                multiplicador={hero.estadisticas?.multiplicador ?? 1}
                mostrarVida={esCompetitivo}
                onPausa={hero.alternarPausaReproduccion}
                onSalir={onSalir}
            />

            {hero.estadoJuego === 'contando' && hero.cuenta !== null && (
                <div className="juego-sim-cuenta-overlay">
                    <span key={hero.cuenta} className="juego-sim-cuenta-numero">
                        {hero.cuenta}
                    </span>
                </div>
            )}

            <main className="juego-sim-main">
                {enJuego && modoActual === 'maestro_solo' && (
                    <ModoMaestroSolo
                        estadoJuego={hero.estadoJuego}
                        tickActual={hero.tickActual}
                        totalTicks={hero.totalTicks}
                        reproduciendo={hero.reproduciendo}
                        pausado={hero.pausado}
                        botonesActivosMaestro={hero.botonesActivosMaestro}
                        direccionMaestro={hero.direccionMaestro}
                        logica={hero.logica}
                        buscarTick={hero.buscarTick}
                        alternarPausa={hero.alternarPausaReproduccion}
                        maestroSuena={hero.maestroSuena}
                        setMaestroSuena={hero.setMaestroSuena}
                        mp3Silenciado={hero.mp3Silenciado}
                        setMp3Silenciado={hero.setMp3Silenciado}
                        modoGuiado={hero.modoGuiado}
                        setModoGuiado={hero.setModoGuiado}
                        bpm={hero.bpm}
                        cambiarBpm={hero.cambiarBpm}
                        loopAB={hero.loopAB}
                        marcarLoopInicio={hero.marcarLoopInicio}
                        marcarLoopFin={hero.marcarLoopFin}
                        actualizarLoopInicioTick={hero.actualizarLoopInicioTick}
                        actualizarLoopFinTick={hero.actualizarLoopFinTick}
                        alternarLoopAB={hero.alternarLoopAB}
                        limpiarLoopAB={hero.limpiarLoopAB}
                    />
                )}

                {enJuego && (modoActual === 'ninguno' || modoActual === 'libre') && (
                    <ModoJuego
                        conPenalizacion={modoActual === 'ninguno'}
                        cancion={cancion}
                        tickActual={hero.tickActual}
                        botonesActivosMaestro={hero.botonesActivosMaestro}
                        direccionMaestro={hero.direccionMaestro}
                        logica={hero.logica}
                        configTonalidad={hero.logica.configTonalidad}
                        estadisticas={hero.estadisticas}
                        efectosVisuales={hero.efectosVisuales}
                        notasImpactadas={hero.notasImpactadas}
                        imagenFondo={IMG_ALUMNO}
                        actualizarBotonActivo={hero.logica.actualizarBotonActivo}
                        registrarPosicionGolpe={hero.registrarPosicionGolpe}
                        rangoSeccion={hero.seccionSeleccionada
                            ? { inicio: hero.seccionSeleccionada.tickInicio, fin: hero.seccionSeleccionada.tickFin }
                            : null}
                    />
                )}

                {enJuego && modoActual === 'synthesia' && (
                    <ModoSynthesia
                        cancion={cancion}
                        tickActual={hero.tickActual}
                        botonesActivosMaestro={hero.botonesActivosMaestro}
                        direccionMaestro={hero.direccionMaestro}
                        logica={hero.logica}
                        configTonalidad={hero.logica.configTonalidad}
                        estadisticas={hero.estadisticas}
                        efectosVisuales={hero.efectosVisuales}
                        notasEsperando={hero.notasEsperando}
                        botonesGuiaAlumno={hero.botonesGuiaAlumno}
                        notasImpactadas={hero.notasImpactadas}
                        imagenFondo={IMG_ALUMNO}
                        actualizarBotonActivo={hero.logica.actualizarBotonActivo}
                        registrarPosicionGolpe={hero.registrarPosicionGolpe}
                        mensajeMotivacional={hero.mensajeMotivacional}
                        feedbackFuelle={hero.feedbackFuelle}
                    />
                )}
            </main>

            {opacidadDano > 0 && (
                <div
                    className="juego-sim-dano-overlay"
                    style={{ opacity: opacidadDano }}
                />
            )}

            {hero.estadoJuego === 'resultados' && cancion && (
                <PantallaResultados
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    esModoCompetencia={esCompetitivo}
                    modo={esCompetitivo ? 'competencia' : modoActual}
                    mostrarGuardado={hero.grabaciones?.mostrarGuardadoResultado ?? false}
                    guardandoGrabacion={hero.grabaciones?.guardando ?? false}
                    errorGuardado={hero.grabaciones?.error}
                    tituloSugeridoGrabacion={hero.grabaciones?.tituloSugerido}
                    tituloGrabacionGuardada={hero.grabaciones?.ultimaGuardada?.tipo === 'competencia'
                        ? hero.grabaciones.ultimaGuardada.titulo
                        : null}
                    onGuardarGrabacion={hero.grabaciones?.guardarPendiente}
                    onDescartarGuardado={hero.grabaciones?.descartarPendiente}
                    onJugarDeNuevo={() => hero.iniciarJuego(cancion)}
                    onVolverSeleccion={onSalir}
                    seccionSeleccionada={hero.seccionSeleccionada}
                    onJugarSiguienteSeccion={(s: any) => {
                        hero.seleccionarSeccion(s);
                        setTimeout(() => hero.iniciarJuego(cancion), 50);
                    }}
                />
            )}

            {hero.estadoJuego === 'gameOver' && cancion && (
                <PantallaGameOverProMax
                    estadisticas={hero.estadisticas}
                    cancion={cancion}
                    onReintentar={() => hero.reiniciarDesdeGameOver(cancion)}
                    onVolverSeleccion={onSalir}
                />
            )}

            <MenuPausaProMax
                visible={hero.estadoJuego === 'pausado'}
                onReanudar={hero.reanudarConConteo}
                onReiniciar={reiniciar}
                maestroSuena={hero.maestroSuena}
                onToggleMaestroSuena={hero.setMaestroSuena}
                modoPractica={hero.modoPractica}
                modoAudioSynthesia={hero.modoAudioSynthesia}
                onCambiarModoAudioSynthesia={hero.setModoAudioSynthesia}
                bpm={hero.bpm}
                onCambiarBpm={hero.cambiarBpm}
                modoVista={hero.logica.modoVista}
                onCambiarVista={hero.logica.setModoVista}
                volumenMusica={hero.volumenMusica}
                onCambiarVolumenMusica={hero.setVolumenMusica}
                volumenAcordeon={hero.volumenAcordeon}
                onCambiarVolumenAcordeon={hero.setVolumenAcordeon}
                onSalir={onSalir}
            />
        </div>
    );
};

export default JuegoSimuladorApp;
