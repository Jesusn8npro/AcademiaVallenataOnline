import React from 'react';
import type { NuevoEventoForm } from './useEventosAdmin';

interface Props {
    nuevoEvento: NuevoEventoForm;
    cargando: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancelar: () => void;
}

const FormularioCrearEvento = ({ nuevoEvento, cargando, handleInputChange, onSubmit, onCancelar }: Props) => (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Crear Nuevo Evento</h2>
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">Título del Evento *</label>
                    <input id="titulo" name="titulo" type="text" value={nuevoEvento.titulo} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Masterclass de Técnicas Avanzadas" />
                </div>
                <div>
                    <label htmlFor="instructor_nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre del Instructor</label>
                    <input id="instructor_nombre" name="instructor_nombre" type="text" value={nuevoEvento.instructor_nombre} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nombre completo del instructor" />
                </div>
            </div>

            <div>
                <label htmlFor="descripcion_corta" className="block text-sm font-medium text-gray-700 mb-2">Descripción Corta</label>
                <input id="descripcion_corta" name="descripcion_corta" type="text" value={nuevoEvento.descripcion_corta} onChange={handleInputChange} maxLength={500} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Resumen breve del evento" />
            </div>
            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">Descripción Completa</label>
                <textarea id="descripcion" name="descripcion" value={nuevoEvento.descripcion} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Descripción detallada del evento, objetivos, contenido..."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="tipo_evento" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
                    <select id="tipo_evento" name="tipo_evento" value={nuevoEvento.tipo_evento} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="masterclass">Masterclass</option>
                        <option value="workshop">Workshop</option>
                        <option value="concierto">Concierto</option>
                        <option value="concurso">Concurso</option>
                        <option value="webinar">Webinar</option>
                        <option value="reunion">Reunión</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
                    <select id="modalidad" name="modalidad" value={nuevoEvento.modalidad} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="online">Online</option>
                        <option value="presencial">Presencial</option>
                        <option value="hibrido">Híbrido</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <select id="categoria" name="categoria" value={nuevoEvento.categoria} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="tecnica">Técnica</option>
                        <option value="teoria">Teoría</option>
                        <option value="repertorio">Repertorio</option>
                        <option value="historia">Historia</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora de Inicio *</label>
                    <input id="fecha_inicio" name="fecha_inicio" type="datetime-local" value={nuevoEvento.fecha_inicio} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora de Fin</label>
                    <input id="fecha_fin" name="fecha_fin" type="datetime-local" value={nuevoEvento.fecha_fin} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="nivel_dificultad" className="block text-sm font-medium text-gray-700 mb-2">Nivel de Dificultad</label>
                    <select id="nivel_dificultad" name="nivel_dificultad" value={nuevoEvento.nivel_dificultad} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                        <option value="profesional">Profesional</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="capacidad_maxima" className="block text-sm font-medium text-gray-700 mb-2">Capacidad Máxima</label>
                    <input id="capacidad_maxima" name="capacidad_maxima" type="number" value={nuevoEvento.capacidad_maxima} onChange={handleInputChange} min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">Precio (COP)</label>
                    <input id="precio" name="precio" type="number" value={nuevoEvento.precio} onChange={handleInputChange} min="0" step="1000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="link_transmision" className="block text-sm font-medium text-gray-700 mb-2">Link de Transmisión</label>
                    <input id="link_transmision" name="link_transmision" type="url" value={nuevoEvento.link_transmision} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://zoom.us/j/..." />
                </div>
                <div>
                    <label htmlFor="imagen_portada" className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen de Portada</label>
                    <input id="imagen_portada" name="imagen_portada" type="url" value={nuevoEvento.imagen_portada} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input type="checkbox" name="requiere_inscripcion" checked={nuevoEvento.requiere_inscripcion} onChange={handleInputChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Requiere Inscripción</span>
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" name="es_publico" checked={nuevoEvento.es_publico} onChange={handleInputChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Evento Público</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button type="submit" disabled={cargando} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    {cargando ? 'Creando...' : 'Crear Evento'}
                </button>
                <button type="button" onClick={onCancelar} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
                    Cancelar
                </button>
            </div>
        </form>
    </div>
);

export default FormularioCrearEvento;
