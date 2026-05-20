'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from '@/compat/router';
import { useUsuario } from '@/contextos/UsuarioContext';
import ComunidadService from '../../../servicios/comunidadService';
import type { PublicacionComunidad } from '../../../servicios/comunidadService';
import type { Usuario } from '../tipos';

export function useComunidad() {
  const { usuario: ctxUsuario, inicializado } = useUsuario();
  const location = useLocation();

  // Map context user (UsuarioContext type) → comunidad Usuario type
  const usuario: Usuario | null = useMemo(() => {
    if (!ctxUsuario) return null;
    return {
      id: ctxUsuario.id,
      nombre: ctxUsuario.nombre || 'Usuario',
      apellido: (ctxUsuario as any).apellido || '',
      nombre_usuario: (ctxUsuario as any).nombre_usuario,
      url_foto_perfil: ctxUsuario.url_foto_perfil,
      rol: ctxUsuario.rol || 'usuario',
      ...(ctxUsuario as any),
    };
  }, [ctxUsuario]);

  // UsuarioContext already fetched the full profile from 'perfiles' table
  const perfilCompleto = ctxUsuario as unknown as Record<string, unknown> | null;

  const [publicaciones, setPublicaciones] = useState<PublicacionComunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viendoUnica, setViendoUnica] = useState(false);

  // Ref para el userId: evita recrear cargarPublicaciones cuando el perfil pasa
  // de usuarioBasico → perfilCompleto (mismo id, diferente objeto), lo que
  // causaba una doble carga visible en el feed.
  const usuarioIdRef = useRef(ctxUsuario?.id);
  useEffect(() => { usuarioIdRef.current = ctxUsuario?.id; }, [ctxUsuario?.id]);

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

      const datos = await ComunidadService.obtenerPublicaciones(0, 20, usuarioIdRef.current);
      setPublicaciones(datos);
      setViendoUnica(false);
    } catch {
      setError('No se pudieron cargar las publicaciones. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []); // estable: lee userId desde ref, no recrea al cambiar el perfil

  useEffect(() => {
    if (!inicializado) return;
    cargarPublicaciones(location.hash);
  }, [location.hash, cargarPublicaciones, inicializado]);

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
