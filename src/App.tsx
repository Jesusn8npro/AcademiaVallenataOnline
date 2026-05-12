import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
// Home: eager (es el LCP candidate principal — debe estar en el critical path).
import Home from './Paginas/Inicio/Home'
// Menus / layouts / guards: eager (forman el chrome de la app que aparece en
// todas las rutas, hacerlos lazy genera flash de "menu desaparecido").
import MenuPublico from './componentes/Menu/MenuPublico'
import MenuSuperiorAutenticado from './componentes/Menu/MenuSuperiorAutenticado'
import MenuInferiorResponsivo from './componentes/Menu/MenuInferiorResponsivo'
import SidebarAdmin from './componentes/Menu/SidebarAdmin'
import ProteccionRuta from './SeguridadApp/ProteccionRuta'
import ProteccionAdmin from './SeguridadApp/ProteccionAdmin'
// EmailCompletarWrapper solo se renderiza para usuarios autenticados (no anonimos
// en Home). Lazy: ahorra ~30KB en el critical path de visitantes nuevos.
const EmailCompletarWrapper = lazy(() => import('./componentes/Pagos/EmailCompletarWrapper'))

// Componentes flotantes/footer no criticos para el render inicial.
const BotonWhatsapp = lazy(() => import('./componentes/BotonWhatsapp/BotonWhatsapp'))
const ChatEnVivo = lazy(() => import('./componentes/chat/ChatEnVivo'))
const Footer = lazy(() => import('./componentes/Footer/Footer'))

// Resto de paginas: lazy. Solo se descargan cuando el usuario navega a ellas.
// Antes eran eager y todas (con sus CSS de ~5-70KB c/u) entraban en index.css
// + index.js del critical path = ~600KB extra en mobile.
const Eventos = lazy(() => import('./Paginas/Eventos/Eventos'))
const DetalleEvento = lazy(() => import('./Paginas/Eventos/DetalleEvento'))
const Paquetes = lazy(() => import('./Paginas/Paquetes/Paquetes'))
const DetallePaquete = lazy(() => import('./Paginas/Paquetes/DetallePaquete'))
const Blog = lazy(() => import('./Paginas/Blog/Blog'))
const ArticuloBlog = lazy(() => import('./Paginas/Blog/ArticuloBlog'))
const Cursos = lazy(() => import('./Paginas/Cursos/Cursos'))
const LandingCurso = lazy(() => import('./Paginas/Cursos/LandingCurso'))
const MiPerfil = lazy(() => import('./Paginas/Perfil/MiPerfil'))
const MisCursos = lazy(() => import('./Paginas/Perfil/MisCursos'))
const MisEventos = lazy(() => import('./Paginas/Perfil/MisEventos'))
const MisPublicaciones = lazy(() => import('./Paginas/Perfil/MisPublicaciones'))
const MisValidaciones = lazy(() => import('./Paginas/Perfil/MisValidaciones'))
const ConfiguracionPerfil = lazy(() => import('./Paginas/Perfil/ConfiguracionPerfil'))
const PerfilLayout = lazy(() => import('./Paginas/Perfil/PerfilLayout'))
const ComunidadPage = lazy(() => import('./Paginas/Comunidad/ComunidadPage'))
const PanelEstudiante = lazy(() => import('./Paginas/PanelEstudiante/PanelEstudiante'))
const RankingPage = lazy(() => import('./Paginas/Ranking/RankingPage'))
const NuestraAcademia = lazy(() => import('./Paginas/NuestraAcademia/NuestraAcademia'))
const Contacto = lazy(() => import('./Paginas/Contacto/Contacto'))
const PagoError = lazy(() => import('./Paginas/Pagos/PagoError/PagoError'))
const PagoExitoso = lazy(() => import('./Paginas/Pagos/PagoExitoso/PagoExitoso'))
const Terminos = lazy(() => import('./Paginas/Legales/Terminos'))
const Privacidad = lazy(() => import('./Paginas/Legales/Privacidad'))
const RecuperarContrasena = lazy(() => import('./Paginas/Legales/RecuperarContrasena'))
const PerfilPublicoLayout = lazy(() => import('./Paginas/Usuarios/PerfilPublicoLayout'))
const PerfilPublicoPage = lazy(() => import('./Paginas/Usuarios/PerfilPublicoPage'))
const ActividadUsuarioPage = lazy(() => import('./Paginas/Usuarios/ActividadUsuarioPage'))
const PublicacionesUsuarioPage = lazy(() => import('./Paginas/Usuarios/PublicacionesUsuarioPage'))
const GrabacionesUsuarioPage = lazy(() => import('./Paginas/Usuarios/GrabacionesUsuarioPage'))
const Notificaciones = lazy(() => import('./Paginas/Notificaciones/Notificaciones'))
const Pagina404 = lazy(() => import('./Paginas/404/Pagina404'))
const CierreSesion = lazy(() => import('./Paginas/CierreSesion/CierreSesion'))

