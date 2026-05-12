import React from 'react';
import { useModalInicioSesion, paises } from './useModalInicioSesion';
import { getModalInicioSesionStyles } from './getModalInicioSesionStyles';
import VistaLoginModal from './VistaLoginModal';
import VistaRegistroModal from './VistaRegistroModal';
import VistaRecuperarModal from './VistaRecuperarModal';

interface ModalDeInicioDeSesionProps {
  abierto: boolean;
  onCerrar: () => void;
}

const ModalDeInicioDeSesion: React.FC<ModalDeInicioDeSesionProps> = ({ abierto, onCerrar }) => {
  const {
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
  } = useModalInicioSesion({ abierto, onCerrar });

  const styles = getModalInicioSesionStyles(isMobile);

  return (
    <>
      <div style={styles.fondoModal} onClick={cerrarModal}>
        <div style={styles.modalInicioSesion} onClick={detenerPropagacion}>
          <div style={styles.modalHeader}>
            <div style={styles.logoContainer}>
              <img src="/logo academia vallenata.webp" alt="Logo Academia Vallenata" style={styles.logoModal} width="300" height="194" loading="lazy" decoding="async" />
            </div>
            <button style={styles.botonCerrar} aria-label="Cerrar" onClick={cerrarModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {vistaRecuperar ? (
            <VistaRecuperarModal
              styles={styles}
              correoRecuperar={correoRecuperar}
              mensajeRecuperar={mensajeRecuperar}
              cargando={cargando}
              setCorreoRecuperar={setCorreoRecuperar}
              onVolver={() => { setVistaRecuperar(false); setCorreoRecuperar(''); }}
              onSubmit={enviarRecuperacion}
            />
          ) : !vistaRegistro ? (
            <VistaLoginModal
              styles={styles}
              usuario={usuario}
              contrasena={contrasena}
              mostrarContrasena={mostrarContrasena}
              errorLogin={errorLogin}
              cargando={cargando}
              setUsuario={setUsuario}
              setContrasena={setContrasena}
              setMostrarContrasena={setMostrarContrasena}
              setVistaRecuperar={setVistaRecuperar}
              setVistaRegistro={setVistaRegistro}
              onSubmit={manejarLogin}
              iniciarSesionConGoogle={iniciarSesionConGoogle}
              iniciarSesionConFacebook={iniciarSesionConFacebook}
            />
          ) : (
            <VistaRegistroModal
              styles={styles}
              nombre={nombre}
              apellido={apellido}
              whatsapp={whatsapp}
              correoRegistro={correoRegistro}
              contrasenaRegistro={contrasenaRegistro}
              mostrarContrasenaRegistro={mostrarContrasenaRegistro}
              codigoPais={codigoPais}
              paises={paises}
              errorLogin={errorLogin}
              cargando={cargando}
              setNombre={setNombre}
              setApellido={setApellido}
              setWhatsapp={setWhatsapp}
              setCorreoRegistro={setCorreoRegistro}
              setContrasenaRegistro={setContrasenaRegistro}
              setMostrarContrasenaRegistro={setMostrarContrasenaRegistro}
              setCodigoPais={setCodigoPais}
              setVistaRegistro={setVistaRegistro}
              onSubmit={manejarRegistro}
              iniciarSesionConGoogle={iniciarSesionConGoogle}
              iniciarSesionConFacebook={iniciarSesionConFacebook}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
