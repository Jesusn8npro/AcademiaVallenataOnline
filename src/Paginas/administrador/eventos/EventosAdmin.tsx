import React, { useState, useEffect } from 'react';
import { eventosService } from '../../../servicios/eventosService';
import type { EventoCompleto } from '../../../types/eventos';
import './EventosAdmin.css';

const EventosAdmin: React.FC = () => {
  // Estados
  const [eventos, setEventos] = useState<EventoCompleto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Datos del formulario
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    descripcion: '',
    descripcion_corta: '',
    tipo_evento: 'masterclass',
    fecha_inicio: '',
    fecha_fin: '',
    modalidad: 'online',
    precio: 0,
    categoria: 'tecnica',
    nivel_dificultad: 'principiante',
    instructor_nombre: '',
    capacidad_maxima: 100,
    requiere_inscripcion: true,
    es_publico: true,
    estado: 'programado',
    link_transmision: '',
    imagen_portada: ''
  });

  useEffect(() => {
    cargarEventos();
  }, []);

  async function cargarEventos() {
    setCargando(true);
    const resultado = await eventosService.obtenerEventos();

    if (resultado.error) {
      setError(resultado.error);
    } else {
      setEventos(resultado.eventos);
    }
    setCargando(false);
  }

  function mostrarFormularioCrear() {
    setMostrarFormulario(true);
    // Limpiar formulario
    setNuevoEvento({
      titulo: '',
      descripcion: '',
      descripcion_corta: '',
      tipo_evento: 'masterclass',
      fecha_inicio: '',
      fecha_fin: '',
      modalidad: 'online',
      precio: 0,
      categoria: 'tecnica',
      nivel_dificultad: 'principiante',
      instructor_nombre: '',
      capacidad_maxima: 100,
      requiere_inscripcion: true,
      es_publico: true,
      estado: 'programado',
      link_transmision: '',
      imagen_portada: ''
    });
  }

  function cancelarCreacion() {
    setMostrarFormulario(false);
  }

  function generarSlug(titulo: string): string {
    return titulo
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function crearEvento(e: React.FormEvent) {
    e.preventDefault();

    if (!nuevoEvento.titulo || !nuevoEvento.fecha_inicio) {
      setError('El título y la fecha de inicio son obligatorios');
      return;
    }

    setCargando(true);
    setError('');

    try {
      // Preparar datos según la estructura real de la base de datos
      const eventoData = {
        titulo: nuevoEvento.titulo,
        descripcion: nuevoEvento.descripcion || undefined,
        descripcion_corta: nuevoEvento.descripcion_corta || undefined,
        slug: generarSlug(nuevoEvento.titulo),
        tipo_evento: nuevoEvento.tipo_evento as 'masterclass' | 'workshop' | 'concierto' | 'concurso' | 'webinar' | 'reunion',
        fecha_inicio: nuevoEvento.fecha_inicio,
        fecha_fin: nuevoEvento.fecha_fin || undefined,
        modalidad: nuevoEvento.modalidad as 'online' | 'presencial' | 'hibrido',
        precio: nuevoEvento.precio,
        categoria: nuevoEvento.categoria,
        nivel_dificultad: nuevoEvento.nivel_dificultad as 'principiante' | 'intermedio' | 'avanzado' | 'profesional',
        instructor_nombre: nuevoEvento.instructor_nombre || undefined,
        capacidad_maxima: nuevoEvento.capacidad_maxima,
        requiere_inscripcion: nuevoEvento.requiere_inscripcion,
        es_publico: nuevoEvento.es_publico,
        estado: nuevoEvento.estado as 'borrador' | 'programado' | 'en_vivo' | 'finalizado' | 'cancelado' | 'pospuesto',
        link_transmision: nuevoEvento.link_transmision || undefined,
        imagen_portada: nuevoEvento.imagen_portada || undefined,
        participantes_inscritos: 0,
        total_visualizaciones: 0,
        calificacion_promedio: 0,
        total_calificaciones: 0
      };

      const resultado = await eventosService.crearEvento(eventoData);

      if (resultado.error) {
        setError(`Error al crear el evento: ${resultado.error}`);
      } else {
        // Recargar lista de eventos
        await cargarEventos();
        // Ocultar formulario
        setMostrarFormulario(false);
        setError('');
      }
    } catch (err: any) {
      setError(`Error inesperado: ${err.message}`);
    }

    setCargando(false);
  }

  async function eliminarEvento(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    const resultado = await eventosService.eliminarEvento(id);

    if (resultado.error) {
      setError(resultado.error);
    } else {
      await cargarEventos();
    }
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatearPrecio(precio: number): string {
    if (precio === 0) return 'Gratuito';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setNuevoEvento(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="mt-2 text-gray-600">Administra masterclasses, workshops y otros eventos de la academia</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Botón para crear evento */}
        {!mostrarFormulario && (
          <div className="mb-6">
            <button
              onClick={mostrarFormularioCrear}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Evento
            </button>
          </div>
        )}

        {/* Formulario de creación */}
        {mostrarFormulario && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Nuevo Evento</h2>

            <form onSubmit={crearEvento} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Evento *
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    type="text"
                    value={nuevoEvento.titulo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Masterclass de Técnicas Avanzadas"
                  />
                </div>

                <div>
                  <label htmlFor="instructor_nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Instructor
                  </label>
                  <input
                    id="instructor_nombre"
                    name="instructor_nombre"
                    type="text"
                    value={nuevoEvento.instructor_nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre completo del instructor"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion_corta" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Corta
                </label>
                <input
                  id="descripcion_corta"
                  name="descripcion_corta"
                  type="text"
                  value={nuevoEvento.descripcion_corta}
                  onChange={handleInputChange}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Resumen breve del evento"
                />
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Completa
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={nuevoEvento.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción detallada del evento, objetivos, contenido..."
                ></textarea>
              </div>

              {/* Configuración del evento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="tipo_evento" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evento
                  </label>
                  <select
                    id="tipo_evento"
                    name="tipo_evento"
                    value={nuevoEvento.tipo_evento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="masterclass">Masterclass</option>
                    <option value="workshop">Workshop</option>
                    <option value="concierto">Concierto</option>
                    <option value="concurso">Concurso</option>
                    <option value="webinar">Webinar</option>
                    <option value="reunion">Reunión</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidad
                  </label>
                  <select
                    id="modalidad"
                    name="modalidad"
                    value={nuevoEvento.modalidad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={nuevoEvento.categoria}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tecnica">Técnica</option>
                    <option value="teoria">Teoría</option>
                    <option value="repertorio">Repertorio</option>
                    <option value="historia">Historia</option>
                  </select>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="datetime-local"
                    value={nuevoEvento.fecha_inicio}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    id="fecha_fin"
                    name="fecha_fin"
                    type="datetime-local"
                    value={nuevoEvento.fecha_fin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Configuración adicional */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="nivel_dificultad" className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Dificultad
                  </label>
                  <select
                    id="nivel_dificultad"
                    name="nivel_dificultad"
                    value={nuevoEvento.nivel_dificultad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                    <option value="profesional">Profesional</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="capacidad_maxima" className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad Máxima
                  </label>
                  <input
                    id="capacidad_maxima"
                    name="capacidad_maxima"
                    type="number"
                    value={nuevoEvento.capacidad_maxima}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (COP)
                  </label>
                  <input
                    id="precio"
                    name="precio"
                    type="number"
                    value={nuevoEvento.precio}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Enlaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="link_transmision" className="block text-sm font-medium text-gray-700 mb-2">
                    Link de Transmisión
                  </label>
                  <input
                    id="link_transmision"
                    name="link_transmision"
                    type="url"
                    value={nuevoEvento.link_transmision}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div>
                  <label htmlFor="imagen_portada" className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen de Portada
                  </label>
                  <input
                    id="imagen_portada"
                    name="imagen_portada"
                    type="url"
                    value={nuevoEvento.imagen_portada}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Opciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requiere_inscripcion"
                      checked={nuevoEvento.requiere_inscripcion}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requiere Inscripción</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="es_publico"
                      checked={nuevoEvento.es_publico}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Evento Público</span>
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={cargando}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {cargando ? 'Creando...' : 'Crear Evento'}
                </button>

                <button
                  type="button"
                  onClick={cancelarCreacion}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de eventos */}
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
                          {evento.instructor_nombre && (
                            <div className="text-xs text-gray-400">Instructor: {evento.instructor_nombre}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatearFecha(evento.fecha_inicio)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${evento.modalidad === 'online' ? 'bg-blue-100 text-blue-800' :
                            evento.modalidad === 'presencial' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'}`}>
                          {evento.modalidad}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatearPrecio(evento.precio)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {evento.participantes_inscritos} / {evento.capacidad_maxima || '∞'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${evento.estado === 'programado' ? 'bg-yellow-100 text-yellow-800' :
                            evento.estado === 'en_vivo' ? 'bg-red-100 text-red-800' :
                              evento.estado === 'finalizado' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'}`}>
                          {evento.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/eventos/${evento.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver evento"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>

                          <button
                            onClick={() => eliminarEvento(evento.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Eliminar evento"
                          >
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
