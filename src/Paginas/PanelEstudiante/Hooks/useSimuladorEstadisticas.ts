import { useState, useEffect } from 'react';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { GamificacionServicio as GamificacionService, type RankingGlobal } from '../../../servicios/gamificacionServicio';
import { calcularTiempoHistoricoRapido, formatearTiempo } from './useLogrosDesafios';

export { formatearTiempo };

export function useSimuladorEstadisticas() {
    const { usuario } = useUsuario();
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
    const [estadisticasReales, setEstadisticasReales] = useState<any[]>([]);

    useEffect(() => {
        const cargar = async () => {
            if (!usuario?.id) { setCargandoEstadisticas(false); return; }
            try {
                const [ranking, tiempoHistorico] = await Promise.all([
                    GamificacionService.obtenerRanking('general', 50).catch(() => []),
                    calcularTiempoHistoricoRapido(usuario.id)
                ]);

                const miRanking = (ranking as RankingGlobal[]).find(r => r.usuario_id === usuario.id);
                const puntosFinales = miRanking?.puntuacion || 0;

                setEstadisticasReales([
                    { icono: '📚', valor: '0', label: 'Lecciones' },
                    { icono: '⏱️', valor: formatearTiempo(tiempoHistorico), label: 'Estudiando' },
                    { icono: '🔥', valor: '0', label: 'Racha' },
                    { icono: '💎', valor: puntosFinales.toString(), label: 'Puntos' }
                ]);
            } catch {
                // keep defaults
            } finally {
                setCargandoEstadisticas(false);
            }
        };
        cargar();
    }, [usuario]);

    return { cargandoEstadisticas, estadisticasReales };
}
