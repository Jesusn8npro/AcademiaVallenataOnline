import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import ComunidadService from '../../../servicios/comunidadService';
import type { PublicacionComunidad } from '../../../servicios/comunidadService';
import type { Usuario } from '../tipos';

export function useComunidad() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [publicaciones, setPublicaciones] = useState<PublicacionComunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<Record<string, unknown> | null>(null);
  const [viendoUnica, setViendoUnica] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (perfilError) return;

        setUsuario({
          id: user.id,
          nombre: (perfil.nombre as string) || 'Usuario',
          apellido: (perfil.apellido as string) || '',
          nombre_usuario: perfil.nombre_usuario as string | undefined,
          url_foto_perfil: perfil.url_foto_perfil as string | undefined,
          rol: (perfil.rol as string) || 'usuario',
          ...perfil,
        });
        setPerfilCompleto(perfil);
      } catch {
        // error de autenticación no es fatal; usuario queda en null
      }
    };

    cargarUsuario();
  }, []);

  const cargarPublicaciones = useCallback(async (hash: string) => {
    try {
      setCargando(true);
      setError(null);

      const idEspecifico = hash.includes('publicacion-')
        ? hash.split('publicacion-')[1]
        : null;

      if (idEspecifico) {
        const publicacion = await ComunidadService.obtenerPublicacionPorId(idEspecifico);
        if (publicacion) {
          setPublicaciones([publicacion]);
          setViendoUnica(true);
          return;
        }
      }

      const datos = await ComunidadService.obtenerPublicaciones(0, 20);
      setPublicaciones(datos);
      setViendoUnica(false);
    } catch {
      setError('No se pudieron cargar las publicaciones. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPublicaciones(location.hash);
  }, [location.hash, cargarPublicaciones]);

  const manejarNuevaPublicacion = useCallback(() => {
    window.location.hash = '';
    cargarPublicaciones('');
  }, [cargarPublicaciones]);

  const eliminarPublicacion = useCallback((id: string) => {
    setPublicaciones(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    usuario,
    publicaciones,
    cargando,
    error,
    perfilCompleto,
    viendoUnica,
    manejarNuevaPublicacion,
    eliminarPublicacion,
  };
}