// Rutas pesadas o de uso esporadico: lazy-load para reducir el bundle inicial.
// Admin completo, AcordeonProMax (three.js + audio engine), SimuladorApp, paginas 3D,
// modulos de lectura intensiva (ClaseCurso/Tutorial), Mensajes, MisGrabaciones.
const HomeProMax = lazy(() => import('./Paginas/AcordeonProMax/Pantallas/HomeProMax'));
const ListaCancionesProMax = lazy(() => import('./Paginas/AcordeonProMax/Pantallas/ListaCancionesProMax'));
const ConfiguracionProMax = lazy(() => import('./Paginas/AcordeonProMax/Pantallas/ConfiguracionProMax'));
const AcordeonProMaxSimulador = lazy(() => import('./Paginas/AcordeonProMax/Pantallas/AcordeonProMaxSimulador'));
const AcordeonProMaxPrueba = lazy(() => import('./Paginas/AcordeonProMax/Pantallas/AcordeonProMaxPrueba'));
const PaginaGrabadorV2 = lazy(() => import('./Paginas/AcordeonProMax/GrabadorV2/PaginaGrabadorV2'));
const SimuladorApp = lazy(() => import('./Paginas/SimuladorApp/SimuladorApp'));
const PaginaEjemplo3D = lazy(() => import('./Paginas/Ejemplos3d1'));
const PaginaEjemploAcordeon3D = lazy(() => import('./Paginas/Ejemplos3d2'));
const AcordeonDiapason3D = lazy(() => import('./Paginas/AcordeonProMax/Pruebas3D/AcordeonDiapason3D'));
const ClaseTutorial = lazy(() => import('./Paginas/Tutoriales/ClaseTutorial'));
const ContenidoTutorial = lazy(() => import('./Paginas/Tutoriales/ContenidoTutorial'));
const ClaseCurso = lazy(() => import('./Paginas/Cursos/ClaseCurso'));
const CursoAcordeonDesdeCero = lazy(() => import('./Paginas/Cursos/CursoAcordeonDesdeCero'));
const MensajesPage = lazy(() => import('./Paginas/Mensajes/MensajesPage'));
const MisGrabaciones = lazy(() => import('./Paginas/Perfil/MisGrabaciones'));
const DashboardAdmin = lazy(() => import('./Paginas/administrador/Dashboard/DashboardAdmin'));
const PanelContenido = lazy(() => import('./Paginas/administrador/PanelContenido'));
const CrearContenido = lazy(() => import('./Paginas/administrador/crear-contenido/CrearContenido'));
const PaquetesAdmin = lazy(() => import('./Paginas/administrador/paquetes/PaquetesAdmin'));
const CrearPaquete = lazy(() => import('./Paginas/administrador/paquetes/crear/CrearPaquete'));
const EditarPaquete = lazy(() => import('./Paginas/administrador/paquetes/editar/EditarPaquete'));
const AdminNotificaciones = lazy(() => import('./Paginas/administrador/notificaciones/AdminNotificaciones'));
const EventosAdmin = lazy(() => import('./Paginas/administrador/eventos/EventosAdmin'));
const GestionUsuarios = lazy(() => import('./Paginas/administrador/Usuarios/GestionUsuarios'));
const Pagos = lazy(() => import('./Paginas/administrador/Pagos/Pagos'));
const AdminBlog = lazy(() => import('./Paginas/administrador/blog/AdminBlog'));
const CreadorArticulos = lazy(() => import('./Paginas/administrador/blog/CreadorArticulos'));
const AdminChats = lazy(() => import('./Paginas/administrador/chats/AdminChats'));
const PanelDeObjetivos = lazy(() => import('./Paginas/administrador/Objetivos/PanelDeObjetivos'));
const ValidacionesAdmin = lazy(() => import('./Paginas/administrador/Validaciones/ValidacionesAdmin'));

