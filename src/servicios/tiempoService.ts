import { supabase } from './clienteSupabase';

// 🕒 Servicio para tracking de tiempo en la plataforma
export class TiempoService {
    private static sesionIniciada: Date | null = null;
    private static tiempoAcumulado: number = 0;
    private static intervaloGuardado: NodeJS.Timeout | null = null;
    private static paginaActual: string = '';
    private static tiempoInicialPagina: Date | null = null;

    // 🚀 Iniciar sesión de tiempo
    static iniciarSesion(usuarioId: string) {
        if (typeof window === 'undefined') return;

        console.log('⏱️ Iniciando tracking de tiempo para:', usuarioId);

        this.sesionIniciada = new Date();
        this.tiempoAcumulado = 0;

        // Guardar cada 30 segundos
        this.intervaloGuardado = setInterval(() => {
            this.guardarTiempoSesion(usuarioId);
        }, 30000);

        // Guardar al cerrar la página
        window.addEventListener('beforeunload', () => {
            this.finalizarSesion(usuarioId);
        });

        // Guardar al cambiar de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pausarSesion();
            } else {
                this.reanudarSesion();
            }
        });
    }

    // ⏸️ Pausar sesión (cuando se oculta la pestaña)
    static pausarSesion() {
        if (this.sesionIniciada) {
            const tiempoActual = new Date().getTime() - this.sesionIniciada.getTime();
            this.tiempoAcumulado += Math.floor(tiempoActual / 1000 / 60); // En minutos
            this.sesionIniciada = null;
        }
    }

    // ▶️ Reanudar sesión 
    static reanudarSesion() {
        if (!this.sesionIniciada) {
            this.sesionIniciada = new Date();
        }
    }

    // 📄 Trackear tiempo en página específica
    static iniciarTiempoPagina(ruta: string) {
        // Guardar tiempo de página anterior
        if (this.paginaActual && this.tiempoInicialPagina) {
            const tiempoEnPagina = new Date().getTime() - this.tiempoInicialPagina.getTime();
            const minutosEnPagina = Math.floor(tiempoEnPagina / 1000 / 60);

            if (minutosEnPagina > 0) {
                this.guardarTiempoPagina(this.paginaActual, minutosEnPagina);
            }
        }

        // Iniciar nueva página
        this.paginaActual = ruta;
        this.tiempoInicialPagina = new Date();
    }

    // 💾 Guardar tiempo de sesión en BD
    static async guardarTiempoSesion(usuarioId: string) {
        if (!this.sesionIniciada) return;

        const tiempoActual = new Date().getTime() - this.sesionIniciada.getTime();
        const minutosActuales = Math.floor(tiempoActual / 1000 / 60);
        const totalMinutos = this.tiempoAcumulado + minutosActuales;

        if (totalMinutos <= 0) return;

        try {
            const { error } = await supabase
                .from('sesiones_usuario')
                .upsert({
                    usuario_id: usuarioId,
                    fecha: new Date().toISOString().split('T')[0],
                    tiempo_total_minutos: totalMinutos,
                    ultima_actividad: new Date().toISOString(),
                    ruta_actual: this.paginaActual
                }, {
                    onConflict: 'usuario_id,fecha'
                });

            if (!error) {
                console.log('💾 Tiempo guardado:', totalMinutos, 'minutos');
            }
        } catch (error) {
            console.error('❌ Error guardando tiempo:', error);
        }
    }

    // 📄 Guardar tiempo por página
    static async guardarTiempoPagina(ruta: string, minutos: number) {
        // Implementar si necesitas tracking granular por página
        console.log(`📄 Tiempo en ${ruta}: ${minutos} minutos`);
    }

    // 🔚 Finalizar sesión
    static async finalizarSesion(usuarioId: string) {
        if (this.intervaloGuardado) {
            clearInterval(this.intervaloGuardado);
            this.intervaloGuardado = null;
        }

        await this.guardarTiempoSesion(usuarioId);

        this.sesionIniciada = null;
        this.tiempoAcumulado = 0;
        this.paginaActual = '';
        this.tiempoInicialPagina = null;
    }

    // 📊 Obtener tiempo total del usuario (esta semana)
    static async obtenerTiempoSemanal(usuarioId: string): Promise<number> {
        const fechaHaceUnaSemana = new Date();
        fechaHaceUnaSemana.setDate(fechaHaceUnaSemana.getDate() - 7);

        try {
            // 1. Tiempo en lecciones de cursos
            const { data: tiempoLecciones } = await supabase
                .from('progreso_lecciones')
                .select('tiempo_total')
                .eq('usuario_id', usuarioId)
                .gte('updated_at', fechaHaceUnaSemana.toISOString());

            // 2. Tiempo en tutoriales
            const { data: tiempoTutoriales } = await supabase
                .from('progreso_tutorial')
                .select('tiempo_visto')
                .eq('usuario_id', usuarioId)
                .gte('ultimo_acceso', fechaHaceUnaSemana.toISOString());

            // 3. Tiempo en simulador
            const { data: tiempoSimulador } = await supabase
                .from('sesiones_simulador_acordeon')
                .select('duracion_minutos')
                .eq('usuario_id', usuarioId)
                .gte('created_at', fechaHaceUnaSemana.toISOString());

            // 4. Tiempo total en plataforma (sesiones)
            const { data: tiempoSesiones } = await supabase
                .from('sesiones_usuario')
                .select('tiempo_total_minutos')
                .eq('usuario_id', usuarioId)
                .gte('fecha', fechaHaceUnaSemana.toISOString().split('T')[0]);

            // Calcular totales
            const totalLecciones = tiempoLecciones?.reduce((sum: number, item: any) => sum + (item.tiempo_total || 0), 0) || 0;
            const totalTutoriales = tiempoTutoriales?.reduce((sum: number, item: any) => sum + (item.tiempo_visto || 0), 0) || 0;
            const totalSimulador = tiempoSimulador?.reduce((sum: number, item: any) => sum + (item.duracion_minutos || 0), 0) || 0;
            const totalSesiones = tiempoSesiones?.reduce((sum: number, item: any) => sum + (item.tiempo_total_minutos || 0), 0) || 0;

            // Usar el mayor entre tiempo específico y tiempo total de sesiones
            const tiempoEspecifico = totalLecciones + totalTutoriales + totalSimulador;
            const tiempoFinal = Math.max(tiempoEspecifico, totalSesiones);

            console.log('⏱️ Cálculo de tiempo semanal:', {
                lecciones: totalLecciones,
                tutoriales: totalTutoriales,
                simulador: totalSimulador,
                sesiones: totalSesiones,
                final: tiempoFinal
            });

            return tiempoFinal;

        } catch (error) {
            console.error('❌ Error calculando tiempo semanal:', error);
            return 0;
        }
    }

    // 📈 Obtener estadísticas detalladas de tiempo
    static async obtenerEstadisticasDetalladas(usuarioId: string) {
        const fechaHaceUnMes = new Date();
        fechaHaceUnMes.setDate(fechaHaceUnMes.getDate() - 30);

        try {
            const { data: sesiones } = await supabase
                .from('sesiones_usuario')
                .select('fecha, tiempo_total_minutos, ruta_actual')
                .eq('usuario_id', usuarioId)
                .gte('fecha', fechaHaceUnMes.toISOString().split('T')[0])
                .order('fecha', { ascending: false });

            const estadisticas = {
                tiempoTotalMes: sesiones?.reduce((sum: number, s: any) => sum + (s.tiempo_total_minutos || 0), 0) || 0,
                diasActivos: sesiones?.length || 0,
                promedioMinutosPorDia: 0,
                paginaMasVisitada: 'Dashboard',
                sesionMasLarga: Math.max(...(sesiones?.map((s: any) => s.tiempo_total_minutos || 0) || [0]))
            };

            if (estadisticas.diasActivos > 0) {
                estadisticas.promedioMinutosPorDia = Math.round(estadisticas.tiempoTotalMes / estadisticas.diasActivos);
            }

            return estadisticas;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

// 📋 Crear tabla de sesiones (SQL para ejecutar en Supabase)
export const SQL_CREAR_TABLA_SESIONES = `
CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tiempo_total_minutos INTEGER DEFAULT 0,
  ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ruta_actual TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(usuario_id, fecha)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_fecha ON sesiones_usuario(usuario_id, fecha);
CREATE INDEX IF NOT EXISTS idx_sesiones_ultima_actividad ON sesiones_usuario(ultima_actividad);
`;

