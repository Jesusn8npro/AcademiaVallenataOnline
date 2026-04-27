import React from 'react';
import type { ResultadosBusqueda } from '../../servicios/busquedaService';

interface Props {
  resultados: ResultadosBusqueda;
  reproducirSonido: (tipo: string) => void;
  navigarAResultado: (url: string) => void;
}

export default function ResultadosBusqueda({ resultados, reproducirSonido, navigarAResultado }: Props) {
  return (
    <div className="academia-resultados-container">
      <div className="academia-resultados-header">
        <h3 className="academia-resultados-titulo">
          📊 {resultados.total} resultado{resultados.total !== 1 ? 's' : ''} encontrado{resultados.total !== 1 ? 's' : ''}
        </h3>
      </div>

      {resultados.cursos.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">🎓</span>
            Cursos ({resultados.cursos.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.cursos.map((curso, index) => (
              <button key={index} className="academia-tarjeta-resultado"
                onClick={() => { reproducirSonido('resultado'); navigarAResultado(curso.url); }}
                onMouseEnter={() => reproducirSonido('hover')}>
                {curso.imagen ? (
                  <img src={curso.imagen} alt={curso.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-blue-500 to-blue-700">
                    <span className="academia-placeholder-icono">🎓</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{curso.titulo}</h5>
                  {curso.descripcion && <p className="academia-resultado-descripcion">{curso.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {curso.nivel && <span className="academia-meta-item">📊 {curso.nivel}</span>}
                    {curso.precio && <span className="academia-meta-item academia-precio">${new Intl.NumberFormat('es-CO').format(curso.precio)} COP</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultados.tutoriales.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">🎵</span>
            Tutoriales ({resultados.tutoriales.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.tutoriales.map((tutorial, index) => (
              <button key={index} className="academia-tarjeta-resultado"
                onClick={() => { reproducirSonido('resultado'); navigarAResultado(tutorial.url); }}
                onMouseEnter={() => reproducirSonido('hover')}>
                {tutorial.imagen ? (
                  <img src={tutorial.imagen} alt={tutorial.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-teal-500 to-teal-700">
                    <span className="academia-placeholder-icono">🎵</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{tutorial.titulo}</h5>
                  {tutorial.descripcion && <p className="academia-resultado-descripcion">{tutorial.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {tutorial.autor && <span className="academia-meta-item">👤 {tutorial.autor}</span>}
                    {tutorial.nivel && <span className="academia-meta-item">📊 {tutorial.nivel}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultados.blog.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">📖</span>
            Blog ({resultados.blog.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.blog.map((articulo, index) => (
              <button key={index} className="academia-tarjeta-resultado"
                onClick={() => { reproducirSonido('resultado'); navigarAResultado(articulo.url); }}
                onMouseEnter={() => reproducirSonido('hover')}>
                {articulo.imagen ? (
                  <img src={articulo.imagen} alt={articulo.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-orange-500 to-orange-700">
                    <span className="academia-placeholder-icono">📖</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{articulo.titulo}</h5>
                  {articulo.descripcion && <p className="academia-resultado-descripcion">{articulo.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {articulo.autor && <span className="academia-meta-item">👤 {articulo.autor}</span>}
                    {articulo.categoria && <span className="academia-meta-item">🏷️ {articulo.categoria}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultados.usuarios.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">👥</span>
            Usuarios ({resultados.usuarios.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.usuarios.map((usuario, index) => (
              <button key={index} className="academia-tarjeta-resultado" onClick={() => navigarAResultado(usuario.url)}>
                {usuario.imagen ? (
                  <img src={usuario.imagen} alt={usuario.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-purple-500 to-purple-700">
                    <span className="academia-placeholder-icono">👤</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{usuario.titulo}</h5>
                  {usuario.descripcion && <p className="academia-resultado-descripcion">{usuario.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {usuario.nivel && <span className="academia-meta-item">📊 {usuario.nivel}</span>}
                    <span className="academia-meta-item">🎵 Acordeonista</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultados.eventos.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">🎪</span>
            Eventos ({resultados.eventos.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.eventos.map((evento, index) => (
              <button key={index} className="academia-tarjeta-resultado"
                onClick={() => { reproducirSonido('resultado'); navigarAResultado(evento.url); }}
                onMouseEnter={() => reproducirSonido('hover')}>
                {evento.imagen ? (
                  <img src={evento.imagen} alt={evento.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-green-500 to-green-700">
                    <span className="academia-placeholder-icono">🎪</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{evento.titulo}</h5>
                  {evento.descripcion && <p className="academia-resultado-descripcion">{evento.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {evento.fechaCreacion && <span className="academia-meta-item">📅 {new Date(evento.fechaCreacion).toLocaleDateString('es-ES')}</span>}
                    <span className="academia-meta-item">🎫 Evento</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultados.paquetes.length > 0 && (
        <div className="academia-categoria-seccion">
          <h4 className="academia-categoria-titulo">
            <span className="academia-categoria-icono">📦</span>
            Paquetes ({resultados.paquetes.length})
          </h4>
          <div className="academia-grid-resultados">
            {resultados.paquetes.map((paquete, index) => (
              <button key={index} className="academia-tarjeta-resultado" onClick={() => navigarAResultado(paquete.url)}>
                {paquete.imagen ? (
                  <img src={paquete.imagen} alt={paquete.titulo} className="academia-resultado-imagen" loading="lazy" />
                ) : (
                  <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-yellow-500 to-yellow-700">
                    <span className="academia-placeholder-icono">📦</span>
                  </div>
                )}
                <div className="academia-resultado-contenido">
                  <h5 className="academia-resultado-titulo">{paquete.titulo}</h5>
                  {paquete.descripcion && <p className="academia-resultado-descripcion">{paquete.descripcion}</p>}
                  <div className="academia-resultado-meta">
                    {paquete.precio && <span className="academia-meta-item academia-precio">${new Intl.NumberFormat('es-CO').format(paquete.precio)} COP</span>}
                    <span className="academia-meta-item">📦 Paquete</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