import { UsuarioProvider, useUsuario } from './contextos/UsuarioContext'
import { supabase } from './servicios/clienteSupabase'
import { useSeguridadConsola } from './hooks/useSeguridadConsola'
import { useSesionTracker } from './hooks/useSesionTracker'
import { useBackButtonNativo } from './hooks/useBackButtonNativo'
// CursorPersonalizado es decorativo (efectos custom de cursor). Lazy + idle:
// no se necesita inmediatamente para el render del Hero, y libera ~10-15KB
// del critical path mas su CSS.
const CursorPersonalizado = lazy(() => import('./componentes/ui/CursorPersonalizado/CursorPersonalizado'))

// Componente interno que tiene acceso al contexto de usuario
const AppContent = () => {
  const { estaAutenticado, usuario } = useUsuario()
  const location = useLocation();

  // CursorPersonalizado: NO se monta hasta que el usuario mueva el mouse por
  // primera vez. Esto elimina el forced reflow ~440ms que genera al medir
  // posiciones del cursor en el initial render. En dispositivos touch nunca
  // se carga (no hay mousemove). Cero impacto en UX: el cursor custom solo
  // tiene sentido cuando ya estas moviendo el mouse.
  const [mouseDetectado, setMouseDetectado] = useState(false);
  useEffect(() => {
    if (mouseDetectado) return;
    const handler = () => setMouseDetectado(true);
    window.addEventListener('mousemove', handler, { once: true, passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseDetectado]);

  useSeguridadConsola();

  // Back button hardware Android (no-op en web)
  useBackButtonNativo();

  // Rastrear sesión del usuario autenticado
  useSesionTracker(usuario?.id || null)

  // Prefetch idle de los chunks de las rutas mas visitadas. Se ejecuta
  // cuando el browser esta inactivo (no compite con el critical path).
  // Cuando el usuario hace click en /cursos, /paquetes, etc., el chunk ya
  // esta descargado y parseado = navegacion instantanea sin "flash blanco".
  useEffect(() => {
    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 2000));
    const handle = idle(() => {
      import('./Paginas/Cursos/Cursos');
      import('./Paginas/Paquetes/Paquetes');
      import('./Paginas/Contacto/Contacto');
      import('./Paginas/Blog/Blog');
      import('./Paginas/NuestraAcademia/NuestraAcademia');
      import('./Paginas/Eventos/Eventos');
    });
    return () => {
      const cancel = (window as any).cancelIdleCallback;
      if (cancel) cancel(handle);
    };
  }, []);

  // Verificar si estamos en una vista de lectura/reproducción (Tutoriales o Cursos)
  const pathname = location.pathname;
  const esClaseTutorial = pathname.includes('/tutoriales/') && pathname.includes('/clase/');
  const esClaseCurso = pathname.startsWith('/cursos/') && pathname.split('/').filter(Boolean).length >= 4;
  const esModoLectura = esClaseTutorial || esClaseCurso;

  const esLandingVenta = pathname === '/curso-acordeon-desde-cero';

  // Función para cerrar sesión
  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    // Forzar navegación a página de despedida
    window.location.href = '/sesion-cerrada';
  }

  const esSimuladorApp = pathname.startsWith('/simulador-app');
  const esRecuperarContrasena = pathname === '/recuperar-contrasena';

  const esAcordeonProMax = pathname.startsWith('/acordeon-pro-max') || pathname === '/acordeon-promax' || pathname === '/acordeon-promax-menu';

  // Agregar clase al body cuando el usuario está autenticado y NO estamos en vistas inmersivas
  useEffect(() => {
    const esInmersivo = esModoLectura || esLandingVenta || esSimuladorApp || esAcordeonProMax || esRecuperarContrasena;

    if (estaAutenticado && !esInmersivo) {
      document.body.classList.add('con-sidebar')
    } else {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }

    return () => {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
  }, [estaAutenticado, esModoLectura, esLandingVenta, esSimuladorApp, esAcordeonProMax])

  return (
    <>
      {mouseDetectado && !location.pathname.startsWith('/simulador') && (
        <Suspense fallback={null}>
          <CursorPersonalizado />
        </Suspense>
      )}
      {/* Mostrar MenuPublico si NO está autenticado, MenuSuperiorAutenticado si SÍ está autenticado */}
      {!esModoLectura && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && (
        estaAutenticado ? (
          <MenuSuperiorAutenticado onCerrarSesion={cerrarSesion} />
        ) : (
          <MenuPublico />
        )
      )}

      {/* Mostrar banner de email faltante si está autenticado */}
      {estaAutenticado && !esModoLectura && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && (
        <Suspense fallback={null}>
          <EmailCompletarWrapper />
        </Suspense>
      )}

      {/* Sidebar Admin - Solo visible si está autenticado Y NO es clase, landing venta o SIMULADOR */}
      {estaAutenticado && !esModoLectura && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && <SidebarAdmin />}

      {/* Menú Inferior Responsivo - Solo visible en móvil y solo si está autenticado Y NO es clase, landing venta o SIMULADOR */}
      {estaAutenticado && !esModoLectura && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && <MenuInferiorResponsivo />}


      <Suspense fallback={<div className="route-suspense-fallback" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/eventos/:slug" element={<DetalleEvento />} />
        <Route path="/paquetes" element={<Paquetes />} />
        <Route path="/paquetes/:slug" element={<DetallePaquete />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<ArticuloBlog />} />
        <Route path="/tutoriales-de-acordeon" element={<Cursos />} />
        <Route path="/cursos" element={<Navigate to="/tutoriales-de-acordeon" replace />} />
        <Route path="/cursos/:slug" element={<LandingCurso />} />
        <Route path="/tutoriales/:slug" element={<LandingCurso />} />
        <Route path="/nuestra-academia" element={<NuestraAcademia />} />
        <Route path="/curso-acordeon-desde-cero" element={<CursoAcordeonDesdeCero />} />
        <Route path="/usuarios/:slug" element={<PerfilPublicoLayout />}>
          <Route index element={<PerfilPublicoPage />} />
          <Route path="actividad" element={<ActividadUsuarioPage />} />
          <Route path="publicaciones" element={<PublicacionesUsuarioPage />} />
          <Route path="grabaciones" element={<GrabacionesUsuarioPage />} />
        </Route>

        {/* Ruta para Clases de Cursos (Igual que Tutoriales) */}
        <Route path="/cursos/:slug/:moduloSlug/:leccionSlug" element={<ClaseCurso />} />

        <Route element={<ProteccionRuta />}>
          <Route path="/panel-estudiante" element={<PanelEstudiante />} />
          <Route element={<PerfilLayout />}>
            <Route path="/mi-perfil" element={<MiPerfil />} />
            <Route path="/mis-cursos" element={<MisCursos />} />
            <Route path="/mis-eventos" element={<MisEventos />} />
            <Route path="/publicaciones" element={<MisPublicaciones />} />
            <Route path="/grabaciones" element={<MisGrabaciones />} />
            <Route path="/mis-validaciones" element={<MisValidaciones />} />
            <Route path="/configuracion" element={<ConfiguracionPerfil />} />
          </Route>
          <Route path="/tutoriales/:slug/contenido" element={<ContenidoTutorial />} />
          <Route path="/tutoriales/:slug/clase/:claseSlug" element={<ClaseTutorial />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/mensajes/:chatId" element={<MensajesPage />} />
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/ranking" element={<RankingPage />} />
        </Route>
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/pago-error" element={<PagoError />} />
        <Route path="/pago-exitoso" element={<PagoExitoso />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/sesion-cerrada" element={<CierreSesion />} />
        <Route path="/ejemplo-3d" element={<PaginaEjemplo3D />} />
        <Route path="/v-pro-3d" element={<PaginaEjemploAcordeon3D />} />
        <Route path="/acordeon-3d-test" element={<AcordeonDiapason3D />} />
        {/* Admin Routes wrapped in ProteccionAdmin */}
        <Route element={<ProteccionAdmin />}>
          <Route path="/acordeon-pro-max" element={<HomeProMax />} />
          <Route path="/acordeon-pro-max/lista" element={<ListaCancionesProMax />} />
          <Route path="/acordeon-pro-max/acordeon" element={<AcordeonProMaxSimulador />} />
          <Route path="/acordeon-pro-max/acordeon/:slug" element={<AcordeonProMaxSimulador />} />
          <Route path="/acordeon-pro-max/admin" element={<PaginaGrabadorV2 />} />
          <Route path="/acordeon-pro-max/prueba" element={<AcordeonProMaxPrueba />} />
          <Route path="/acordeon-pro-max/configuracion" element={<ConfiguracionProMax />} />
          <Route path="/simulador-app" element={<SimuladorApp />} />
          <Route path="/administrador" element={<DashboardAdmin />} />
          <Route path="/administrador/contenido" element={<PanelContenido />} />
          <Route path="/administrador/panel-contenido" element={<PanelContenido />} />
          <Route path="/administrador/crear-contenido" element={<CrearContenido />} />
          <Route path="/administrador/paquetes" element={<PaquetesAdmin />} />
          <Route path="/administrador/paquetes/crear" element={<CrearPaquete />} />
          <Route path="/administrador/paquetes/editar/:id" element={<EditarPaquete />} />
          <Route path="/administrador/notificaciones" element={<AdminNotificaciones />} />
          <Route path="/administrador/eventos" element={<EventosAdmin />} />
          <Route path="/administrador/usuarios" element={<GestionUsuarios />} />
          <Route path="/administrador/pagos" element={<Pagos />} />
          <Route path="/administrador/blog" element={<AdminBlog />} />
          <Route path="/administrador/crear-articulo" element={<CreadorArticulos />} />
          <Route path="/administrador/blog/editar/:slug" element={<CreadorArticulos />} />
          <Route path="/administrador/chats" element={<AdminChats />} />
          <Route path="/administrador/objetivos" element={<PanelDeObjetivos />} />
          <Route path="/administrador/validaciones" element={<ValidacionesAdmin />} />
        </Route>
        <Route path="/notificaciones" element={<Notificaciones />} />
        {/* Catch all - 404 */}
        <Route path="*" element={<Pagina404 />} />
      </Routes>
      </Suspense>
      {!esModoLectura && !location.pathname.includes('/mensajes') && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && (
        <Suspense fallback={null}>
          {!estaAutenticado && <ChatEnVivo />}
          {!estaAutenticado && <BotonWhatsapp />}
        </Suspense>
      )}

      {/* Footer - Solo en páginas públicas, NO en app autenticada, NO en vistas inmersivas */}
      {!estaAutenticado && !esModoLectura && !esLandingVenta && !esSimuladorApp && !esAcordeonProMax && !esRecuperarContrasena && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  )
}

function App() {
  return (
    <UsuarioProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UsuarioProvider>
  )
}

export default App
