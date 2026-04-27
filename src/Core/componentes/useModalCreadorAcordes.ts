import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../servicios/clienteSupabase';

interface Opciones {
    visible: boolean;
    botonesSeleccionados: string[];
    fuelleActual: 'abriendo' | 'cerrando';
    tonalidadActual: string;
    acordeAEditar?: any;
    onExitoUpdate?: () => void;
    onCerrar: () => void;
}

export function useModalCreadorAcordes({ visible, botonesSeleccionados, fuelleActual, tonalidadActual, acordeAEditar, onExitoUpdate, onCerrar }: Opciones) {
    const [nombre, setNombre] = useState('');
    const [grado, setGrado] = useState('I');
    const [tipo, setTipo] = useState<'Mayor' | 'Menor' | 'Septima'>('Mayor');
    const [invAbriendo, setInvAbriendo] = useState(0);
    const [invCerrando, setInvCerrando] = useState(0);
    const [hilera, setHilera] = useState<number>(2);
    const [botonesCapturados, setBotonesCapturados] = useState<string[]>([]);
    const [fuelleGrabado, setFuelleGrabado] = useState<'abriendo' | 'cerrando'>('abriendo');
    const [guardando, setGuardando] = useState(false);
    const [descripcion, setDescripcion] = useState('');
    const [nombreCirculo, setNombreCirculo] = useState('');
    const [referenciaMaestro, setReferenciaMaestro] = useState('');
    const [modalidadCirculo, setModalidadCirculo] = useState<'Mayor' | 'Menor'>('Mayor');
    const [mensajeCreador, setMensajeCreador] = useState<{ texto: string; exito: boolean } | null>(null);
    const buttonsEnabledRef = useRef(true);

    useEffect(() => {
        if (visible && buttonsEnabledRef.current && botonesSeleccionados.length > 0) {
            if (botonesCapturados.length === 0) setFuelleGrabado(fuelleActual);
            setBotonesCapturados(prev => [...new Set([...prev, ...botonesSeleccionados])]);
        }
    }, [botonesSeleccionados, visible, fuelleActual]);

    useEffect(() => {
        if (visible && acordeAEditar) {
            buttonsEnabledRef.current = false;
            setNombre(acordeAEditar.nombre);
            setGrado(acordeAEditar.grado || 'I');
            setNombreCirculo(acordeAEditar.tonalidad_referencia || '');
            setTipo(acordeAEditar.tipo || 'Mayor');
            setInvAbriendo(acordeAEditar.inv_abriendo ?? 0);
            setInvCerrando(acordeAEditar.inv_cerrando ?? 0);
            setHilera(acordeAEditar.hilera_lider ?? 2);
            setBotonesCapturados(acordeAEditar.botones || []);
            setFuelleGrabado(acordeAEditar.fuelle || 'abriendo');
            setDescripcion(acordeAEditar.descripcion?.split(' | ')[1] || acordeAEditar.descripcion || '');
            setReferenciaMaestro(acordeAEditar.descripcion?.split(' | ')[0] || '');
            setModalidadCirculo(acordeAEditar.modalidad_circulo || 'Mayor');
            setTimeout(() => { buttonsEnabledRef.current = true; }, 500);
        } else if (visible && !acordeAEditar) {
            setBotonesCapturados([]);
            setNombre('');
        }
    }, [visible, acordeAEditar]);

    const handleGuardar = async () => {
        if (!nombre || botonesCapturados.length === 0) {
            setMensajeCreador({ texto: 'Pon un nombre y presiona al menos un botón.', exito: false });
            return;
        }

        setGuardando(true);
        setMensajeCreador(null);
        try {
            const payload = {
                nombre,
                hilera_lider: hilera,
                tipo,
                fuelle: fuelleGrabado,
                botones: botonesCapturados,
                inv_abriendo: invAbriendo,
                inv_cerrando: invCerrando,
                tonalidad_referencia: nombreCirculo || tonalidadActual,
                descripcion: `${referenciaMaestro} | ${descripcion}`,
                grado: grado || nombreCirculo,
                modalidad_circulo: modalidadCirculo
            };

            let error;
            if (acordeAEditar?.id) {
                const res = await (supabase.from('acordes_hero') as any).update(payload).eq('id', acordeAEditar.id);
                error = res.error;
            } else {
                const res = await (supabase.from('acordes_hero') as any).insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            setMensajeCreador({ texto: acordeAEditar ? '✅ ¡Acorde actualizado!' : '✅ ¡Acorde Maestro guardado!', exito: true });
            if (acordeAEditar) {
                if (onExitoUpdate) onExitoUpdate();
                onCerrar();
            } else {
                setBotonesCapturados([]);
                setNombre('');
            }
        } catch (err: any) {
            setMensajeCreador({ texto: 'Error al guardar: ' + err.message, exito: false });
        } finally {
            setGuardando(false);
        }
    };

    const reiniciarBotones = () => {
        setBotonesCapturados([]);
        setFuelleGrabado(fuelleActual);
    };

    return {
        nombre, setNombre,
        grado, setGrado,
        tipo, setTipo,
        invAbriendo, setInvAbriendo,
        invCerrando, setInvCerrando,
        hilera, setHilera,
        botonesCapturados,
        fuelleGrabado,
        guardando,
        descripcion, setDescripcion,
        nombreCirculo, setNombreCirculo,
        referenciaMaestro, setReferenciaMaestro,
        modalidadCirculo, setModalidadCirculo,
        mensajeCreador,
        handleGuardar,
        reiniciarBotones
    };
}
