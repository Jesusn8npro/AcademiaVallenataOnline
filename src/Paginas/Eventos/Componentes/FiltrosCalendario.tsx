import React from 'react';
import type { FiltrosEvento } from './useCalendarioEventos';

const CATEGORIAS = [
  { value: '', label: 'Todas las categorías' }, { value: 'tecnica', label: 'Técnica' },
  { value: 'teoria', label: 'Teoría' }, { value: 'repertorio', label: 'Repertorio' },
  { value: 'historia', label: 'Historia' },
];
const TIPOS_EVENTO = [
  { value: '', label: 'Todos los tipos' }, { value: 'masterclass', label: 'Masterclass' },
  { value: 'workshop', label: 'Workshop' }, { value: 'concierto', label: 'Concierto' },
  { value: 'concurso', label: 'Concurso' }, { value: 'webinar', label: 'Webinar' },
  { value: 'reunion', label: 'Reunión' },
];
const NIVELES_EVENTO = [
  { value: '', label: 'Todos los niveles' }, { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' }, { value: 'avanzado', label: 'Avanzado' },
  { value: 'profesional', label: 'Profesional' },
];

interface FiltrosCalendarioProps {
  filtros: FiltrosEvento;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onLimpiar: () => void;
}

const FiltrosCalendario: React.FC<FiltrosCalendarioProps> = ({ filtros, onChange, onLimpiar }) => (
  <div className="evt-cal-filters-container">
    <div className="evt-cal-filters-header">
      <h3 className="evt-cal-filters-title">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
          <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
        </svg>
        Filtros
      </h3>
      <button className="evt-cal-clear-filters" onClick={onLimpiar}>Limpiar filtros</button>
    </div>
    <div className="evt-cal-filters-grid">
      <div className="evt-cal-filter-group-wide">
        <label className="evt-cal-label">Buscar eventos</label>
        <input type="text" name="busqueda" placeholder="Busca por título o descripción..."
          className="evt-cal-input" value={filtros.busqueda} onChange={onChange} />
      </div>
      <div>
        <label className="evt-cal-label">Categoría</label>
        <select name="categoria" className="evt-cal-select" value={filtros.categoria} onChange={onChange}>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="evt-cal-label">Tipo</label>
        <select name="tipo_evento" className="evt-cal-select" value={filtros.tipo_evento} onChange={onChange}>
          {TIPOS_EVENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="evt-cal-label">Nivel</label>
        <select name="nivel_dificultad" className="evt-cal-select" value={filtros.nivel_dificultad} onChange={onChange}>
          {NIVELES_EVENTO.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
        </select>
      </div>
      <div className="evt-cal-checkbox-group">
        <input type="checkbox" name="es_gratuito" id="solo-gratuitos" className="evt-cal-checkbox"
          checked={filtros.es_gratuito === true} onChange={onChange} />
        <label htmlFor="solo-gratuitos" className="evt-cal-checkbox-label">Solo eventos gratuitos</label>
      </div>
      <div>
        <label className="evt-cal-label">Desde</label>
        <input type="date" name="fecha_desde" className="evt-cal-input" value={filtros.fecha_desde} onChange={onChange} />
      </div>
    </div>
  </div>
);

export default FiltrosCalendario;
