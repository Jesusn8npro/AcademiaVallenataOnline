import React from 'react'
import type { FiltrosEventos } from '../../servicios/eventosServicio'
import { categorias, tiposEvento, nivelesEvento } from './useCalendarioEventos'

interface Props {
  filtros: FiltrosEventos
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosEventos>>
  aplicarFiltros: () => void
  limpiarFiltros: () => void
}

const FiltrosEventosPanel: React.FC<Props> = ({ filtros, setFiltros, aplicarFiltros, limpiarFiltros }) => {
  return (
    <div className="filtros">
      <div className="filtros-top">
        <h3>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
          </svg>
          Filtros
        </h3>
        <button onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>

      <div className="filtros-grid">
        <div className="campo xl:col-span-2">
          <label>Buscar eventos</label>
          <input
            type="text"
            placeholder="Busca por título o descripción..."
            value={filtros.busqueda}
            onChange={(e) => { setFiltros(prev => ({ ...prev, busqueda: e.target.value })); aplicarFiltros() }}
          />
        </div>

        <div className="campo">
          <label>Categoría</label>
          <select
            value={filtros.categoria}
            onChange={(e) => { setFiltros(prev => ({ ...prev, categoria: e.target.value })); aplicarFiltros() }}
          >
            {categorias.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
        </div>

        <div className="campo">
          <label>Tipo</label>
          <select
            value={filtros.tipo_evento}
            onChange={(e) => { setFiltros(prev => ({ ...prev, tipo_evento: e.target.value })); aplicarFiltros() }}
          >
            {tiposEvento.map(tipo => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
          </select>
        </div>

        <div className="campo">
          <label>Nivel</label>
          <select
            value={filtros.nivel_dificultad}
            onChange={(e) => { setFiltros(prev => ({ ...prev, nivel_dificultad: e.target.value })); aplicarFiltros() }}
          >
            {nivelesEvento.map(nivel => <option key={nivel.value} value={nivel.value}>{nivel.label}</option>)}
          </select>
        </div>

        <div className="checkbox-linea">
          <input
            type="checkbox"
            id="solo-gratuitos"
            checked={filtros.es_gratuito === true}
            onChange={(e) => {
              setFiltros(prev => ({ ...prev, es_gratuito: e.target.checked ? true : undefined }))
              aplicarFiltros()
            }}
          />
          <label htmlFor="solo-gratuitos">Solo eventos gratuitos</label>
        </div>

        <div className="campo">
          <label>Desde</label>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => { setFiltros(prev => ({ ...prev, fecha_desde: e.target.value })); aplicarFiltros() }}
          />
        </div>
      </div>
    </div>
  )
}

export default FiltrosEventosPanel
