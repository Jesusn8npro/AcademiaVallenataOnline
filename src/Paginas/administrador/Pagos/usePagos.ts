import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';

export interface Pago {
    id: string;
    ref_payco: string;
    usuario_id: string;
    curso_id?: string;
    tutorial_id?: string;
    nombre_producto: string;
    valor: number;
    estado: string;
    metodo_pago?: string;
    created_at: string;
    perfiles?: { nombre: string; apellido: string; correo_electronico: string };
    cursos?: { titulo: string };
    tutoriales?: { titulo: string };
}

export const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatearValor = (valor: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

export const obtenerClaseBadgeEstado = (estado: string) => {
    const clases: Record<string, string> = { aceptada: 'academia-badge-aceptada', rechazada: 'academia-badge-rechazada', pendiente: 'academia-badge-pendiente', fallida: 'academia-badge-fallida', cancelada: 'academia-badge-cancelada' };
    return `academia-badge ${clases[estado] || 'academia-badge-cancelada'}`;
};

export const obtenerIconoEstado = (estado: string) => {
    const iconos: Record<string, string> = { aceptada: '✅', rechazada: '❌', pendiente: '⏳', fallida: '💥', cancelada: '🚫' };
    return iconos[estado] || '❓';
};

export const truncarReferencia = (ref: string) =>
    !ref ? '' : ref.length > 20 ? `${ref.substring(0, 10)}...${ref.substring(ref.length - 6)}` : ref;

export function usePagos() {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [buscarRef, setBuscarRef] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [vistaActual, setVistaActual] = useState<'tabla' | 'cards'>('tabla');
    const [confirmando, setConfirmando] = useState<Record<string, boolean>>({});
    const [mensajesConfirmacion, setMensajesConfirmacion] = useState<Record<string, string>>({});
    const [estadisticas, setEstadisticas] = useState({ total: 0, aceptada: 0, pendiente: 0, rechazada: 0, fallida: 0, valorTotal: 0 });
    const [mensajeAccion, setMensajeAccion] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);
    const [confirmarCambioEstado, setConfirmarCambioEstado] = useState<{ refPayco: string; nuevoEstado: string } | null>(null);
    const [pedirConfirmacionSincronizar, setPedirConfirmacionSincronizar] = useState(false);

    useEffect(() => {
        if (window.innerWidth < 768) setVistaActual('cards');
        const handleResize = () => { if (window.innerWidth < 768 && vistaActual === 'tabla') setVistaActual('cards'); };
        window.addEventListener('resize', handleResize);
        cargarPagos();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calcularEstadisticas = (pagosData: Pago[]) => {
        setEstadisticas({
            total: pagosData.length,
            aceptada: pagosData.filter(p => p.estado === 'aceptada').length,
            pendiente: pagosData.filter(p => p.estado === 'pendiente').length,
            rechazada: pagosData.filter(p => p.estado === 'rechazada').length,
            fallida: pagosData.filter(p => p.estado === 'fallida').length,
            valorTotal: pagosData.reduce((sum, p) => sum + (parseFloat(p.valor.toString()) || 0), 0)
        });
    };

    const cargarPagos = async () => {
        setCargando(true);
        try {
            const { data: todosPagos, error } = await supabase.from('pagos_epayco').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            let pagosFiltrados = todosPagos || [];
            if (filtroEstado !== 'todos') pagosFiltrados = pagosFiltrados.filter((p: Pago) => p.estado === filtroEstado);
            if (buscarRef.trim()) pagosFiltrados = pagosFiltrados.filter((p: Pago) => p.ref_payco?.toLowerCase().includes(buscarRef.trim().toLowerCase()));

            const pagosEnriquecidos = [];
            for (const pago of pagosFiltrados) {
                const pe: any = { ...pago };
                if (pago.usuario_id) { try { const { data } = await supabase.from('perfiles').select('nombre, apellido, correo_electronico').eq('id', pago.usuario_id).single(); if (data) pe.perfiles = data; } catch {} }
                if (pago.curso_id) { try { const { data } = await supabase.from('cursos').select('titulo').eq('id', pago.curso_id).single(); if (data) pe.cursos = data; } catch {} }
                if (pago.tutorial_id) { try { const { data } = await supabase.from('tutoriales').select('titulo').eq('id', pago.tutorial_id).single(); if (data) pe.tutoriales = data; } catch {} }
                pagosEnriquecidos.push(pe);
            }
            setPagos(pagosEnriquecidos);
            calcularEstadisticas(pagosEnriquecidos);
        } catch {
            setPagos([]);
        } finally {
            setCargando(false);
        }
    };

    const confirmarPagoManualmente = async (refPayco: string) => {
        setConfirmando(prev => ({ ...prev, [refPayco]: true }));
        setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: 'Confirmando...' }));
        try {
            const { error } = await supabase.from('pagos_epayco').update({ estado: 'aceptada', updated_at: new Date().toISOString() }).eq('ref_payco', refPayco);
            if (error) throw error;
            await inscribirUsuarioManual(refPayco);
            setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: '✅ Pago confirmado e inscripción procesada' }));
            await cargarPagos();
        } catch {
            setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: '❌ Error al confirmar pago' }));
        } finally {
            setConfirmando(prev => ({ ...prev, [refPayco]: false }));
            setTimeout(() => setMensajesConfirmacion(prev => ({ ...prev, [refPayco]: '' })), 5000);
        }
    };

    const solicitarCambioEstado = (refPayco: string, nuevoEstado: string) => {
        setConfirmarCambioEstado({ refPayco, nuevoEstado });
    };

    const ejecutarCambioEstado = async () => {
        if (!confirmarCambioEstado) return;
        const { refPayco, nuevoEstado } = confirmarCambioEstado;
        setConfirmarCambioEstado(null);
        try {
            const { error } = await supabase.from('pagos_epayco').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('ref_payco', refPayco);
            if (error) throw error;
            if (nuevoEstado === 'aceptada') await inscribirUsuarioManual(refPayco);
            await cargarPagos();
            setMensajeAccion({ texto: `Estado cambiado a "${nuevoEstado}" exitosamente`, tipo: 'exito' });
            setTimeout(() => setMensajeAccion(null), 3000);
        } catch {
            setMensajeAccion({ texto: 'Error al cambiar el estado', tipo: 'error' });
        }
    };

    const inscribirUsuarioManual = async (refPayco: string) => {
        try {
            const { data: pago } = await supabase.from('pagos_epayco').select('*').eq('ref_payco', refPayco).single();
            if (!pago) return;
            if (pago.curso_id) {
                await supabase.from('inscripciones').upsert({ usuario_id: pago.usuario_id, curso_id: pago.curso_id, fecha_inscripcion: new Date().toISOString(), completado: false, progreso: 0, tipo_acceso: 'pagado', pago_id: pago.id }, { onConflict: 'usuario_id,curso_id' });
            }
            if (pago.tutorial_id) {
                await supabase.from('progreso_tutorial').upsert({ usuario_id: pago.usuario_id, tutorial_id: pago.tutorial_id, completado: false, ultimo_acceso: new Date().toISOString(), tiempo_visto: 0, fecha_inicio: new Date().toISOString() }, { onConflict: 'usuario_id,tutorial_id' });
            }
        } catch { /* error no fatal */ }
    };

    const resetearFiltros = () => { setFiltroEstado('todos'); setBuscarRef(''); cargarPagos(); };

    const solicitarSincronizar = () => setPedirConfirmacionSincronizar(true);
    const cancelarSincronizar = () => setPedirConfirmacionSincronizar(false);

    const ejecutarSincronizar = async () => {
        setPedirConfirmacionSincronizar(false);
        setCargando(true);
        let actualizados = 0;
        let totales = 0;
        try {
            const { data: pagosPendientes, error } = await supabase.from('pagos_epayco').select('*').eq('estado', 'pendiente');
            if (error) throw error;
            if (!pagosPendientes || pagosPendientes.length === 0) {
                setMensajeAccion({ texto: 'No hay pagos pendientes para sincronizar', tipo: 'exito' });
                return;
            }
            totales = pagosPendientes.length;
            const epaycoPublicKey = import.meta.env.VITE_EPAYCO_PUBLIC_KEY;
            for (const pago of pagosPendientes) {
                try {
                    const response = await fetch(`https://secure.epayco.co/validation/v1/reference/${pago.ref_payco}`, { method: 'GET', headers: { 'Authorization': `Bearer ${epaycoPublicKey}`, 'Content-Type': 'application/json' } });
                    if (!response.ok) continue;
                    const datos = await response.json();
                    if (datos.x_cod_response === '1' || datos.success) {
                        const { error: updateError } = await supabase.from('pagos_epayco').update({ estado: 'aceptada', updated_at: new Date().toISOString() }).eq('ref_payco', pago.ref_payco);
                        if (!updateError) { actualizados++; await inscribirUsuarioManual(pago.ref_payco); }
                    }
                } catch { /* continuar con el siguiente */ }
            }
            await cargarPagos();
            setMensajeAccion({ texto: `✅ Sincronización completada. Pagos actualizados: ${actualizados} de ${totales}`, tipo: 'exito' });
            setTimeout(() => setMensajeAccion(null), 6000);
        } catch {
            setMensajeAccion({ texto: '❌ Error durante la sincronización', tipo: 'error' });
        } finally {
            setCargando(false);
        }
    };

    return {
        pagos, cargando, filtroEstado, setFiltroEstado, buscarRef, setBuscarRef,
        mostrarFiltros, setMostrarFiltros, vistaActual, setVistaActual,
        confirmando, mensajesConfirmacion, estadisticas,
        mensajeAccion, confirmarCambioEstado, cancelarCambioEstado: () => setConfirmarCambioEstado(null),
        pedirConfirmacionSincronizar,
        cargarPagos, confirmarPagoManualmente, solicitarCambioEstado, ejecutarCambioEstado,
        resetearFiltros, solicitarSincronizar, cancelarSincronizar, ejecutarSincronizar
    };
}
