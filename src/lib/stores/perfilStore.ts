import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/clienteSupabase';

interface PerfilData {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  url_foto_perfil: string;
  portada_url: string;
  posicion_img_portada: number;
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
  async function cargarEstadisticasInternas(userId: string): Promise<StatsData> {
    try {
      const [publicacionesResult, cursosResult, tutorialesResult, rankingResult] = await Promise.all([
        supabase.from('comunidad_publicaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
        supabase.from('progreso_tutorial').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).eq('completado', true),
        supabase.from('perfiles').select('id').order('puntos_comunidad', { ascending: false })
      ]);

      const posicionRanking = rankingResult.data ? 
        rankingResult.data.findIndex((p: any) => p.id === userId) + 1 : 0;

      return {
        publicaciones: publicacionesResult.count || 0,
        cursos: cursosResult.count || 0,
        tutoriales: tutorialesResult.count || 0,
        ranking: posicionRanking || 0
      };
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
    }
  }

  return {
    subscribe,
    
    async cargarDatosPerfil(forzarRecarga = false) {
      console.log('🔄 [PERFIL STORE] Cargando datos del perfil...', { forzarRecarga, inicializado: currentStore.inicializado, cargando: currentStore.cargando });
      
      // Si ya está inicializado y no es recarga forzada, no hacer nada
      if (currentStore.inicializado && !forzarRecarga) {
        console.log('✅ [PERFIL STORE] Datos ya inicializados, saltando carga');
        return;
      }

      // Si ya está cargando, no iniciar otra carga
      if (currentStore.cargando && !forzarRecarga) {
        console.log('⏳ [PERFIL STORE] Ya está cargando, saltando nueva carga');
        return;
      }

      update(state => ({ ...state, cargando: true }));

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.warn('⚠️ [PERFIL STORE] Usuario no autenticado:', userError?.message);
          update(state => ({ 
            ...state, 
            cargando: false,
            inicializado: true,
            perfil: null
          }));
          return;
        }

        console.log('👤 [PERFIL STORE] Usuario autenticado:', user.id);

        // Obtener datos del perfil desde Supabase
        const { data: perfilData, error: perfilError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (perfilError && perfilError.code !== 'PGRST116') {
          console.error('❌ [PERFIL STORE] Error obteniendo perfil:', perfilError);
          // En lugar de throw, continuar con datos básicos
        }

        console.log('📄 [PERFIL STORE] Datos de perfil obtenidos:', perfilData);

        // Cargar estadísticas (con timeout para evitar bloqueos)
        let statsResult = { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
        try {
          const statsPromise = cargarEstadisticasInternas(user.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000) // 10 segundos timeout
          );
          statsResult = await Promise.race([statsPromise, timeoutPromise]) as StatsData;
        } catch (error) {
          console.warn('⚠️ [PERFIL STORE] Error/timeout cargando estadísticas:', error);
        }

        const perfilCompleto = perfilData || {
          id: user.id,
          nombre_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          correo_electronico: user.email || '',
          url_foto_perfil: user.user_metadata?.avatar_url || '',
          portada_url: '',
          posicion_img_portada: 50
        };

        update(state => ({
          ...state,
          perfil: perfilCompleto,
          stats: statsResult,
          cargando: false,
          inicializado: true
        }));

        console.log('✅ [PERFIL STORE] Datos cargados exitosamente:', perfilCompleto);

      } catch (error) {
        console.error('❌ [PERFIL STORE] Error crítico cargando datos del perfil:', error);
        update(state => ({ 
          ...state, 
          cargando: false,
          inicializado: true,
          perfil: null
        }));
      }
    },

    async cargarEstadisticasComunidad(userId: string): Promise<StatsData> {
      try {
        const [publicacionesResult, cursosResult, tutorialesResult, rankingResult] = await Promise.all([
          supabase.from('comunidad_publicaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
          supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('usuario_id', userId),
          supabase.from('progreso_tutorial').select('*', { count: 'exact', head: true }).eq('usuario_id', userId).eq('completado', true),
          supabase.from('perfiles').select('id').order('puntos_comunidad', { ascending: false })
        ]);

        const posicionRanking = rankingResult.data ? 
          rankingResult.data.findIndex((p: any) => p.id === userId) + 1 : 0;

        return {
          publicaciones: publicacionesResult.count || 0,
          cursos: cursosResult.count || 0,
          tutoriales: tutorialesResult.count || 0,
          ranking: posicionRanking || 0
        };
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        return { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
      }
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

// Solo resetear cuando el usuario se desloguee (no auto-cargar para evitar conflictos)
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if (event === 'SIGNED_OUT') {
      console.log('🚪 [PERFIL STORE] Usuario desautenticado, reseteando store');
      perfilStore.resetear();
    }
    // Removimos la auto-carga en SIGNED_IN para evitar conflictos con el layout
  });
} 