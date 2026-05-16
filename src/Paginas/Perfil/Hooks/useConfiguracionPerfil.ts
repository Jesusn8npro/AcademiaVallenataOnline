import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { usePerfilStore } from '../../../stores/perfilStore';

export function useConfiguracionPerfil() {
    const { usuario, cerrarSesion: cerrarSesionContext } = useUsuario();
    const { actualizarPerfil, resetear: resetearPerfil } = usePerfilStore();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [membresiaActual, setMembresiaActual] = useState<any>(null);
    const [historialPagos, setHistorialPagos] = useState<any[]>([]);
    const [configuraciones, setConfiguraciones] = useState({
        notificaciones_email: true,
        notificaciones_push: true,
        publico_perfil: true
    });
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [mostrarFormularioContrasena, setMostrarFormularioContrasena] = useState(false);
    const [correoRecuperar, setCorreoRecuperar] = useState('');
    const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
    const [mensajeRecuperar, setMensajeRecuperar] = useState('');
    const [confirmacionEliminar, setConfirmacionEliminar] = useState('');
    const [datosPersonales, setDatosPersonales] = useState({
        nombre_completo: '',
        correo_electronico: '',
        whatsapp: '',
        ciudad: '',
        fecha_creacion: ''
    });
    const [editandoCuenta, setEditandoCuenta] = useState(false);
    const [datosEditados, setDatosEditados] = useState({ nombre_completo: '', correo_electronico: '', whatsapp: '', ciudad: '' });
    const [guardandoCuenta, setGuardandoCuenta] = useState(false);

    useEffect(() => { cargarDatosUsuario(); }, [usuario]);

    async function cargarDatosUsuario() {
        if (!usuario?.id) return;
        try {
            setCargando(true);
            const [perfilResult, pagosResult] = await Promise.all([
                supabase.rpc('obtener_mi_perfil_completo'),
                supabase.from('pagos_epayco').select('*').eq('usuario_id', usuario.id)
                    .eq('estado', 'Aceptada').order('created_at', { ascending: false }).limit(3)
            ]);

            const perfilData = perfilResult.data;
            if (perfilResult.error) throw perfilResult.error;

            setHistorialPagos(pagosResult.data || []);

            if (perfilData?.suscripcion && perfilData.suscripcion !== 'free') {
                const { data: membresia } = await supabase
                    .from('membresias').select('*').eq('nombre', perfilData.suscripcion).single();
                setMembresiaActual(membresia);
            }

            setConfiguraciones({
                notificaciones_email: perfilData.notificaciones_email ?? true,
                notificaciones_push: perfilData.notificaciones_push ?? true,
                publico_perfil: perfilData.publico_perfil ?? true
            });

            setDatosPersonales({
                nombre_completo: perfilData.nombre_completo || '',
                correo_electronico: perfilData.correo_electronico || '',
                whatsapp: perfilData.whatsapp || '',
                ciudad: perfilData.ciudad || perfilData.pais || '',
                fecha_creacion: new Date(perfilData.fecha_creacion).toLocaleDateString('es-ES')
            });

            setCorreoRecuperar(perfilData.correo_electronico || '');
        } catch {
            setMensaje('Error cargando la configuración');
        } finally {
            setCargando(false);
        }
    }

    async function guardarConfiguracion() {
        if (!usuario?.id) return;
        setGuardando(true);
        try {
            const { error } = await supabase.from('perfiles').update(configuraciones).eq('id', usuario.id);
            if (error) throw error;
            setMensaje('¡Configuración guardada exitosamente!');
            actualizarPerfil(configuraciones);
        } catch (error: any) {
            setMensaje('Error al guardar configuración: ' + error.message);
        } finally {
            setGuardando(false);
            setTimeout(() => setMensaje(''), 3000);
        }
    }

    async function enviarRecuperacionContrasena() {
        if (!correoRecuperar) return;
        setCargandoRecuperar(true);
        setMensajeRecuperar('');
        try {
            const isProduction = window.location.hostname === 'academiavallenataonline.com';
            const redirectURL = isProduction
                ? 'https://academiavallenataonline.com/recuperar-contrasena'
                : window.location.origin + '/recuperar-contrasena';
            const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperar, { redirectTo: redirectURL });
            if (error) throw error;
            setMensajeRecuperar('¡Revisa tu correo para restablecer la contraseña!');
            setMostrarFormularioContrasena(false);
        } catch (error: any) {
            setMensajeRecuperar('Error: ' + error.message);
        } finally {
            setCargandoRecuperar(false);
        }
    }

    async function eliminarCuenta() {
        if (confirmacionEliminar !== 'ELIMINAR MI CUENTA') {
            setMensaje('Debes escribir exactamente "ELIMINAR MI CUENTA" para confirmar');
            return;
        }
        if (!usuario?.id) return;
        try {
            const { error } = await supabase.from('perfiles').update({ eliminado: true }).eq('id', usuario.id);
            if (error) throw error;
            await cerrarSesionContext();
            resetearPerfil();
            navigate('/sesion_cerrada');
        } catch (error: any) {
            setMensaje('Error al eliminar cuenta: ' + error.message);
        }
    }

    function iniciarEdicionCuenta() {
        setDatosEditados({
            nombre_completo: datosPersonales.nombre_completo,
            correo_electronico: datosPersonales.correo_electronico,
            whatsapp: datosPersonales.whatsapp,
            ciudad: datosPersonales.ciudad
        });
        setEditandoCuenta(true);
    }

    async function guardarDatosPersonales() {
        if (!usuario?.id) return;
        setGuardandoCuenta(true);
        try {
            const partes = datosEditados.nombre_completo.trim().split(' ');
            const nombre = partes[0] || '';
            const apellido = partes.slice(1).join(' ');

            await supabase.from('perfiles').update({
                nombre_completo: datosEditados.nombre_completo,
                nombre,
                apellido,
                whatsapp: datosEditados.whatsapp,
                ciudad: datosEditados.ciudad
            }).eq('id', usuario.id);

            if (datosEditados.correo_electronico !== datosPersonales.correo_electronico) {
                await supabase.auth.updateUser({ email: datosEditados.correo_electronico });
                setMensaje('Datos guardados. Revisa tu nuevo correo para confirmar el cambio.');
            } else {
                setMensaje('¡Datos personales actualizados exitosamente!');
            }

            setDatosPersonales(prev => ({ ...prev, ...datosEditados }));
            actualizarPerfil({ nombre_completo: datosEditados.nombre_completo, nombre, apellido, whatsapp: datosEditados.whatsapp, ciudad: datosEditados.ciudad });
            setEditandoCuenta(false);
        } catch (error: any) {
            setMensaje('Error al guardar: ' + error.message);
        } finally {
            setGuardandoCuenta(false);
            setTimeout(() => setMensaje(''), 4000);
        }
    }

    function cancelarEdicionCuenta() {
        setEditandoCuenta(false);
    }

    function cancelarRecuperacion() {
        setMostrarFormularioContrasena(false);
        setMensajeRecuperar('');
    }

    async function cerrarSesion() {
        await cerrarSesionContext();
        resetearPerfil();
        navigate('/sesion_cerrada');
    }

    return {
        cargando, guardando, mensaje, membresiaActual, historialPagos,
        configuraciones, setConfiguraciones,
        mostrarModalEliminar, setMostrarModalEliminar,
        mostrarFormularioContrasena, setMostrarFormularioContrasena,
        correoRecuperar, setCorreoRecuperar,
        cargandoRecuperar, mensajeRecuperar,
        confirmacionEliminar, setConfirmacionEliminar,
        datosPersonales,
        editandoCuenta, datosEditados, setDatosEditados, guardandoCuenta,
        iniciarEdicionCuenta, guardarDatosPersonales, cancelarEdicionCuenta,
        guardarConfiguracion, enviarRecuperacionContrasena, cancelarRecuperacion, eliminarCuenta, cerrarSesion
    };
}
