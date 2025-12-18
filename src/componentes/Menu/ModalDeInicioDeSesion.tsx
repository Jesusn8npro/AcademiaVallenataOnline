import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../servicios/supabaseCliente';
import { useUsuario } from '../../contextos/UsuarioContext';

interface ModalDeInicioDeSesionProps {
  abierto: boolean;
  onCerrar: () => void;
}

interface Pais {
  codigo: string;
  nombre: string;
  bandera: string;
}

const ModalDeInicioDeSesion: React.FC<ModalDeInicioDeSesionProps> = ({ abierto, onCerrar }) => {
  const navigate = useNavigate();
  const { cargarUsuario } = useUsuario();

  // Estados principales
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [vistaRegistro, setVistaRegistro] = useState(false);
  const [vistaRecuperar, setVistaRecuperar] = useState(false);

  // Campos de registro
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');

  // Estados de UI
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [correoRecuperar, setCorreoRecuperar] = useState('');
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarContrasenaRegistro, setMostrarContrasenaRegistro] = useState(false);
  const [codigoPais, setCodigoPais] = useState('+57');

  // Lista de países
  const paises: Pais[] = [
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

  // Manejar escape key
  useEffect(() => {
    const manejarKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && abierto) {
        cerrarModal();
      }
    };

    if (abierto) {
      document.addEventListener('keydown', manejarKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', manejarKeyDown);
        document.body.style.overflow = 'unset';
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
    // Limpiar campos de registro
    setNombre('');
    setApellido('');
    setWhatsapp('');
    setCorreoRegistro('');
    setContrasenaRegistro('');

    // Restaurar scroll del body
    document.body.style.overflow = 'unset';
  };

  const detenerPropagacion = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin('');
    setCargando(true);

    try {
      console.log('🚀 [LOGIN] Iniciando autenticación para:', usuario);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena
      });

      if (error) {
        console.error('❌ [LOGIN] Error de autenticación:', error);
        setErrorLogin(error.message);
        setCargando(false);
        return;
      }

      if (!data.user) {
        console.error('❌ [LOGIN] No se obtuvo usuario');
        setErrorLogin('Error en la autenticación');
        setCargando(false);
        return;
      }

      console.log('✅ [LOGIN] Usuario autenticado:', data.user.email);

      // Obtener perfil básico
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, rol, correo_electronico')
        .eq('id', data.user.id)
        .single();

      if (perfilError) {
        console.warn('⚠️ [LOGIN] Error obteniendo perfil, continuando con datos básicos:', perfilError);
      }

      console.log('✅ [LOGIN] Login exitoso, cargando usuario en contexto...');

      // Cargar usuario en el contexto INMEDIATAMENTE
      await cargarUsuario();

      // Cerrar modal
      cerrarModal();
      setCargando(false);

      // Navegar según rol usando React Router
      if (perfilData?.rol && perfilData.rol.toLowerCase() === 'admin') {
        console.log('🚀 [LOGIN] Navegando a panel admin');
        navigate('/administrador');
      } else {
        console.log('🚀 [LOGIN] Navegando a mis cursos');
        navigate('/mis-cursos');
      }

    } catch (error) {
      console.error('❌ [LOGIN] Error general:', error);
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
        options: {
          data: {
            nombre,
            apellido,
            whatsapp: `${codigoPais}${whatsapp}`
          }
        }
      });

      if (error) {
        setErrorLogin(error.message);
        setCargando(false);
        return;
      }

      if (data.user) {
        console.log('✅ [REGISTRO] Usuario registrado:', data.user.email);
        cerrarModal();
        window.location.href = '/mis-cursos';
      }

    } catch (error) {
      console.error('❌ [REGISTRO] Error:', error);
      setErrorLogin('Error inesperado durante el registro');
      setCargando(false);
    }
  };

  const enviarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeRecuperar('');
    setCargando(true);

    try {
      console.log('🔄 [RECUPERACIÓN] Iniciando proceso para:', correoRecuperar);

      const isProduction = window.location.hostname === 'academiavallenataonline.com';
      const redirectURL = isProduction
        ? 'https://academiavallenataonline.com/recuperar-contrasena'
        : window.location.origin + '/recuperar-contrasena';

      const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperar, {
        redirectTo: redirectURL
      });

      if (error) {
        console.error('❌ [RECUPERACIÓN] Error:', error);
        setMensajeRecuperar('Error al enviar el email de recuperación');
      } else {
        console.log('✅ [RECUPERACIÓN] Email enviado exitosamente');
        setMensajeRecuperar('📨 ¡Email enviado! Revisa tu bandeja de entrada, spam y promociones.');
      }

    } catch (error) {
      console.error('❌ [RECUPERACIÓN] Error inesperado:', error);
      setMensajeRecuperar('Error inesperado. Verifica tu conexión a internet.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesionConGoogle = async () => {
    try {
      setCargando(true);
      setErrorLogin('');

      console.log('🔐 [GOOGLE] Iniciando autenticación con Google...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/mis-cursos`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ [GOOGLE] Error en autenticación:', error);
        setErrorLogin('Error al conectar con Google. Inténtalo de nuevo.');
        setCargando(false);
        return;
      }

      console.log('✅ [GOOGLE] Redirigiendo a Google Auth...');

    } catch (error) {
      console.error('❌ [GOOGLE] Error inesperado:', error);
      setErrorLogin('Error inesperado. Inténtalo de nuevo.');
      setCargando(false);
    }
  };

  if (!abierto) return null;

  // Detectar móvil para estilos responsivos
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Agregar clase al body cuando el modal está abierto para ocultar widgets
  useEffect(() => {
    if (abierto) {
      document.body.classList.add('modal-login-abierto');
    } else {
      document.body.classList.remove('modal-login-abierto');
    }
    return () => {
      document.body.classList.remove('modal-login-abierto');
    };
  }, [abierto]);

  const styles = {
    fondoModal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      // En móvil usamos flex-start con padding superior para que el teclado no empuje el modal fuera de vista (hacia arriba)
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: 1,
      animation: 'fadeIn 0.3s ease-out forwards',
      padding: isMobile ? '16px' : '16px',
      paddingTop: isMobile ? '40px' : '16px', // Margen superior seguro en móvil
      overflowY: 'auto' as const, // Permitir scroll si es necesario
    },
    modalInicioSesion: {
      width: '100%',
      maxWidth: '420px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: isMobile ? '20px' : '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: 0,
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      transform: 'translateY(0)',
      animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginBottom: isMobile ? '40px' : 'auto', // Espacio abajo para scroll
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '12px 16px' : '16px 24px 12px', // Menos padding en móvil
      borderBottom: '1px solid rgba(226, 232, 240, 0.3)',
      background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.03) 0%, rgba(255, 102, 0, 0.08) 100%)',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    logoModal: {
      width: isMobile ? '40px' : '56px', // Logo más pequeño en móvil
      height: isMobile ? '40px' : '56px',
      borderRadius: '50%',
      boxShadow: '0 4px 12px rgba(255, 102, 0, 0.2)',
      transition: 'transform 0.3s ease',
      objectFit: 'contain' as const, // Asegurar que no se deforme
    },
    botonCerrar: {
      width: isMobile ? '36px' : '40px',
      height: isMobile ? '36px' : '40px',
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(255, 102, 0, 0.1)',
      color: '#ff6600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloModal: {
      fontSize: isMobile ? '1.5rem' : '1.875rem', // Título más pequeño
      fontWeight: 800,
      background: 'linear-gradient(135deg, #ff6600 0%, #ff8c42 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: isMobile ? '12px 16px 4px' : '16px 24px 6px',
      textAlign: 'center' as const,
      lineHeight: 1.2,
    },
    loginDesc: {
      color: '#64748b',
      fontSize: isMobile ? '0.9rem' : '1rem',
      margin: isMobile ? '0 16px 16px' : '0 24px 20px',
      textAlign: 'center' as const,
      lineHeight: 1.4,
    },
    formularioInicioSesion: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '12px' : '16px',
      padding: isMobile ? '0 16px 16px' : '0 24px 20px',
    },
    campoFormulario: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      margin: 0,
      padding: 0,
    },
    label: {
      fontSize: '0.875rem',
      color: '#1e293b',
      fontWeight: 600,
      margin: 0,
      padding: 0,
    },
    inputIcono: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      background: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: 0,
      transition: 'all 0.3s ease',
      overflow: 'hidden',
    },
    input: {
      flex: 1,
      border: 'none',
      background: 'transparent',
      padding: isMobile ? '10px 14px' : '12px 16px', // Inputs más compactos
      fontSize: '1rem',
      color: '#1e293b',
      outline: 'none',
      minHeight: isMobile ? '42px' : '48px',
    },
    iconoInput: {
      padding: isMobile ? '0 12px' : '0 16px',
      fontSize: '1.25rem',
      color: '#ff6600',
    },
    botonMostrarContrasena: {
      background: 'none',
      border: 'none',
      padding: '12px',
      cursor: 'pointer',
      fontSize: '1.25rem',
      color: '#64748b',
      transition: 'color 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonEnviar: {
      background: 'linear-gradient(135deg, #ff6600 0%, #ff8c42 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: isMobile ? '14px 20px' : '16px 24px',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '4px',
      boxShadow: '0 4px 12px rgba(255, 102, 0, 0.3)',
      position: 'relative' as const,
      overflow: 'hidden',
      minHeight: isMobile ? '48px' : '52px',
    },
    mensajeError: {
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid rgba(220, 38, 38, 0.2)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '0.875rem',
      textAlign: 'center' as const,
      margin: '-8px 0 8px',
    },
    mensajeRecuperar: {
      border: '1px solid rgba(99, 102, 241, 0.2)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '0.875rem',
      margin: '-8px 0 8px',
      lineHeight: 1.4,
      background: '#f0fdf4',
      color: '#16a34a',
      textAlign: 'center' as const,
    },
    separadorO: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      margin: isMobile ? '12px 16px 12px' : '16px 24px 12px',
    },
    linea: {
      flex: 1,
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%)',
    },
    textoO: {
      fontSize: '0.875rem',
      color: '#64748b',
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
    },
    botonesSociales: {
      padding: isMobile ? '0 16px 8px' : '0 24px 8px',
    },
    botonGoogle: {
      width: '100%',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: isMobile ? '12px 16px' : '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1e293b',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    enlacesExtra: {
      padding: isMobile ? '0 16px 16px' : '0 24px 16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      alignItems: 'center',
      borderTop: '1px solid rgba(226, 232, 240, 0.3)',
      marginTop: '4px',
      paddingTop: '12px',
    },
    enlaceOlvido: {
      background: 'none',
      border: 'none',
      color: '#1a73e8',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      padding: '8px 16px',
      borderRadius: '8px',
      fontFamily: 'inherit',
      textDecoration: 'none',
    },
    filaNombreApellido: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: isMobile ? '12px' : '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    inputWhatsapp: {
      display: 'flex',
      background: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      width: '100%',
      gap: 0,
    },
    selectorPaisContainer: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      minWidth: isMobile ? '80px' : '90px',
    },
    selectorPais: {
      background: 'rgba(255, 102, 0, 0.05)',
      border: 'none',
      padding: '6px 4px',
      paddingRight: '20px',
      fontSize: '0.875rem',
      color: '#1e293b',
      cursor: 'pointer',
      outline: 'none',
      width: '100%',
      borderRight: '1px solid #e2e8f0',
      appearance: 'none' as const,
    },
    flechaSelector: {
      position: 'absolute' as const,
      right: '4px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      fontSize: '10px',
      pointerEvents: 'none' as const,
      zIndex: 1,
    },
    inputNumero: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
    },
  };

  return (
    <>
      <div style={styles.fondoModal} onClick={cerrarModal}>
        <div style={styles.modalInicioSesion} onClick={detenerPropagacion}>
          <div style={styles.modalHeader}>
            <div style={styles.logoContainer}>
              <img
                src="/imagenes/logo academia vallenata.png"
                alt="Logo Academia Vallenata"
                style={styles.logoModal}
              />
            </div>
            <button style={styles.botonCerrar} aria-label="Cerrar" onClick={cerrarModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {vistaRecuperar ? (
            <>
              <h2 style={styles.tituloModal}>Recuperar contraseña</h2>
              <p style={styles.loginDesc}>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
              <form style={styles.formularioInicioSesion} onSubmit={enviarRecuperacion}>
                <div style={styles.campoFormulario}>
                  <label htmlFor="recuperarCorreo" style={styles.label}>Correo electrónico</label>
                  <div style={styles.inputIcono}>
                    <input
                      id="recuperarCorreo"
                      type="email"
                      value={correoRecuperar}
                      onChange={(e) => setCorreoRecuperar(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      required
                      style={styles.input}
                    />
                    <span style={styles.iconoInput}>📧</span>
                  </div>
                </div>
                {mensajeRecuperar && (
                  <div style={styles.mensajeRecuperar}>
                    {mensajeRecuperar}
                  </div>
                )}
                <button type="submit" style={styles.botonEnviar} disabled={cargando}>
                  {cargando ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              <div style={styles.enlacesExtra}>
                <button
                  type="button"
                  style={styles.enlaceOlvido}
                  onClick={() => {
                    setVistaRecuperar(false);
                    setMensajeRecuperar('');
                    setCorreoRecuperar('');
                  }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </>
          ) : !vistaRegistro ? (
            <>
              <h2 style={styles.tituloModal}>¡Bienvenido de nuevo!</h2>
              <p style={styles.loginDesc}>Accede a tu cuenta para disfrutar de todos los beneficios de la Academia Vallenata Online.</p>
              <form style={styles.formularioInicioSesion} onSubmit={manejarLogin}>
                <div style={styles.campoFormulario}>
                  <label htmlFor="usuario" style={styles.label}>Correo electrónico o usuario</label>
                  <div style={styles.inputIcono}>
                    <input
                      id="usuario"
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="ejemplo@correo.com o usuario"
                      required
                      style={styles.input}
                    />
                    <span style={styles.iconoInput}>📧</span>
                  </div>
                </div>
                <div style={styles.campoFormulario}>
                  <label htmlFor="contrasena" style={styles.label}>Contraseña</label>
                  <div style={styles.inputIcono}>
                    <input
                      id="contrasena"
                      type={mostrarContrasena ? 'text' : 'password'}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="Tu contraseña"
                      required
                      style={styles.input}
                    />
                    <button
                      type="button"
                      style={styles.botonMostrarContrasena}
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarContrasena ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
                {errorLogin && (
                  <div style={styles.mensajeError}>{errorLogin}</div>
                )}
                <button type="submit" style={styles.botonEnviar} disabled={cargando}>
                  {cargando ? 'Ingresando...' : 'Entrar'}
                </button>
              </form>

              <div style={styles.separadorO}>
                <div style={styles.linea}></div>
                <span style={styles.textoO}>o continúa con</span>
                <div style={styles.linea}></div>
              </div>

              <div style={styles.botonesSociales}>
                <button type="button" style={styles.botonGoogle} onClick={iniciarSesionConGoogle} disabled={cargando}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>{cargando ? 'Conectando...' : 'Continuar con Google'}</span>
                </button>
              </div>

              <div style={styles.enlacesExtra}>
                <button type="button" style={styles.enlaceOlvido} onClick={() => setVistaRecuperar(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
                <button type="button" style={styles.enlaceOlvido} onClick={() => setVistaRegistro(true)}>
                  ¿No tienes cuenta? <b>Regístrate</b>
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={styles.tituloModal}>Crear cuenta nueva</h2>
              <p style={styles.loginDesc}>Únete a la comunidad y accede a todos los cursos, eventos y beneficios exclusivos.</p>
              <form style={styles.formularioInicioSesion} onSubmit={manejarRegistro}>
                <div style={styles.filaNombreApellido}>
                  <div style={styles.campoFormulario}>
                    <label htmlFor="nombre" style={styles.label}>Nombre</label>
                    <div style={styles.inputIcono}>
                      <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ejem: Omar"
                        required
                        style={styles.input}
                      />
                      <span style={styles.iconoInput}>👤</span>
                    </div>
                  </div>
                  <div style={styles.campoFormulario}>
                    <label htmlFor="apellido" style={styles.label}>Apellido</label>
                    <div style={styles.inputIcono}>
                      <input
                        id="apellido"
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="Ejem: Geles"
                        required
                        style={styles.input}
                      />
                      <span style={styles.iconoInput}>👤</span>
                    </div>
                  </div>
                </div>
                <div style={styles.campoFormulario}>
                  <label htmlFor="whatsapp" style={styles.label}>WhatsApp</label>
                  <div style={styles.inputWhatsapp}>
                    <div style={styles.selectorPaisContainer}>
                      <select
                        style={styles.selectorPais}
                        value={codigoPais}
                        onChange={(e) => setCodigoPais(e.target.value)}
                      >
                        {paises.map((pais) => (
                          <option key={pais.codigo} value={pais.codigo}>
                            {pais.bandera} {pais.codigo}
                          </option>
                        ))}
                      </select>
                      <span style={styles.flechaSelector}>▼</span>
                    </div>
                    <div style={styles.inputNumero}>
                      <input
                        id="whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Número sin código de país"
                        required
                        style={{ ...styles.input, padding: '12px 8px' }}
                      />
                      <span style={styles.iconoInput}>📱</span>
                    </div>
                  </div>
                </div>
                <div style={styles.campoFormulario}>
                  <label htmlFor="correoRegistro" style={styles.label}>Correo electrónico</label>
                  <div style={styles.inputIcono}>
                    <input
                      id="correoRegistro"
                      type="email"
                      value={correoRegistro}
                      onChange={(e) => setCorreoRegistro(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      required
                      style={styles.input}
                    />
                    <span style={styles.iconoInput}>📧</span>
                  </div>
                </div>
                <div style={styles.campoFormulario}>
                  <label htmlFor="contrasenaRegistro" style={styles.label}>Contraseña</label>
                  <div style={styles.inputIcono}>
                    <input
                      id="contrasenaRegistro"
                      type={mostrarContrasenaRegistro ? 'text' : 'password'}
                      value={contrasenaRegistro}
                      onChange={(e) => setContrasenaRegistro(e.target.value)}
                      placeholder="Crea una contraseña segura"
                      required
                      style={styles.input}
                    />
                    <button
                      type="button"
                      style={styles.botonMostrarContrasena}
                      onClick={() => setMostrarContrasenaRegistro(!mostrarContrasenaRegistro)}
                      aria-label={mostrarContrasenaRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarContrasenaRegistro ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>
                {errorLogin && (
                  <div style={styles.mensajeError}>{errorLogin}</div>
                )}
                <button type="submit" style={styles.botonEnviar} disabled={cargando}>
                  {cargando ? 'Registrando...' : 'Registrarme'}
                </button>
              </form>
              <div style={styles.enlacesExtra}>
                <button type="button" style={styles.enlaceOlvido} onClick={() => setVistaRegistro(false)}>
                  ¿Ya tienes cuenta? <b>Inicia sesión</b>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modal-inicio-sesion {
            max-width: 95vw !important;
            margin: 8px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ModalDeInicioDeSesion; 
