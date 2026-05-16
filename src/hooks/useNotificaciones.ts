import { useState, useEffect, useCallback } from 'react';
import { notificacionesService } from '../servicios/notificacionesService';
import type { Notificacion } from '../servicios/notificacionesService';

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const cargar = async () => {
      const { notificaciones: data } = await notificacionesService.obtenerNotificaciones({ limite: 20 });
      if (!cancelled) {
        setNotificaciones(data);
        setNoLeidas(data.filter(n => !n.leida).length);
        setCargando(false);
      }
    };

    cargar();

    const unsubPromise = notificacionesService.suscribirseANotificaciones((nueva) => {
      setNotificaciones(prev => [nueva, ...prev]);
      setNoLeidas(n => n + 1);
    });

    return () => {
      cancelled = true;
      unsubPromise.then(unsub => unsub());
    };
  }, []);

  const marcarLeida = useCallback(async (id: string) => {
    await notificacionesService.marcarComoLeida([id]);
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await notificacionesService.marcarTodasComoLeidas();
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  }, []);

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, cargando };
}
