import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './Paginas/Inicio/Home'
import Eventos from './Paginas/Eventos/Eventos';
import DetalleEvento from './Paginas/Eventos/DetalleEvento';
import Paquetes from './Paginas/Paquetes/Paquetes';
import DetallePaquete from './Paginas/Paquetes/DetallePaquete';
import MenuPublico from './componentes/Menu/MenuPublico'
import MenuSuperiorAutenticado from './componentes/Menu/MenuSuperiorAutenticado'
import MenuInferiorResponsivo from './componentes/Menu/MenuInferiorResponsivo'
import SidebarAdmin from './componentes/Menu/SidebarAdmin'
import Blog from './Paginas/Blog/Blog'
import ArticuloBlog from './Paginas/Blog/ArticuloBlog'
import Cursos from './Paginas/Cursos/Cursos'
import LandingCurso from './Paginas/Cursos/LandingCurso'
import MiPerfil from './Paginas/Perfil/MiPerfil'
import MisCursos from './Paginas/Perfil/MisCursos'
import MisEventos from './Paginas/Perfil/MisEventos'
import MisPublicaciones from './Paginas/Perfil/MisPublicaciones'
import MisGrabaciones from './Paginas/Perfil/MisGrabaciones'
import ConfiguracionPerfil from './Paginas/Perfil/ConfiguracionPerfil'
import PerfilLayout from './Paginas/Perfil/PerfilLayout'
import ContenidoTutorial from './Paginas/Tutoriales/ContenidoTutorial'
import ClaseTutorial from './Paginas/Tutoriales/ClaseTutorial'
import ComunidadPage from './componentes/Comunidad/ComunidadPage'
import MensajesPage from './Paginas/Mensajes/MensajesPage'
import ChatPage from './Paginas/Mensajes/ChatPage'
import PanelEstudiante from './Paginas/PanelEstudiante/PanelEstudiante'
import RankingPage from './Paginas/Ranking/RankingPage'
import CursoAcordeonDesdeCero from './Paginas/Cursos/CursoAcordeonDesdeCero'
import ClaseCurso from './Paginas/Cursos/ClaseCurso'
import NuestraAcademia from './Paginas/NuestraAcademia/NuestraAcademia'
import Contacto from './Paginas/Contacto/Contacto'
import PagoError from './Paginas/Pagos/PagoError/PagoError'
import PagoExitoso from './Paginas/Pagos/PagoExitoso/PagoExitoso'
import ProteccionRuta from './SeguridadApp/ProteccionRuta'
import ProteccionAdmin from './SeguridadApp/ProteccionAdmin'
import Terminos from './Paginas/Legales/Terminos'
import Privacidad from './Paginas/Legales/Privacidad'
import PerfilPublicoLayout from './Paginas/Usuarios/PerfilPublicoLayout'
import PerfilPublicoPage from './Paginas/Usuarios/PerfilPublicoPage'
import ActividadUsuarioPage from './Paginas/Usuarios/ActividadUsuarioPage'
import PublicacionesUsuarioPage from './Paginas/Usuarios/PublicacionesUsuarioPage'
import GrabacionesUsuarioPage from './Paginas/Usuarios/GrabacionesUsuarioPage'
import PanelContenido from './Paginas/administrador/PanelContenido';
import PaquetesAdmin from './Paginas/administrador/paquetes/PaquetesAdmin'
import CrearPaquete from './Paginas/administrador/paquetes/crear/CrearPaquete'
import EditarPaquete from './Paginas/administrador/paquetes/editar/EditarPaquete'
// import NotificacionesAdmin from './Paginas/administrador/notificaciones/NotificacionesAdmin'
import EventosAdmin from './Paginas/administrador/eventos/EventosAdmin'
import GestionUsuarios from './Paginas/administrador/Usuarios/GestionUsuarios'
import Pagos from './Paginas/administrador/Pagos/Pagos'
import AdminBlog from './Paginas/administrador/blog/AdminBlog'
import CreadorArticulos from './Paginas/administrador/blog/CreadorArticulos'
import CrearContenido from './Paginas/administrador/crear-contenido/CrearContenido'
import BotonWhatsapp from './componentes/BotonWhatsapp/BotonWhatsapp'
import ChatEnVivo from './componentes/chat/ChatEnVivo'
import AdminChats from './Paginas/administrador/chats/AdminChats'
import Notificaciones from './Paginas/Notificaciones/Notificaciones'
import AdminNotificaciones from './Paginas/administrador/notificaciones/AdminNotificaciones'
import Pagina404 from './Paginas/404/Pagina404'
import SimuladorGaming from './Paginas/SimuladorDeAcordeon/SimuladorGaming';
import CierreSesion from './Paginas/CierreSesion/CierreSesion';
import PanelDeObjetivos from './Paginas/administrador/Objetivos/PanelDeObjetivos';

