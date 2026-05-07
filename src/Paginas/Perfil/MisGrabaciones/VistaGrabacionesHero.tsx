import { createPortal } from 'react-dom';
import { Disc3, Globe, Lock, Radio, RefreshCcw, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ModalReplayGrabacionHero, { type GrabacionReplayHero } from './Componentes/ModalReplayGrabacionHero';
import { obtenerSubtituloGrabacion, obtenerMetaGrabacion, obtenerTextoBadge } from './utilsGrabaciones';
import { useVistaGrabaciones } from './useVistaGrabaciones';
import './MisGrabaciones.css';

interface VistaGrabacionesHeroProps {
    usuarioId?: string | null;
    tipoVista: 'propia' | 'publica';
    nombreUsuario?: string | null;
}

export default function VistaGrabacionesHero({ usuarioId, tipoVista, nombreUsuario }: VistaGrabacionesHeroProps) {
    const {
        filtro, setFiltro, grabaciones, cargando, error,
        grabacionActiva, setGrabacionActiva,
        grabacionParaPublicar, tituloPublicacion, setTituloPublicacion,
        descripcionPublicacion, setDescripcionPublicacion,
        publicandoGrabacion, errorPublicacion,
        grabacionActualizandoVisibilidadId, errorVisibilidad,
        pendingCambioVisibilidad,
        tituloSeccion, subtituloSeccion, resumenTarjetas,
        cargarGrabaciones, abrirModalPublicacion, cerrarModalPublicacion,
        confirmarPublicacion, cambiarVisibilidad, confirmarCambioVisibilidad, cancelarCambioVisibilidad
    } = useVistaGrabaciones({ usuarioId, tipoVista, nombreUsuario });

    const estaVacia = !cargando && grabaciones.length === 0;

    return (
        <section className="mis-grabaciones-pagina">
            <header className="mis-grabaciones-hero">
                <div className="mis-grabaciones-hero-contenido">
                    <div>
                        <p className="mis-grabaciones-eyebrow">Acordeon Hero Pro Max</p>
                        <h1>{tituloSeccion}</h1>
                        <p className="mis-grabaciones-subtitulo">{subtituloSeccion}</p>
                    </div>

                    <div className="mis-grabaciones-hero-acciones">
                        <label className="mis-grabaciones-filtro">
                            <span>Filtrar</span>
                            <select value={filtro} onChange={(event) => setFiltro(event.target.value as any)}>
                                <option value="todas">Todas</option>
                                <option value="competencia">Competencia</option>
                                <option value="practica_libre">Practica libre</option>
                            </select>
                        </label>

                        <button className="mis-grabaciones-boton-secundario" onClick={cargarGrabaciones}>
                            <RefreshCcw size={16} />
                            Actualizar
                        </button>
                    </div>
                </div>

                <div className="mis-grabaciones-resumen-grid">
                    <article className="mis-grabaciones-resumen-card acento-azul">
                        <span>Total guardadas</span>
                        <strong>{resumenTarjetas.total}</strong>
                    </article>
                    <article className="mis-grabaciones-resumen-card acento-dorado">
                        <span>Competencia</span>
                        <strong>{resumenTarjetas.competencias}</strong>
                    </article>
                    <article className="mis-grabaciones-resumen-card acento-verde">
                        <span>Practica libre</span>
                        <strong>{resumenTarjetas.practicas}</strong>
                    </article>
                    <article className="mis-grabaciones-resumen-card acento-oscuro">
                        <span>Publicas</span>
                        <strong>{resumenTarjetas.publicadas}</strong>
                    </article>
                </div>
            </header>

            {cargando ? (
                <div className="mis-grabaciones-estado">
                    <div className="mis-grabaciones-spinner" />
                    <p>Cargando grabaciones...</p>
                </div>
            ) : error ? (
                <div className="mis-grabaciones-estado error">
                    <div className="mis-grabaciones-estado-icono"><Radio size={28} /></div>
                    <h3>No pudimos cargar las grabaciones</h3>
                    <p>{error}</p>
                    <button className="mis-grabaciones-boton-principal" onClick={cargarGrabaciones}>Reintentar</button>
                </div>
            ) : estaVacia ? (
                <div className="mis-grabaciones-estado vacio">
                    <div className="mis-grabaciones-estado-icono"><Disc3 size={30} /></div>
                    <h3>{tipoVista === 'publica' ? 'Aun no hay grabaciones publicas' : 'Aun no tienes grabaciones guardadas'}</h3>
                    <p>
                        {tipoVista === 'publica'
                            ? 'Cuando este usuario publique sus mejores replays apareceran aqui.'
                            : 'Juega en Pro Max, guarda tus mejores ejecuciones y revisalas luego desde esta biblioteca.'}
                    </p>
                    {tipoVista === 'propia' && (
                        <Link to="/acordeon-pro-max/lista" className="mis-grabaciones-boton-principal">
                            Ir a practicar
                        </Link>
                    )}
                </div>
            ) : (
                <div className="mis-grabaciones-lista">
                    {grabaciones.map((grabacion) => {
                        const esCompetencia = grabacion.modo === 'competencia';
                        const tienePublicacionActiva = Boolean(grabacion.publicacion_id);
                        const visibilidadCargando = grabacionActualizandoVisibilidadId === grabacion.id;

                        return (
                            <article key={grabacion.id} className="mis-grabaciones-card">
                                <div className={`mis-grabaciones-card-marca ${esCompetencia ? 'competencia' : 'practica'}`}>
                                    <span>{esCompetencia ? 'compet.' : 'practica'}</span>
                                    <strong>{obtenerTextoBadge(grabacion)}</strong>
                                </div>

                                <div className="mis-grabaciones-card-cuerpo">
                                    <div className="mis-grabaciones-card-titulo-linea">
                                        <h3>{grabacion.titulo || grabacion.canciones_hero?.titulo || 'Grabacion sin titulo'}</h3>

                                        <div className="mis-grabaciones-card-chips">
                                            {grabacion.es_publica ? (
                                                <span className="mis-grabaciones-chip publica">
                                                    <Globe size={12} /> Publica
                                                </span>
                                            ) : tipoVista === 'propia' ? (
                                                <span className="mis-grabaciones-chip privada">
                                                    <Lock size={12} /> Privada
                                                </span>
                                            ) : null}

                                            {tienePublicacionActiva && (
                                                <span className="mis-grabaciones-chip publicada">En comunidad</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="mis-grabaciones-card-subtitulo">{obtenerSubtituloGrabacion(grabacion)}</p>
                                    <p className="mis-grabaciones-card-meta">{obtenerMetaGrabacion(grabacion)}</p>
                                </div>

                                <div className="mis-grabaciones-card-acciones">
                                    <button className="mis-grabaciones-boton-secundario" onClick={() => setGrabacionActiva(grabacion)}>
                                        Ver replay
                                    </button>

                                    {tipoVista === 'propia' && !tienePublicacionActiva && (
                                        <button className="mis-grabaciones-boton-principal" onClick={() => abrirModalPublicacion(grabacion)}>
                                            <Share2 size={15} />
                                            Compartir
                                        </button>
                                    )}

                                    {tipoVista === 'propia' && tienePublicacionActiva && (
                                        <a className="mis-grabaciones-boton-secundario" href={`/comunidad#publicacion-${grabacion.publicacion_id}`}>
                                            Ver en comunidad
                                        </a>
                                    )}

                                    {tipoVista === 'propia' && (
                                        <button
                                            className="mis-grabaciones-boton-secundario"
                                            onClick={() => cambiarVisibilidad(grabacion, !grabacion.es_publica)}
                                            disabled={visibilidadCargando}
                                        >
                                            {visibilidadCargando
                                                ? 'Guardando...'
                                                : grabacion.es_publica
                                                    ? 'Hacer privada'
                                                    : 'Hacer publica'}
                                        </button>
                                    )}
                                </div>

                                {errorVisibilidad && grabacionActualizandoVisibilidadId === null && (
                                    <p className="mis-grabaciones-error-publicacion">{errorVisibilidad}</p>
                                )}
                                {pendingCambioVisibilidad?.grabacion.id === grabacion.id && (
                                    <div className="mis-grabaciones-confirm-visibilidad">
                                        <p>Esta acción quitará la grabación de comunidad y la dejará privada.</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <button className="mis-grabaciones-boton-primario" onClick={confirmarCambioVisibilidad}>Confirmar</button>
                                            <button className="mis-grabaciones-boton-secundario" onClick={cancelarCambioVisibilidad}>Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            <ModalReplayGrabacionHero
                abierta={Boolean(grabacionActiva)}
                grabacion={grabacionActiva}
                onCerrar={() => setGrabacionActiva(null)}
            />

            {grabacionParaPublicar && createPortal(
                <div className="mis-grabaciones-publicar-overlay" onClick={cerrarModalPublicacion}>
                    <div className="mis-grabaciones-publicar-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="mis-grabaciones-publicar-encabezado">
                            <div>
                                <p className="mis-grabaciones-eyebrow">Publicar en comunidad</p>
                                <h2>{grabacionParaPublicar.titulo || 'Grabacion Hero'}</h2>
                                <p>{obtenerSubtituloGrabacion(grabacionParaPublicar)}</p>
                            </div>

                            <span className={`mis-grabaciones-chip-badge ${grabacionParaPublicar.modo === 'competencia' ? 'competencia' : 'practica'}`}>
                                {grabacionParaPublicar.modo === 'competencia' ? 'Competencia' : 'Practica libre'}
                            </span>
                        </div>

                        <label className="mis-grabaciones-campo">
                            <span>Titulo para la comunidad</span>
                            <input
                                type="text"
                                value={tituloPublicacion}
                                onChange={(event) => setTituloPublicacion(event.target.value)}
                                maxLength={120}
                                placeholder="Ej: Logre el 91% en El amor de mi vida"
                            />
                        </label>

                        <label className="mis-grabaciones-campo">
                            <span>Descripcion opcional</span>
                            <textarea
                                value={descripcionPublicacion}
                                onChange={(event) => setDescripcionPublicacion(event.target.value)}
                                maxLength={500}
                                placeholder="Cuenta que practicaste, que descubriste o por que quieres compartir este replay..."
                            />
                        </label>

                        <p className="mis-grabaciones-ayuda-publicacion">
                            Al publicar en comunidad esta grabacion tambien queda marcada como publica en tu perfil.
                        </p>

                        {errorPublicacion && <p className="mis-grabaciones-error-publicacion">{errorPublicacion}</p>}

                        <div className="mis-grabaciones-publicar-acciones">
                            <button className="mis-grabaciones-boton-secundario" onClick={cerrarModalPublicacion} disabled={publicandoGrabacion}>
                                Cancelar
                            </button>
                            <button className="mis-grabaciones-boton-principal" onClick={confirmarPublicacion} disabled={publicandoGrabacion}>
                                {publicandoGrabacion ? 'Publicando...' : 'Publicar en comunidad'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}
