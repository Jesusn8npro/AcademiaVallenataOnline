import { useEffect, useMemo, useState } from 'react';
import {
    actualizarVisibilidadGrabacion,
    obtenerGrabacionesPublicasUsuario,
    obtenerGrabacionesUsuario,
    publicarGrabacionEnComunidad,
    type ModoGrabacionHero,
} from '../../../servicios/grabacionesHeroService';
import type { GrabacionReplayHero } from './Componentes/tiposReplay';
import { obtenerTituloInicialPublicacion, obtenerSubtituloGrabacion } from './utilsGrabaciones';

type FiltroGrabacion = 'todas' | ModoGrabacionHero;

interface UseVistaGrabacionesProps {
    usuarioId?: string | null;
    tipoVista: 'propia' | 'publica';
    nombreUsuario?: string | null;
}

export function useVistaGrabaciones({ usuarioId, tipoVista, nombreUsuario }: UseVistaGrabacionesProps) {
    const [filtro, setFiltro] = useState<FiltroGrabacion>('todas');
    const [grabaciones, setGrabaciones] = useState<GrabacionReplayHero[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [grabacionActiva, setGrabacionActiva] = useState<GrabacionReplayHero | null>(null);
    const [grabacionParaPublicar, setGrabacionParaPublicar] = useState<GrabacionReplayHero | null>(null);
    const [tituloPublicacion, setTituloPublicacion] = useState('');
    const [descripcionPublicacion, setDescripcionPublicacion] = useState('');
    const [publicandoGrabacion, setPublicandoGrabacion] = useState(false);
    const [errorPublicacion, setErrorPublicacion] = useState('');
    const [grabacionActualizandoVisibilidadId, setGrabacionActualizandoVisibilidadId] = useState<string | null>(null);
    const [errorVisibilidad, setErrorVisibilidad] = useState('');
    const [pendingCambioVisibilidad, setPendingCambioVisibilidad] = useState<{ grabacion: GrabacionReplayHero; siguienteEsPublica: boolean } | null>(null);

    const tituloSeccion = useMemo(() => {
        if (tipoVista === 'publica') return nombreUsuario ? `Grabaciones de ${nombreUsuario}` : 'Grabaciones publicas';
        return 'Mis grabaciones';
    }, [nombreUsuario, tipoVista]);

    const subtituloSeccion = useMemo(() => {
        if (tipoVista === 'publica') return 'Replays publicados desde Acordeon Hero Pro Max';
        return 'Tu biblioteca privada de ejecuciones, replays y practicas destacadas';
    }, [tipoVista]);

    const resumenTarjetas = useMemo(() => ({
        total: grabaciones.length,
        competencias: grabaciones.filter((g) => g.modo === 'competencia').length,
        practicas: grabaciones.filter((g) => g.modo === 'practica_libre').length,
        publicadas: grabaciones.filter((g) => g.es_publica).length,
    }), [grabaciones]);

    async function cargarGrabaciones() {
        if (!usuarioId) return;
        setCargando(true);
        setError('');
        try {
            const modo = filtro === 'todas' ? undefined : filtro;
            const data = tipoVista === 'publica'
                ? await obtenerGrabacionesPublicasUsuario(usuarioId, modo)
                : await obtenerGrabacionesUsuario(usuarioId, { modo });
            setGrabaciones((Array.isArray(data) ? data : []) as GrabacionReplayHero[]);
        } catch (err: any) {
            setError(err?.message || 'No se pudieron cargar las grabaciones.');
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => { cargarGrabaciones(); }, [usuarioId, filtro, tipoVista]);

    useEffect(() => {
        if (!grabacionParaPublicar) return;
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.classList.add('mis-grabaciones-publicar-modal-abierto');
        return () => {
            document.body.style.overflow = overflowAnterior;
            document.body.classList.remove('mis-grabaciones-publicar-modal-abierto');
        };
    }, [grabacionParaPublicar]);

    const abrirModalPublicacion = (grabacion: GrabacionReplayHero) => {
        setGrabacionParaPublicar(grabacion);
        setTituloPublicacion(obtenerTituloInicialPublicacion(grabacion));
        setDescripcionPublicacion(grabacion.descripcion || '');
        setErrorPublicacion('');
    };

    const cerrarModalPublicacion = () => {
        if (publicandoGrabacion) return;
        setGrabacionParaPublicar(null);
        setTituloPublicacion('');
        setDescripcionPublicacion('');
        setErrorPublicacion('');
    };

    const confirmarPublicacion = async () => {
        if (!grabacionParaPublicar) return;
        if (!tituloPublicacion.trim()) {
            setErrorPublicacion('Debes escribir un titulo para publicar en comunidad.');
            return;
        }
        setPublicandoGrabacion(true);
        setErrorPublicacion('');
        try {
            const resultado = await publicarGrabacionEnComunidad(grabacionParaPublicar.id, {
                tituloPublicacion,
                descripcionPublicacion
            });
            setGrabaciones((previas) => previas.map((grabacion) =>
                grabacion.id === grabacionParaPublicar.id
                    ? { ...grabacion, es_publica: true, publicacion_id: resultado.publicacionId }
                    : grabacion
            ));
            setGrabacionParaPublicar(null);
        } catch (err: any) {
            setErrorPublicacion(err?.message || 'No se pudo publicar esta grabacion.');
        } finally {
            setPublicandoGrabacion(false);
        }
    };

    const cambiarVisibilidad = (grabacion: GrabacionReplayHero, siguienteEsPublica: boolean) => {
        if (grabacionActualizandoVisibilidadId) return;
        if (!siguienteEsPublica && grabacion.publicacion_id) {
            setPendingCambioVisibilidad({ grabacion, siguienteEsPublica });
            return;
        }
        ejecutarCambioVisibilidad(grabacion, siguienteEsPublica);
    };

    const confirmarCambioVisibilidad = () => {
        if (!pendingCambioVisibilidad) return;
        const { grabacion, siguienteEsPublica } = pendingCambioVisibilidad;
        setPendingCambioVisibilidad(null);
        ejecutarCambioVisibilidad(grabacion, siguienteEsPublica);
    };

    const cancelarCambioVisibilidad = () => setPendingCambioVisibilidad(null);

    const ejecutarCambioVisibilidad = async (grabacion: GrabacionReplayHero, siguienteEsPublica: boolean) => {
        setGrabacionActualizandoVisibilidadId(grabacion.id);
        setErrorVisibilidad('');
        try {
            const grabacionActualizada = await actualizarVisibilidadGrabacion(grabacion.id, siguienteEsPublica);
            setGrabaciones((previas) => previas.map((item) =>
                item.id === grabacion.id
                    ? { ...item, ...grabacionActualizada, canciones_hero: item.canciones_hero }
                    : item
            ));
        } catch (err: any) {
            setErrorVisibilidad(err?.message || 'No se pudo actualizar la visibilidad de la grabacion.');
        } finally {
            setGrabacionActualizandoVisibilidadId(null);
        }
    };

    return {
        filtro, setFiltro, grabaciones, cargando, error,
        grabacionActiva, setGrabacionActiva,
        grabacionParaPublicar, tituloPublicacion, setTituloPublicacion,
        descripcionPublicacion, setDescripcionPublicacion,
        publicandoGrabacion, errorPublicacion,
        grabacionActualizandoVisibilidadId, errorVisibilidad,
        pendingCambioVisibilidad,
        tituloSeccion, subtituloSeccion, resumenTarjetas,
        cargarGrabaciones, abrirModalPublicacion, cerrarModalPublicacion,
        confirmarPublicacion, cambiarVisibilidad, confirmarCambioVisibilidad, cancelarCambioVisibilidad
    };
}
