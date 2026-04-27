import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerTodosPaquetes,
  eliminarPaquete,
  formatearPrecio,
  type PaqueteTutorial
} from '../../../servicios/paquetesService';
import './PaquetesAdmin.css';

const PaquetesAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [paquetes, setPaquetes] = useState<PaqueteTutorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<{ id: string; titulo: string } | null>(null);

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [modoVista, setModoVista] = useState<'cuadricula' | 'lista'>('cuadricula');

  const paquetesFiltrados = filtrarPaquetes(paquetes);
  const stats = calcularEstadisticas(paquetes);

  // Funciones
  function filtrarPaquetes(paquetes: PaqueteTutorial[]) {
    let resultado = [...paquetes];

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    if (filtroCategoria !== 'todas') {
      resultado = resultado.filter(p => p.categoria === filtroCategoria);
    }

    if (textoBusqueda.trim()) {
      const busqueda = textoBusqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.titulo.toLowerCase().includes(busqueda) ||
        p.descripcion?.toLowerCase().includes(busqueda) ||
        p.categoria?.toLowerCase().includes(busqueda)
      );
    }

    return resultado.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }

  function calcularEstadisticas(paquetes: PaqueteTutorial[]) {
    return {
      total: paquetes.length,
      publicados: paquetes.filter(p => p.estado === 'publicado').length,
      borradores: paquetes.filter(p => p.estado === 'borrador').length,
      destacados: paquetes.filter(p => p.destacado).length
    };
  }

  async function cargarDatos() {
    try {
      setCargando(true);
      setError('');

      const resultadoPaquetes = await obtenerTodosPaquetes();
      if (resultadoPaquetes.success) {
        setPaquetes(resultadoPaquetes.data);
      } else {
        throw new Error(resultadoPaquetes.error);
      }

    } catch (err: any) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setCargando(false);
    }
  }

  async function ejecutarEliminar() {
    if (!confirmandoEliminarId) return;
    const { id } = confirmandoEliminarId;
    setConfirmandoEliminarId(null);
    try {
      const resultado = await eliminarPaquete(id);
      if (resultado.success) {
        setExito(resultado.message || 'Paquete eliminado exitosamente');
        await cargarDatos();
        setTimeout(() => setExito(''), 3000);
      } else {
        setError(resultado.error || 'Error eliminando paquete');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err: any) {
      setError('Error eliminando paquete: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="paquetes-admin">
        <div className="paquetes-admin__cargando">
          <div className="paquetes-admin__spinner"></div>
          <p>Cargando paquetes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="paquetes-admin">
      {/* Cabecera */}
      <div className="paquetes-admin__cabecera">
        <div className="paquetes-admin__titulo">
          <h1>🎵 Gestión de Paquetes</h1>
          <p>Administra los paquetes de tutoriales de la academia</p>
        </div>

        <div className="paquetes-admin__acciones">
          <button
            onClick={() => navigate('/administrador/paquetes/crear')}
            className="paquetes-admin__btn-crear"
          >
            ➕ Crear Paquete
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="paquetes-admin__stats">
        <div className="paquetes-admin__stat">
          <span className="paquetes-admin__stat-numero">{stats.total}</span>
          <span className="paquetes-admin__stat-label">Total</span>
        </div>
        <div className="paquetes-admin__stat">
          <span className="paquetes-admin__stat-numero">{stats.publicados}</span>
          <span className="paquetes-admin__stat-label">Publicados</span>
        </div>
        <div className="paquetes-admin__stat">
          <span className="paquetes-admin__stat-numero">{stats.borradores}</span>
          <span className="paquetes-admin__stat-label">Borradores</span>
        </div>
        <div className="paquetes-admin__stat">
          <span className="paquetes-admin__stat-numero">{stats.destacados}</span>
          <span className="paquetes-admin__stat-label">Destacados</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="paquetes-admin__filtros">
        <div className="paquetes-admin__busqueda">
          <input
            type="text"
            placeholder="Buscar paquetes..."
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            className="paquetes-admin__input-busqueda"
          />
        </div>

        <div className="paquetes-admin__filtros-opciones">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="paquetes-admin__select"
          >
            <option value="todos">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="borrador">Borradores</option>
            <option value="archivado">Archivados</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="paquetes-admin__select"
          >
            <option value="todas">Todas las categorías</option>
            <option value="Acordeón">Acordeón</option>
            <option value="Guitarra">Guitarra</option>
            <option value="Piano">Piano</option>
            <option value="Canto">Canto</option>
          </select>

          <div className="paquetes-admin__vista">
            <button
              onClick={() => setModoVista('cuadricula')}
              className={`paquetes-admin__btn-vista ${modoVista === 'cuadricula' ? 'activo' : ''}`}
            >
              📱
            </button>
            <button
              onClick={() => setModoVista('lista')}
              className={`paquetes-admin__btn-vista ${modoVista === 'lista' ? 'activo' : ''}`}
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {confirmandoEliminarId && (
        <div style={{ background: '#fff5f5', border: '1px solid #fc8181', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', color: '#c53030' }}>¿Eliminar el paquete "{confirmandoEliminarId.titulo}"? Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={ejecutarEliminar} style={{ padding: '0.3rem 0.75rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Eliminar</button>
            <button onClick={() => setConfirmandoEliminarId(null)} style={{ padding: '0.3rem 0.75rem', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="paquetes-admin__error">
          <div className="paquetes-admin__error-icono">❌</div>
          <p>{error}</p>
        </div>
      )}

      {exito && (
        <div className="paquetes-admin__exito">
          <div className="paquetes-admin__exito-icono">✅</div>
          <p>{exito}</p>
        </div>
      )}

      {/* Lista de paquetes */}
      <div className={`paquetes-admin__lista ${modoVista === 'cuadricula' ? 'cuadricula' : 'lista'}`}>
        {paquetesFiltrados.length === 0 ? (
          <div className="paquetes-admin__vacio">
            <div className="paquetes-admin__vacio-icono">📦</div>
            <h3>No hay paquetes</h3>
            <p>No se encontraron paquetes con los filtros aplicados.</p>
            <button
              onClick={() => navigate('/administrador/paquetes/crear')}
              className="paquetes-admin__btn-crear"
            >
              Crear Primer Paquete
            </button>
          </div>
        ) : (
          paquetesFiltrados.map((paquete) => (
            <div key={paquete.id} className="paquetes-admin__item">
              <div className="paquetes-admin__item-imagen">
                {paquete.imagen_url ? (
                  <img src={paquete.imagen_url} alt={paquete.titulo} />
                ) : (
                  <div className="paquetes-admin__item-imagen-placeholder">🎵</div>
                )}
                {paquete.destacado && (
                  <div className="paquetes-admin__item-destacado">⭐</div>
                )}
              </div>

              <div className="paquetes-admin__item-contenido">
                <h3>{paquete.titulo}</h3>
                <p>{paquete.descripcion_corta}</p>

                <div className="paquetes-admin__item-meta">
                  <span className={`paquetes-admin__item-estado ${paquete.estado}`}>
                    {paquete.estado}
                  </span>
                  <span className="paquetes-admin__item-categoria">
                    {paquete.categoria}
                  </span>
                  <span className="paquetes-admin__item-precio">
                    {formatearPrecio(paquete.precio_normal)}
                  </span>
                </div>

                <div className="paquetes-admin__item-acciones">
                  <button
                    onClick={() => navigate(`/administrador/paquetes/editar/${paquete.id}`)}
                    className="paquetes-admin__btn-editar"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setConfirmandoEliminarId({ id: paquete.id!, titulo: paquete.titulo })}
                    className="paquetes-admin__btn-eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaquetesAdmin;
