import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Disc3, Globe, Lock, Radio, RefreshCcw, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    actualizarVisibilidadGrabacion,
    obtenerGrabacionesPublicasUsuario,
    obtenerGrabacionesUsuario,
    publicarGrabacionEnComunidad,
    type ModoGrabacionHero,
} from '../../../servicios/grabacionesHeroService';
import ModalReplayGrabacionHero, { type GrabacionReplayHero } from './Componentes/ModalReplayGrabacionHero';
import { obtenerSubtituloGrabacion, obtenerMetaGrabacion, obtenerTituloInicialPublicacion, obtenerTextoBadge } from './utilsGrabaciones';
import './MisGrabaciones.css';

interface VistaGrabacionesHeroProps {
    usuarioId?: string | null;
    tipoVista: 'propia' | 'publica';
    nombreUsuario?: string | null;
}

type FiltroGrabacion = 'todas' | ModoGrabacionHero;

export default function VistaGrabacionesHero({ usuarioId, tipoVista, nombreUsuario }: VistaGrabacionesHeroProps) {
    const [filtro, setFiltro] = useState<FiltroGrabacion>('todas');
    const [grabaciones, setGrabaciones] = useState<GrabacionReplayHero[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [grabacionActiva, setGrabacionActiva] = useState<GrabacionReplayHero | null>(null);
    const [grabacionParaPublicar, setGrabacionParaPublicar] = useState<GrabacionReplayHero | null>(null);
    const [tituloPublicacion, setTituloPublicacion] = useState('');
    const [descripcionPublicacion, setDescripcionPublicacion] = useState('');
    const [publicandoGrabacion, setPublicandoGrabacion] = useState(false);
    const [errorPublicacion, setErrorPublicacion] = useState('');
    const [grabacionActualizandoVisibilidadId, setGrabacionActualizandoVisibilidadId] = useState<string | null>(null);

    const tituloSeccion = useMemo(() => {
        if (tipoVista === 'publica') {
            return nombreUsuario ? `Grabaciones de ${nombreUsuario}` : 'Grabaciones publicas';
        }

        return 'Mis grabaciones';
    }, [nombreUsuario, tipoVista]);

    const subtituloSeccion = useMemo(() => {
        if (tipoVista === 'publica') {
            return 'Replays publicados desde Acordeon Hero Pro Max';
        }

        return 'Tu biblioteca privada de ejecuciones, replays y practicas destacadas';
    }, [tipoVista]);

    const resumenTarjetas = useMemo(() => {
        const competencias = grabaciones.filter((grabacion) => grabacion.modo === 'competencia').length;
        const practicas = grabaciones.filter((grabacion) => grabacion.modo === 'practica_libre').length;
        const publicadas = grabaciones.filter((grabacion) => grabacion.es_publica).length;

        return {
            total: grabaciones.length,
            competencias,
            practicas,
            publicadas,
        };
    }, [grabaciones]);

    async function cargarGrabaciones() {
        if (!usuarioId) return;

        setCargando(true);
        setError('');

        try {
            const modo = filtro === 'todas' ? undefined : filtro;
            const data = tipoVista === 'publica'
                ? await obtenerGrabacionesPublicasUsuario(usuarioId, modo)
                : await obtenerGrabacionesUsuario(usuarioId, { modo });

            setGrabaciones((Array.isArray(data) ? data : []) as GrabacionReplayHero[]);
        } catch (error: any) {
            setError(error?.message || 'No se pudieron cargar las grabaciones.');
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarGrabaciones();
    }, [usuarioId, filtro, tipoVista]);

    useEffect(() => {
        if (!grabacionParaPublicar) return;

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mis-grabaciones-publicar-modal-abierto');

        return () => {
            document.body.style.overflow = overflowAnterior;
            document.body.classList.remove('mis-grabaciones-publicar-modal-abierto');
        };
    }, [grabacionParaPublicar]);

    const abrirModalPublicacion = (grabacion: GrabacionReplayHero) => {
        setGrabacionParaPublicar(grabacion);
        setTituloPublicacion(obtenerTituloInicialPublicacion(grabacion));
        setDescripcionPublicacion(grabacion.descripcion || '');
        setErrorPublicacion('');
    };

    const cerrarModalPublicacion = () => {
        if (publicandoGrabacion) return;
        setGrabacionParaPublicar(null);
        setTituloPublicacion('');
        setDescripcionPublicacion('');
        setErrorPublicacion('');
    };

    const confirmarPublicacion = async () => {
        if (!grabacionParaPublicar) return;

        if (!tituloPublicacion.trim()) {
            setErrorPublicacion('Debes escribir un titulo para publicar en comunidad.');
            return;
        }

        setPublicandoGrabacion(true);
        setErrorPublicacion('');

        try {
            const resultado = await publicarGrabacionEnComunidad(grabacionParaPublicar.id, {
                tituloPublicacion,
                descripcionPublicacion
            });

            setGrabaciones((previas) => previas.map((grabacion) => (
                grabacion.id === grabacionParaPublicar.id
                    ? {
                        ...grabacion,
                        es_publica: true,
                        publicacion_id: resultado.publicacionId
                    }
                    : grabacion
            )));

            setGrabacionParaPublicar(null);
        } catch (error: any) {
            setErrorPublicacion(error?.message || 'No se pudo publicar esta grabacion.');
        } finally {
            setPublicandoGrabacion(false);
        }
    };

    const cambiarVisibilidad = async (grabacion: GrabacionReplayHero, siguienteEsPublica: boolean) => {
        if (grabacionActualizandoVisibilidadId) return;

        if (!siguienteEsPublica && grabacion.publicacion_id) {
            const confirmado = window.confirm('Esta accion quitara la grabacion de comunidad y la dejara privada.');
            if (!confirmado) return;
        }

        setGrabacionActualizandoVisibilidadId(grabacion.id);

        try {
            const grabacionActualizada = await actualizarVisibilidadGrabacion(grabacion.id, siguienteEsPublica);

            setGrabaciones((previas) => previas.map((item) => (
                item.id === grabacion.id
                    ? {
                        ...item,
                        ...grabacionActualizada,
                        canciones_hero: item.canciones_hero
                    }
                    : item
            )));
        } catch (error: any) {
            window.alert(error?.message || 'No se pudo actualizar la visibilidad de la grabacion.');
        } finally {
            setGrabacionActualizandoVisibilidadId(null);
        }
    };

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
                            <select value={filtro} onChange={(event) => setFiltro(event.target.value as FiltroGrabacion)}>
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
