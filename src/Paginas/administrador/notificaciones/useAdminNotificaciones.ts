import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import {
    crearNotificacion,
    limpiarNotificacionesExpiradas,
    obtenerEstadisticasNotificaciones,
    type TipoEvento
} from '../../../servicios/generadorNotificaciones';

export type VistaNotif = 'enviadas' | 'crear' | 'estadisticas';

export function useAdminNotificaciones() {
    const [vista, setVista] = useState<VistaNotif>('enviadas');
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error'>('exito');
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [pedirConfirmacionLimpiar, setPedirConfirmacionLimpiar] = useState(false);
    const [enviadas, setEnviadas] = useState<any[]>([]);
    const [cargandoEnviadas, setCargandoEnviadas] = useState(false);
    const [grupoAEliminar, setGrupoAEliminar] = useState<{ grupo: string; titulo: string; total: number } | null>(null);
    const [detalle, setDetalle] = useState<{ grupo: string; titulo: string; destinatarios: any[] } | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const [formManual, setFormManual] = useState({
        tipo: 'nuevo_curso' as TipoEvento,
        mensaje: '',
        url_accion: '',
        usuario_id: ''
    });

    useEffect(() => { cargarEstadisticas(); cargarEnviadas(); }, []);

    const mostrarMensaje = (texto: string, tipo: 'exito' | 'error') => {
        setMensaje(texto);
        setTipoMensaje(tipo);
        setTimeout(() => setMensaje(''), 5000);
    };

    const cargarEstadisticas = async () => {
        const { exito, estadisticas: stats } = await obtenerEstadisticasNotificaciones();
        if (exito) setEstadisticas(stats);
    };

    // Notificaciones enviadas agrupadas por envío (RPC admin SECURITY DEFINER).
    const cargarEnviadas = async () => {
        setCargandoEnviadas(true);
        const { data, error } = await supabase.rpc('admin_listar_notificaciones_enviadas', { p_limite: 100 });
        if (!error) setEnviadas(data || []);
        setCargandoEnviadas(false);
    };

    // Ver a quién se le envió la notificación (lista de destinatarios).
    const verDestinatarios = async (grupo: string, titulo: string) => {
        setDetalle({ grupo, titulo, destinatarios: [] });
        setCargandoDetalle(true);
        const { data, error } = await supabase.rpc('admin_listar_destinatarios_notificacion', { p_grupo: grupo });
        if (error) { mostrarMensaje(`❌ Error: ${error.message}`, 'error'); setDetalle(null); }
        else setDetalle({ grupo, titulo, destinatarios: data || [] });
        setCargandoDetalle(false);
    };
    const cerrarDetalle = () => setDetalle(null);

    const solicitarEliminarGrupo = (grupo: string, titulo: string, total: number) => setGrupoAEliminar({ grupo, titulo, total });
    const cancelarEliminarGrupo = () => setGrupoAEliminar(null);

    const confirmarEliminarGrupo = async () => {
        if (!grupoAEliminar) return;
        const { grupo } = grupoAEliminar;
        setGrupoAEliminar(null);
        setCargando(true);
        const { data, error } = await supabase.rpc('admin_eliminar_notificaciones_grupo', { p_grupo: grupo });
        if (error) mostrarMensaje(`❌ Error: ${error.message}`, 'error');
        else mostrarMensaje(`🗑️ Notificación eliminada de ${data ?? 0} usuarios`, 'exito');
        await cargarEnviadas();
        await cargarEstadisticas();
        setCargando(false);
    };

    const enviarNotificacionManual = async () => {
        if (!formManual.mensaje.trim()) { mostrarMensaje('El mensaje es requerido', 'error'); return; }
        setCargando(true);
        const resultado = await crearNotificacion({
            tipo: formManual.tipo,
            mensaje: formManual.mensaje,
            url_accion: formManual.url_accion || undefined,
            usuario_id: formManual.usuario_id || undefined,
            datos_adicionales: { manual: true }
        });
        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación enviada a ${resultado.notificaciones_creadas} usuario(s)`, 'exito');
            setFormManual(prev => ({ ...prev, mensaje: '', url_accion: '', usuario_id: '' }));
            await cargarEstadisticas();
            await cargarEnviadas();
            setVista('enviadas');
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }
        setCargando(false);
    };

    const solicitarLimpiarExpiradas = () => setPedirConfirmacionLimpiar(true);
    const cancelarLimpiarExpiradas = () => setPedirConfirmacionLimpiar(false);

    const confirmarLimpiarExpiradas = async () => {
        setPedirConfirmacionLimpiar(false);
        setCargando(true);
        const resultado = await limpiarNotificacionesExpiradas();
        if (resultado.exito) { mostrarMensaje(`🧹 ${resultado.eliminadas} notificaciones expiradas eliminadas`, 'exito'); await cargarEstadisticas(); await cargarEnviadas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    return {
        vista, setVista,
        cargando, mensaje, tipoMensaje, estadisticas,
        pedirConfirmacionLimpiar,
        enviadas, cargandoEnviadas, cargarEnviadas,
        grupoAEliminar, solicitarEliminarGrupo, cancelarEliminarGrupo, confirmarEliminarGrupo,
        detalle, cargandoDetalle, verDestinatarios, cerrarDetalle,
        formManual, setFormManual,
        enviarNotificacionManual,
        solicitarLimpiarExpiradas, cancelarLimpiarExpiradas, confirmarLimpiarExpiradas,
        cargarEstadisticas
    };
}
