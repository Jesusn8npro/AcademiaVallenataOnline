import { useState, useEffect } from 'react';
import { supabase } from '../../../../../servicios/clienteSupabase';
import { cambiarPasswordUsuario, enviarEmailRestablecimiento } from '../../../../../servicios/passwordService';

export interface Usuario {
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

export interface Pago {
  id: string;
  descripcion?: string;
  nombre_producto?: string;
  fecha_transaccion?: string;
  created_at?: string;
  ref_payco: string;
  valor: number;
  estado: string;
}

export function usePestanaConfiguracion(usuario: Usuario, onUsuarioActualizado?: (u: Usuario) => void) {
  const [cargando, setCargando] = useState(false);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [mostrarGestionMembresia, setMostrarGestionMembresia] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([]);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargandoPassword, setCargandoPassword] = useState(false);
  const [cargandoEmail, setCargandoEmail] = useState(false);

  useEffect(() => {
    cargarHistorialPagos();
  }, []);

  const cargarHistorialPagos = async () => {
    try {
      setCargandoPagos(true);
      const { data, error: dbError } = await supabase
        .from('pagos_epayco')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('fecha_transaccion', { ascending: false })
        .limit(10);

      if (dbError) return;
      setHistorialPagos(data || []);
    } catch {
    } finally {
      setCargandoPagos(false);
    }
  };

  const cambiarMembresia = async (nuevaMembresia: string) => {
    try {
      setCargando(true);
      setError('');
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ suscripcion: nuevaMembresia, fecha_actualizacion: new Date().toISOString() })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      setMostrarGestionMembresia(false);
      setExito('Membresía actualizada exitosamente');
      onUsuarioActualizado?.({ ...usuario, suscripcion: nuevaMembresia, fecha_actualizacion: new Date().toISOString() });
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      setError(`Error al cambiar membresía: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const cambiarPassword = async () => {
    if (!nuevaPassword || !confirmarPassword) { setError('Por favor completa todos los campos'); return; }
    if (nuevaPassword !== confirmarPassword) { setError('Las contraseñas no coinciden'); return; }
    if (nuevaPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }

    try {
      setCargandoPassword(true);
      setError('');
      const resultado = await cambiarPasswordUsuario(usuario.id, nuevaPassword);
      if (resultado.success) {
        setExito('Contraseña actualizada exitosamente');
        setMostrarCambioPassword(false);
        setNuevaPassword('');
        setConfirmarPassword('');
        setTimeout(() => setExito(''), 3000);
      } else {
        setError(`Error al cambiar contraseña: ${resultado.error}`);
      }
    } catch (err: any) {
      setError(`Error al cambiar contraseña: ${err.message}`);
    } finally {
      setCargandoPassword(false);
    }
  };

  const enviarEmailRestablecimientoHandler = async () => {
    try {
      setCargandoEmail(true);
      setError('');
      const resultado = await enviarEmailRestablecimiento(usuario.correo_electronico);
      if (resultado.success) {
        setExito('Email de restablecimiento enviado exitosamente');
        setTimeout(() => setExito(''), 3000);
      } else {
        setError(`Error enviando email: ${resultado.error}`);
      }
    } catch (err: any) {
      setError(`Error enviando email: ${err.message}`);
    } finally {
      setCargandoEmail(false);
    }
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatearPrecio = (precio: number | string) => {
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(numero);
  };

  return {
    cargando, cargandoPagos, error, exito,
    mostrarGestionMembresia, setMostrarGestionMembresia,
    historialPagos,
    mostrarCambioPassword, setMostrarCambioPassword,
    nuevaPassword, setNuevaPassword,
    confirmarPassword, setConfirmarPassword,
    cargandoPassword, cargandoEmail,
    cambiarMembresia, cambiarPassword, enviarEmailRestablecimientoHandler,
    formatearFecha, formatearPrecio
  };
}
