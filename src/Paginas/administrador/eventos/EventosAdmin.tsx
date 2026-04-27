import React from 'react';
import { useEventosAdmin } from './useEventosAdmin';
import FormularioCrearEvento from './FormularioCrearEvento';
import './EventosAdmin.css';

const EventosAdmin: React.FC = () => {
    const {
        eventos, cargando, error, mostrarFormulario, nuevoEvento,
        confirmarEliminarId,
        mostrarFormularioCrear, cancelarCreacion, crearEvento,
        solicitarEliminar, cancelarEliminar, confirmarEliminar,
        handleInputChange, formatearFecha, formatearPrecio
    } = useEventosAdmin();

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
                    <p className="mt-2 text-gray-600">Administra masterclasses, workshops y otros eventos de la academia</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>
                )}

                {confirmarEliminarId && (
                    <div style={{ background: '#fff5f5', border: '1px solid #fc8181', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Eliminar este evento? Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={confirmarEliminar} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Eliminar</button>
                            <button onClick={cancelarEliminar} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                )}

                {!mostrarFormulario && (
                    <div className="mb-6">
                        <button onClick={mostrarFormularioCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Crear Evento
                        </button>
                    </div>
                )}

                {mostrarFormulario && (
                    <FormularioCrearEvento
                        nuevoEvento={nuevoEvento}
                        cargando={cargando}
                        handleInputChange={handleInputChange}
                        onSubmit={crearEvento}
                        onCancelar={cancelarCreacion}
                    />
                )}

                <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Eventos Registrados</h2>
                    </div>
                    {cargando ? (
                        <div className="px-6 py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Cargando eventos...</p>
                        </div>
                    ) : eventos.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>No hay eventos registrados</p>
                            <p className="text-sm">Crea tu primer evento usando el botón "Crear Evento"</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscritos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {eventos.map((evento) => (
                                        <tr key={evento.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{evento.titulo}</div>
                                                    <div className="text-sm text-gray-500">{evento.tipo_evento} • {evento.categoria}</div>
                                                    {evento.instructor_nombre && <div className="text-xs text-gray-400">Instructor: {evento.instructor_nombre}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{formatearFecha(evento.fecha_inicio)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${evento.modalidad === 'online' ? 'bg-blue-100 text-blue-800' : evento.modalidad === 'presencial' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {evento.modalidad}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{formatearPrecio(evento.precio)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{evento.participantes_inscritos} / {evento.capacidad_maxima || '∞'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${evento.estado === 'programado' ? 'bg-yellow-100 text-yellow-800' : evento.estado === 'en_vivo' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {evento.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <a href={`/eventos/${evento.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 p-1 rounded" title="Ver evento">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </a>
                                                    <button onClick={() => solicitarEliminar(evento.id)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Eliminar evento">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventosAdmin;
