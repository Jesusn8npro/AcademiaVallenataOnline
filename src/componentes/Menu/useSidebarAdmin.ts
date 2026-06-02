import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from '@/compat/router';
import { useUsuario } from '../../contextos/UsuarioContext';
import { supabase } from '../../servicios/clienteSupabase';
import { leerCacheStale, guardarCache } from '../../utilidades/cacheLocal';

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

  const mensajesMotivacionales = {
    racha: [
      "¡Racha activa! Cada día que practicas te acercas más a dominar el acordeón 🔥",
      "¡No pares! Tu constancia diaria es lo que separa a los buenos músicos de los grandes 🎵",
      "Llevas días seguidos estudiando — eso es dedicación real. ¡Sigue! 💪",
    ],
    progreso: [
      "Mira cuánto has avanzado. Cada lección completada es una victoria 🏆",
      "Tu progreso habla por ti. ¡Continúa con esa energía! 🚀",
      "Estás construyendo una habilidad que durará toda la vida 🎶",
    ],
    inicio: [
      "¡Hoy es un gran día para aprender algo nuevo en el acordeón! 🎼",
      "El maestro fue primero estudiante. Tu camino empieza aquí 🌟",
      "Cada nota que tocas hoy es una inversión en tu futuro musical ⭐",
    ],
    general: [
      "El acordeón vallenato es cultura viva — tú eres parte de ella 🎵",
      "La práctica hace al maestro. ¿Listo para la sesión de hoy? 🎯",
      "Tu talento se afila cada vez que abres una lección ✨",
      "¡Eres capaz de grandes cosas! La música lo comprueba 🎉",
    ],
  };

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

    // Stale-while-revalidate: si hay cache, lo mostramos INSTANTÁNEAMENTE
    // mientras se refresca de Supabase en background. Hace que volver al
    // sidebar después de navegar no muestre "0 / 0" mientras carga.
    const claveCache = `sidebar-admin-stats:${usuario.id}`;
    const cached = leerCacheStale<EstadisticasAdmin>(claveCache);
    if (cached) setEstadisticasAdmin(cached);

    // Promise.allSettled: si UNA query falla/cuelga (ej. token expirado),
    // las otras 2 igual aplican sus contadores. Antes con Promise.all una
    // falla dejaba el sidebar en "0 / 0 / 0" para siempre.
    // Timeout: 8s — evita que el sidebar quede "Cargando..." si Supabase no responde.
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const withTimeout = <T,>(p: PromiseLike<T>): Promise<T> => Promise.race([
      Promise.resolve(p),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);

    const [estudiantesRes, cursosRes, comunidadRes] = await Promise.allSettled([
      withTimeout(supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante')),
      withTimeout(supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('estado', 'publicado')),
      withTimeout(supabase.from('perfiles').select('*', { count: 'exact', head: true }).gte('updated_at', hace30Dias)),
    ]);

    const estudiantes = estudiantesRes.status === 'fulfilled' ? ((estudiantesRes.value as any)?.count || 0) : 0;
    const cursos = cursosRes.status === 'fulfilled' ? ((cursosRes.value as any)?.count || 0) : 0;
    const usuariosComunidad = comunidadRes.status === 'fulfilled' ? ((comunidadRes.value as any)?.count || 0) : 0;

    const nuevasStats: EstadisticasAdmin = {
      totalEstudiantes: estudiantes,
      totalCursos: cursos,
      objetivoMensual: 100,
      porcentajeObjetivo: Math.round((estudiantes / 100) * 100),
      notificacionesPendientes: 0,
      usuariosComunidad,
    };
    setEstadisticasAdmin(nuevasStats);
    guardarCache(claveCache, nuevasStats);
  };

  const cargarProgresoEstudiante = async () => {
    if (!usuario || tipoUsuario !== 'estudiante') return;

    // Cache stale-while-revalidate: si hay datos previos, los mostramos
    // instantáneamente mientras refrescamos. Evita el "0/0/0" mientras carga.
    const claveCache = `sidebar-estudiante-progreso:${usuario.id}`;
    const cached = leerCacheStale<ProgresoEstudiante>(claveCache);
    if (cached) { setProgresoEstudiante(cached); seleccionarMensajeMotivacional(cached); }

    // Promise.allSettled + timeout: si UNA query falla (token corrupto, RLS,
    // tabla inexistente), las otras igual cargan. Antes con Promise.all UNA
    // falla dejaba todo en 0.
    const withTimeout = <T,>(p: PromiseLike<T>): Promise<T> => Promise.race([
      Promise.resolve(p),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [inscripcionesResult, progresoLeccionesResult, progresoTutorialesResult, rankingResult, sesionesResult] =
        await Promise.allSettled([
          withTimeout(supabase.from('inscripciones').select('*, cursos(titulo)').eq('usuario_id', usuario.id)),
          withTimeout(supabase.from('progreso_lecciones').select('porcentaje_completado, estado').eq('usuario_id', usuario.id)),
          withTimeout(supabase.from('progreso_tutorial').select('completado, ultimo_acceso').eq('usuario_id', usuario.id)),
          withTimeout(supabase.from('ranking_global').select('puntuacion, posicion').eq('usuario_id', usuario.id).maybeSingle()),
          withTimeout(supabase.from('sesiones_usuario').select('created_at').eq('usuario_id', usuario.id)
            .gte('created_at', hace7Dias)
            .order('created_at', { ascending: false })),
        ]);

      const data = (res: PromiseSettledResult<any>): any =>
        res.status === 'fulfilled' ? ((res.value as any)?.data ?? null) : null;

      const inscripciones = data(inscripcionesResult) || [];
      const progresoLecciones = data(progresoLeccionesResult) || [];
      const progresoTutoriales = data(progresoTutorialesResult) || [];
      const ranking = data(rankingResult);
      const sesiones = data(sesionesResult) || [];

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

      const nuevoProgreso: ProgresoEstudiante = {
        cursosCompletados, cursosEnProgreso: cursosActivos, porcentajeProgreso,
        miembrosComunidad: 0, leccionesCompletadas: totalActividadesCompletadas,
        tutorialesCompletados, totalTutoriales, puntos, racha,
      };
      setProgresoEstudiante(nuevoProgreso);
      guardarCache(claveCache, nuevoProgreso);
      seleccionarMensajeMotivacional(nuevoProgreso);
    } catch {
      // ignore progress load errors
    }
  };

  // Construye un mensaje PERSONALIZADO con el nombre del usuario y su actividad real
  // (racha, cursos en progreso/completados, lecciones, XP). Rota por día para que se
  // sienta como una "motivación diaria" estable (no cambia en cada render).
  const seleccionarMensajeMotivacional = (p: ProgresoEstudiante) => {
    const nombre = (nombreUsuario || 'crack').trim().split(' ')[0] || 'crack';
    const cap = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    const candidatos: string[] = [];

    if (p.racha >= 2) candidatos.push(`¡${cap}, llevas ${p.racha} días de racha! 🔥 No la rompas hoy.`);
    if (p.cursosEnProgreso > 0) candidatos.push(`${cap}, tienes ${p.cursosEnProgreso} ${p.cursosEnProgreso === 1 ? 'curso' : 'cursos'} en progreso. ¡Continúa donde lo dejaste! 🎯`);
    if (p.cursosCompletados > 0) candidatos.push(`¡Grande, ${cap}! Ya completaste ${p.cursosCompletados} ${p.cursosCompletados === 1 ? 'curso' : 'cursos'} 🏆`);
    if (p.leccionesCompletadas >= 5) candidatos.push(`Vas muy bien, ${cap}: ${p.leccionesCompletadas} lecciones completadas ✨`);
    if (p.puntos > 0) candidatos.push(`${cap}, acumulas ${p.puntos} XP. ¡Cada lección suma! ⭐`);

    // Usuario nuevo / sin actividad: mensajes de bienvenida con su nombre.
    if (p.leccionesCompletadas === 0 && p.cursosCompletados === 0 && p.cursosEnProgreso === 0) {
      candidatos.push(`¡Bienvenido, ${cap}! Hoy es un gran día para tu primera lección 🎼`);
      candidatos.push(`${cap}, tu camino en el acordeón vallenato empieza hoy. ¡Vamos! 🌟`);
    }

    if (candidatos.length === 0) candidatos.push(...mensajesMotivacionales.general);

    // Selección estable por día (no aleatoria en cada render).
    const idx = new Date().getDate() % candidatos.length;
    setMensajeMotivacional(candidatos[idx]);
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
