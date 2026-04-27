import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsuario } from '../../contextos/UsuarioContext';
import { supabase } from '../../servicios/clienteSupabase';

export interface EstadisticasAdmin {
  totalEstudiantes: number;
  totalCursos: number;
  objetivoMensual: number;
  porcentajeObjetivo: number;
  notificacionesPendientes: number;
  usuariosComunidad: number;
}

export interface ProgresoEstudiante {
  cursosCompletados: number;
  cursosEnProgreso: number;
  porcentajeProgreso: number;
  miembrosComunidad: number;
  leccionesCompletadas: number;
  tutorialesCompletados: number;
  totalTutoriales: number;
  puntos: number;
  racha: number;
}

export function useSidebarAdmin() {
  const { usuario, cerrarSesion } = useUsuario();
  const navigate = useNavigate();
  const location = useLocation();

  const [colapsado, setColapsado] = useState(false);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);

  const [estadisticasAdmin, setEstadisticasAdmin] = useState<EstadisticasAdmin>({
    totalEstudiantes: 0, totalCursos: 0, objetivoMensual: 100,
    porcentajeObjetivo: 0, notificacionesPendientes: 0, usuariosComunidad: 0
  });

  const [progresoEstudiante, setProgresoEstudiante] = useState<ProgresoEstudiante>({
    cursosCompletados: 0, cursosEnProgreso: 0, porcentajeProgreso: 0,
    miembrosComunidad: 0, leccionesCompletadas: 0, tutorialesCompletados: 0,
    totalTutoriales: 0, puntos: 0, racha: 0
  });

  const [mensajeMotivacional, setMensajeMotivacional] = useState('');

  const perfilRef = useRef<HTMLDivElement>(null);

  const tipoUsuario = usuario?.rol === 'admin' ? 'admin' : 'estudiante';
  const nombreUsuario = usuario?.nombre || 'Usuario';

  const mensajesMotivacionales = [
    "¡Sigue así! Cada día es un paso hacia el éxito 🎵",
    "Tu dedicación te llevará lejos ⭐",
    "El acordeón es tu pasión, ¡persíguela! 🎶",
    "Cada nota que aprendes te hace mejor músico 🎼",
    "La práctica hace al maestro 🎯",
    "¡Tu talento brilla cada día más! ✨",
    "Cada lección te acerca a tu sueño 🚀",
    "El ritmo está en tu sangre 💪",
    "¡Eres capaz de grandes cosas! 🌟",
    "Tu esfuerzo hoy será tu éxito mañana 🎉"
  ];

  const esRutaActiva = (ruta: string): boolean => {
    if (ruta === '/administrador') {
      const rutasPrincipales = [
        '/administrador/objetivos', '/administrador/usuarios', '/administrador/pagos',
        '/administrador/notificaciones', '/administrador/chats', '/administrador/panel-contenido',
        '/administrador/paquetes', '/administrador/crear-contenido', '/administrador/blog', '/administrador/eventos'
      ];
      const esSubrutaDeOtra = rutasPrincipales.some(r => location.pathname.startsWith(r));
      return location.pathname === ruta || (location.pathname.startsWith(ruta + '/') && !esSubrutaDeOtra);
    }
    return location.pathname === ruta || location.pathname.startsWith(ruta + '/');
  };

  const cargarEstadisticasAdmin = async () => {
    if (!usuario || tipoUsuario !== 'admin') return;
    try {
      const { count: estudiantes } = await supabase
        .from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante');
      const { count: cursos } = await supabase
        .from('cursos').select('*', { count: 'exact', head: true }).eq('estado', 'publicado');
      const { count: usuariosComunidad } = await supabase
        .from('perfiles').select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      setEstadisticasAdmin({
        totalEstudiantes: estudiantes || 0,
        totalCursos: cursos || 0,
        objetivoMensual: 100,
        porcentajeObjetivo: Math.round(((estudiantes || 0) / 100) * 100),
        notificacionesPendientes: 0,
        usuariosComunidad: usuariosComunidad || 0
      });
    } catch {
      // ignore stats load errors
    }
  };

  const cargarProgresoEstudiante = async () => {
    if (!usuario || tipoUsuario !== 'estudiante') return;
    try {
      const [inscripcionesResult, progresoLeccionesResult, progresoTutorialesResult, rankingResult, sesionesResult] =
        await Promise.all([
          supabase.from('inscripciones').select('*, cursos(titulo)').eq('usuario_id', usuario.id),
          supabase.from('progreso_lecciones').select('porcentaje_completado, estado').eq('usuario_id', usuario.id),
          supabase.from('progreso_tutorial').select('completado, ultimo_acceso').eq('usuario_id', usuario.id),
          supabase.from('ranking_global').select('puntuacion, posicion').eq('usuario_id', usuario.id).maybeSingle(),
          supabase.from('sesiones_usuario').select('created_at').eq('usuario_id', usuario.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
        ]);

      const inscripciones = inscripcionesResult.data || [];
      const progresoLecciones = progresoLeccionesResult.data || [];
      const progresoTutoriales = progresoTutorialesResult.data || [];
      const ranking = rankingResult.data as any;
      const sesiones = sesionesResult.data || [];

      const cursosActivos = inscripciones.filter((i: any) => !i.completado).length;
      const cursosCompletados = inscripciones.filter((i: any) => i.completado).length;
      const totalCursos = inscripciones.length;
      const leccionesCompletadas = progresoLecciones.filter((p: any) =>
        p.estado === 'completado' || p.porcentaje_completado === 100
      ).length;
      const tutorialesCompletados = progresoTutoriales.filter((t: any) => t.completado).length;
      const totalTutoriales = progresoTutoriales.length;
      const totalActividadesCompletadas = leccionesCompletadas + tutorialesCompletados;
      const puntos = ranking?.puntuacion || 0;

      let racha = 0;
      if (sesiones.length > 0) {
        const hoy = new Date();
        let diasConsecutivos = 0;
        let fechaActual = new Date(hoy);
        for (let i = 0; i < 7; i++) {
          const fechaStr = fechaActual.toISOString().split('T')[0];
          const tieneActividad = sesiones.some((s: any) => s.created_at.startsWith(fechaStr));
          if (tieneActividad) { diasConsecutivos++; fechaActual.setDate(fechaActual.getDate() - 1); }
          else break;
        }
        racha = diasConsecutivos;
      }

      const porcentajeProgreso = totalCursos > 0 ? Math.round((cursosCompletados / totalCursos) * 100) : 0;

      setProgresoEstudiante({
        cursosCompletados, cursosEnProgreso: cursosActivos, porcentajeProgreso,
        miembrosComunidad: 0, leccionesCompletadas: totalActividadesCompletadas,
        tutorialesCompletados, totalTutoriales, puntos, racha
      });
    } catch {
      // ignore progress load errors
    }
  };

  const seleccionarMensajeMotivacional = () => {
    const indiceAleatorio = Math.floor(Math.random() * mensajesMotivacionales.length);
    setMensajeMotivacional(mensajesMotivacionales[indiceAleatorio]);
  };

  const alternarBarraLateral = () => setColapsado(!colapsado);

  const alternarMenuPerfil = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuPerfilAbierto(!menuPerfilAbierto);
  };

  const cerrarSesionCompleta = async () => {
    await cerrarSesion();
    navigate('/');
  };

  const irAPerfil = () => { setMenuPerfilAbierto(false); navigate('/mi-perfil'); };

  const irACursos = () => {
    setMenuPerfilAbierto(false);
    navigate(tipoUsuario === 'admin' ? '/cursos' : '/mis-cursos');
  };

  const abrirModalBusqueda = () => setModalBusquedaAbierto(true);

  useEffect(() => {
    const manejarClicFuera = (evento: MouseEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(evento.target as Node) && menuPerfilAbierto) {
        setMenuPerfilAbierto(false);
      }
    };
    document.addEventListener('click', manejarClicFuera);
    return () => document.removeEventListener('click', manejarClicFuera);
  }, [menuPerfilAbierto]);

  useEffect(() => {
    if (colapsado) {
      document.body.classList.remove('con-sidebar');
      document.body.classList.add('con-sidebar-colapsado');
    } else {
      document.body.classList.remove('con-sidebar-colapsado');
      document.body.classList.add('con-sidebar');
    }
  }, [colapsado]);

  useEffect(() => {
    if (tipoUsuario === 'admin') {
      cargarEstadisticasAdmin();
    } else if (tipoUsuario === 'estudiante') {
      cargarProgresoEstudiante();
      seleccionarMensajeMotivacional();
    }
  }, [usuario, tipoUsuario]);

  return {
    usuario, tipoUsuario, nombreUsuario,
    colapsado, menuPerfilAbierto, modalBusquedaAbierto, setModalBusquedaAbierto,
    estadisticasAdmin, progresoEstudiante, mensajeMotivacional,
    perfilRef,
    esRutaActiva, alternarBarraLateral, alternarMenuPerfil,
    cerrarSesionCompleta, irAPerfil, irACursos, abrirModalBusqueda
  };
}
