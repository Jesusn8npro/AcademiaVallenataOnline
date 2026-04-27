import React from 'react';
import type { Pais } from './useModalInicioSesion';

interface Props {
  styles: any;
  nombre: string;
  apellido: string;
  whatsapp: string;
  correoRegistro: string;
  contrasenaRegistro: string;
  mostrarContrasenaRegistro: boolean;
  codigoPais: string;
  paises: Pais[];
  errorLogin: string;
  cargando: boolean;
  setNombre: (v: string) => void;
  setApellido: (v: string) => void;
  setWhatsapp: (v: string) => void;
  setCorreoRegistro: (v: string) => void;
  setContrasenaRegistro: (v: string) => void;
  setMostrarContrasenaRegistro: (v: boolean) => void;
  setCodigoPais: (v: string) => void;
  setVistaRegistro: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  iniciarSesionConGoogle: () => void;
  iniciarSesionConFacebook: () => void;
}

export default function VistaRegistroModal({
  styles, nombre, apellido, whatsapp, correoRegistro, contrasenaRegistro,
  mostrarContrasenaRegistro, codigoPais, paises, errorLogin, cargando,
  setNombre, setApellido, setWhatsapp, setCorreoRegistro, setContrasenaRegistro,
  setMostrarContrasenaRegistro, setCodigoPais, setVistaRegistro,
  onSubmit, iniciarSesionConGoogle, iniciarSesionConFacebook
}: Props) {
  return (
    <>
      <h2 style={styles.tituloModal}>Crear cuenta nueva</h2>
      <p style={styles.loginDesc}>Únete a la comunidad y accede a todos los cursos, eventos y beneficios exclusivos.</p>
      <form style={styles.formularioInicioSesion} onSubmit={onSubmit}>
        <div style={styles.filaNombreApellido}>
          <div style={styles.campoFormulario}>
            <label htmlFor="nombre" style={styles.label}>Nombre</label>
            <div style={styles.inputIcono}>
              <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ejem: Omar" required style={styles.input} />
              <span style={styles.iconoInput}>👤</span>
            </div>
          </div>
          <div style={styles.campoFormulario}>
            <label htmlFor="apellido" style={styles.label}>Apellido</label>
            <div style={styles.inputIcono}>
              <input id="apellido" type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ejem: Geles" required style={styles.input} />
              <span style={styles.iconoInput}>👤</span>
            </div>
          </div>
        </div>
        <div style={styles.campoFormulario}>
          <label htmlFor="whatsapp" style={styles.label}>WhatsApp</label>
          <div style={styles.inputWhatsapp}>
            <div style={styles.selectorPaisContainer}>
              <select style={styles.selectorPais} value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)}>
                {paises.map((pais) => (
                  <option key={pais.codigo} value={pais.codigo}>{pais.bandera} {pais.codigo}</option>
                ))}
              </select>
              <span style={styles.flechaSelector}>▼</span>
            </div>
            <div style={styles.inputNumero}>
              <input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Número sin código de país" required style={{ ...styles.input, padding: '12px 8px' }} />
              <span style={styles.iconoInput}>📱</span>
            </div>
          </div>
        </div>
        <div style={styles.campoFormulario}>
          <label htmlFor="correoRegistro" style={styles.label}>Correo electrónico</label>
          <div style={styles.inputIcono}>
            <input id="correoRegistro" type="email" value={correoRegistro} onChange={(e) => setCorreoRegistro(e.target.value)} placeholder="ejemplo@correo.com" required style={styles.input} />
            <span style={styles.iconoInput}>📧</span>
          </div>
        </div>
        <div style={styles.campoFormulario}>
          <label htmlFor="contrasenaRegistro" style={styles.label}>Contraseña</label>
          <div style={styles.inputIcono}>
            <input id="contrasenaRegistro" type={mostrarContrasenaRegistro ? 'text' : 'password'} value={contrasenaRegistro} onChange={(e) => setContrasenaRegistro(e.target.value)} placeholder="Crea una contraseña segura" required style={styles.input} />
            <button type="button" style={styles.botonMostrarContrasena} onClick={() => setMostrarContrasenaRegistro(!mostrarContrasenaRegistro)} aria-label={mostrarContrasenaRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {mostrarContrasenaRegistro ? '👁️' : '🙈'}
            </button>
          </div>
        </div>
        {errorLogin && <div style={styles.mensajeError}>{errorLogin}</div>}
        <button type="submit" style={styles.botonEnviar} disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
      <div style={styles.separadorO}>
        <div style={styles.linea}></div>
        <span style={styles.textoO}>o únete con</span>
        <div style={styles.linea}></div>
      </div>
      <div style={styles.botonesSociales}>
        <button type="button" style={styles.botonGoogle} onClick={iniciarSesionConGoogle} disabled={cargando}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Google</span>
        </button>
        <button type="button" style={styles.botonFacebook} onClick={iniciarSesionConFacebook} disabled={cargando}>
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </button>
      </div>
      <div style={styles.enlacesExtra}>
        <button type="button" style={styles.enlaceOlvido} onClick={() => setVistaRegistro(false)}>
          ¿Ya tienes cuenta? <b>Inicia sesión</b>
        </button>
      </div>
    </>
  );
}
