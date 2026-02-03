import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../servicios/supabaseCliente'

interface Perfil {
  id: string
  nombre_completo: string
  url_foto_perfil?: string | null
  portada_url?: string | null
  posicion_img_portada?: string | null
  nivel_habilidad?: string | null
}

interface Stats {
  publicaciones: number
  cursos: number
  tutoriales: number
  ranking: number
}

interface StoreState {
  perfil: Perfil | null
  stats: Stats
  cargando: boolean
  inicializado: boolean
  cargarDatosPerfil: (forzar?: boolean) => Promise<void>
  actualizarPerfil: (parcial: Partial<Perfil>) => void
  establecerPerfil: (nuevoPerfil: Perfil) => void
  forzarInicializacion: () => void
  resetear: () => void
}

const PerfilContext = createContext<StoreState | null>(null)

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [stats, setStats] = useState<Stats>({ publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 })
  const [cargando, setCargando] = useState(false)
  const [inicializado, setInicializado] = useState(false)

  async function cargarDatosPerfil(forzar = false) {
    if (inicializado && !forzar) return

    // 1. Obtener sesión LOCALMENTE (sin llamada de red bloqueante)
    // Usamos getSession en lugar de getUser para velocidad instantánea
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      setPerfil(null)
      setCargando(false)
      setInicializado(true)
      return
    }

    const user = session.user

    // 2. OPTIMISTIC UI: Construir y setear perfil INMEDIATAMENTE
    // Esto elimina CUALQUIER posibilidad de carga infinita por red
    const perfilOptimista: Perfil = {
      id: user.id,
      nombre_completo: user.user_metadata?.full_name || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
      url_foto_perfil: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      portada_url: null,
      posicion_img_portada: null,
      nivel_habilidad: 'principiante'
    }

    // Renderizado inmediato
    setPerfil(perfilOptimista)
    setInicializado(true)
    setCargando(true)

    try {
      console.log('🔄 Sincronizando perfil con BD (Background)...')

      // 3. Validación y Sync real (sin bloquear UI)
      // Primero verificamos que el token sea válido con servidor (silent check)
      // No esperamos esto para el primer render

      // 4. Fetch DB real
      const { data: perfilData, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfilData) {
        console.log('✅ Perfil actualizado desde BD')
        setPerfil(perfilData as Perfil)
      } else if (error) {
        console.warn('⚠️ Fallo carga BD, manteniendo perfil optimista:', error.message)
      }

      // 5. Cargar stats en paralelo
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('curso_id, tutorial_id')
        .eq('usuario_id', user.id);

      const cursosCount = inscripciones?.filter(i => i.curso_id).length || 0;
      const tutorialesCount = inscripciones?.filter(i => i.tutorial_id).length || 0;

      // Cargar ranking desde GamificacionServicio
      let rankingValue = 0;
      try {
        const { GamificacionServicio } = await import('../servicios/gamificacionServicio');
        const rankingList = await GamificacionServicio.obtenerRanking('general', 100);
        const rankingUser = rankingList.find(r => r.usuario_id === user.id);

        if (rankingUser) {
          rankingValue = rankingUser.posicion;
        } else {
          const rankingData = await GamificacionServicio.obtenerPosicionUsuario(user.id, 'general');
          if (rankingData && rankingData.posicion) rankingValue = rankingData.posicion;
        }
      } catch (err) {
        console.error('Error cargando ranking en store:', err);
      }

      // Cargar publicaciones
      const { count: publicacionesCount } = await supabase
        .from('comunidad_publicaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id);

      setStats({
        publicaciones: publicacionesCount || 0,
        cursos: cursosCount,
        tutoriales: tutorialesCount,
        ranking: rankingValue
      })

    } catch (error) {
      console.error('Error background sync:', error)
    } finally {
      setCargando(false)
    }
  }

  function actualizarPerfil(parcial: Partial<Perfil>) {
    setPerfil(prev => prev ? { ...prev, ...parcial } : prev)
  }

  function establecerPerfil(nuevoPerfil: Perfil) {
    setPerfil(nuevoPerfil)
    setInicializado(true)
  }

  function forzarInicializacion() { setInicializado(true); setCargando(false) }

  function resetear() {
    setPerfil(null)
    setStats({ publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 })
    setInicializado(false)
  }

  const value = useMemo(() => ({
    perfil,
    stats,
    cargando,
    inicializado,
    cargarDatosPerfil,
    actualizarPerfil,
    establecerPerfil,
    forzarInicializacion,
    resetear
  }), [perfil, stats, cargando, inicializado])

  // Auto-cargar datos del perfil al montar
  useEffect(() => {
    cargarDatosPerfil()
  }, [])

  return <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
}

export function usePerfilStore() {
  const ctx = useContext(PerfilContext)
  if (!ctx) throw new Error('usePerfilStore debe usarse dentro de PerfilProvider')
  return ctx
}

export async function requiereAutenticacion(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 3000)
    )

    const sessionPromise = supabase.auth.getSession()

    // Carrera entre la sesión y un timeout de 3s
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])

    return !!session
  } catch (error) {
    console.error('Error verificando sesión:', error)
    return false
  }
}
