import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../servicios/supabaseCliente';
import ModalInscripciones from './ModalInscripciones';
import './MostradorCursosTutoriales.css';

interface Contenido {
    id: string;
    titulo: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_url?: string;
    estado?: string;
    nivel?: string;
    categoria?: string;
    created_at: string;
    precio_normal?: number;
    precio_rebajado?: number;
    estudiantes_inscritos_real?: number;
    estudiantes_inscritos?: number;
    modulos_count_real?: number;
    modulos_count?: number;
    lecciones_count_real?: number;
    lecciones_count?: number;
    conteo_lecciones?: number;
    duracion_estimada?: number;
    partes_count_real?: number;
    partes_count?: number;
    duracion?: number;
    artista?: string;
    tonalidad?: string;
    tipo?: 'curso' | 'tutorial';
    [key: string]: any;
}

interface Props {
    cursos: Contenido[];
    tutoriales: Contenido[];
    modoVista: 'cuadricula' | 'lista';
    onUpdate?: () => void;
}

const MostradorCursosTutoriales = ({ cursos, tutoriales, modoVista, onUpdate }: Props) => {
    const navigate = useNavigate();
    const [procesandoAccion, setProcesandoAccion] = useState(false);
    const [itemProcesando, setItemProcesando] = useState('');

    // Estados para el Modal de Inscripciones
    const [modalInscripcionesOpen, setModalInscripcionesOpen] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<Contenido | null>(null);

    // Estado para el hover de estudiantes
    const [hoverEstudiantesId, setHoverEstudiantesId] = useState<string | null>(null);
    const [listaEstudiantesRapida, setListaEstudiantesRapida] = useState<{ id: string, nombre: string }[]>([]);
    const [cargandoListaRapida, setCargandoListaRapida] = useState(false);

    // Unificar y ordenar contenido
    const contenidoUnificado = [
        ...cursos.map(c => ({ ...c, tipo: 'curso' as const })),
        ...tutoriales.map(t => ({ ...t, tipo: 'tutorial' as const }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const obtenerBadgeEstado = (estado: string) => {
        const estados: Record<string, string> = {
            'publicado': 'mostrador-badge-publicado',
            'borrador': 'mostrador-badge-borrador',
            'archivado': 'mostrador-badge-archivado'
        };
        return estados[estado] || 'mostrador-badge-default';
    };

    const obtenerBadgeNivel = (nivel: string) => {
        const niveles: Record<string, string> = {
            'principiante': 'mostrador-badge-principiante',
            'intermedio': 'mostrador-badge-intermedio',
            'avanzado': 'mostrador-badge-avanzado'
        };
        return niveles[nivel] || 'mostrador-badge-default';
    };

    const obtenerImagenPorDefecto = (tipo: string) => {
        return tipo === 'curso'
            ? 'mostrador-gradient-curso'
            : 'mostrador-gradient-tutorial';
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const generarSlug = (texto: string): string => {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const manejarEliminar = async (item: Contenido) => {
        if (procesandoAccion) return;

        const confirmacion = window.confirm(
            `¿Estás seguro que deseas eliminar este ${item.tipo}?\n\n"${item.titulo}"\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmacion) return;

        try {
            setProcesandoAccion(true);
            setItemProcesando(item.id);

            const tabla = item.tipo === 'curso' ? 'cursos' : 'tutoriales';
            const { error } = await supabase.from(tabla).delete().eq('id', item.id);

            if (error) throw error;

            window.location.reload();
        } catch (error) {
            console.error('Error eliminando:', error);
            alert(`Error al eliminar el ${item.tipo}. Por favor, intenta de nuevo.`);
        } finally {
            setProcesandoAccion(false);
            setItemProcesando('');
        }
    };

    const manejarEditar = async (item: Contenido) => {
        if (procesandoAccion) return;

        try {
            setProcesandoAccion(true);
            setItemProcesando(item.id);

            navigate(`/administrador/crear-contenido?tipo=${item.tipo}&editar=${item.id}`);
        } catch (error) {
            console.error('Error al editar:', error);
            alert('Error al cargar el contenido para editar. Por favor, intenta de nuevo.');
        } finally {
            setProcesandoAccion(false);
            setItemProcesando('');
        }
    };

    const manejarVer = async (item: Contenido) => {
        if (procesandoAccion) return;

        try {
            setProcesandoAccion(true);
            setItemProcesando(item.id);

            if (item.tipo === 'curso') {
                const { data: curso, error } = await supabase
                    .from('cursos')
                    .select('slug, titulo')
                    .eq('id', item.id)
                    .single();

                if (error || !curso) {
                    throw new Error('No se encontró el curso');
                }

                const slug = curso.slug || generarSlug(curso.titulo);
                navigate(`/cursos/${slug}`);
            } else {
                const { data: tutorial, error } = await supabase
                    .from('tutoriales')
                    .select('titulo')
                    .eq('id', item.id)
                    .single();

                if (error || !tutorial) {
                    throw new Error('No se encontró el tutorial');
                }

                const slugGenerado = generarSlug(tutorial.titulo);
                navigate(`/tutoriales/${slugGenerado}`);
            }
        } catch (error) {
            console.error('Error al ver:', error);
            alert('Error al cargar el contenido. Por favor, intenta de nuevo.');
        } finally {
            setProcesandoAccion(false);
            setItemProcesando('');
        }
    };

    const cargarListaRapida = async (itemId: string, tipo: 'curso' | 'tutorial') => {
        try {
            setCargandoListaRapida(true);
            const foreignKey = tipo === 'curso' ? 'curso_id' : 'tutorial_id';

            const { data, error } = await supabase
                .from('inscripciones')
                .select(`
                    perfiles:usuario_id (
                        nombre_completo
                    )
                `)
                .eq(foreignKey, itemId)
                .limit(10);

            if (error) throw error;

            setListaEstudiantesRapida((data as any[] || []).map(i => ({
                id: i.perfiles.id,
                nombre: i.perfiles.nombre_completo
            })));
        } catch (error) {
            console.error('Error lista rapida:', error);
        } finally {
            setCargandoListaRapida(false);
        }
    };

    const abrirModalInscripciones = (item: Contenido) => {
        setItemSeleccionado(item);
        setModalInscripcionesOpen(true);
    };

    const formatearMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    };

    if (contenidoUnificado.length === 0) {
        return (
            <div className="mostrador-estado-vacio">
                <div className="mostrador-contenido-vacio">
                    <div className="mostrador-icono-vacio">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 className="mostrador-titulo-vacio">No hay contenido para mostrar</h3>
                    <p className="mostrador-descripcion-vacio">
                        Comienza creando tu primer curso o tutorial para verlo aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mostrador-contenido">
            <div className={`mostrador-contenedor-items ${modoVista === 'lista' ? 'mostrador-modo-lista' : 'mostrador-modo-cuadricula'}`}>
                {contenidoUnificado.map((item) => (
                    <div key={item.id} className={`mostrador-tarjeta ${modoVista === 'lista' ? 'mostrador-vista-lista' : 'mostrador-vista-cuadricula'}`}>
                        {/* Imagen/Thumbnail */}
                        <div className="mostrador-contenedor-imagen">
                            {item.imagen_url ? (
                                <img
                                    src={item.imagen_url}
                                    alt={item.titulo}
                                    className="mostrador-imagen-contenido"
                                    loading="lazy"
                                />
                            ) : (
                                <div className={`mostrador-imagen-placeholder ${obtenerImagenPorDefecto(item.tipo!)}`}>
                                    <div className="mostrador-icono-placeholder">
                                        {item.tipo === 'curso' ? (
                                            <svg className="mostrador-icono-tipo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                            </svg>
                                        ) : (
                                            <svg className="mostrador-icono-tipo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Badge tipo */}
                            <div className={`mostrador-badge-tipo ${item.tipo === 'curso' ? 'mostrador-badge-curso' : 'mostrador-badge-tutorial'}`}>
                                <svg className="mostrador-icono-badge" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {item.tipo === 'curso' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    )}
                                </svg>
                                {item.tipo === 'curso' ? 'Curso' : 'Tutorial'}
                            </div>

                            {/* Overlay de carga */}
                            {procesandoAccion && itemProcesando === item.id && (
                                <div className="mostrador-overlay-carga">
                                    <div className="mostrador-spinner-accion"></div>
                                </div>
                            )}
                        </div>

                        {/* Información */}
                        <div className="mostrador-info-contenido">
                            {/* Badges */}
                            <div className="mostrador-badges-superiores">
                                {item.estado && (
                                    <span className={`mostrador-badge ${obtenerBadgeEstado(item.estado)}`}>
                                        {item.estado}
                                    </span>
                                )}
                                {item.nivel && (
                                    <span className={`mostrador-badge ${obtenerBadgeNivel(item.nivel)}`}>
                                        {item.nivel}
                                    </span>
                                )}
                            </div>

                            {/* Título y descripción */}
                            <div className="mostrador-texto-principal">
                                <h3 className="mostrador-titulo-contenido">{item.titulo}</h3>
                                <p className="mostrador-descripcion-contenido">
                                    {item.descripcion_corta || item.descripcion || 'Sin descripción disponible'}
                                </p>
                            </div>

                            {/* Estadísticas */}
                            <div className="mostrador-estadisticas">
                                <div
                                    className="mostrador-stat-item mostrador-stat-estudiantes"
                                    onMouseEnter={() => {
                                        setHoverEstudiantesId(item.id);
                                        cargarListaRapida(item.id, item.tipo!);
                                    }}
                                    onMouseLeave={() => setHoverEstudiantesId(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        abrirModalInscripciones(item);
                                    }}
                                >
                                    <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m7-7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                    </svg>
                                    <span className="mostrador-stat-numero">
                                        {item.tipo === 'curso'
                                            ? (item.estudiantes_inscritos_real ?? item.estudiantes_inscritos ?? 0)
                                            : (item.estudiantes_inscritos_real ?? 0)}
                                    </span>
                                    <span className="mostrador-stat-label">Estudiantes</span>

                                    {/* Lista Hover Rapida */}
                                    {hoverEstudiantesId === item.id && (
                                        <div className="mostrador-hover-lista">
                                            {cargandoListaRapida ? (
                                                <div className="hover-item mini">Cargando...</div>
                                            ) : listaEstudiantesRapida.length === 0 ? (
                                                <div className="hover-item mini">Sin inscritos</div>
                                            ) : (
                                                <>
                                                    {listaEstudiantesRapida.map(est => (
                                                        <div key={est.id} className="hover-item">{est.nombre}</div>
                                                    ))}
                                                    {((item.estudiantes_inscritos_real ?? 0) > 10) && (
                                                        <div className="hover-item-ver-mas">Ver todos...</div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {item.tipo === 'curso' ? (
                                    <>
                                        <div className="mostrador-stat-item">
                                            <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                            </svg>
                                            <span className="mostrador-stat-numero">{item.modulos_count_real ?? item.modulos_count ?? 0}</span>
                                            <span className="mostrador-stat-label">Módulos</span>
                                        </div>

                                        <div className="mostrador-stat-item">
                                            <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span className="mostrador-stat-numero">{item.lecciones_count_real ?? item.lecciones_count ?? item.conteo_lecciones ?? 0}</span>
                                            <span className="mostrador-stat-label">Lecciones</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mostrador-stat-item">
                                            <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                                            </svg>
                                            <span className="mostrador-stat-numero">{item.partes_count_real ?? item.partes_count ?? 0}</span>
                                            <span className="mostrador-stat-label">Partes</span>
                                        </div>
                                        {item.duracion && (
                                            <div className="mostrador-stat-item">
                                                <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <span className="mostrador-stat-numero">{item.duracion}</span>
                                                <span className="mostrador-stat-label">Minutos</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* NUEVO: Mostrar Precio */}
                                {(item.precio_normal || item.precio_rebajado) && (
                                    <div className="mostrador-stat-item mostrador-stat-precio">
                                        <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span className="mostrador-stat-numero">
                                            {formatearMoneda(item.precio_rebajado || item.precio_normal || 0)}
                                        </span>
                                        <span className="mostrador-stat-label">Valor</span>
                                    </div>
                                )}
                            </div>

                            {/* Fecha */}
                            <div className="mostrador-fecha-creacion">
                                <svg className="mostrador-icono-fecha" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span>Creado: {formatearFecha(item.created_at)}</span>
                            </div>

                            {/* Acciones */}
                            <div className="mostrador-acciones-contenido">
                                <button
                                    className="mostrador-boton-accion mostrador-boton-editar"
                                    onClick={() => manejarEditar(item)}
                                    disabled={procesandoAccion}
                                    title="Editar contenido"
                                >
                                    <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                    <span>Editar</span>
                                </button>

                                <button
                                    className="mostrador-boton-accion mostrador-boton-ver"
                                    onClick={() => manejarVer(item)}
                                    disabled={procesandoAccion}
                                    title="Ver contenido"
                                >
                                    <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <span>Ver</span>
                                </button>

                                <button
                                    className="mostrador-boton-accion mostrador-boton-eliminar"
                                    onClick={() => manejarEliminar(item)}
                                    disabled={procesandoAccion}
                                    title="Eliminar contenido"
                                >
                                    <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {itemSeleccionado && (
                <ModalInscripciones
                    isOpen={modalInscripcionesOpen}
                    onClose={() => setModalInscripcionesOpen(false)}
                    itemId={itemSeleccionado.id}
                    itemTitulo={itemSeleccionado.titulo}
                    itemTipo={itemSeleccionado.tipo!}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
};

export default MostradorCursosTutoriales;
