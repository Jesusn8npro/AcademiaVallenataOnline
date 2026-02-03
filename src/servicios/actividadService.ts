import { supabase } from './supabaseCliente';

export interface UsuarioActivo {
    usuario_id: string;
    perfiles: {
        id: string;
        nombre: string;
        apellido: string;
        url_foto_perfil: string;
        rol: string;
        nivel_habilidad?: string;
        suscripcion?: string;
    };
    ultima_actividad: string;
    pagina_actual: string;
    tiempo_sesion_actual: number;
    esta_activo: boolean;
    tipo_actividad: string;
    tiempo_total_minutos: number;
    origen: string;
    estado_visual: 'online' | 'reciente' | 'hoy' | 'semana' | 'desconectado' | 'offline';
    es_datos_reales: boolean;
    minutos_desde_actividad?: number;
}

export const actividadService = {
    /**
     * Carga la actividad en tiempo real de los usuarios
     */
    async cargarActividadTiempoReal(): Promise<UsuarioActivo[]> {
        try {
            console.log('🔄 [ADMIN] Cargando actividad en tiempo real...');

            const ahora = new Date();
            const hace2Horas = new Date(ahora.getTime() - 2 * 60 * 60 * 1000); // 2 horas atrás
            const hace30Min = new Date(ahora.getTime() - 30 * 60 * 1000);

            // 1. Obtener sesiones activas desde la tabla 'sesiones_usuario'
            // Nota: En React usamos select con join explícito si es necesario, pero Supabase js client maneja esto
            const { data: usuariosSesionActiva, error: errorSesion } = await supabase
                .from('sesiones_usuario')
                .select(`
                    usuario_id,
                    ultima_actividad,
                    pagina_actual,
                    esta_activo,
                    tiempo_sesion_actual,
                    tiempo_total_minutos,
                    sesiones_totales,
                    perfiles:usuario_id (
                        id,
                        nombre,
                        apellido,
                        url_foto_perfil,
                        rol
                    )
                `)
                .eq('esta_activo', true)
                .gte('ultima_actividad', hace2Horas.toISOString())
                .order('ultima_actividad', { ascending: false })
                .limit(25);

            if (errorSesion) {
                console.error('❌ [ADMIN] Error obteniendo usuarios activos:', errorSesion);
                throw errorSesion;
            }

            // 2. Obtener sesiones recientes (como respaldo)
            let sesionesActivas: any[] = [];
            try {
                const { data: sesiones } = await supabase
                    .from('sesiones_usuario')
                    .select(`
                        *,
                        perfiles:usuario_id (
                            id,
                            nombre,
                            apellido,
                            url_foto_perfil,
                            rol
                        )
                    `)
                    .eq('esta_activo', true)
                    .gte('ultima_actividad', hace30Min.toISOString())
                    .order('ultima_actividad', { ascending: false });

                if (sesiones) {
                    sesionesActivas = sesiones;
                }
            } catch (error) {
                console.warn('⚠️ [ADMIN] Error secundario al obtener sesiones:', error);
            }

            // 3. Procesar y combinar datos
            const usuariosFinales = new Map<string, UsuarioActivo>();

            const procesarUsuario = (sesion: any, esRespaldo: boolean = false) => {
                if (!sesion.perfiles) return;

                const fechaActividad = new Date(sesion.ultima_actividad);
                const minutosDesdeUpdate = Math.floor((ahora.getTime() - fechaActividad.getTime()) / (1000 * 60));

                // Lógica de estado
                const esActivoAhora = minutosDesdeUpdate <= 5;
                const esActivoReciente = minutosDesdeUpdate <= 30;

                let paginaAmigable = sesion.pagina_actual || '/panel-estudiante';
                if (paginaAmigable.includes('/panel-estudiante')) paginaAmigable = 'Panel Estudiante';
                else if (paginaAmigable.includes('/cursos')) paginaAmigable = 'Cursos';
                else if (paginaAmigable.includes('/tutoriales')) paginaAmigable = 'Tutoriales';
                else if (paginaAmigable.includes('/simulador')) paginaAmigable = 'Simulador';
                else if (paginaAmigable.includes('/comunidad')) paginaAmigable = 'Comunidad';
                else if (paginaAmigable === '/') paginaAmigable = 'Inicio';

                const usuarioProcesado: UsuarioActivo = {
                    usuario_id: sesion.usuario_id,
                    ultima_actividad: sesion.ultima_actividad,
                    pagina_actual: paginaAmigable,
                    tiempo_sesion_actual: sesion.tiempo_sesion_actual || Math.max(1, 60 - minutosDesdeUpdate),
                    esta_activo: sesion.esta_activo && esActivoReciente,
                    perfiles: sesion.perfiles,
                    tipo_actividad: esActivoAhora ? 'En línea ahora' :
                        esActivoReciente ? `Hace ${minutosDesdeUpdate}m` :
                            'Conectado recientemente',
                    tiempo_total_minutos: sesion.tiempo_total_minutos || 0,
                    origen: 'sesiones_usuario',
                    estado_visual: esActivoAhora ? 'online' : esActivoReciente ? 'reciente' : 'offline',
                    es_datos_reales: true,
                    minutos_desde_actividad: minutosDesdeUpdate
                };

                if (!usuariosFinales.has(sesion.usuario_id)) {
                    usuariosFinales.set(sesion.usuario_id, usuarioProcesado);
                }
            };

            // Procesar lista principal
            usuariosSesionActiva?.forEach(u => procesarUsuario(u));

            // Procesar lista de respaldo (si no están ya)
            sesionesActivas?.forEach(u => procesarUsuario(u, true));

            // 4. Convertir a array y ordenar
            const listaOrdenada = Array.from(usuariosFinales.values())
                .sort((a, b) => {
                    // 1. Online primero
                    if (a.estado_visual === 'online' && b.estado_visual !== 'online') return -1;
                    if (a.estado_visual !== 'online' && b.estado_visual === 'online') return 1;

                    // 2. Activos recientes
                    if (a.esta_activo && !b.esta_activo) return -1;
                    if (!a.esta_activo && b.esta_activo) return 1;

                    // 3. Por fecha
                    return new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime();
                })
                .slice(0, 15); // Top 15

            return listaOrdenada;

        } catch (error) {
            console.error('❌ [ADMIN] Error fatal cargando actividad:', error);
            return [];
        }
    },

    /**
     * Carga los alumnos activos para mostrar en el dashboard y estadísticas
     */
    async cargarAlumnosActivos() {
        try {
            console.log('🔄 [ADMIN] Cargando alumnos recientes...');
            const ahora = new Date();
            const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

            // 1. Obtener actividad reciente
            const { data: estudiantesActivos } = await supabase
                .from('sesiones_usuario')
                .select(`
                    usuario_id,
                    ultima_actividad,
                    pagina_actual,
                    esta_activo,
                    tiempo_sesion_actual,
                    tiempo_total_minutos,
                    sesiones_totales,
                    perfiles:usuario_id (
                        id,
                        nombre,
                        apellido,
                        url_foto_perfil,
                        nivel_habilidad,
                        suscripcion,
                        rol
                    )
                `)
                .gte('ultima_actividad', hace7Dias.toISOString())
                .order('ultima_actividad', { ascending: false })
                .limit(50);

            // 2. Obtener inscripciones para métricas de progreso
            const { data: datosInscripciones } = await supabase
                .from('inscripciones')
                .select(`
                    usuario_id,
                    progreso,
                    porcentaje_completado,
                    completado,
                    ultima_actividad,
                    created_at
                `)
                .not('ultima_actividad', 'is', null);

            // 3. Combinar datos
            const usuariosMap = new Map();

            estudiantesActivos?.forEach((sesion: any) => {
                if (sesion.perfiles && sesion.perfiles.rol === 'estudiante') {
                    const minutosMap = Math.floor((ahora.getTime() - new Date(sesion.ultima_actividad).getTime()) / (1000 * 60));

                    // Determinar estado visual
                    let estado_visual: 'online' | 'reciente' | 'hoy' | 'semana' | 'desconectado' = 'desconectado';
                    let estado_texto = 'Desconectado';

                    if (sesion.esta_activo && minutosMap <= 5) {
                        estado_visual = 'online';
                        estado_texto = 'En línea ahora';
                    } else if (sesion.esta_activo && minutosMap <= 30) {
                        estado_visual = 'reciente';
                        estado_texto = `Hace ${minutosMap}m`;
                    } else if (minutosMap < 60 * 24) {
                        estado_visual = 'hoy';
                        estado_texto = `Hace ${Math.floor(minutosMap / 60)}h`;
                    } else {
                        estado_visual = 'semana';
                        estado_texto = `Hace ${Math.floor(minutosMap / (60 * 24))}d`;
                    }

                    if (!usuariosMap.has(sesion.usuario_id)) {
                        usuariosMap.set(sesion.usuario_id, {
                            usuario_id: sesion.usuario_id,
                            perfiles: sesion.perfiles,
                            ultima_actividad: sesion.ultima_actividad,
                            tiempo_total_minutos: sesion.tiempo_total_minutos || 0,
                            inscripciones_count: 0,
                            porcentaje_total: 0,
                            cursos_completados: 0,
                            esta_activo: sesion.esta_activo,
                            estado_visual,
                            estado_texto,
                            origen: 'sesiones_usuario'
                        });
                    }
                }
            });

            // Enriquecer con inscripciones
            datosInscripciones?.forEach((insc: any) => {
                if (usuariosMap.has(insc.usuario_id)) {
                    const u = usuariosMap.get(insc.usuario_id);
                    u.inscripciones_count++;
                    u.porcentaje_total += (insc.porcentaje_completado || 0);
                    u.cursos_completados += (insc.completado ? 1 : 0);

                    // Actualizar última actividad si es más reciente
                    if (insc.ultima_actividad && new Date(insc.ultima_actividad) > new Date(u.ultima_actividad)) {
                        u.ultima_actividad = insc.ultima_actividad;
                    }
                }
            });

            // 4. Convertir a array final
            return Array.from(usuariosMap.values())
                .map((u: any) => ({
                    ...u,
                    sesiones_totales: Math.max(1, u.inscripciones_count),
                    porcentaje_promedio: u.inscripciones_count > 0 ? Math.round(u.porcentaje_total / u.inscripciones_count) : 0
                }))
                .sort((a: any, b: any) => {
                    const priorities: Record<string, number> = { online: 4, reciente: 3, hoy: 2, semana: 1, desconectado: 0 };
                    const diff = (priorities[b.estado_visual] || 0) - (priorities[a.estado_visual] || 0);
                    if (diff !== 0) return diff;
                    return new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime();
                })
                .slice(0, 12);

        } catch (error) {
            console.error('❌ [ADMIN] Error cargando alumnos activos:', error);
            return [];
        }
    }
};
