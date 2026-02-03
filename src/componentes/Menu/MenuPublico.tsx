import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../servicios/supabaseCliente';
import ModalBusqueda from '../Busqueda/ModalBusqueda';
import ModalDeInicioDeSesion from './ModalDeInicioDeSesion';
import MenuLateralResponsive from './MenuLateralResponsive';
import './MenuPublico.css';

interface ArticuloBlog {
  id: number;
  titulo: string;
  resumen: string;
  imagen_url: string;
  creado_en: string;
  slug: string;
}

interface MenuPublicoProps {
  usuario?: any;
  onCerrarSesion?: () => Promise<void>;
  onAbrirLogin?: () => void;
  onAbrirMenuLateral?: () => void;
}

const MenuPublico: React.FC<MenuPublicoProps> = ({
  usuario,
  onCerrarSesion,
  onAbrirLogin = () => { },
  onAbrirMenuLateral = () => { }
}) => {
  // Hook de traducción
  const { t, i18n } = useTranslation();

  // Estados
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false);
  const [mostrarModalMenu, setMostrarModalMenu] = useState(false);
  const [mostrarMenuLateralResponsive, setMostrarMenuLateralResponsive] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarIdiomas, setMostrarIdiomas] = useState(false);
  const [articulosBlog, setArticulosBlog] = useState<ArticuloBlog[]>([]);
  const [cargandoArticulos, setCargandoArticulos] = useState(false);
  const [esMovil, setEsMovil] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  const selectorIdiomaRef = useRef<HTMLDivElement>(null);

  // Función para cambiar idioma
  const cambiarIdioma = (codigoIdioma: string) => {
    i18n.changeLanguage(codigoIdioma);
    setMostrarIdiomas(false);
  };

  // Obtener nombre del idioma actual
  const obtenerNombreIdiomaActual = () => {
    switch (i18n.language) {
      case 'en': return 'Inglés';
      case 'pt': return 'Portugués';
      case 'fr': return 'Francés';
      default: return 'Español';
    }
  };

  // Función para cerrar sesión
  const cerrarSesion = async () => {
    if (cerrandoSesion || !onCerrarSesion) return;
    setCerrandoSesion(true);
    try {
      await onCerrarSesion();
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    } finally {
      setCerrandoSesion(false);
    }
  };

  // Función para cargar artículos del blog
  const cargarArticulosBlog = async () => {
    if (articulosBlog.length > 0) return;
    setCargandoArticulos(true);
    try {
      const { data, error } = await supabase
        .from('blog_articulos')
        .select('id, titulo, resumen, imagen_url, creado_en, slug')
        .eq('estado', 'publicado')
        .order('creado_en', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error al cargar artículos:', error);
        setArticulosBlog([]);
      } else {
        setArticulosBlog(data || []);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setArticulosBlog([]);
    } finally {
      setCargandoArticulos(false);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Funciones para manejar modales
  const abrirModalBusqueda = () => {
    setMostrarModalBusqueda(true);
    document.body.style.overflow = 'hidden';
  };

  const abrirModalMenu = () => {
    if (esMovil) {
      setMostrarMenuLateralResponsive(true);
    } else {
      setMostrarModalMenu(true);
      cargarArticulosBlog();
    }
  };

  const abrirModalLogin = () => {
    setMostrarModalLogin(true);
  };

  const cerrarModalLogin = () => {
    setMostrarModalLogin(false);
    document.body.style.overflow = 'auto';
  };

  const cerrarModales = () => {
    setMostrarModalBusqueda(false);
    setMostrarModalMenu(false);
    setMostrarMenuLateralResponsive(false);
    setMostrarModalLogin(false);
    document.body.style.overflow = 'auto';
  };

  // Función para manejar clicks fuera del selector de idiomas
  const manejarClicFuera = (event: MouseEvent) => {
    if (selectorIdiomaRef.current && !selectorIdiomaRef.current.contains(event.target as Node)) {
      setMostrarIdiomas(false);
    }
  };

  const manejarTeclaEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      cerrarModales();
    }
  };

  const manejarClicModal = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      cerrarModales();
    }
  };

  const detectarMovil = () => {
    setEsMovil(window.innerWidth <= 1000);
  };

  const manejarScroll = () => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsSticky(currentScrollY > 80);
  };

  useEffect(() => {
    document.addEventListener('mousedown', manejarClicFuera);
    document.addEventListener('keydown', manejarTeclaEscape);
    window.addEventListener('scroll', manejarScroll, { passive: true });
    detectarMovil();
    window.addEventListener('resize', detectarMovil);

    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
      document.removeEventListener('keydown', manejarTeclaEscape);
      window.removeEventListener('scroll', manejarScroll);
      window.removeEventListener('resize', detectarMovil);
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      {/* Barra superior negra */}
      <div className="mpub-barra-superior-negra">
        <div className="mpub-contenedor-barra-superior">
          {/* Información de contacto */}
          <div className="mpub-zona-izquierda">
            <div className="mpub-item-contacto">
              <span className="mpub-icono-circulo">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <path fill="#ff6600" d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5v-11ZM4.5 6a.5.5 0 0 0-.5.5v.27l8 5.21 8-5.21V6.5a.5.5 0 0 0-.5-.5h-15Zm15 2.98-7.5 4.89a.5.5 0 0 1-.54 0L4 8.98V17.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V8.98Z" />
                </svg>
              </span>
              <span className="mpub-texto-contacto">contacto@academiavallenata.com</span>
            </div>
            <div className="mpub-item-contacto">
              <span className="mpub-icono-circulo">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <path fill="#ff6600" d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2Z" />
                </svg>
              </span>
              <span className="mpub-texto-contacto">+57 3212587616</span>
            </div>
          </div>

          {/* Redes sociales, idioma y login */}
          <div className="mpub-zona-derecha">
            <div className="mpub-redes-sociales">
              <a href="https://www.facebook.com/academiavallenataonlineoficial" className="mpub-icono-red mpub-icono-facebook" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="#fff" d="M17 2.05H15c-2.76 0-5 2.24-5 5v2H7a1 1 0 0 0-1 1v3c0 .55.45 1 1 1h3v7a1 1 0 0 0 1 1h3c.55 0 1-.45 1-1v-7h2.29a1 1 0 0 0 .99-1.14l-.38-3A1 1 0 0 0 18.23 9H16V7c0-.55.45-1 1-1h1a1 1 0 0 0 1-1V3.05a1 1 0 0 0-1-1z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/academiavallenataonline/" className="mpub-icono-red" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="17" cy="7" r="1.5" fill="#fff" />
                </svg>
              </a>
              <a href="https://wa.me/573212587616?text=Hola,%20quiero%20información%20sobre%20la%20Academia%20Vallenata%20Online" className="mpub-icono-red" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                </svg>
              </a>
            </div>

            <div className="mpub-contenedor-idioma-login">
              <div className="mpub-selector-idioma" ref={selectorIdiomaRef} tabIndex={0}>
                <button
                  className="mpub-boton-idioma"
                  aria-haspopup="listbox"
                  aria-expanded={mostrarIdiomas}
                  onClick={() => setMostrarIdiomas(!mostrarIdiomas)}
                >
                  {obtenerNombreIdiomaActual()}
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ marginLeft: '0.5rem' }}>
                    <path d="M7 10l5 5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {mostrarIdiomas && (
                  <ul className="mpub-lista-idiomas" role="listbox">
                    <li role="option" aria-selected={i18n.language === 'es'} onClick={() => cambiarIdioma('es')}>Español</li>
                    <li role="option" aria-selected={i18n.language === 'en'} onClick={() => cambiarIdioma('en')}>Inglés</li>
                    <li role="option" aria-selected={i18n.language === 'pt'} onClick={() => cambiarIdioma('pt')}>Portugués</li>
                    <li role="option" aria-selected={i18n.language === 'fr'} onClick={() => cambiarIdioma('fr')}>Francés</li>
                  </ul>
                )}
              </div>

              <button className="mpub-boton-login" aria-label="Iniciar sesión" onClick={abrirModalLogin}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" style={{ marginLeft: '0.5rem' }}>
                  <circle cx="12" cy="8" r="4" fill="#fff" />
                  <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra principal de navegación */}
      <div className={`mpub-barra-principal-navegacion ${isSticky ? 'mpub-sticky' : ''}`}>
        <div className="mpub-contenedor-barra-principal">
          {/* Logo */}
          <a href="/" className="mpub-logo-navegacion" aria-label="Ir a la página de inicio">
            <img src="/imagenes/logo academia vallenata.png" alt="Logo Academia Vallenata" />
          </a>

          {/* Menú de navegación */}
          <nav className="mpub-menu-enlaces">
            <a href="/" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <path d="M3 12L12 3l9 9" />
                  <path d="M9 21V9h6v12" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.inicio')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
            <a href="/blog" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M7 7h10M7 11h10M7 15h6" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.blog')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
            <a href="/cursos" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="13" rx="2" />
                  <path d="M16 3v4M8 3v4" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.cursos')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
            <a href="/paquetes" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.paquetes')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
            <a href="/eventos" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.eventos')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
            <a href="/nuestra-academia" className="mpub-enlace-nav">
              <span className="mpub-icono-enlace-nav">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                  <path d="M12 3l9 6-9 6-9-6 9-6z" />
                  <path d="M3 9v6a9 9 0 0 0 18 0V9" />
                </svg>
              </span>
              <span className="mpub-enlace-texto">{t('menu.nuestraAcademia')}</span>
              <div className="mpub-enlace-underline"></div>
            </a>
          </nav>

          {/* Botones de acción */}
          <div className="mpub-botones-accion">
            <button className="mpub-boton-busqueda" aria-label={t('menu.buscarContenido')} onClick={abrirModalBusqueda}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <button className="mpub-menu-hamburguesa" aria-label="Abrir menú" onClick={abrirModalMenu}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <rect y="4" width="24" height="2" rx="1" fill="currentColor" />
                <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
                <rect y="18" width="24" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de menú */}
      {mostrarModalMenu && (
        <div className="mpub-modal-menu-overlay" onClick={manejarClicModal} role="dialog" aria-modal="true" aria-label="Modal de menú" tabIndex={-1}>
          <div className="mpub-modal-menu-panel">
            <button className="mpub-boton-cerrar-menu" onClick={cerrarModales} aria-label="Cerrar menú">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="#ff6600" strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="mpub-encabezado-menu">
              <a href="/" className="mpub-logo-menu-link" aria-label="Ir a la página de inicio" onClick={cerrarModales}>
                <img src="/imagenes/logo academia vallenata.png" alt="Academia Vallenata" className="mpub-logo-menu" />
              </a>
              <p className="mpub-descripcion-menu">
                {t('menu.descripcion')}
              </p>
            </div>

            <div className="mpub-redes-menu">
              <a href="https://www.facebook.com/academiavallenataonlineoficial" className="mpub-icono-red-menu" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="#ff6600" d="M17 2.05H15c-2.76 0-5 2.24-5 5v2H7a1 1 0 0 0-1 1v3c0 .55.45 1 1 1h3v7a1 1 0 0 0 1 1h3c.55 0 1-.45 1-1v-7h2.29a1 1 0 0 0 .99-1.14l-.38-3A1 1 0 0 0 18.23 9H16V7c0-.55.45-1 1-1h1a1 1 0 0 0 1-1V3.05a1 1 0 0 0-1-1z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/academiavallenataonline/" className="mpub-icono-red-menu" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="#ff6600" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" fill="none" stroke="#ff6600" strokeWidth="2" />
                  <circle cx="17" cy="7" r="1.5" fill="#ff6600" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@AcademiaVallenataONLINE" className="mpub-icono-red-menu" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="#ff6600" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a href="https://wa.me/573212587616?text=Hola,%20quiero%20información%20sobre%20la%20Academia%20Vallenata%20Online" className="mpub-icono-red-menu" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path fill="#ff6600" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                </svg>
              </a>
            </div>

            <div className="mpub-articulos-recientes">
              <h3>Artículos Recientes</h3>
              {cargandoArticulos ? (
                <p>Cargando artículos...</p>
              ) : articulosBlog.length > 0 ? (
                articulosBlog.map((articulo) => (
                  <article key={articulo.id} className="mpub-articulo-item">
                    <img src={articulo.imagen_url} alt="Artículo" className="mpub-imagen-articulo" />
                    <div className="mpub-contenido-articulo">
                      <span className="mpub-fecha-articulo">{formatearFecha(articulo.creado_en)}</span>
                      <h4 className="mpub-titulo-articulo">{articulo.titulo}</h4>
                    </div>
                  </article>
                ))
              ) : (
                <p>No hay artículos disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {mostrarModalBusqueda && <ModalBusqueda abierto={mostrarModalBusqueda} onCerrar={cerrarModales} />}
      {mostrarMenuLateralResponsive && (
        <MenuLateralResponsive
          abierto={mostrarMenuLateralResponsive}
          usuario={usuario}
          onCerrar={() => setMostrarMenuLateralResponsive(false)}
          cerrarSesion={cerrarSesion}
          cerrandoSesion={cerrandoSesion}
          abrirModalLogin={abrirModalLogin}
        />
      )}
      {mostrarModalLogin && <ModalDeInicioDeSesion abierto={mostrarModalLogin} onCerrar={cerrarModalLogin} />}
    </>
  );
};

export default MenuPublico;
