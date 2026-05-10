import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';

export interface Pais {
  codigo: string;
  nombre: string;
  bandera: string;
}

export const paises: Pais[] = [
  { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+52', nombre: 'México', bandera: '🇲🇽' },
  { codigo: '+1', nombre: 'Estados Unidos', bandera: '🇺🇸' },
  { codigo: '+34', nombre: 'España', bandera: '🇪🇸' },
  { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+56', nombre: 'Chile', bandera: '🇨🇱' },
  { codigo: '+51', nombre: 'Perú', bandera: '🇵🇪' },
  { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+593', nombre: 'Ecuador', bandera: '🇪🇨' },
  { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦' }
];

interface UseModalInicioSesionProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function useModalInicioSesion({ abierto, onCerrar }: UseModalInicioSesionProps) {
  const navigate = useNavigate();
  const { cargarUsuario } = useUsuario();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [vistaRegistro, setVistaRegistro] = useState(false);
  const [vistaRecuperar, setVistaRecuperar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [correoRecuperar, setCorreoRecuperar] = useState('');
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarContrasenaRegistro, setMostrarContrasenaRegistro] = useState(false);
  const [codigoPais, setCodigoPais] = useState('+57');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (abierto) {
      document.body.classList.add('modal-login-abierto');
    } else {
      document.body.classList.remove('modal-login-abierto');
    }
    return () => { document.body.classList.remove('modal-login-abierto'); };
  }, [abierto]);

  useEffect(() => {
    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) cerrarModal();
    };
    if (abierto) {
      document.addEventListener('keydown', manejarKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', manejarKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [abierto]);

  const cerrarModal = () => {
    onCerrar();
    setVistaRegistro(false);
    setVistaRecuperar(false);
    setUsuario('');
    setContrasena('');
    setErrorLogin('');
    setCargando(false);
    setCorreoRecuperar('');
    setMensajeRecuperar('');
    setMostrarContrasena(false);
    setMostrarContrasenaRegistro(false);
    setCodigoPais('+57');
    setNombre('');
    setApellido('');
    setWhatsapp('');
    setCorreoRegistro('');
    setContrasenaRegistro('');
    document.body.style.overflow = '';
  };

  const detenerPropagacion = (e: React.MouseEvent) => { e.stopPropagation(); };

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: usuario, password: contrasena });

      if (error) {
        setErrorLogin(error.message);
        setCargando(false);
        return;
      }

      if (!data.user) {
        setErrorLogin('Error en la autenticación');
        setCargando(false);
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .rpc('obtener_mi_perfil_completo');

      if (perfilError) {
        // continue with basic auth data
      }

      await cargarUsuario();
      cerrarModal();
      setCargando(false);

      const esAdmin = perfilData && typeof perfilData === 'object' && 'rol' in perfilData && (perfilData as any).rol?.toLowerCase() === 'admin';
      navigate(esAdmin ? '/administrador' : '/mis-cursos');

    } catch {
      setErrorLogin('Error inesperado durante el login');
      setCargando(false);
    }
  };

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: correoRegistro,
        password: contrasenaRegistro,
        options: { data: { nombre, apellido, whatsapp: `${codigoPais}${whatsapp}` } }
      });

      if (error) {
        setErrorLogin(error.message);
        setCargando(false);
        return;
      }

      if (data.user) {
        cerrarModal();
        window.location.href = '/mis-cursos';
      }
    } catch {
      setErrorLogin('Error inesperado durante el registro');
      setCargando(false);
    }
  };

  const enviarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeRecuperar('');
    setCargando(true);

    try {
      const isProduction = window.location.hostname === 'academiavallenataonline.com';
      const redirectURL = isProduction
        ? 'https://academiavallenataonline.com/recuperar-contrasena'
        : window.location.origin + '/recuperar-contrasena';

      const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperar, { redirectTo: redirectURL });

      if (error) {
        setMensajeRecuperar('Error al enviar el email de recuperación');
      } else {
        setMensajeRecuperar('📨 ¡Email enviado! Revisa tu bandeja de entrada, spam y promociones.');
      }
    } catch {
      setMensajeRecuperar('Error inesperado. Verifica tu conexión a internet.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesionConGoogle = async () => {
    try {
      setCargando(true);
      setErrorLogin('');

      const isProduction = window.location.hostname === 'academiavallenataonline.com';
      const redirectURL = isProduction ? 'https://academiavallenataonline.com' : `${window.location.origin}/mis-cursos`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectURL }
      });

      if (error) {
        setErrorLogin('Error al conectar con Google. Inténtalo de nuevo.');
        setCargando(false);
      }
    } catch {
      setErrorLogin('Error inesperado. Inténtalo de nuevo.');
      setCargando(false);
    }
  };

  const iniciarSesionConFacebook = async () => {
    try {
      setCargando(true);
      setErrorLogin('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: 'https://academiavallenataonline.com' }
      });

      if (error) {
        setErrorLogin('Error al conectar con Facebook. Inténtalo de nuevo.');
        setCargando(false);
      }
    } catch {
      setErrorLogin('Error inesperado. Inténtalo de nuevo.');
      setCargando(false);
    }
  };

  return {
    usuario, setUsuario,
    contrasena, setContrasena,
    vistaRegistro, setVistaRegistro,
    vistaRecuperar, setVistaRecuperar,
    nombre, setNombre,
    apellido, setApellido,
    whatsapp, setWhatsapp,
    correoRegistro, setCorreoRegistro,
    contrasenaRegistro, setContrasenaRegistro,
    cargando,
    errorLogin,
    correoRecuperar, setCorreoRecuperar,
    mensajeRecuperar,
    mostrarContrasena, setMostrarContrasena,
    mostrarContrasenaRegistro, setMostrarContrasenaRegistro,
    codigoPais, setCodigoPais,
    isMobile,
    cerrarModal, detenerPropagacion,
    manejarLogin, manejarRegistro, enviarRecuperacion,
    iniciarSesionConGoogle, iniciarSesionConFacebook
  };
}
