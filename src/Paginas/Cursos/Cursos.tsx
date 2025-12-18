import React, { useEffect, useMemo, useState } from 'react'
import './Cursos.css'
import HeroCursos from '../../componentes/Cursos/HeroCursos'
import FiltrosCursos, { type FiltrosCursos as TFiltros } from '../../componentes/Cursos/FiltrosCursos'
import GridCursos from '../../componentes/Cursos/GridCursos'
import SEO from '../../componentes/common/SEO'
import { obtenerCatalogo } from '../../servicios/cursosServicio'

export default function Cursos() {
  const [todos, setTodos] = useState<any[]>([])
  const [filtrados, setFiltrados] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState<TFiltros>({ texto: '', tipo: '', nivel: '', precio: '' })
  const itemsPorPagina = 12
  const [paginaActual, setPaginaActual] = useState(1)

  const estadisticas = useMemo(() => ({
    totalCursos: filtrados.filter(i => i.tipo === 'curso').length,
    totalTutoriales: filtrados.filter(i => i.tipo === 'tutorial').length
  }), [filtrados])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true); setError('')
    const { items, error } = await obtenerCatalogo()
    if (error) setError(error)
    setTodos(items)
    setCargando(false)
  }

  useEffect(() => { aplicarFiltros() }, [filtros, todos])

  function aplicarFiltros() {
    let res = [...todos]
    if (filtros.texto) {
      const t = filtros.texto.toLowerCase()
      res = res.filter(i => (i.titulo || '').toLowerCase().includes(t) || (i.descripcion || '').toLowerCase().includes(t))
    }
    if (filtros.tipo) res = res.filter(i => i.tipo === filtros.tipo)
    if (filtros.nivel) res = res.filter(i => i.nivel === filtros.nivel)
    if (filtros.precio === 'gratis') res = res.filter(i => !i.precio_normal || i.precio_normal === 0)
    if (filtros.precio === 'pago') res = res.filter(i => i.precio_normal && i.precio_normal > 0)
    setFiltrados(res)
    setPaginaActual(1)
  }

  const inicio = (paginaActual - 1) * itemsPorPagina
  const fin = paginaActual * itemsPorPagina
  const paginaItems = filtrados.slice(inicio, fin)

  return (
    <main>
      <SEO
        title="Cursos de Acordeón Vallenato | Niveles Principiante a Avanzado"
        description="Explora nuestro catálogo de cursos de acordeón. Desde 'Cero a Rey Vallenato' hasta tutoriales de canciones específicas. Empieza hoy mismo."
      />
      <HeroCursos />
      <section id="catalogo-section" className="cp-catalogo-section">
        <div className="cp-container">
          <div className="cp-header">
            <h2 className="cp-titulo">
              Explora Nuestro <span className="cp-highlight">Catálogo Completo</span>
            </h2>
            <p className="cp-subtitulo">
              Encuentra el curso o tutorial perfecto para tu nivel y objetivos musicales
            </p>
          </div>
          <FiltrosCursos filtros={filtros} estadisticas={{ totalCursos: estadisticas.totalCursos, totalTutoriales: estadisticas.totalTutoriales }} onFiltrar={setFiltros} />
          <GridCursos items={paginaItems} cargando={cargando} error={error} paginaActual={paginaActual} itemsPorPagina={itemsPorPagina} totalItems={filtrados.length} onPaginaChange={setPaginaActual} />
        </div>
      </section>
    </main>
  )
}
