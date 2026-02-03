import React, { useState, useEffect } from 'react';
import './PestanaConfiguracion.css';
import { supabase } from '../../../../../servicios/supabaseCliente';
import { cambiarPasswordUsuario, enviarEmailRestablecimiento } from '../../../../../servicios/passwordService';

// Interfaces
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
  eliminado: boolean;
  url_foto_perfil?: string;
  ciudad?: string;
  pais?: string;
  whatsapp?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
}

interface Pago {
  id: string;
  descripcion?: string;
  nombre_producto?: string;
  fecha_transaccion?: string;
  created_at?: string;
  ref_payco: string;
  valor: number;
  estado: string;
}

interface Props {
  usuario: Usuario;
  onUsuarioActualizado?: (usuario: Usuario) => void;
}

const PestanaConfiguracion: React.FC<Props> = ({ usuario, onUsuarioActualizado }) => {
  // Estados
  const [cargando, setCargando] = useState(false);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [mostrarGestionMembresia, setMostrarGestionMembresia] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([]);

  // Estados para cambio de contraseña
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargandoPassword, setCargandoPassword] = useState(false);
  const [cargandoEmail, setCargandoEmail] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarHistorialPagos();
  }, []);

  // Cargar historial de pagos
  const cargarHistorialPagos = async () => {
    try {
      setCargandoPagos(true);
      const { data, error } = await supabase
        .from('pagos_epayco')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('fecha_transaccion', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error cargando historial de pagos:', error);
        return;
      }

      setHistorialPagos(data || []);
    } catch (err) {
      console.error('Error en cargarHistorialPagos:', err);
    } finally {
      setCargandoPagos(false);
    }
  };

  // Cambiar membresía
  const cambiarMembresia = async (nuevaMembresia: string) => {
    try {
      setCargando(true);
      setError('');

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          suscripcion: nuevaMembresia,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // Actualizar usuario local
      const usuarioActualizado = {
        ...usuario,
        suscripcion: nuevaMembresia,
        fecha_actualizacion: new Date().toISOString()
      };

      setMostrarGestionMembresia(false);
      setExito('Membresía actualizada exitosamente');

      // Notificar al componente padre
      if (onUsuarioActualizado) {
        onUsuarioActualizado(usuarioActualizado);
      }

      setTimeout(() => {
        setExito('');
      }, 3000);

    } catch (err: any) {
      setError(`Error al cambiar membresía: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Cambiar contraseña - Método directo usando función RPC
  const cambiarPassword = async () => {
    if (!nuevaPassword || !confirmarPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCargandoPassword(true);
      setError('');

      console.log('Cambiando contraseña para usuario:', usuario.id);

      // Usar función RPC para cambiar contraseña directamente
      const resultado = await cambiarPasswordUsuario(usuario.id, nuevaPassword);

      if (resultado.success) {
        setExito('Contraseña actualizada exitosamente');
        setMostrarCambioPassword(false);
        setNuevaPassword('');
        setConfirmarPassword('');

        setTimeout(() => {
          setExito('');
        }, 3000);
      } else {
        setError(`Error al cambiar contraseña: ${resultado.error}`);
      }

    } catch (err: any) {
      console.error('Error cambiando contraseña:', err);
      setError(`Error al cambiar contraseña: ${err.message}`);
    } finally {
      setCargandoPassword(false);
    }
  };


  // Enviar email de restablecimiento
  const enviarEmailRestablecimientoHandler = async () => {
    try {
      setCargandoEmail(true);
      setError('');

      const resultado = await enviarEmailRestablecimiento(usuario.correo_electronico);

      if (resultado.success) {
        setExito('Email de restablecimiento enviado exitosamente');
        setTimeout(() => {
          setExito('');
        }, 3000);
      } else {
        setError(`Error enviando email: ${resultado.error}`);
      }

    } catch (err: any) {
      console.error('Error enviando email:', err);
      setError(`Error enviando email: ${err.message}`);
    } finally {
      setCargandoEmail(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear precio
  const formatearPrecio = (precio: number | string) => {
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  // Iconos SVG reutilizables
  const icons = {
    crown: (
      <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.633-.24l-1.7.91a1 1 0 011 .55 4.004 4.004 0 01-4 4 4.004 4.004 0 01-4-4 1 1 0 011-.55l-1.7-.91a1 1 0 01-2.08-1.55l1.739-5.42-1.235-.617a1 1 0 01.895-1.79l1.598.8L6.878 5.436V3a1 1 0 011-1h2z" clipRule="evenodd" />
      </svg>
    ),
    star: (
      <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    diamond: (
      <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
        <path d="M9 12a1 1 0 011-1h1a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1z" />
      </svg>
    ),
    book: (
      <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    academic: (
      <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    )
  };


  // Obtener icono de membresía
  const getMembresiaIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'premium': return icons.crown;
      case 'pro': return icons.star;
      case 'vip': return icons.diamond;
      case 'basico': return icons.book;
      default: return icons.academic;
    }
  };

  return (
    <div className="uconf-container">
      {/* Mensajes de estado */}
      {error && (
        <div className="uconf-error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} />
          </svg>
          {error}
        </div>
      )}

      {exito && (
        <div className="uconf-success-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} />
          </svg>
          {exito}
        </div>
      )}

      {/* Gestión de Membresía */}
      <div className="uconf-section uconf-section-membership">
        <div className="uconf-section-header">
          <h3 className="uconf-section-title">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.25rem' }}>
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.633-.24l-1.7.91a1 1 0 011 .55 4.004 4.004 0 01-4 4 4.004 4.004 0 01-4-4 1 1 0 011-.55l-1.7-.91a1 1 0 01-2.08-1.55l1.739-5.42-1.235-.617a1 1 0 01.895-1.79l1.598.8L6.878 5.436V3a1 1 0 011-1h2z" clipRule="evenodd" />
            </svg>
            Gestión de Membresía
          </h3>
          <button
            className="uconf-btn-action"
            onClick={() => setMostrarGestionMembresia(!mostrarGestionMembresia)}
            disabled={cargando}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1L3 5l9 4 9-4-9-4zM3 5v14l9 4 9-4V5" />
            </svg>
            Cambiar Membresía
          </button>
        </div>

        <div className="uconf-membership-card">
          <div className="uconf-membership-icon-wrapper">
            {getMembresiaIcon(usuario.suscripcion)}
          </div>
          <div>
            <p className="uconf-membership-title">Membresía Actual</p>
            <p className="uconf-membership-value">{usuario.suscripcion || 'Ninguna'}</p>
            <p className="uconf-membership-date">Desde: {formatearFecha(usuario.fecha_creacion)}</p>
          </div>
        </div>

        {mostrarGestionMembresia && (
          <div className="uconf-membership-selector">
            <h4 className="uconf-selector-title">Seleccionar Nueva Membresía</h4>
            <div className="uconf-options-grid">
              {['gratis', 'basico', 'premium', 'pro', 'vip'].map((tipoMembresia) => (
                <button
                  key={tipoMembresia}
                  className={`uconf-membership-option ${usuario.suscripcion === tipoMembresia ? 'active' : ''}`}
                  onClick={() => cambiarMembresia(tipoMembresia)}
                  disabled={usuario.suscripcion === tipoMembresia || cargando}
                >
                  <div style={{ width: '2rem', height: '2rem', color: usuario.suscripcion === tipoMembresia ? '#8b5cf6' : 'inherit' }}>
                    {getMembresiaIcon(tipoMembresia)}
                  </div>
                  <span>{tipoMembresia}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gestión de Contraseña */}
      <div className="uconf-section uconf-section-password">
        <div className="uconf-section-header">
          <h3 className="uconf-section-title">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.25rem' }}>
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 010-2z" clipRule="evenodd" />
            </svg>
            Gestión de Contraseña
          </h3>
          <div className="uconf-header-actions">
            <button
              className="uconf-btn-primary"
              onClick={() => setMostrarCambioPassword(!mostrarCambioPassword)}
              disabled={cargandoPassword}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15h2m-6 4h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Cambiar Contraseña
            </button>
            <button
              className="uconf-btn-success"
              onClick={enviarEmailRestablecimientoHandler}
              disabled={cargandoEmail}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {cargandoEmail ? 'Enviando...' : 'Enviar Email'}
            </button>
          </div>
        </div>

        {mostrarCambioPassword && (
          <div className="uconf-password-form">
            <div className="uconf-info-box">
              <p><strong>Cambio Directo de Contraseña</strong></p>
              <p>Ingresa la nueva contraseña para el usuario. La contraseña se actualizará inmediatamente en la base de datos.</p>
            </div>

            <div className="uconf-form-group">
              <label className="uconf-label">Nueva Contraseña:</label>
              <input
                className="uconf-input"
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Ingresa nueva contraseña (mínimo 6 caracteres)"
                minLength={6}
                disabled={cargandoPassword}
                required
              />
            </div>
            <div className="uconf-form-group">
              <label className="uconf-label">Confirmar Contraseña:</label>
              <input
                className="uconf-input"
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Confirma la nueva contraseña"
                minLength={6}
                disabled={cargandoPassword}
                required
              />
            </div>
            <div className="uconf-form-actions">
              <button
                className="uconf-btn-success"
                onClick={cambiarPassword}
                disabled={cargandoPassword || !nuevaPassword || !confirmarPassword}
              >
                {cargandoPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button
                className="uconf-btn-secondary"
                onClick={() => {
                  setMostrarCambioPassword(false);
                  setNuevaPassword('');
                  setConfirmarPassword('');
                  setError('');
                }}
                disabled={cargandoPassword}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Pagos */}
      <div className="uconf-section">
        <h3 className="uconf-section-title" style={{ marginBottom: '1.5rem' }}>
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1.25rem' }}>
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          Historial de Pagos
        </h3>

        {cargandoPagos ? (
          <div className="uconf-loading-wrapper">Cargando historial de pagos...</div>
        ) : historialPagos.length === 0 ? (
          <div className="uconf-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '1rem', display: 'inline-block' }}>
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor" />
            </svg>
            <p>No hay historial de pagos</p>
          </div>
        ) : (
          <div className="uconf-payments-list">
            {historialPagos.map((pago) => (
              <div key={pago.id} className="uconf-payment-item">
                <div className="uconf-payment-info">
                  <h4>{pago.descripcion || pago.nombre_producto || 'Pago'}</h4>
                  <p className="uconf-payment-date">{formatearFecha(pago.fecha_transaccion || pago.created_at || '')}</p>
                  <p className="uconf-payment-ref">Ref: {pago.ref_payco}</p>
                </div>
                <div className="uconf-payment-right">
                  <span className="uconf-payment-amount">{formatearPrecio(pago.valor)}</span>
                  <span className={`uconf-payment-status uconf-status-${pago.estado.toLowerCase()}`}>
                    {pago.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PestanaConfiguracion;