import { UsuarioProvider, useUsuario } from './contextos/UsuarioContext'
import { supabase } from './servicios/supabaseCliente'
import DashboardAdmin from './Paginas/administrador/Dashboard/DashboardAdmin'
import { useSeguridadConsola } from './hooks/useSeguridadConsola'
import CursorPersonalizado from './componentes/ui/CursorPersonalizado/CursorPersonalizado'

// Componente interno que tiene acceso al contexto de usuario
const AppContent = () => {
  const { estaAutenticado } = useUsuario()
  const location = useLocation();

  // Activar efectos globales de seguridad (Sonido manejado ahora por CursorPersonalizado y AudioManager)
  useSeguridadConsola();
  // useEfectosSonido(); // Reemplazado por CursorPersonalizado + AudioManager

  // Verificar si estamos en una vista de lectura/reproducción (Tutoriales o Cursos)
  const pathname = location.pathname;
  const esClaseTutorial = pathname.includes('/tutoriales/') && pathname.includes('/clase/');
  const esClaseCurso = pathname.startsWith('/cursos/') && pathname.split('/').filter(Boolean).length >= 4;
  const esModoLectura = esClaseTutorial || esClaseCurso;

  // Función para cerrar sesión
  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    // Forzar navegación a página de despedida
    window.location.href = '/sesion-cerrada';
  }

  // Agregar clase al body cuando el usuario está autenticado
  useEffect(() => {
    if (estaAutenticado) {
      document.body.classList.add('con-sidebar')
    } else {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }

    return () => {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
  }, [estaAutenticado])



  const esLandingVenta = pathname === '/curso-acordeon-desde-cero';

  return (
    <>
      <CursorPersonalizado />
      {/* Mostrar MenuPublico si NO está autenticado, MenuSuperiorAutenticado si SÍ está autenticado
          OCULTAR si estamos en vista de clase o landing venta */}
      {!esModoLectura && !esLandingVenta && (
        estaAutenticado ? (
          <MenuSuperiorAutenticado onCerrarSesion={cerrarSesion} />
        ) : (
          <MenuPublico />
        )
      )}

      {/* Sidebar Admin - Solo visible si está autenticado Y NO es clase NI landing venta */}
      {estaAutenticado && !esModoLectura && !esLandingVenta && <SidebarAdmin />}

      {/* Menú Inferior Responsivo - Solo visible en móvil y solo si está autenticado Y NO es clase NI landing venta */}
      {estaAutenticado && !esModoLectura && !esLandingVenta && <MenuInferiorResponsivo />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/eventos/:slug" element={<DetalleEvento />} />
        <Route path="/paquetes" element={<Paquetes />} />
        <Route path="/paquetes/:slug" element={<DetallePaquete />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<ArticuloBlog />} />
        <Route path="/cursos" element={<Cursos />} />
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
            <Route path="/configuracion" element={<ConfiguracionPerfil />} />
          </Route>
          <Route path="/tutoriales/:slug/contenido" element={<ContenidoTutorial />} />
          <Route path="/tutoriales/:slug/clase/:claseSlug" element={<ClaseTutorial />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/mensajes/:chatId" element={<ChatPage />} />
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/ranking" element={<RankingPage />} />
        </Route>
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/pago-error" element={<PagoError />} />
        <Route path="/pago-exitoso" element={<PagoExitoso />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/sesion-cerrada" element={<CierreSesion />} />


        {/* Admin Routes wrapped in ProteccionAdmin */}
        <Route element={<ProteccionAdmin />}>
          <Route path="/simulador-gaming" element={<SimuladorGaming />} />
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
        </Route>
        <Route path="/notificaciones" element={<Notificaciones />} />
        {/* Catch all - 404 */}
        <Route path="*" element={<Pagina404 />} />
      </Routes>
      {!esModoLectura && !location.pathname.includes('/mensajes') && !esLandingVenta && (
        <>
          {!estaAutenticado && <ChatEnVivo />}
          {!estaAutenticado && <BotonWhatsapp />}
        </>
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
