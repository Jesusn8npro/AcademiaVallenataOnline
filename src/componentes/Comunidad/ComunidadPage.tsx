import React, { useState, useEffect } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import { useLocation } from 'react-router-dom';
import BannerComunidad from '../ComponentesComunidad/BannerComunidad';
import ComunidadPublicar from '../ComponentesComunidad/ComunidadPublicar';
import FeedPublicaciones from '../ComponentesComunidad/FeedPublicaciones';
import PorcentajePerfil from '../Perfil/PorcentajePerfil';
import RankingComunidadNuevo from '../ComponentesComunidad/RankingComunidadNuevo';
import UltimosArticulosBlog from '../Perfil/UltimosArticulosBlog';
import SliderCursos from '../ComponentesComunidad/SliderCursos';
import ComunidadService from '../../servicios/comunidadService';
import type { PublicacionComunidad } from '../../servicios/comunidadService';
import './ComunidadPage.css';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario?: string;
  url_foto_perfil?: string;
  rol: string;
  [key: string]: any;
}

const ComunidadPage: React.FC = () => {
  // Estados principales
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [publicaciones, setPublicaciones] = useState<PublicacionComunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<any>(null);
  const [viendoUnica, setViendoUnica] = useState(false);
  const location = useLocation();

  // Cargar usuario actual
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (perfilError) {
            console.error('Error obteniendo perfil:', perfilError);
            return;
          }

          setUsuario({
            id: user.id,
            nombre: perfil.nombre || 'Usuario',
            apellido: perfil.apellido || '',
            nombre_usuario: perfil.nombre_usuario,
            url_foto_perfil: perfil.url_foto_perfil,
            rol: perfil.rol || 'usuario',
            ...perfil
          });

          setPerfilCompleto(perfil);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };

    cargarUsuario();
  }, []);

  // Cargar publicaciones
  useEffect(() => {
    const cargarPublicaciones = async () => {
      try {
        setCargando(true);
        setError(null);

        // Verificar si hay una publicación específica en la URL (#publicacion-id)
        const hash = window.location.hash || location.hash;
        const idEspecifico = hash.includes('publicacion-') ? hash.split('publicacion-')[1] : null;

        if (idEspecifico) {
          const publicacionData = await ComunidadService.obtenerPublicacionPorId(idEspecifico);
          if (publicacionData) {
            setPublicaciones([publicacionData]);
            setViendoUnica(true);
          } else {
            const publicacionesData = await ComunidadService.obtenerPublicaciones(20, 0);
            setPublicaciones(publicacionesData);
            setViendoUnica(false);
          }
        } else {
          const publicacionesData = await ComunidadService.obtenerPublicaciones(20, 0);
          setPublicaciones(publicacionesData);
          setViendoUnica(false);
        }
      } catch (error) {
        console.error('Error cargando publicaciones:', error);
        // Si hay error de conexión, usar datos de ejemplo
        const publicacionesEjemplo = [
          {
            id: '1',
            usuario_id: '1',
            usuario_nombre: 'Carlos Mendoza',
            url_foto_perfil: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=667eea&color=fff',
            usuario_slug: 'carlos-mendoza',
            fecha: '2024-01-15T10:30:00Z',
            contenido: '¡Hola comunidad! Acabo de terminar mi primera canción en el acordeón. ¡Qué emoción! 🎵',
            tipo: 'texto',
            me_gusta: ['2', '3'],
            total_comentarios: 5,
            total_compartidos: 2
          },
          {
            id: '2',
            usuario_id: '2',
            usuario_nombre: 'Ana Rodríguez',
            url_foto_perfil: 'https://ui-avatars.com/api/?name=Ana+Rodriguez&background=667eea&color=fff',
            usuario_slug: 'ana-rodriguez',
            fecha: '2024-01-15T09:15:00Z',
            contenido: 'Compartiendo mi práctica de hoy. ¿Qué opinan?',
            url_imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
            tipo: 'foto',
            me_gusta: ['1', '3', '4'],
            total_comentarios: 8,
            total_compartidos: 3
          },
          {
            id: '3',
            usuario_id: '3',
            usuario_nombre: 'Luis García',
            url_foto_perfil: 'https://ui-avatars.com/api/?name=Luis+Garcia&background=667eea&color=fff',
            usuario_slug: 'luis-garcia',
            fecha: '2024-01-15T08:45:00Z',
            contenido: '¿Cuál es su canción favorita para practicar?',
            encuesta: {
              pregunta: '¿Cuál es su canción favorita para practicar?',
              opciones: ['La gota fría', 'El hijo de Tuta', 'La casa en el aire', 'Otra']
            },
            tipo: 'encuesta',
            me_gusta: ['1', '2'],
            total_comentarios: 12,
            total_compartidos: 1
          }
        ] as unknown as PublicacionComunidad[];
        setPublicaciones(publicacionesEjemplo);
        setError('Modo offline - Mostrando datos de ejemplo');
      } finally {
        setCargando(false);
      }
    };

    cargarPublicaciones();
  }, [location.hash]);

  // Manejar nueva publicación
  const manejarNuevaPublicacion = () => {
    setViendoUnica(false);
    window.location.hash = '';

    // Recargar publicaciones
    const recargarPublicaciones = async () => {
      try {
        const publicacionesData = await ComunidadService.obtenerPublicaciones(20, 0);
        setPublicaciones(publicacionesData);
      } catch (error) {
        console.error('Error recargando publicaciones:', error);
      }
    };

    recargarPublicaciones();
  };

  return (
    <div className="comunidad-page-contenedor">
      {/* Banner superior */}
      <BannerComunidad />

      {/* Contenido principal con estructura idéntica a Svelte */}
      <div className="comunidad-page-contenido">
        <div className="comunidad-page-timeline-grid">
          {/* Columna Izquierda - EXACTAMENTE COMO SVELTE */}
          <div className="comunidad-page-columna-timeline comunidad-page-columna-izquierda">
            {/* Widget de progreso del perfil */}
            <div className="comunidad-page-bloque-ranking">
              {perfilCompleto && (
                <PorcentajePerfil perfil={perfilCompleto} />
              )}
            </div>

            {/* Widget de artículos del blog */}
            <UltimosArticulosBlog />
          </div>

          {/* Columna Central - EXACTAMENTE COMO SVELTE */}
          <div className="comunidad-page-columna-timeline comunidad-page-columna-central">
            {/* Componente de publicar */}
            <div className="comunidad-page-contenedor-publicar">
              {usuario && (
                <ComunidadPublicar
                  usuario={usuario}
                  onPublicar={manejarNuevaPublicacion}
                />
              )}
            </div>

            {/* Feed de Publicaciones */}
            <div className="comunidad-page-feed-publicaciones">
              {cargando ? (
                <div className="comunidad-page-estado-carga">
                  <div className="comunidad-page-spinner"></div>
                  <p>Cargando publicaciones...</p>
                </div>
              ) : error ? (
                <div className="comunidad-page-estado-error">
                  <p>{error}</p>
                  <button
                    className="comunidad-page-btn-reintentar"
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  {viendoUnica && (
                    <div className="comunidad-page-filtro-info">
                      <p>Mostrando una publicación específica</p>
                      <button
                        className="comunidad-page-btn-ver-todo"
                        onClick={() => {
                          window.location.hash = '';
                          if (!location.hash) window.location.reload();
                        }}
                      >
                        Ver todas las publicaciones
                      </button>
                    </div>
                  )}
                  {publicaciones.length === 0 ? (
                    <div className="comunidad-page-estado-vacio">
                      <div className="comunidad-page-icono-vacio">🎵</div>
                      <h3>No hay publicaciones aún</h3>
                      <p>¡Sé el primero en compartir algo con la comunidad!</p>
                    </div>
                  ) : (
                    publicaciones.map((publicacion) => (
                      <FeedPublicaciones
                        key={publicacion.id}
                        {...publicacion}
                        usuario={usuario}
                        onEliminar={(id) => {
                          setPublicaciones(prev => prev.filter(p => p.id !== id));
                        }}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Columna Derecha - EXACTAMENTE COMO SVELTE */}
          <div className="comunidad-page-columna-timeline comunidad-page-columna-derecha">
            {/* Widget de ranking */}
            <RankingComunidadNuevo />

            {/* Widget de cursos pendientes */}
            <SliderCursos />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComunidadPage;
