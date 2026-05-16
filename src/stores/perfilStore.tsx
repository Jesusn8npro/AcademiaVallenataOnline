import React from 'react';
import { writable, useTienda } from '../utilidades/tiendaReact';
import { supabase } from '../servicios/clienteSupabase';

interface PerfilData {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  nombre_usuario: string;
  correo_electronico: string;
  url_foto_perfil: string;
  portada_url: string;
  posicion_img_portada: number;
  biografia: string;
  whatsapp: string;
  ciudad: string;
  pais: string;
  nivel_usuario: number;
  experiencia_total: number;
  suscripcion: string;
  rol: string;
  fecha_actualizacion?: Date | string;
  updated_at?: Date | string;
  notificaciones_email?: boolean;
  notificaciones_push?: boolean;
  modo_oscuro?: boolean;
  idioma?: string;
  publico_perfil?: boolean;
}

interface StatsData {
  publicaciones: number;
  cursos: number;
  tutoriales: number;
  ranking: number;
}

interface PerfilStore {
  perfil: PerfilData | null;
  stats: StatsData;
  cargando: boolean;
  inicializado: boolean;
}

const estadoInicial: PerfilStore = {
  perfil: null,
  stats: { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 },
  cargando: false,
  inicializado: false
};

function crearPerfilStore() {
  const { subscribe, set, update } = writable<PerfilStore>(estadoInicial);

  let currentStore: PerfilStore = estadoInicial;

  // Subscribe para mantener referencia al estado actual
  const unsubscribe = subscribe(state => currentStore = state);

  // Función interna para cargar estadísticas
  async function cargarEstadisticasInternas(userId: string, experienciaUsuario = 0): Promise<StatsData> {
    try {
      const [publicacionesResult, cursosResult, tutorialesResult, rankingResult] = await Promise.all([
        supabase.from('comunidad_publicaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('progreso_tutorial').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).eq('completado', true),
        supabase.from('perfiles').select('*', { count: 'exact', head: true }).gt('experiencia_total', experienciaUsuario)
      ]);

      return {
        publicaciones: publicacionesResult.count || 0,
        cursos: cursosResult.count || 0,
        tutoriales: tutorialesResult.count || 0,
        ranking: (rankingResult.count || 0) + 1
      };
    } catch (error) {
      return { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
    }
  }

  return {
    subscribe,

    async cargarDatosPerfil(forzarRecarga = false) {

      // Si ya está inicializado y no es recarga forzada, no hacer nada
      if (currentStore.inicializado && !forzarRecarga) {
        return;
      }

      // Si ya está cargando, no iniciar otra carga
      if (currentStore.cargando && !forzarRecarga) {
        return;
      }

      update(state => ({ ...state, cargando: true }));

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          update(state => ({
            ...state,
            cargando: false,
            inicializado: true,
            perfil: null
          }));
          return;
        }


        // Obtener datos del perfil desde Supabase
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Cargar estadísticas con experiencia del usuario para calcular ranking eficientemente
        let statsResult = { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
        try {
          statsResult = await Promise.race([
            cargarEstadisticasInternas(user.id, perfilData?.experiencia_total || 0),
            new Promise<StatsData>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
          ]);
        } catch {
        }

        const perfilCompleto: PerfilData = perfilData || {
          id: user.id,
          nombre: user.user_metadata?.first_name || '',
          apellido: user.user_metadata?.last_name || '',
          nombre_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          nombre_usuario: user.user_metadata?.user_name || user.email?.split('@')[0] || '',
          correo_electronico: user.email || '',
          url_foto_perfil: user.user_metadata?.avatar_url || '',
          portada_url: '',
          posicion_img_portada: 50,
          biografia: '',
          whatsapp: '',
          ciudad: '',
          pais: '',
          nivel_usuario: 1,
          experiencia_total: 0,
          suscripcion: 'free',
          rol: 'estudiante'
        };

        update(state => ({
          ...state,
          perfil: perfilCompleto,
          stats: statsResult,
          cargando: false,
          inicializado: true
        }));


      } catch (error) {
        update(state => ({
          ...state,
          cargando: false,
          inicializado: true,
          perfil: null
        }));
      }
    },

    async cargarEstadisticasComunidad(userId: string, experienciaUsuario = 0): Promise<StatsData> {
      return cargarEstadisticasInternas(userId, experienciaUsuario);
    },

    actualizarPerfil(nuevoPerfil: Partial<PerfilData>) {
      update(state => ({
        ...state,
        perfil: state.perfil ? { ...state.perfil, ...nuevoPerfil } : null
      }));
    },

    actualizarStats(nuevasStats: Partial<StatsData>) {
      update(state => ({
        ...state,
        stats: { ...state.stats, ...nuevasStats }
      }));
    },

    forzarInicializacion() {
      update(state => ({
        ...state,
        cargando: false,
        inicializado: true
      }));
    },

    resetear() {
      set(estadoInicial);
    },


  };
}

export const perfilStore = crearPerfilStore();

/**
 * Hook para usar el store de perfil en componentes React
 */
export const usePerfilStore = () => {
  const estado = useTienda(perfilStore);
  return {
    ...estado,
    cargarDatosPerfil: perfilStore.cargarDatosPerfil,
    cargarEstadisticasComunidad: perfilStore.cargarEstadisticasComunidad,
    actualizarPerfil: perfilStore.actualizarPerfil,
    actualizarStats: perfilStore.actualizarStats,
    forzarInicializacion: perfilStore.forzarInicializacion,
    resetear: perfilStore.resetear
  };
};

/**
 * Provider decorativo para mantener compatibilidad con componentes que lo esperan.
 * El estado real se gestiona a través del singleton perfilStore.
 */
export const PerfilProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children} </>;
};

// Solo resetear cuando el usuario se desloguee (no auto-cargar para evitar conflictos)
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if (event === 'SIGNED_OUT') {
      perfilStore.resetear();
    }
    // Removimos la auto-carga en SIGNED_IN para evitar conflictos con el layout
  });
}


