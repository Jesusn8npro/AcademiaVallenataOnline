import { useState } from 'react';
import { supabase } from '../../../../servicios/clienteSupabase';
import type { Contenido } from './useMostradorCursosTutoriales';

interface Props {
    item: Contenido & { tipo: 'curso' | 'tutorial' };
    modoVista: 'cuadricula' | 'lista';
    procesandoAccion: boolean;
    itemProcesando: string;
    onEditar: (item: Contenido) => void;
    onVer: (item: Contenido) => void;
    onEliminar: (item: Contenido) => void;
    onAbrirInscripciones: (item: Contenido) => void;
}

const badgeEstado: Record<string, string> = { publicado: 'mostrador-badge-publicado', borrador: 'mostrador-badge-borrador', archivado: 'mostrador-badge-archivado' };
const badgeNivel: Record<string, string> = { principiante: 'mostrador-badge-principiante', intermedio: 'mostrador-badge-intermedio', avanzado: 'mostrador-badge-avanzado' };
const obtenerBadgeEstado = (e: string) => badgeEstado[e] || 'mostrador-badge-default';
const obtenerBadgeNivel = (n: string) => badgeNivel[n] || 'mostrador-badge-default';
const obtenerImagenPorDefecto = (tipo: string) => tipo === 'curso' ? 'mostrador-gradient-curso' : 'mostrador-gradient-tutorial';
const formatearFecha = (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const formatearMoneda = (valor: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

const TarjetaContenidoAdmin = ({ item, modoVista, procesandoAccion, itemProcesando, onEditar, onVer, onEliminar, onAbrirInscripciones }: Props) => {
    const [hovered, setHovered] = useState(false);
    const [listaRapida, setListaRapida] = useState<{ id: string; nombre: string }[]>([]);
    const [cargandoLista, setCargandoLista] = useState(false);

    const cargarListaRapida = async () => {
        try {
            setCargandoLista(true);
            const foreignKey = item.tipo === 'curso' ? 'curso_id' : 'tutorial_id';
            const { data, error } = await supabase
                .from('inscripciones')
                .select('perfiles:usuario_id ( nombre_completo )')
                .eq(foreignKey, item.id)
                .limit(10);
            if (error) throw error;
            setListaRapida((data as any[] || []).map(i => ({ id: i.perfiles.id, nombre: i.perfiles.nombre_completo })));
        } catch { /* error no fatal */ } finally {
            setCargandoLista(false);
        }
    };

    return (
        <div className={`mostrador-tarjeta ${modoVista === 'lista' ? 'mostrador-vista-lista' : 'mostrador-vista-cuadricula'}`}>
            <div className="mostrador-contenedor-imagen">
                {item.imagen_url ? (
                    <img src={item.imagen_url} alt={item.titulo} className="mostrador-imagen-contenido" loading="lazy" />
                ) : (
                    <div className={`mostrador-imagen-placeholder ${obtenerImagenPorDefecto(item.tipo)}`}>
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

                {procesandoAccion && itemProcesando === item.id && (
                    <div className="mostrador-overlay-carga">
                        <div className="mostrador-spinner-accion"></div>
                    </div>
                )}
            </div>

            <div className="mostrador-info-contenido">
                <div className="mostrador-badges-superiores">
                    {item.estado && (
                        <span className={`mostrador-badge ${obtenerBadgeEstado(item.estado)}`}>{item.estado}</span>
                    )}
                    {item.nivel && (
                        <span className={`mostrador-badge ${obtenerBadgeNivel(item.nivel)}`}>{item.nivel}</span>
                    )}
                </div>

                <div className="mostrador-texto-principal">
                    <h3 className="mostrador-titulo-contenido">{item.titulo}</h3>
                    <p className="mostrador-descripcion-contenido">
                        {item.descripcion_corta || item.descripcion || 'Sin descripción disponible'}
                    </p>
                </div>

                <div className="mostrador-estadisticas">
                    <div
                        className="mostrador-stat-item mostrador-stat-estudiantes"
                        onMouseEnter={() => { setHovered(true); cargarListaRapida(); }}
                        onMouseLeave={() => setHovered(false)}
                        onClick={(e) => { e.stopPropagation(); onAbrirInscripciones(item); }}
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

                        {hovered && (
                            <div className="mostrador-hover-lista">
                                {cargandoLista ? (
                                    <div className="hover-item mini">Cargando...</div>
                                ) : listaRapida.length === 0 ? (
                                    <div className="hover-item mini">Sin inscritos</div>
                                ) : (
                                    <>
                                        {listaRapida.map(est => (
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

                    {(item.precio_normal || item.precio_rebajado) && (
                        <div className="mostrador-stat-item mostrador-stat-precio">
                            <svg className="mostrador-stat-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="mostrador-stat-numero">{formatearMoneda(item.precio_rebajado || item.precio_normal || 0)}</span>
                            <span className="mostrador-stat-label">Valor</span>
                        </div>
                    )}
                </div>

                <div className="mostrador-fecha-creacion">
                    <svg className="mostrador-icono-fecha" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>Creado: {formatearFecha(item.created_at)}</span>
                </div>

                <div className="mostrador-acciones-contenido">
                    <button className="mostrador-boton-accion mostrador-boton-editar" onClick={() => onEditar(item)} disabled={procesandoAccion} title="Editar contenido">
                        <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        <span>Editar</span>
                    </button>
                    <button className="mostrador-boton-accion mostrador-boton-ver" onClick={() => onVer(item)} disabled={procesandoAccion} title="Ver contenido">
                        <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>Ver</span>
                    </button>
                    <button className="mostrador-boton-accion mostrador-boton-eliminar" onClick={() => onEliminar(item)} disabled={procesandoAccion} title="Eliminar contenido">
                        <svg className="mostrador-icono-accion" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TarjetaContenidoAdmin;
