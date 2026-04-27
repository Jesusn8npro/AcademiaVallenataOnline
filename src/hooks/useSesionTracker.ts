import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../servicios/clienteSupabase';

export const useSesionTracker = (usuarioId: string | null) => {
  const location = useLocation();

  useEffect(() => {
    if (!usuarioId) return;

    // Función para registrar la sesión
    const registrarSesion = async () => {
      try {
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0]; // Formato: YYYY-MM-DD

        const { error } = await supabase
          .from('sesiones_usuario')
          .upsert(
            {
              usuario_id: usuarioId,
              fecha,
              ultima_actividad: ahora.toISOString(),
              pagina_actual: location.pathname,
              esta_activo: true,
            },
            {
              onConflict: 'usuario_id,fecha',
            }
          );

      } catch (err) {
      }
    };

    // Registrar inmediatamente cuando cambia la página
    registrarSesion();

    // Heartbeat: registrar cada 2 minutos
    const heartbeatInterval = setInterval(() => {
      registrarSesion();
    }, 2 * 60 * 1000); // 2 minutos

    // Al desmontar: marcar como inactivo
    const handleBeforeUnload = async () => {
      try {
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];

        await supabase
          .from('sesiones_usuario')
          .update({
            esta_activo: false,
            ultima_actividad: ahora.toISOString(),
          })
          .eq('usuario_id', usuarioId)
          .eq('fecha', fecha);

      } catch (err) {
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [usuarioId, location.pathname]);
};
