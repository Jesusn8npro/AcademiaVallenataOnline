'use client';


import './FiltrosCursos.css'

export interface FiltrosCursos {
  texto: string
  tipo: '' | 'curso' | 'tutorial'
  nivel: '' | 'principiante' | 'intermedio' | 'avanzado' | 'profesional'
  precio: '' | 'gratis' | 'pago'
}

interface Props {
  filtros: FiltrosCursos
  estadisticas: { totalCursos: number; totalTutoriales: number }
  onFiltrar: (filtros: FiltrosCursos) => void
}

export default function FiltrosCursos({ filtros, estadisticas, onFiltrar }: Props) {
  const hayFiltros = !!(filtros.texto || filtros.tipo || filtros.nivel || filtros.precio)
  const totalResultados = estadisticas.totalCursos + estadisticas.totalTutoriales

  const cambiar = (campo: keyof FiltrosCursos, valor: any) => {
    onFiltrar({ ...filtros, [campo]: valor })
  }

  const limpiar = () => onFiltrar({ texto: '', tipo: '', nivel: '', precio: '' })

  return (
    <div className="fc-container">
      {/* DESKTOP */}
      <div className="fc-desktop">
        <div className="fc-buscador-item">
          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={filtros.texto}
            onChange={(e) => cambiar('texto', e.target.value)}
            className="fc-input-buscar"
          />
        </div>

        <select
          value={filtros.tipo}
          onChange={(e) => cambiar('tipo', e.target.value as any)}
          className="fc-select"
        >
          <option value="">📚 Cursos y Tutoriales</option>
          <option value="curso">🎓 Cursos</option>
          <option value="tutorial">🎵 Tutoriales</option>
        </select>

        <select
          value={filtros.nivel}
          onChange={(e) => cambiar('nivel', e.target.value as any)}
          className="fc-select"
        >
          <option value="">🎯 Nivel</option>
          <option value="principiante">🌱 Principiante</option>
          <option value="intermedio">🔥 Intermedio</option>
          <option value="avanzado">⚡ Avanzado</option>
          <option value="profesional">👑 Profesional</option>
        </select>

        <select
          value={filtros.precio}
          onChange={(e) => cambiar('precio', e.target.value as any)}
          className="fc-select"
        >
          <option value="">💰 Precio</option>
          <option value="gratis">🆓 Gratis</option>
          <option value="pago">💎 Premium</option>
        </select>

        {hayFiltros && (
          <button className="fc-btn-limpiar" onClick={limpiar}>
            🗑️ Limpiar
          </button>
        )}

        {hayFiltros && (
          <div className="fc-resultados-desktop">
            <span className="fc-count">{totalResultados}</span>
            <span className="fc-text">resultados</span>
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className="fc-mobile">
        <div className="fc-buscador-completo">
          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={filtros.texto}
            onChange={(e) => cambiar('texto', e.target.value)}
            className="fc-input-buscar"
          />
        </div>

        <div className="fc-filtros-fila">
          <select
            value={filtros.tipo}
            onChange={(e) => cambiar('tipo', e.target.value as any)}
            className="fc-select-mobile"
          >
            <option value="">📚 Todos</option>
            <option value="curso">🎓 Cursos</option>
            <option value="tutorial">🎵 Tutoriales</option>
          </select>

          <select
            value={filtros.nivel}
            onChange={(e) => cambiar('nivel', e.target.value as any)}
            className="fc-select-mobile"
          >
            <option value="">🎯 Nivel</option>
            <option value="principiante">🌱 Principiante</option>
            <option value="intermedio">🔥 Intermedio</option>
            <option value="avanzado">⚡ Avanzado</option>
            <option value="profesional">👑 Profesional</option>
          </select>

          <select
            value={filtros.precio}
            onChange={(e) => cambiar('precio', e.target.value as any)}
            className="fc-select-mobile"
          >
            <option value="">💰 Precio</option>
            <option value="gratis">🆓 Gratis</option>
            <option value="pago">💎 Premium</option>
          </select>
        </div>

        {hayFiltros && (
          <div className="fc-limpiar-mobile">
            <button className="fc-btn-limpiar" onClick={limpiar}>
              🗑️ Limpiar
            </button>
          </div>
        )}

        {hayFiltros && (
          <div className="fc-resultados-mobile">
            <span className="fc-count">{totalResultados}</span>
            <span className="fc-text">resultados</span>
          </div>
        )}
      </div>
    </div>
  )
}
