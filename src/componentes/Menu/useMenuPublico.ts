import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../servicios/clienteSupabase';

export interface ArticuloBlog {
  id: number;
  titulo: string;
  resumen: string;
  imagen_url: string;
  creado_en: string;
  slug: string;
}

interface UseMenuPublicoProps {
  onCerrarSesion?: () => Promise<void>;
}

export function useMenuPublico({ onCerrarSesion }: UseMenuPublicoProps) {
  const { t, i18n } = useTranslation();
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false);
  const [mostrarModalMenu, setMostrarModalMenu] = useState(false);
  const [mostrarMenuLateralResponsive, setMostrarMenuLateralResponsive] = useState(false);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [mostrarIdiomas, setMostrarIdiomas] = useState(false);
  const [articulosBlog, setArticulosBlog] = useState<ArticuloBlog[]>([]);
  const [cargandoArticulos, setCargandoArticulos] = useState(false);
  const [esMovil, setEsMovil] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const selectorIdiomaRef = useRef<HTMLDivElement>(null);

  const cambiarIdioma = (codigoIdioma: string) => {
    i18n.changeLanguage(codigoIdioma);
    setMostrarIdiomas(false);
  };

  const obtenerNombreIdiomaActual = () => {
    switch (i18n.language) {
      case 'en': return 'Inglés';
      case 'pt': return 'Portugués';
      case 'fr': return 'Francés';
      default: return 'Español';
    }
  };

  const cerrarModales = () => {
    setMostrarModalBusqueda(false);
    setMostrarModalMenu(false);
    setMostrarMenuLateralResponsive(false);
    setMostrarModalLogin(false);
  };

  const cerrarSesion = async () => {
    if (cerrandoSesion || !onCerrarSesion) return;
    setCerrandoSesion(true);
    try {
      await onCerrarSesion();
    } catch {
      // error silenciado intencionalmente
    } finally {
      setCerrandoSesion(false);
    }
  };

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
      setArticulosBlog(error ? [] : data || []);
    } catch {
      setArticulosBlog([]);
    } finally {
      setCargandoArticulos(false);
    }
  };

  const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const abrirModalBusqueda = () => setMostrarModalBusqueda(true);
  const abrirModalLogin = () => setMostrarModalLogin(true);
  const cerrarModalLogin = () => setMostrarModalLogin(false);

  const abrirModalMenu = () => {
    if (esMovil) {
      setMostrarMenuLateralResponsive(true);
    } else {
      setMostrarModalMenu(true);
      cargarArticulosBlog();
    }
  };

  const detectarMovil = () => setEsMovil(window.innerWidth <= 1000);
  const manejarScroll = () => setIsSticky(window.scrollY > 80);

  useEffect(() => {
    const manejarClicFuera = (event: MouseEvent) => {
      if (selectorIdiomaRef.current && !selectorIdiomaRef.current.contains(event.target as Node)) {
        setMostrarIdiomas(false);
      }
    };
    const manejarTeclaEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrarModales();
    };
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
    };
  }, []);

  return {
    t, i18n,
    mostrarModalBusqueda, mostrarModalMenu,
    mostrarMenuLateralResponsive, setMostrarMenuLateralResponsive,
    mostrarModalLogin,
    mostrarIdiomas, setMostrarIdiomas,
    articulosBlog, cargandoArticulos,
    cerrandoSesion, isSticky,
    selectorIdiomaRef,
    cambiarIdioma, obtenerNombreIdiomaActual,
    cerrarSesion, formatearFecha,
    abrirModalBusqueda, abrirModalMenu,
    abrirModalLogin, cerrarModalLogin, cerrarModales,
  };
}
