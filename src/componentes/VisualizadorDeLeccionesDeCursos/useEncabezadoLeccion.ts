import { useState, useEffect, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../servicios/clienteSupabase';

type TipoContenido = 'leccion' | 'clase';

function generarSlugBase(texto: string): string {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface UseEncabezadoLeccionProps {
  cursoId: string;
  leccionId: string;
  tipo: TipoContenido;
  curso: any;
  cursoTitulo: string;
  leccionTitulo: string;
}

export function useEncabezadoLeccion({
  cursoId, leccionId, tipo, curso, cursoTitulo, leccionTitulo,
}: UseEncabezadoLeccionProps) {
  const navigate = useNavigate();
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false);
  const [desplazado, setDesplazado] = useState(false);
  const [esDesktop, setEsDesktop] = useState(true);
  const [sidebarMovilAbierta, setSidebarMovilAbierta] = useState(false);
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false);
  const [modalAvancesAbierto, setModalAvancesAbierto] = useState(false);

  const cursoSlug = useMemo(() => {
    if (!curso) return cursoId;
    return curso.slug || (curso.titulo ? generarSlugBase(curso.titulo) : cursoId);
  }, [curso, cursoId]);

  const urlCurso = useMemo(() => {
    return tipo === 'leccion' ? `/mis-cursos/${cursoSlug}` : `/tutoriales/${cursoSlug}/contenido`;
  }, [tipo, cursoSlug]);

  const { leccionActual, totalLecciones } = useMemo(() => {
    let total = 1;
    let actual = 1;
    if (curso && tipo === 'leccion' && Array.isArray(curso.modulos)) {
      let contador = 0;
      for (const modulo of curso.modulos) {
        if (Array.isArray(modulo.lecciones)) {
          for (const leccion of modulo.lecciones) {
            contador++;
            if (String(leccion.id) === String(leccionId) || String(leccion.slug) === String(leccionId)) {
              actual = contador;
            }
          }
        }
      }
      total = contador || 1;
    } else if (curso && tipo === 'clase') {
      const posiblesListas = [
        curso.clases_tutorial, curso.clases, curso.partes_tutorial, curso.partes,
      ].find((arr: any) => Array.isArray(arr) && arr.length > 0) || [];
      total = posiblesListas.length || 1;
      const idx = posiblesListas.findIndex((c: any) =>
        String(c.id) === String(leccionId) || String(c.slug) === String(leccionId)
      );
      actual = idx >= 0 ? idx + 1 : 1;
    }
    return { leccionActual: actual, totalLecciones: total };
  }, [curso, tipo, leccionId]);

  useEffect(() => {
    function actualizarTamano() {
      setEsDesktop((typeof window !== 'undefined' ? window.innerWidth : 1200) > 1024);
    }
    function actualizarScroll() {
      setDesplazado((typeof window !== 'undefined' ? window.scrollY : 0) > 8);
    }
    function actualizarPantallaCompleta() {
      const elem = typeof document !== 'undefined'
        ? (document as any).fullscreenElement || (document as any).webkitFullscreenElement
        : null;
      setEsPantallaCompleta(!!elem);
    }
    actualizarTamano();
    actualizarScroll();
    actualizarPantallaCompleta();
    window.addEventListener('resize', actualizarTamano);
    window.addEventListener('scroll', actualizarScroll);
    document.addEventListener('fullscreenchange', actualizarPantallaCompleta);
    return () => {
      window.removeEventListener('resize', actualizarTamano);
      window.removeEventListener('scroll', actualizarScroll);
      document.removeEventListener('fullscreenchange', actualizarPantallaCompleta);
    };
  }, []);

  function alternarPantallaCompleta() {
    if (typeof document === 'undefined') return;
    try {
      const doc: any = document;
      const docEl: any = document.documentElement;
      const isNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
      const hasImmersive = document.body.classList.contains('modo-inmersivo');
      if (isNativeFs) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
        if (typeof exit === 'function') exit.call(doc);
        setEsPantallaCompleta(false);
      } else if (hasImmersive) {
        document.body.classList.remove('modo-inmersivo');
        setEsPantallaCompleta(false);
      } else {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
        if (typeof req === 'function') {
          req.call(docEl);
        } else {
          document.body.classList.add('modo-inmersivo');
          setEsPantallaCompleta(true);
        }
      }
    } catch {
      if (document.body.classList.contains('modo-inmersivo')) {
        document.body.classList.remove('modo-inmersivo');
        setEsPantallaCompleta(false);
      } else {
        document.body.classList.add('modo-inmersivo');
        setEsPantallaCompleta(true);
      }
    }
  }

  function compartir() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if ((navigator as any).share) {
      (navigator as any).share({ title: leccionTitulo, text: cursoTitulo, url });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  async function cerrarSesion() {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {}
  }

  function navegarA(ruta: string) {
    navigate(ruta);
  }

  function navegarLeccion(destino: any) {
    if (!destino) return;
    if (tipo === 'clase') {
      const claseSlug = destino.slug || generarSlugBase(destino.titulo);
      startTransition(() => navigate(`/tutoriales/${cursoSlug}/clase/${claseSlug}`));
    } else {
      const moduloSlug = destino.modulo?.slug || generarSlugBase(destino.modulo?.titulo || '');
      const leccionSlug = destino.slug || generarSlugBase(destino.titulo);
      if (cursoSlug && moduloSlug && leccionSlug) {
        startTransition(() => navigate(`/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`));
      }
    }
  }

  return {
    esPantallaCompleta, desplazado, esDesktop,
    sidebarMovilAbierta, setSidebarMovilAbierta,
    menuOpcionesAbierto, setMenuOpcionesAbierto,
    modalAvancesAbierto, setModalAvancesAbierto,
    urlCurso, leccionActual, totalLecciones,
    alternarPantallaCompleta, compartir, cerrarSesion, navegarA, navegarLeccion,
  };
}
