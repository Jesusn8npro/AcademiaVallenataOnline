import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { usePerfilStore } from '../../../stores/perfilStore';

export function useConfiguracionProMax() {
  const { usuario, estaAutenticado } = useUsuario();
  const { perfil, actualizarPerfil, cargarDatosPerfil } = usePerfilStore();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    biografia: '',
    url_foto_perfil: '',
    whatsapp: '',
    ciudad: ''
  });

  useEffect(() => {
    if (estaAutenticado) cargarDatosPerfil(true);
  }, [estaAutenticado]);

  useEffect(() => {
    if (perfil) {
      setForm({
        nombre: perfil.nombre || '',
        apellido: perfil.apellido || '',
        nombre_usuario: perfil.nombre_usuario || '',
        biografia: perfil.biografia || '',
        url_foto_perfil: perfil.url_foto_perfil || '',
        whatsapp: perfil.whatsapp || '',
        ciudad: perfil.ciudad || perfil.pais || ''
      });
    }
  }, [perfil]);

  const handleLogin = async (provider: 'google' | 'facebook' | 'email') => {
    if (provider === 'email') {
      window.location.href = '/mi-perfil';
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/acordeon-pro-max/configuracion' }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSave = async () => {
    if (!usuario || !perfil) return;
    setCargando(true);
    setMensaje(null);
    try {
      const nombreCompleto = `${form.nombre} ${form.apellido}`.trim();
      const updates = {
        ...form,
        nombre_completo: nombreCompleto,
        fecha_actualizacion: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('perfiles').update(updates).eq('id', usuario.id);
      if (error) throw error;
      actualizarPerfil(updates as any);
      setMensaje({ tipo: 'exito', texto: '¡Información actualizada con éxito!' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar los cambios' });
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return { usuario, estaAutenticado, perfil, form, cargando, mensaje, handleLogin, handleLogout, handleSave, handleChange };
}
