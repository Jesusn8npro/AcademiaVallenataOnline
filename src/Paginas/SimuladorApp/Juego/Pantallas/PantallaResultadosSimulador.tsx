import React from 'react';
import { RotateCcw, X, ArrowRight, Star, Coins, History, Save, Trophy, TrendingUp, TrendingDown, Lock, AlertTriangle } from 'lucide-react';
import { usePantallaResultados } from '../../../AcordeonProMax/Componentes/usePantallaResultados';
import ModalHistorialSimulador from '../Modales/ModalHistorialSimulador';
import ModalGuardarSimulador from '../Modales/ModalGuardarSimulador';
import RecomendacionMaestro from '../Piezas/RecomendacionMaestro';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../../../AcordeonProMax/TiposProMax';
import type { Seccion } from '../../../AcordeonProMax/tiposSecciones';
import './PantallaResultadosSimulador.css';

interface Props {
    estadisticas: EstadisticasPartida;
    cancion: CancionHeroConTonalidad;
    modo: string;
    mostrarGuardado: boolean;
    guardandoGrabacion?: boolean;
    errorGuardado?: string | null;
    tituloSugeridoGrabacion: string;
    tituloGrabacionGuardada?: string | null;
    umbralGuardado?: number;
    onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
    onJugarDeNuevo: () => void;
    onVolverSeleccion: () => void;
    seccionSeleccionada?: Seccion | null;
    onJugarSiguienteSeccion?: (seccion: Seccion) => void;
    onPracticarMaestro?: () => void;
}

