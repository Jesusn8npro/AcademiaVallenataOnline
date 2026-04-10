import React, { useState } from 'react';
import { crearUsuario as crearUsuarioService } from '../../../../servicios/usuariosAdminService';
import './CrearUsuario.css';

// Definir la interfaz Usuario directamente aquí como en Svelte
interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: string;
  suscripcion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultima_actividad?: string;
  url_foto_perfil?: string;
  eliminado: boolean;
  whatsapp?: string;
  ciudad?: string;
  pais?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
  documento_tipo?: string;
  instrumento?: string;
  // Campos de geolocalización
  latitud?: string;
  longitud?: string;
  zona_horaria?: string;
  ip_registro?: string;
}

interface Props {
  onCerrar: () => void;
  onUsuarioCreado: (usuario: Usuario) => void;
}

// Componente principal
const CrearUsuario: React.FC<Props> = ({ onCerrar, onUsuarioCreado }) => {
  // Estados principales
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  // Datos del formulario
  const [datos, setDatos] = useState({
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    correo_electronico: '',
    password: '',
    rol: 'estudiante',
    suscripcion: 'free',
    ciudad: '',
    pais: '',
    whatsapp: '',
    nivel_habilidad: '',
    documento_tipo: 'CC',
    documento_numero: '',
    profesion: '',
    instrumento: 'acordeon'
  });

  // Función para limpiar entrada de emojis y caracteres especiales
  const limpiarTexto = (texto: string): string => {
    return texto
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  };

  // Función para limpiar solo al enviar el formulario (con trim)
  const limpiarTextoFinal = (texto: string): string => {
    return texto
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .trim();
  };

  // Función para validar email
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Crear usuario
  const crearUsuarioLocal = async () => {
    // Limpiar todos los campos de texto al enviar el formulario
    const datosLimpios = {
      ...datos,
      nombre: limpiarTextoFinal(datos.nombre),
      apellido: limpiarTextoFinal(datos.apellido),
      nombre_usuario: limpiarTextoFinal(datos.nombre_usuario),
      correo_electronico: datos.correo_electronico.trim().toLowerCase(),
      ciudad: limpiarTextoFinal(datos.ciudad),
      pais: limpiarTextoFinal(datos.pais),
      profesion: limpiarTextoFinal(datos.profesion)
    };

    // Validaciones
    if (!datosLimpios.nombre || !datosLimpios.apellido || !datosLimpios.correo_electronico || !datosLimpios.password) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!validarEmail(datosLimpios.correo_electronico)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (datosLimpios.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar formato del nombre de usuario (solo si se proporciona)
    if (datosLimpios.nombre_usuario && datosLimpios.nombre_usuario.trim() !== '') {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(datosLimpios.nombre_usuario)) {
        setError('El nombre de usuario solo puede contener letras, números y guiones bajos (_)');
        return;
      }

      if (datosLimpios.nombre_usuario.length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
      }
    }

    try {
      setCargando(true);
      setError('');

      // Crear usuario usando Supabase
      const resultado = await crearUsuarioService(datosLimpios);

      if (resultado.success) {
        setExito(true);
        limpiarFormulario();

        setTimeout(() => {
          onUsuarioCreado(resultado.data as any);
        }, 2000);
      } else {
        setError(resultado.error || 'Error al crear el usuario');
      }

    } catch (err: any) {
      console.error('Error completo:', err);
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setDatos({
      nombre: '',
      apellido: '',
      nombre_usuario: '',
      correo_electronico: '',
      password: '',
      rol: 'estudiante',
      suscripcion: 'free',
      ciudad: '',
      pais: '',
      whatsapp: '',
      nivel_habilidad: '',
      documento_tipo: 'CC',
      documento_numero: '',
      profesion: '',
      instrumento: 'acordeon'
    });
    setError('');
    setExito(false);
  };

  // Manejadores de entrada para limpiar automáticamente
  const manejarEntradaTexto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const campo = target.name;
    if (campo && ['nombre', 'apellido', 'nombre_usuario', 'ciudad', 'pais', 'profesion'].includes(campo)) {
      target.value = limpiarTexto(target.value);
    }
  };

  // Manejar cambio de datos
  const manejarCambioDatos = (campo: string, valor: string) => {
    setDatos(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <div className="crear-usuario">
      <div className="crear-usuario-header">
        <h2>Crear Nuevo Usuario</h2>
        <button className="crear-usuario-btn-cerrar" onClick={onCerrar}>×</button>
      </div>

      {error && (
        <div className="crear-usuario-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
          </svg>
          {error}
        </div>
      )}

      {exito && (
        <div className="crear-usuario-exito">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} />
          </svg>
          <p>Â¡Usuario creado exitosamente!</p>
          <small>Redirigiendo...</small>
        </div>
      )}

      {!exito && (
        <form onSubmit={(e) => { e.preventDefault(); crearUsuarioLocal(); }} className="crear-usuario-formulario">
          <div className="crear-usuario-seccion">
            <h3>Información Básica</h3>
            <div className="crear-usuario-campos-grupo">
              <div className="crear-usuario-campo crear-usuario-campo-obligatorio">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={datos.nombre}
                  onChange={(e) => manejarCambioDatos('nombre', e.target.value)}
                  onInput={manejarEntradaTexto}
                  required
                  placeholder="Nombre del usuario"
                  maxLength={100}
                />
              </div>

              <div className="crear-usuario-campo crear-usuario-campo-obligatorio">
                <label htmlFor="apellido">Apellido *</label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  value={datos.apellido}
                  onChange={(e) => manejarCambioDatos('apellido', e.target.value)}
                  onInput={manejarEntradaTexto}
                  required
                  placeholder="Apellido del usuario"
                  maxLength={100}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="nombre_usuario">Nombre de Usuario (opcional)</label>
                <input
                  id="nombre_usuario"
                  name="nombre_usuario"
                  type="text"
                  value={datos.nombre_usuario}
                  onChange={(e) => manejarCambioDatos('nombre_usuario', e.target.value)}
                  onInput={manejarEntradaTexto}
                  placeholder="Se generará automáticamente si no se especifica"
                  maxLength={50}
                />
              </div>

              <div className="crear-usuario-campo crear-usuario-campo-obligatorio">
                <label htmlFor="correo">Correo Electrónico *</label>
                <input
                  id="correo"
                  type="email"
                  value={datos.correo_electronico}
                  onChange={(e) => manejarCambioDatos('correo_electronico', e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  maxLength={255}
                />
              </div>

              <div className="crear-usuario-campo crear-usuario-campo-obligatorio">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  value={datos.password}
                  onChange={(e) => manejarCambioDatos('password', e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          <div className="crear-usuario-seccion">
            <h3>Rol y Permisos</h3>
            <div className="crear-usuario-campos-grupo">
              <div className="crear-usuario-campo">
                <label htmlFor="rol">Rol del Usuario</label>
                <select
                  id="rol"
                  value={datos.rol}
                  onChange={(e) => manejarCambioDatos('rol', e.target.value)}
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="profesor">Profesor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="suscripcion">Tipo de Membresía</label>
                <select
                  id="suscripcion"
                  value={datos.suscripcion}
                  onChange={(e) => manejarCambioDatos('suscripcion', e.target.value)}
                >
                  <option value="free">Gratuita</option>
                  <option value="basic">Básica</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Profesional</option>
                </select>
              </div>
            </div>
          </div>

          <div className="crear-usuario-seccion">
            <h3>Información Adicional (Opcional)</h3>
            <div className="crear-usuario-campos-grupo">
              <div className="crear-usuario-campo">
                <label htmlFor="ciudad">Ciudad</label>
                <input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  value={datos.ciudad}
                  onChange={(e) => manejarCambioDatos('ciudad', e.target.value)}
                  onInput={manejarEntradaTexto}
                  placeholder="Ciudad de residencia"
                  maxLength={100}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="pais">País</label>
                <input
                  id="pais"
                  name="pais"
                  type="text"
                  value={datos.pais}
                  onChange={(e) => manejarCambioDatos('pais', e.target.value)}
                  onInput={manejarEntradaTexto}
                  placeholder="País de residencia"
                  maxLength={100}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={datos.whatsapp}
                  onChange={(e) => manejarCambioDatos('whatsapp', e.target.value)}
                  placeholder="+57 300 123 4567"
                  maxLength={20}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="nivel">Nivel de Habilidad</label>
                <select
                  id="nivel"
                  value={datos.nivel_habilidad}
                  onChange={(e) => manejarCambioDatos('nivel_habilidad', e.target.value)}
                >
                  <option value="">Seleccionar nivel...</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="experto">Experto</option>
                </select>
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="documento_tipo">Tipo de Documento</label>
                <select
                  id="documento_tipo"
                  value={datos.documento_tipo}
                  onChange={(e) => manejarCambioDatos('documento_tipo', e.target.value)}
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="documento">Número de Documento</label>
                <input
                  id="documento"
                  type="text"
                  value={datos.documento_numero}
                  onChange={(e) => manejarCambioDatos('documento_numero', e.target.value)}
                  placeholder="Número del documento"
                  maxLength={20}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="profesion">Profesión</label>
                <input
                  id="profesion"
                  name="profesion"
                  type="text"
                  value={datos.profesion}
                  onChange={(e) => manejarCambioDatos('profesion', e.target.value)}
                  onInput={manejarEntradaTexto}
                  placeholder="Profesión u ocupación"
                  maxLength={100}
                />
              </div>

              <div className="crear-usuario-campo">
                <label htmlFor="instrumento">Instrumento Principal</label>
                <select
                  id="instrumento"
                  value={datos.instrumento}
                  onChange={(e) => manejarCambioDatos('instrumento', e.target.value)}
                >
                  <option value="acordeon">Acordeón</option>
                  <option value="caja">Caja</option>
                  <option value="guacharaca">Guacharaca</option>
                  <option value="bajo">Bajo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="crear-usuario-acciones-formulario">
            <button
              type="button"
              className="crear-usuario-btn-limpiar"
              onClick={limpiarFormulario}
              disabled={cargando}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="crear-usuario-btn-crear"
              disabled={cargando}
            >
              {cargando ? 'Creando Usuario...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CrearUsuario; 
