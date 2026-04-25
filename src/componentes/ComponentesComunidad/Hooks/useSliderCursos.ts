import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';

interface Inscripcion {
  id: string;
  curso_id?: string;
  tutorial_id?: string;
  completado: boolean;
  fecha_inscripcion: string;
  cursos?: {
    id: string;
    titulo: string;
    imagen_url: string;
    slug: string;
    descripcion?: string;
    nivel?: string;
    duracion_estimada?: string;
    precio_normal?: number;
  };
  tutoriales?: {
    id: string;
    titulo: string;
    imagen_url: string;
    slug: string;
    descripcion?: string;
    nivel?: string;
    duracion_estimada?: string;
    precio_normal?: number;
    artista?: string;
    acordeonista?: string;
    tonalidad?: string;
  };
}

interface Progreso {
  partes_completadas: number;
  total_partes: number;
  progreso: number;
}

export function useSliderCursos() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [progreso, setProgreso] = useState<Record<string, Progreso>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarInscripciones = async () => {
      try {
        setCargando(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setInscripciones([]);
          setCargando(false);
          return;
        }

        const { data: inscripcionesData, error: err } = await supabase
          .from('inscripciones')
          .select('*')
          .eq('usuario_id', user.id)
          .order('fecha_inscripcion', { ascending: false });

        if (err) throw err;

        if (!inscripcionesData || inscripcionesData.length === 0) {
          setInscripciones([]);
          setCargando(false);
          return;
        }

        const inscripcionesCursos = inscripcionesData.filter((i: Inscripcion) => i.curso_id);
        const inscripcionesTutoriales = inscripcionesData.filter((i: Inscripcion) => i.tutorial_id);

        let cursosData: Inscripcion['cursos'][] = [];
        if (inscripcionesCursos.length > 0) {
          const cursoIds = inscripcionesCursos.map((i: Inscripcion) => i.curso_id);
          const { data: cursos } = await supabase
            .from('cursos')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug')
            .in('id', cursoIds);
          cursosData = cursos || [];
        }

        let tutorialesData: Inscripcion['tutoriales'][] = [];
        if (inscripcionesTutoriales.length > 0) {
          const tutorialIds = inscripcionesTutoriales.map((i: Inscripcion) => i.tutorial_id);
          const { data: tutoriales } = await supabase
            .from('tutoriales')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad')
            .in('id', tutorialIds);
          tutorialesData = tutoriales || [];
        }

        const combinadas: Inscripcion[] = [
          ...inscripcionesCursos.map((i: Inscripcion) => ({
            ...i,
            cursos: cursosData.find((c) => c?.id === i.curso_id),
          })),
          ...inscripcionesTutoriales.map((i: Inscripcion) => ({
            ...i,
            tutoriales: tutorialesData.find((t) => t?.id === i.tutorial_id),
          })),
        ];

        combinadas.sort((a, b) =>
          new Date(b.fecha_inscripcion).getTime() - new Date(a.fecha_inscripcion).getTime()
        );

        setInscripciones(combinadas);
        await cargarProgresoReal(combinadas, user.id);
      } catch {
        setError('No se pudieron cargar tus cursos. Intenta de nuevo.');
      } finally {
        setCargando(false);
      }
    };

    cargarInscripciones();
  }, []);

  const cargarProgresoReal = async (lista: Inscripcion[], usuarioId: string) => {
    const progresoMap: Record<string, Progreso> = {};

    for (const inscripcion of lista) {
      try {
        const esCurso = !!inscripcion.cursos;
        const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
        if (!contenidoId) continue;

        if (esCurso) {
          const { data: modulos } = await supabase
            .from('modulos')
            .select('id')
            .eq('curso_id', contenidoId);

          if (modulos && modulos.length > 0) {
            const moduloIds = modulos.map((m: { id: string }) => m.id);
            const { data: lecciones } = await supabase
              .from('lecciones')
              .select('id')
              .in('modulo_id', moduloIds);

            const leccionIds = (lecciones || []).map((l: { id: string }) => l.id);

            if (leccionIds.length > 0) {
              const { data: progr } = await supabase
                .from('progreso_lecciones')
                .select('leccion_id, estado')
                .eq('usuario_id', usuarioId)
                .in('leccion_id', leccionIds);

              const completadas = progr?.filter((p: { estado: string }) => p.estado === 'completada').length || 0;
              const total = leccionIds.length;
              progresoMap[contenidoId] = {
                partes_completadas: completadas,
                total_partes: total,
                progreso: total > 0 ? Math.round((completadas / total) * 100) : 0,
              };
            }
          }
        } else {
          const { data: partes } = await supabase
            .from('partes_tutorial')
            .select('id')
            .eq('tutorial_id', contenidoId);

          if (partes && partes.length > 0) {
            const { data: progr } = await supabase
              .from('progreso_tutorial')
              .select('parte_tutorial_id, completado')
              .eq('usuario_id', usuarioId)
              .eq('tutorial_id', contenidoId);

            const completadas = progr?.filter((p: { completado: boolean }) => p.completado).length || 0;
            const total = partes.length;
            progresoMap[contenidoId] = {
              partes_completadas: completadas,
              total_partes: total,
              progreso: total > 0 ? Math.round((completadas / total) * 100) : 0,
            };
          }
        }
      } catch {
        const contenidoId = inscripcion.curso_id || inscripcion.tutorial_id;
        if (contenidoId) progresoMap[contenidoId] = { partes_completadas: 0, total_partes: 0, progreso: 0 };
      }
    }

    setProgreso(progresoMap);
  };

  const totalItems = inscripciones.length;
  const maxIndex = Math.max(0, totalItems - 1);

  const nextSlide = () => { if (currentIndex < maxIndex && totalItems > 1) setCurrentIndex(i => i + 1); };
  const prevSlide = () => { if (currentIndex > 0 && totalItems > 1) setCurrentIndex(i => i - 1); };
  const goToSlide = (index: number) => { if (index >= 0 && index < totalItems) setCurrentIndex(index); };

  const handleKeydown = (event: React.KeyboardEvent) => {
    if (totalItems <= 1) return;
    switch (event.key) {
      case 'ArrowLeft': event.preventDefault(); prevSlide(); break;
      case 'ArrowRight': event.preventDefault(); nextSlide(); break;
      case 'Home': event.preventDefault(); goToSlide(0); break;
      case 'End': event.preventDefault(); goToSlide(totalItems - 1); break;
    }
  };

  const determinarTextoBoton = (inscripcion: Inscripcion): string => {
    const esCurso = !!inscripcion.cursos;
    const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
    const progresoReal = contenidoId ? progreso[contenidoId] : null;
    const tieneProgreso = progresoReal && (progresoReal.partes_completadas || 0) > 0;
    if (inscripcion.completado) return 'Completado';
    if (tieneProgreso) return 'Continuar';
    return 'Empezar';
  };

  const navegarAContenido = (inscripcion: Inscripcion) => {
    const esCurso = !!inscripcion.cursos;
    const contenido = esCurso ? inscripcion.cursos : inscripcion.tutoriales;
    if (!contenido) return;
    window.location.href = esCurso ? `/cursos/${contenido.slug}` : `/tutoriales/${contenido.slug}`;
  };

  return {
    inscripciones, progreso, currentIndex, cargando, error,
    totalItems, maxIndex,
    nextSlide, prevSlide, goToSlide, handleKeydown,
    determinarTextoBoton, navegarAContenido,
  };
}