const PantallaResultadosSimulador: React.FC<Props> = ({
    estadisticas, cancion, modo, mostrarGuardado,
    guardandoGrabacion = false, errorGuardado = null,
    tituloSugeridoGrabacion, tituloGrabacionGuardada,
    umbralGuardado = 60,
    onGuardarGrabacion, onJugarDeNuevo, onVolverSeleccion,
    seccionSeleccionada, onJugarSiguienteSeccion, onPracticarMaestro,
}) => {
    const {
        usuario, puntos, notasPerfecto, notasBien, notasFalladas, notasPerdidas,
        rachaMasLarga, totalNotas, estrellas, precision,
        tituloGrabacion, setTituloGrabacion, descripcionGrabacion, setDescripcionGrabacion,
        errorLocal, modalGuardadoAbierto, setModalGuardadoAbierto,
        scoreRespuesta, modalHistorialAbierto, setModalHistorialAbierto,
        animandoXP, mensajeMotivacion, manejarGuardar, estadoSeccion, siguienteSeccion,
    } = usePantallaResultados({
        estadisticas, cancion, modo, mostrarGuardado, tituloSugeridoGrabacion,
        tituloGrabacionGuardada, onGuardarGrabacion, seccionSeleccionada,
    });

    const esCompetencia = modo === 'competencia' || modo === 'ninguno';
    const siguiente = onJugarSiguienteSeccion ? siguienteSeccion : null;
    const umbralSeccion = typeof (cancion as any)?.umbral_precision_seccion === 'number'
        ? (cancion as any).umbral_precision_seccion : 80;
    const intentosMaxSeccion = typeof (cancion as any)?.intentos_para_moneda === 'number'
        ? (cancion as any).intentos_para_moneda : 3;

    return (
        <div className="sim-resultados-overlay">
            <div className="sim-resultados-panel">
                {/* HEADER ─────────────────────────────── */}
                <header className="sim-res-header">
                    <button className="sim-res-cerrar" onClick={onVolverSeleccion} aria-label="Volver">
                        <X size={18} />
                    </button>
                    <div className="sim-res-titulo-bloque">
                        <h2>{cancion.titulo}</h2>
                        <p>
                            {cancion.autor}
                            {seccionSeleccionada && <> · <span className="sim-res-seccion-tag">{seccionSeleccionada.nombre}</span></>}
                        </p>
                    </div>
                    <div className="sim-res-estrellas" aria-label={`${estrellas} estrellas`}>
                        {[1, 2, 3].map((i) => (
                            <Star key={i} size={16}
                                fill={i <= estrellas ? '#fbbf24' : 'none'}
                                stroke={i <= estrellas ? '#fbbf24' : '#525252'} />
                        ))}
                    </div>
                </header>

                {/* BANNERS DE SECCIÓN ─────────────────── */}
                {seccionSeleccionada && estadoSeccion?.completada && (
                    <div className="sim-res-banner-seccion exito">
                        <div className="sim-res-banner-icon">🎉</div>
                        <div className="sim-res-banner-texto">
                            <strong>¡Sección completada!</strong>
                            <span>{seccionSeleccionada.nombre}</span>
                        </div>
                        {Number(estadoSeccion.monedas_ganadas) > 0 ? (
                            <div className="sim-res-banner-premio">
                                <Coins size={14} /> +{estadoSeccion.monedas_ganadas}
                            </div>
                        ) : (
                            <div className="sim-res-banner-premio sin-premio">
                                Sin premio · superaste {intentosMaxSeccion} intentos
                            </div>
                        )}
                    </div>
                )}
                {seccionSeleccionada && estadoSeccion && !estadoSeccion.completada && (
                    <div className="sim-res-banner-seccion pendiente">
                        <AlertTriangle size={14} />
                        <span>Intento {estadoSeccion.intentos} · necesitas ≥{umbralSeccion}% (mejor: {estadoSeccion.mejor_precision}%)</span>
                    </div>
                )}
                {scoreRespuesta?.es_mejor_personal && !scoreRespuesta?.es_nuevo && (
                    <div className="sim-res-record">
                        <Trophy size={13} /> ¡Nuevo récord personal!
                    </div>
                )}

                {/* STATS 4 col + META ─────────────────── */}
                <div className="sim-res-stats">
                    <div className="sim-res-stat perfectas">
                        <span className="sim-res-stat-label">PERFECTAS</span>
                        <span className="sim-res-stat-valor">{notasPerfecto}</span>
                    </div>
                    <div className="sim-res-stat bien">
                        <span className="sim-res-stat-label">BIEN</span>
                        <span className="sim-res-stat-valor">{notasBien}</span>
                    </div>
                    <div className="sim-res-stat falladas">
                        <span className="sim-res-stat-label">FALLIDAS</span>
                        <span className="sim-res-stat-valor">{notasFalladas}</span>
                    </div>
                    <div className="sim-res-stat perdidas">
                        <span className="sim-res-stat-label">PERDIDAS</span>
                        <span className="sim-res-stat-valor">{notasPerdidas}</span>
                    </div>
                </div>

                <div className="sim-res-precision-fila">
                    <div className="sim-res-precision-info">
                        <span className="sim-res-meta-label">Precisión</span>
                        <span className="sim-res-precision-valor">{precision}%</span>
                    </div>
                    <div className="sim-res-precision-barra" aria-hidden="true">
                        <div className="sim-res-precision-relleno" style={{ width: `${precision}%` }} />
                    </div>
                    <div className="sim-res-precision-meta">
                        <span>×{rachaMasLarga} racha</span>
                        <span>·</span>
                        <span>{totalNotas} notas</span>
                    </div>
                </div>

                <div className="sim-res-puntos-bloque">
                    <div className="sim-res-motivacion">{mensajeMotivacion}</div>
                    <div className="sim-res-puntos">{puntos.toLocaleString('es-CO')} <span>pts</span></div>
                </div>

                {/* PANEL XP + MONEDAS ─────────────────── */}
                {scoreRespuesta && (
                    <div className={`sim-res-game ${animandoXP ? 'animar' : ''}`}>
                        <div className="sim-res-game-fila">
                            {scoreRespuesta.xp_ganado > 0 && (
                                <div className="sim-res-xp positivo">
                                    <TrendingUp size={14} />
                                    <span>+{scoreRespuesta.xp_ganado} XP</span>
                                </div>
                            )}
                            {scoreRespuesta.xp_ganado < 0 && (
                                <div className="sim-res-xp negativo">
                                    <TrendingDown size={14} />
                                    <span>{scoreRespuesta.xp_ganado} XP</span>
                                </div>
                            )}
                            {scoreRespuesta.xp_ganado === 0 && scoreRespuesta.xp_acumulado_cancion === 100 && (
                                <div className="sim-res-xp dominada">
                                    <Lock size={13} /> <span>Canción dominada</span>
                                </div>
                            )}
                            {scoreRespuesta.xp_ganado === 0 && scoreRespuesta.xp_acumulado_cancion < 100 && (
                                <div className="sim-res-xp neutro">
                                    <span>0 XP en este intento</span>
                                </div>
                            )}

                            {scoreRespuesta.monedas_ganadas > 0 && (
                                <div className="sim-res-monedas-ganadas">
                                    <Coins size={14} /> +{scoreRespuesta.monedas_ganadas}
                                </div>
                            )}
                            <div className="sim-res-saldo">
                                <Coins size={12} /> {scoreRespuesta.saldo_monedas}
                            </div>
                        </div>

                        {scoreRespuesta.xp_acumulado_cancion >= 0 && scoreRespuesta.xp_acumulado_cancion < 100 && (
                            <div className="sim-res-xp-barra">
                                <div className="sim-res-xp-barra-relleno"
                                    style={{ width: `${scoreRespuesta.xp_acumulado_cancion}%` }} />
                                <span className="sim-res-xp-barra-texto">{scoreRespuesta.xp_acumulado_cancion}/100 XP en esta canción</span>
                            </div>
                        )}
                        {scoreRespuesta.xp_acumulado_cancion < 0 && (
                            <div className="sim-res-xp-barra negativa">
                                <div className="sim-res-xp-barra-relleno negativo"
                                    style={{ width: `${Math.min(100, Math.abs((scoreRespuesta.xp_acumulado_cancion / 50) * 100))}%` }} />
                                <span className="sim-res-xp-barra-texto">XP: {scoreRespuesta.xp_acumulado_cancion}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* GUARDADO ────────────────────────────── */}
                {esCompetencia && tituloGrabacionGuardada && (
                    <div className="sim-res-aviso exito">
                        <strong>Guardada</strong> · <em>{tituloGrabacionGuardada}</em> ya está en Mis grabaciones.
                    </div>
                )}
                {esCompetencia && !mostrarGuardado && !tituloGrabacionGuardada && precision < umbralGuardado && (
                    <div className="sim-res-aviso bloqueado">
                        <Lock size={12} /> Necesitas ≥{umbralGuardado}% de precisión para guardar esta ejecución.
                    </div>
                )}

                {/* RECOMENDACION MAESTRO si puntaje bajo */}
                {onPracticarMaestro && (
                    <RecomendacionMaestro
                        precision={precision}
                        onPracticarMaestro={onPracticarMaestro}
                    />
                )}

                {/* FOOTER BOTONES ─────────────────────── */}
                <footer className="sim-res-acciones">
                    <button className="sim-res-btn sim-res-btn-secundario" onClick={onVolverSeleccion}>
                        <X size={14} /> Elegir canción
                    </button>
                    <button className="sim-res-btn sim-res-btn-secundario" onClick={() => setModalHistorialAbierto(true)}>
                        <History size={14} /> Historial
                    </button>
                    {esCompetencia && mostrarGuardado && !tituloGrabacionGuardada && (
                        <button className="sim-res-btn sim-res-btn-secundario" onClick={() => setModalGuardadoAbierto(true)}>
                            <Save size={14} /> Guardar
                        </button>
                    )}
                    {siguiente && onJugarSiguienteSeccion && (
                        <button className="sim-res-btn sim-res-btn-siguiente"
                            onClick={() => onJugarSiguienteSeccion(siguiente)}>
                            <ArrowRight size={14} /> {siguiente.nombre}
                        </button>
                    )}
                    <button className="sim-res-btn sim-res-btn-primario" onClick={onJugarDeNuevo}>
                        <RotateCcw size={14} /> Otra vez
                    </button>
                </footer>
            </div>

            {/* MODAL GUARDAR GRABACIÓN ─────────────────── */}
            {esCompetencia && mostrarGuardado && modalGuardadoAbierto && (
                <ModalGuardarSimulador
                    cancionTitulo={cancion.titulo}
                    precision={precision}
                    titulo={tituloGrabacion}
                    descripcion={descripcionGrabacion}
                    onTituloChange={setTituloGrabacion}
                    onDescripcionChange={setDescripcionGrabacion}
                    onGuardar={manejarGuardar}
                    onCerrar={() => setModalGuardadoAbierto(false)}
                    guardando={guardandoGrabacion}
                    error={errorLocal || errorGuardado}
                />
            )}

            {/* MODAL HISTORIAL ────────────────────────── */}
            {modalHistorialAbierto && usuario && (
                <ModalHistorialSimulador
                    cancion={cancion}
                    usuarioId={usuario.id}
                    onCerrar={() => setModalHistorialAbierto(false)}
                />
            )}
        </div>
    );
};

export default PantallaResultadosSimulador;
