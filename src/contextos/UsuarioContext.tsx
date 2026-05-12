import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react'
import { supabase } from '../servicios/clienteSupabase'

interface Usuario {
    id: string
    nombre: string
    email: string
    url_foto_perfil?: string
    rol?: 'admin' | 'estudiante' | string
    telefono?: string
    biografia?: string
    pais?: string
    ciudad?: string
    fecha_nacimiento?: string
    genero?: string
    nivel_acordeon?: string
    created_at?: string
    updated_at?: string
}

interface UsuarioContextType {
    usuario: Usuario | null
    setUsuario: (usuario: Usuario | null) => void
    actualizarUsuario: (datosActualizados: Partial<Usuario>) => void
    cargarUsuario: () => Promise<void>
    cerrarSesion: () => Promise<void>
    estaAutenticado: boolean
    esAdmin: boolean
    esEstudiante: boolean
    inicializado: boolean
}

const UsuarioContext = createContext<UsuarioContextType | null>(null)

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
    const [usuario, setUsuarioState] = useState<Usuario | null>(null)
    const [inicializado, setInicializado] = useState(false)
    const authInitialized = useRef(false)

    const estaAutenticado = usuario !== null
    const esAdmin = usuario?.rol === 'admin'
    const esEstudiante = usuario?.rol === 'estudiante'

    // Wrapper para setUsuario que también persiste en localStorage
    const setUsuario = useCallback((nuevoUsuario: Usuario | null) => {
        setUsuarioState(nuevoUsuario)
        if (nuevoUsuario) {
            try {
                localStorage.setItem('usuario_actual', JSON.stringify(nuevoUsuario))
            } catch (error) {
            }
        } else {
            localStorage.removeItem('usuario_actual')
        }
    }, [])

    // Función robusta para cargar usuario
    const cargarUsuario = useCallback(async () => {
        try {

            // 1. Obtener Sesión de Auth
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session?.user) {
                // Si no hay sesion valida, limpiar localStorage para evitar carga
                // optimista falsa en proximas visitas (causaba errores 401 en
                // useSesionTracker porque `estaAutenticado` retornaba true
                // sin tener token Supabase valido).
                setUsuario(null)
                localStorage.removeItem('usuario_actual')
                setInicializado(true)
                return
            }

            const user = session.user

            // 2. Intentar obtener perfil de BD con Timeout
            const fetchPerfil = async () => {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                return { data, error }
            }

            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout DB')), 15000)
            )

            // 3. Fallback inmediato: Crear usuario básico con metadatos
            // Intentar recuperar rol del storage si existe para evitar parpadeo
            let rolCached = 'estudiante';
            try {
                const cached = localStorage.getItem('usuario_actual');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.id === user.id && parsed.rol) {
                        rolCached = parsed.rol;
                    }
                }
            } catch (e) { }

            const usuarioBasico: Usuario = {
                id: user.id,
                nombre: user.user_metadata?.nombre || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
                email: user.email || '',
                url_foto_perfil: user.user_metadata?.avatar_url || user.user_metadata?.url_foto_perfil,
                rol: user.user_metadata?.rol || rolCached
            }

            try {
                // Raza entre BD y Timeout
                const { data: perfil, error: perfilError } = await Promise.race([fetchPerfil(), timeoutPromise])

                if (perfil && !perfilError) {
                    setUsuario({
                        ...usuarioBasico, // Defaults
                        ...perfil,       // Overrides de BD
                        // Mapeo de campos legacy si es necesario
                        nombre: perfil.nombre || perfil.nombre_completo || usuarioBasico.nombre
                    })
                } else {
                    setUsuario(usuarioBasico) // Fallback seguro
                }

            } catch (err) {
                setUsuario(usuarioBasico) // Fallback seguro en caso de timeout
            }

        } catch (error) {
            setUsuario(null)
        } finally {
            setInicializado(true)
        }
    }, [setUsuario])

    const actualizarUsuario = useCallback((datosActualizados: Partial<Usuario>) => {
        setUsuarioState(prev => {
            if (!prev) return null
            const actualizado = { ...prev, ...datosActualizados }
            try {
                localStorage.setItem('usuario_actual', JSON.stringify(actualizado))
            } catch (e) { }
            return actualizado
        })
    }, [])

    // Función para cerrar sesión
    const cerrarSesion = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            setUsuario(null)
            localStorage.removeItem('usuario_actual')
        } catch (error) {
        }
    }, [setUsuario])

    useEffect(() => {
        if (authInitialized.current) return
        authInitialized.current = true

        // 1. Carga optimista del Storage. SOLO si Supabase tiene el token de
        //    auth en localStorage; de lo contrario, dejamos usuario=null y
        //    esperamos a cargarUsuario(). Esto evita que useSesionTracker y
        //    queries autenticadas disparen con usuario fantasma cuando la
        //    sesion Supabase expiro pero el cache `usuario_actual` quedo
        //    huerfano (causaba 400 refresh_token + 401 sesiones_usuario).
        try {
            const cached = localStorage.getItem('usuario_actual')
            const tieneTokenSupabase = Object.keys(localStorage).some(
                k => k.startsWith('sb-') && k.includes('-auth-token')
            )
            if (cached && tieneTokenSupabase) {
                setUsuarioState(JSON.parse(cached))
                setInicializado(true)
            } else if (cached && !tieneTokenSupabase) {
                // Cache huerfano: limpiar
                localStorage.removeItem('usuario_actual')
            }
        } catch (e) { }

        // 2. Carga real
        cargarUsuario()

        // 3. Listener de cambios
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) cargarUsuario()
            } else if (event === 'SIGNED_OUT') {
                setUsuario(null)
                setInicializado(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [cargarUsuario])

    return (
        <UsuarioContext.Provider value={{
            usuario,
            setUsuario,
            actualizarUsuario,
            cargarUsuario,
            cerrarSesion,
            estaAutenticado,
            esAdmin,
            esEstudiante,
            inicializado
        }}>
            {children}
        </UsuarioContext.Provider>
    )
}

export const useUsuario = () => {
    const context = useContext(UsuarioContext)
    if (!context) throw new Error('useUsuario debe ser usado dentro de un UsuarioProvider')
    return context
}
