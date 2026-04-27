import { useState, useEffect } from 'react';
import {
    crearNotificacion,
    notificarNuevoCurso,
    notificarNuevoTutorial,
    notificarPagoAprobado,
    notificarPromocionEspecial,
    limpiarNotificacionesExpiradas,
    obtenerEstadisticasNotificaciones,
    type TipoEvento
} from '../../../servicios/generadorNotificaciones';

export function useAdminNotificaciones() {
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error'>('exito');
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [pedirConfirmacionLimpiar, setPedirConfirmacionLimpiar] = useState(false);

    const [formManual, setFormManual] = useState({
        tipo: 'nuevo_curso' as TipoEvento,
        mensaje: '',
        url_accion: '',
        usuario_id: '',
        prioridad: 'normal'
    });

    const [formCurso, setFormCurso] = useState({ titulo: '', descripcion: '' });
    const [formTutorial, setFormTutorial] = useState({ titulo: '', descripcion: '' });
    const [formPago, setFormPago] = useState<{ usuario_id: string; monto: number; curso_titulo?: string }>({ usuario_id: '', monto: 0, curso_titulo: '' });
    const [formPromocion, setFormPromocion] = useState<{ titulo: string; descripcion: string; codigo: string; fecha_limite: string }>({ titulo: '', descripcion: '', codigo: '', fecha_limite: '' });

    useEffect(() => { cargarEstadisticas(); }, []);

    const cargarEstadisticas = async () => {
        const { exito, estadisticas: stats } = await obtenerEstadisticasNotificaciones();
        if (exito) setEstadisticas(stats);
    };

    const mostrarMensaje = (texto: string, tipo: 'exito' | 'error') => {
        setMensaje(texto);
        setTipoMensaje(tipo);
        setTimeout(() => setMensaje(''), 5000);
    };

    const enviarNotificacionManual = async () => {
        if (!formManual.mensaje.trim()) { mostrarMensaje('El mensaje es requerido', 'error'); return; }
        setCargando(true);
        const resultado = await crearNotificacion({ tipo: formManual.tipo, mensaje: formManual.mensaje, url_accion: formManual.url_accion || undefined, usuario_id: formManual.usuario_id || undefined, datos_adicionales: { manual: true } });
        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
            setFormManual(prev => ({ ...prev, mensaje: '', url_accion: '', usuario_id: '' }));
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }
        setCargando(false);
    };

    const probarNuevoCurso = async () => {
        if (!formCurso.titulo.trim()) { mostrarMensaje('El título del curso es requerido', 'error'); return; }
        setCargando(true);
        const resultado = await notificarNuevoCurso({ curso_id: 'curso-demo-' + Date.now(), titulo_curso: formCurso.titulo, descripcion_curso: formCurso.descripcion || 'Curso de demostración', creador_id: 'admin-demo' });
        if (resultado.exito) { mostrarMensaje(`✅ Notificación de curso enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito'); setFormCurso({ titulo: '', descripcion: '' }); await cargarEstadisticas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    const probarNuevoTutorial = async () => {
        if (!formTutorial.titulo.trim()) { mostrarMensaje('El título del tutorial es requerido', 'error'); return; }
        setCargando(true);
        const resultado = await notificarNuevoTutorial({ tutorial_id: 'tutorial-demo-' + Date.now(), titulo_tutorial: formTutorial.titulo, descripcion_tutorial: formTutorial.descripcion || 'Tutorial de demostración', creador_id: 'admin-demo' });
        if (resultado.exito) { mostrarMensaje(`✅ Notificación de tutorial enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito'); setFormTutorial({ titulo: '', descripcion: '' }); await cargarEstadisticas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    const probarPagoAprobado = async () => {
        if (!formPago.usuario_id.trim() || formPago.monto <= 0) { mostrarMensaje('Usuario ID y monto son requeridos', 'error'); return; }
        setCargando(true);
        const resultado = await notificarPagoAprobado({ usuario_id: formPago.usuario_id, transaccion_id: 'txn-demo-' + Date.now(), monto: formPago.monto, curso_titulo: formPago.curso_titulo || undefined });
        if (resultado.exito) { mostrarMensaje(`✅ Notificación de pago enviada`, 'exito'); setFormPago({ usuario_id: '', monto: 0, curso_titulo: '' }); await cargarEstadisticas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    const probarPromocionEspecial = async () => {
        if (!formPromocion.titulo.trim()) { mostrarMensaje('El título de la promoción es requerido', 'error'); return; }
        setCargando(true);
        const resultado = await notificarPromocionEspecial({ titulo_promocion: formPromocion.titulo, descripcion: formPromocion.descripcion || 'Promoción especial de demostración', codigo_descuento: formPromocion.codigo || undefined, fecha_limite: formPromocion.fecha_limite || undefined });
        if (resultado.exito) { mostrarMensaje(`✅ Promoción enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito'); setFormPromocion({ titulo: '', descripcion: '', codigo: '', fecha_limite: '' }); await cargarEstadisticas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    const solicitarLimpiarExpiradas = () => setPedirConfirmacionLimpiar(true);
    const cancelarLimpiarExpiradas = () => setPedirConfirmacionLimpiar(false);

    const confirmarLimpiarExpiradas = async () => {
        setPedirConfirmacionLimpiar(false);
        setCargando(true);
        const resultado = await limpiarNotificacionesExpiradas();
        if (resultado.exito) { mostrarMensaje(`🧹 ${resultado.eliminadas} notificaciones expiradas eliminadas`, 'exito'); await cargarEstadisticas(); }
        else mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        setCargando(false);
    };

    return {
        cargando, mensaje, tipoMensaje, estadisticas,
        pedirConfirmacionLimpiar,
        formManual, setFormManual,
        formCurso, setFormCurso,
        formTutorial, setFormTutorial,
        formPago, setFormPago,
        formPromocion, setFormPromocion,
        enviarNotificacionManual,
        probarNuevoCurso, probarNuevoTutorial, probarPagoAprobado, probarPromocionEspecial,
        solicitarLimpiarExpiradas, cancelarLimpiarExpiradas, confirmarLimpiarExpiradas,
        cargarEstadisticas
    };
}
