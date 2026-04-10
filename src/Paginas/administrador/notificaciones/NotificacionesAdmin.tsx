import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotificacionesAdmin.css';
import {
  obtenerEstadisticasNotificaciones,
  notificarNuevoCurso,
  notificarNuevoTutorial,
  notificarPagoAprobado,
  notificarPromocionEspecial,
  limpiarNotificacionesExpiradas,
  type EstadisticasNotificaciones
} from '../../../servicios/notificacionesService';

// Tipos de datos locales

interface FormularioNotificacionManual {
  tipo: string;
  mensaje: string;
  url_accion: string;
  usuario_id: string;
  prioridad: string;
}

interface FormularioCurso {
  titulo: string;
  descripcion: string;
}

interface FormularioTutorial {
  titulo: string;
  descripcion: string;
}

interface FormularioPago {
  usuario_id: string;
  monto: number;
  curso_titulo: string;
}

interface FormularioPromocion {
  titulo: string;
  descripcion: string;
  codigo: string;
  fecha_limite: string;
}

const NotificacionesAdmin: React.FC = () => {
  // Estados
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>('');
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error'>('exito');
  const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones | null>(null);

  // Formulario de notificación manual
  const [formularioManual, setFormularioManual] = useState<FormularioNotificacionManual>({
    tipo: 'nuevo_curso',
    mensaje: '',
    url_accion: '',
    usuario_id: '',
    prioridad: 'normal'
  });

  // Formularios de prueba
  const [formularioCurso, setFormularioCurso] = useState<FormularioCurso>({
    titulo: '',
    descripcion: ''
  });

  const [formularioTutorial, setFormularioTutorial] = useState<FormularioTutorial>({
    titulo: '',
    descripcion: ''
  });

  const [formularioPago, setFormularioPago] = useState<FormularioPago>({
    usuario_id: '',
    monto: 0,
    curso_titulo: ''
  });

  const [formularioPromocion, setFormularioPromocion] = useState<FormularioPromocion>({
    titulo: '',
    descripcion: '',
    codigo: '',
    fecha_limite: ''
  });

  // Efectos
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Funciones
  const cargarEstadisticas = async (): Promise<void> => {
    try {
      const { exito, estadisticas: stats, error } = await obtenerEstadisticasNotificaciones();

      if (exito && stats) {
        setEstadisticas(stats);
      } else {
        console.error('Error cargando estadísticas:', error);
        mostrarMensaje(`Error al cargar las estadísticas: ${error}`, 'error');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      mostrarMensaje('Error al cargar las estadísticas', 'error');
    }
  };

  const mostrarMensaje = (texto: string, tipo: 'exito' | 'error'): void => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(''), 5000);
  };

  // Notificación manual
  const enviarNotificacionManual = async (): Promise<void> => {
    if (!formularioManual.mensaje.trim()) {
      mostrarMensaje('El mensaje es requerido', 'error');
      return;
    }

    setCargando(true);

    try {
      // TODO: Implementar servicio real
      // const resultado = await crearNotificacion({
      //   tipo: formularioManual.tipo,
      //   mensaje: formularioManual.mensaje,
      //   url_accion: formularioManual.url_accion || undefined,
      //   usuario_id: formularioManual.usuario_id || undefined,
      //   datos_adicionales: { manual: true }
      // });

      // Simulación de respuesta
      const notificacionesCreadas = Math.floor(Math.random() * 100) + 50;

      mostrarMensaje(`✅ Notificación enviada a ${notificacionesCreadas} usuarios`, 'exito');

      // Limpiar formulario
      setFormularioManual({
        tipo: 'nuevo_curso',
        mensaje: '',
        url_accion: '',
        usuario_id: '',
        prioridad: 'normal'
      });

      await cargarEstadisticas();
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  // Prueba: Nuevo curso
  const probarNuevoCurso = async (): Promise<void> => {
    if (!formularioCurso.titulo.trim()) {
      mostrarMensaje('El título del curso es requerido', 'error');
      return;
    }

    setCargando(true);

    try {
      const resultado = await notificarNuevoCurso({
        curso_id: 'curso-demo-' + Date.now(),
        titulo_curso: formularioCurso.titulo,
        descripcion_curso: formularioCurso.descripcion || 'Curso de demostración',
        creador_id: 'admin-demo'
      });

      if (resultado.exito) {
        mostrarMensaje(`✅ Notificación de curso enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
        setFormularioCurso({ titulo: '', descripcion: '' });
        await cargarEstadisticas();
      } else {
        mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
      }
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  // Prueba: Nuevo tutorial
  const probarNuevoTutorial = async (): Promise<void> => {
    if (!formularioTutorial.titulo.trim()) {
      mostrarMensaje('El título del tutorial es requerido', 'error');
      return;
    }

    setCargando(true);

    try {
      const resultado = await notificarNuevoTutorial({
        tutorial_id: 'tutorial-demo-' + Date.now(),
        titulo_tutorial: formularioTutorial.titulo,
        descripcion_tutorial: formularioTutorial.descripcion || 'Tutorial de demostración',
        creador_id: 'admin-demo'
      });

      if (resultado.exito) {
        mostrarMensaje(`✅ Notificación de tutorial enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
        setFormularioTutorial({ titulo: '', descripcion: '' });
        await cargarEstadisticas();
      } else {
        mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
      }
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  // Prueba: Pago aprobado
  const probarPagoAprobado = async (): Promise<void> => {
    if (!formularioPago.usuario_id.trim() || formularioPago.monto <= 0) {
      mostrarMensaje('Usuario ID y monto son requeridos', 'error');
      return;
    }

    setCargando(true);

    try {
      const resultado = await notificarPagoAprobado({
        usuario_id: formularioPago.usuario_id,
        transaccion_id: 'txn-demo-' + Date.now(),
        monto: formularioPago.monto,
        curso_titulo: formularioPago.curso_titulo || undefined
      });

      if (resultado.exito) {
        mostrarMensaje(`✅ Notificación de pago enviada`, 'exito');
        setFormularioPago({ usuario_id: '', monto: 0, curso_titulo: '' });
        await cargarEstadisticas();
      } else {
        mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
      }
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  // Prueba: Promoción especial
  const probarPromocionEspecial = async (): Promise<void> => {
    if (!formularioPromocion.titulo.trim()) {
      mostrarMensaje('El título de la promoción es requerido', 'error');
      return;
    }

    setCargando(true);

    try {
      const resultado = await notificarPromocionEspecial({
        titulo_promocion: formularioPromocion.titulo,
        descripcion: formularioPromocion.descripcion || 'Promoción especial de demostración',
        codigo_descuento: formularioPromocion.codigo || undefined,
        fecha_limite: formularioPromocion.fecha_limite || undefined
      });

      if (resultado.exito) {
        mostrarMensaje(`✅ Promoción enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
        setFormularioPromocion({ titulo: '', descripcion: '', codigo: '', fecha_limite: '' });
        await cargarEstadisticas();
      } else {
        mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
      }
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  // Limpiar notificaciones expiradas
  const limpiarExpiradas = async (): Promise<void> => {
    if (!window.confirm('¿Estás seguro de eliminar todas las notificaciones expiradas?')) {
      return;
    }

    setCargando(true);

    try {
      const resultado = await limpiarNotificacionesExpiradas();

      if (resultado.exito) {
        mostrarMensaje(`🧹 ${resultado.eliminadas} notificaciones expiradas eliminadas`, 'exito');
        await cargarEstadisticas();
      } else {
        mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
      }
    } catch (error) {
      mostrarMensaje(`❌ Error: ${error}`, 'error');
    }

    setCargando(false);
  };

  return (
    <div className="panel-notificaciones">
      <div className="header-panel">
        <h1>
          <span className="icono">🔔</span>
          Panel de Gestión de Notificaciones
        </h1>
        <p className="descripcion">Gestiona y prueba el sistema de notificaciones de la plataforma</p>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`mensaje ${tipoMensaje}`}>
          {mensaje}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="seccion-estadisticas">
          <h2>📊 Estadísticas de Notificaciones</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="numero">{estadisticas.total}</div>
              <div className="label">Total</div>
            </div>
            <div className="stat-card">
              <div className="numero">{estadisticas.no_leidas}</div>
              <div className="label">Sin Leer</div>
            </div>
            <div className="stat-card">
              <div className="numero">{estadisticas.leidas}</div>
              <div className="label">Leídas</div>
            </div>
            <div className="stat-card">
              <div className="numero">{estadisticas.ultimos_30_dias}</div>
              <div className="label">Últimos 30 Días</div>
            </div>
          </div>

          <div className="stats-details">
            <div className="stat-section">
              <h3>Por Categoría</h3>
              {Object.entries(estadisticas.por_categoria).map(([categoria, cantidad]) => (
                <div key={categoria} className="stat-item">
                  <span>{categoria}</span>
                  <span>{cantidad}</span>
                </div>
              ))}
            </div>

            <div className="stat-section">
              <h3>Por Prioridad</h3>
              {Object.entries(estadisticas.por_prioridad).map(([prioridad, cantidad]) => (
                <div key={prioridad} className="stat-item">
                  <span>{prioridad}</span>
                  <span>{cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="contenido-panel">
        {/* Notificación Manual */}
        <div className="seccion">
          <h2>✍️ Crear Notificación Manual</h2>
          <div className="formulario">
            <div className="campo">
              <label htmlFor="tipo">Tipo de Notificación:</label>
              <select
                id="tipo"
                value={formularioManual.tipo}
                onChange={(e) => setFormularioManual({ ...formularioManual, tipo: e.target.value })}
              >
                <option value="nuevo_curso">🎓 Nuevo Curso</option>
                <option value="nuevo_tutorial">📹 Nuevo Tutorial</option>
                <option value="nueva_actualizacion_plataforma">🚀 Actualización</option>
                <option value="promocion_especial">🎁 Promoción</option>
                <option value="bienvenida_usuario">👋 Bienvenida</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="mensaje">Mensaje:</label>
              <textarea
                id="mensaje"
                value={formularioManual.mensaje}
                onChange={(e) => setFormularioManual({ ...formularioManual, mensaje: e.target.value })}
                placeholder="Escribe el mensaje de la notificación..."
                rows={3}
              />
            </div>

            <div className="campo">
              <label htmlFor="url">URL de Acción (opcional):</label>
              <input
                id="url"
                type="text"
                value={formularioManual.url_accion}
                onChange={(e) => setFormularioManual({ ...formularioManual, url_accion: e.target.value })}
                placeholder="/cursos, /blog/articulo-1, etc."
              />
            </div>

            <div className="campo">
              <label htmlFor="usuario">Usuario ID específico (opcional):</label>
              <input
                id="usuario"
                type="text"
                value={formularioManual.usuario_id}
                onChange={(e) => setFormularioManual({ ...formularioManual, usuario_id: e.target.value })}
                placeholder="Dejar vacío para enviar a todos"
              />
            </div>

            <button
              className="boton-enviar"
              onClick={enviarNotificacionManual}
              disabled={cargando}
            >
              {cargando ? '⏳ Enviando...' : '📤 Enviar Notificación'}
            </button>
          </div>
        </div>

        {/* Pruebas Automáticas */}
        <div className="seccion">
          <h2>🧪 Pruebas de Notificaciones Automáticas</h2>

          <div className="pruebas-grid">
            {/* Nuevo Curso */}
            <div className="prueba-card">
              <h3>🎓 Nuevo Curso</h3>
              <div className="formulario-mini">
                <input
                  type="text"
                  value={formularioCurso.titulo}
                  onChange={(e) => setFormularioCurso({ ...formularioCurso, titulo: e.target.value })}
                  placeholder="Título del curso"
                />
                <input
                  type="text"
                  value={formularioCurso.descripcion}
                  onChange={(e) => setFormularioCurso({ ...formularioCurso, descripcion: e.target.value })}
                  placeholder="Descripción"
                />
                <button
                  className="boton-prueba"
                  onClick={probarNuevoCurso}
                  disabled={cargando}
                >
                  Probar
                </button>
              </div>
            </div>

            {/* Nuevo Tutorial */}
            <div className="prueba-card">
              <h3>📹 Nuevo Tutorial</h3>
              <div className="formulario-mini">
                <input
                  type="text"
                  value={formularioTutorial.titulo}
                  onChange={(e) => setFormularioTutorial({ ...formularioTutorial, titulo: e.target.value })}
                  placeholder="Título del tutorial"
                />
                <input
                  type="text"
                  value={formularioTutorial.descripcion}
                  onChange={(e) => setFormularioTutorial({ ...formularioTutorial, descripcion: e.target.value })}
                  placeholder="Descripción"
                />
                <button
                  className="boton-prueba"
                  onClick={probarNuevoTutorial}
                  disabled={cargando}
                >
                  Probar
                </button>
              </div>
            </div>

            {/* Pago Aprobado */}
            <div className="prueba-card">
              <h3>✅ Pago Aprobado</h3>
              <div className="formulario-mini">
                <input
                  type="text"
                  value={formularioPago.usuario_id}
                  onChange={(e) => setFormularioPago({ ...formularioPago, usuario_id: e.target.value })}
                  placeholder="ID del usuario"
                />
                <input
                  type="number"
                  value={formularioPago.monto}
                  onChange={(e) => setFormularioPago({ ...formularioPago, monto: Number(e.target.value) })}
                  placeholder="Monto"
                />
                <input
                  type="text"
                  value={formularioPago.curso_titulo}
                  onChange={(e) => setFormularioPago({ ...formularioPago, curso_titulo: e.target.value })}
                  placeholder="Título del curso (opcional)"
                />
                <button
                  className="boton-prueba"
                  onClick={probarPagoAprobado}
                  disabled={cargando}
                >
                  Probar
                </button>
              </div>
            </div>

            {/* Promoción Especial */}
            <div className="prueba-card">
              <h3>🎁 Promoción Especial</h3>
              <div className="formulario-mini">
                <input
                  type="text"
                  value={formularioPromocion.titulo}
                  onChange={(e) => setFormularioPromocion({ ...formularioPromocion, titulo: e.target.value })}
                  placeholder="Título de la promoción"
                />
                <input
                  type="text"
                  value={formularioPromocion.descripcion}
                  onChange={(e) => setFormularioPromocion({ ...formularioPromocion, descripcion: e.target.value })}
                  placeholder="Descripción"
                />
                <input
                  type="text"
                  value={formularioPromocion.codigo}
                  onChange={(e) => setFormularioPromocion({ ...formularioPromocion, codigo: e.target.value })}
                  placeholder="Código de descuento"
                />
                <input
                  type="date"
                  value={formularioPromocion.fecha_limite}
                  onChange={(e) => setFormularioPromocion({ ...formularioPromocion, fecha_limite: e.target.value })}
                />
                <button
                  className="boton-prueba"
                  onClick={probarPromocionEspecial}
                  disabled={cargando}
                >
                  Probar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Herramientas de Gestión */}
        <div className="seccion">
          <h2>🛠️ Herramientas de Gestión</h2>
          <div className="herramientas">
            <button
              className="boton-herramienta limpiar"
              onClick={limpiarExpiradas}
              disabled={cargando}
            >
              🧹 Limpiar Notificaciones Expiradas
            </button>

            <button
              className="boton-herramienta actualizar"
              onClick={cargarEstadisticas}
              disabled={cargando}
            >
              🔄 Actualizar Estadísticas
            </button>

            <Link to="/notificaciones" className="boton-herramienta ver">
              👀 Ver Mis Notificaciones
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificacionesAdmin;
