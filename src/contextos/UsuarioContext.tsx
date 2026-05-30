import { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode, useCallback, useRef, useMemo } from 'react'
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

// Lee el usuario cacheado DURANTE el render inicial (no en useEffect) para
// que el primer fotograma ya tenga la sesion => sin flash "Verificando
// permisos". Guard SSR: en prerender no hay localStorage.
function leerUsuarioCacheInicial(): Usuario | null {
    if (typeof window === 'undefined') return null
    try {
        const cached = localStorage.getItem('usuario_actual')
        if (!cached) return null
        const tieneToken =
            !!localStorage.getItem('supabase.auth.token') ||
            Object.keys(localStorage).some(k => k.startsWith('sb-') && k.includes('-auth-token'))
        if (tieneToken) return JSON.parse(cached) as Usuario
        localStorage.removeItem('usuario_actual') // cache huerfano sin sesion
        return null
    } catch { return null }
}

export const UsuarioProvider = ({ children }: { children: ReactNode }) => {
    const [usuario, setUsuarioState] = useState<Usuario | null>(null)
    const [inicializado, setInicializado] = useState(false)
    const authInitialized = useRef(false)

    // Lee el cache del localStorage ANTES del primer paint del navegador.
    // No puede hacerse en useState lazy porque en Next.js SSR ese código corre
    // en el servidor (window === undefined) y React usa el resultado del servidor
    // durante la hidratación, ignorando el localStorage del cliente.
    useLayoutEffect(() => {
        const u = leerUsuarioCacheInicial()
        if (u) {
            setUsuarioState(u)
            setInicializado(true)
        }
    }, [])

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
                // getSession() puede dar null TRANSITORIO justo al cargar
                // (el cliente Supabase aun esta rehidratando/refrescando el
                // token). Si HAY token en storage, NO es logout: no borrar
                // cache ni marcar deslogueado (eso causaba "te saca y te mete
                // de nuevo"). onAuthStateChange (INITIAL_SESSION/SIGNED_IN/
                // TOKEN_REFRESHED) reintentara cargarUsuario cuando rehidrate.
                const hayToken = typeof window !== 'undefined' && (
                    !!localStorage.getItem('supabase.auth.token') ||
                    Object.keys(localStorage).some(k => k.startsWith('sb-') && k.includes('-auth-token'))
                )
                if (hayToken) return
                // Sin token => logout real: limpiar y finalizar.
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

            // Setear inmediatamente con datos básicos: el menú autenticado
            // aparece tan pronto como getSession() responde, sin esperar la BD.
            setUsuario(usuarioBasico)
            setInicializado(true)

            // Enriquecer en segundo plano con el perfil completo de la BD
            try {
                const { data: perfil, error: perfilError } = await Promise.race([fetchPerfil(), timeoutPromise])
                if (perfil && !perfilError) {
                    setUsuario({
                        ...usuarioBasico,
                        ...perfil,
                        nombre: perfil.nombre || perfil.nombre_completo || usuarioBasico.nombre
                    })
                }
            } catch (err) {
                // usuarioBasico ya está activo, no hay nada que hacer
            }

        } catch (error) {
            setUsuario(null)
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

        // 1. La carga optimista del cache ya se hizo en el render inicial
        //    (leerUsuarioCacheInicial en el useState lazy) => sin flash.

        // 2. Carga real (refresca sesion/perfil desde Supabase)
        cargarUsuario()

        // 3. Listener de cambios
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                if (session?.user) {
                    cargarUsuario()
                    const creadoHace = Date.now() - new Date(session.user.created_at).getTime()
                    // Flag local: evita el 2do envío (SIGNED_IN dispara varias veces al registrarse).
                    const flagBienvenida = 'bienvenida_' + session.user.id
                    if (creadoHace < 60000 && !localStorage.getItem(flagBienvenida)) {
                        localStorage.setItem(flagBienvenida, '1')
                        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
                            body: JSON.stringify({
                                tipo: 'bienvenida',
                                destinatario: session.user.email,
                                nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Estudiante'
                            })
                        }).catch(() => {})
                    }
                }
            } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                // INITIAL_SESSION: el cliente termino de rehidratar el token.
                // Recupera la sesion si getSession() dio null transitorio antes.
                if (session?.user) {
                    cargarUsuario()
                } else if (event === 'TOKEN_REFRESHED' && !session) {
                    // Refresh falló: limpiar token corrupto del storage para evitar 401s
                    supabase.auth.signOut({ scope: 'local' }).catch(() => {})
                    setUsuario(null)
                    setInicializado(true)
                }
            } else if (event === 'SIGNED_OUT') {
                setUsuario(null)
                setInicializado(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [cargarUsuario])

    // Memoizado: el value solo cambia cuando cambia `usuario` o `inicializado`
    // (los callbacks son estables con useCallback). Evita re-render en cascada
    // de todos los consumidores del contexto en cada render del provider.
    const value = useMemo<UsuarioContextType>(() => ({
        usuario,
        setUsuario,
        actualizarUsuario,
        cargarUsuario,
        cerrarSesion,
        estaAutenticado,
        esAdmin,
        esEstudiante,
        inicializado,
    }), [usuario, inicializado, setUsuario, actualizarUsuario, cargarUsuario, cerrarSesion, estaAutenticado, esAdmin, esEstudiante])

    return (
        <UsuarioContext.Provider value={value}>
            {children}
        </UsuarioContext.Provider>
    )
}

export const useUsuario = () => {
    const context = useContext(UsuarioContext)
    if (!context) throw new Error('useUsuario debe ser usado dentro de un UsuarioProvider')
    return context
}
