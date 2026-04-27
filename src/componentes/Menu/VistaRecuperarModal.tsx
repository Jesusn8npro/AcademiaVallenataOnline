import React from 'react';

interface Props {
  styles: any;
  correoRecuperar: string;
  mensajeRecuperar: string;
  cargando: boolean;
  setCorreoRecuperar: (v: string) => void;
  onVolver: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function VistaRecuperarModal({
  styles, correoRecuperar, mensajeRecuperar, cargando,
  setCorreoRecuperar, onVolver, onSubmit
}: Props) {
  return (
    <>
      <h2 style={styles.tituloModal}>Recuperar contraseña</h2>
      <p style={styles.loginDesc}>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
      <form style={styles.formularioInicioSesion} onSubmit={onSubmit}>
        <div style={styles.campoFormulario}>
          <label htmlFor="recuperarCorreo" style={styles.label}>Correo electrónico</label>
          <div style={styles.inputIcono}>
            <input id="recuperarCorreo" type="email" value={correoRecuperar} onChange={(e) => setCorreoRecuperar(e.target.value)} placeholder="ejemplo@correo.com" required style={styles.input} />
            <span style={styles.iconoInput}>📧</span>
          </div>
        </div>
        {mensajeRecuperar && <div style={styles.mensajeRecuperar}>{mensajeRecuperar}</div>}
        <button type="submit" style={styles.botonEnviar} disabled={cargando}>
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
      <div style={styles.enlacesExtra}>
        <button type="button" style={styles.enlaceOlvido} onClick={onVolver}>
          Volver al inicio de sesión
        </button>
      </div>
    </>
  );
}
