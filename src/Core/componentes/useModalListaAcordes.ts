import { useState, useEffect } from 'react';
import { supabase } from '../../servicios/clienteSupabase';
import { CIRCULO_OFFSETS, TONALIDAD_OFFSETS, HILERAS_NATIVAS } from '../acordeon/notasAcordeonDiatonico';

export function useModalListaAcordes(visible: boolean, tonalidadActual: string) {
    const [acordes, setAcordes] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [hileraFiltro, setHileraFiltro] = useState<number | null>(null);
    const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
    const [modalidadFiltro, setModalidadFiltro] = useState<'Mayor' | 'Menor' | null>(null);
    const [tonalidadFiltro, setTonalidadFiltro] = useState<string | null>(null);
    const [gradoFiltro, setGradoFiltro] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [guardandoOrden, setGuardandoOrden] = useState(false);
    const [editandoNombreId, setEditandoNombreId] = useState<string | null>(null);
    const [nombreTemporal, setNombreTemporal] = useState('');
    const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);
    const [mensajeAccion, setMensajeAccion] = useState<{ texto: string; exito: boolean } | null>(null);

    const cargarAcordes = async () => {
        setCargando(true);
        const { data, error } = await supabase
            .from('acordes_hero')
            .select('*')
            .order('orden_circulo', { ascending: true })
            .order('creado_en', { ascending: true });
        if (!error && data) setAcordes(data);
        setCargando(false);
    };

    useEffect(() => {
        if (visible) cargarAcordes();
    }, [visible]);

    const solicitarEliminar = (id: string) => setConfirmarEliminarId(id);
    const cancelarEliminar = () => setConfirmarEliminarId(null);

    const confirmarEliminar = async () => {
        if (!confirmarEliminarId) return;
        const id = confirmarEliminarId;
        setConfirmarEliminarId(null);
        const { error } = await supabase.from('acordes_hero').delete().eq('id', id);
        if (!error) cargarAcordes();
    };

    const duplicarAcorde = async (acorde: any, alFinal: boolean = false) => {
        setCargando(true);
        try {
            const { id, creado_en, actualizado_en, ...datosCopia } = acorde;
            const nuevoNombre = `${acorde.nombre} (Copia)`;
            const { data: insertedData, error: insertError } = await (supabase.from('acordes_hero') as any).insert([{ ...datosCopia, nombre: nuevoNombre, orden_circulo: 999 }]).select();
            if (insertError) throw insertError;
            const nuevoAcorde = insertedData[0];

            let listaOrdenadaParaGuardar: any[] = [];
            if (alFinal) {
                listaOrdenadaParaGuardar = [...filtrados, nuevoAcorde];
            } else {
                const indexEnFiltrados = filtrados.findIndex(a => a.id === acorde.id);
                listaOrdenadaParaGuardar = [...filtrados];
                listaOrdenadaParaGuardar.splice(indexEnFiltrados + 1, 0, nuevoAcorde);
            }

            const promesas = listaOrdenadaParaGuardar.map((ac, index) =>
                (supabase.from('acordes_hero') as any).update({ orden_circulo: index }).eq('id', ac.id)
            );
            await Promise.all(promesas);
            await cargarAcordes();
        } catch {
            setMensajeAccion({ texto: 'No se pudo duplicar el acorde correctamente.', exito: false });
            setTimeout(() => setMensajeAccion(null), 4000);
        } finally {
            setCargando(false);
        }
    };

    const reordenar = (nuevaListaFiltrada: any[]) => {
        const filtradosIds = new Set(filtrados.map(f => f.id));
        const otrosAcordes = acordes.filter(a => !filtradosIds.has(a.id));
        setAcordes([...otrosAcordes, ...nuevaListaFiltrada]);
    };

    const moverArriba = (id: string) => {
        const indexEnFiltrados = filtrados.findIndex(a => a.id === id);
        if (indexEnFiltrados <= 0) return;
        const nueva = [...filtrados];
        [nueva[indexEnFiltrados - 1], nueva[indexEnFiltrados]] = [nueva[indexEnFiltrados], nueva[indexEnFiltrados - 1]];
        reordenar(nueva);
    };

    const moverAbajo = (id: string) => {
        const indexEnFiltrados = filtrados.findIndex(a => a.id === id);
        if (indexEnFiltrados === -1 || indexEnFiltrados === filtrados.length - 1) return;
        const nueva = [...filtrados];
        [nueva[indexEnFiltrados + 1], nueva[indexEnFiltrados]] = [nueva[indexEnFiltrados], nueva[indexEnFiltrados + 1]];
        reordenar(nueva);
    };

    const guardarOrdenEnDB = async () => {
        if (filtrados.length === 0) return;
        setGuardandoOrden(true);
        try {
            const promesas = filtrados.map((ac, index) =>
                (supabase.from('acordes_hero') as any).update({ orden_circulo: index }).eq('id', ac.id)
            );
            await Promise.all(promesas);
            await cargarAcordes();
            setMensajeAccion({ texto: `✅ Orden de ${tonalidadFiltro || 'la lista'} guardado correctamente.`, exito: true });
        } catch {
            setMensajeAccion({ texto: 'Error al guardar orden.', exito: false });
        } finally {
            setGuardandoOrden(false);
            setTimeout(() => setMensajeAccion(null), 4000);
        }
    };

    const guardarNombreInline = async (id: string) => {
        if (!nombreTemporal.trim()) { setEditandoNombreId(null); return; }
        const { error } = await (supabase.from('acordes_hero') as any).update({ nombre: nombreTemporal }).eq('id', id);
        if (!error) setAcordes(acordes.map(a => a.id === id ? { ...a, nombre: nombreTemporal } : a));
        setEditandoNombreId(null);
    };

    const iniciarEdicionNombre = (acorde: any) => {
        setEditandoNombreId(acorde.id);
        setNombreTemporal(acorde.nombre);
    };

    const filtrados = acordes.filter(a => {
        const busq = busqueda.toLowerCase();
        const matchSearch = a.nombre.toLowerCase().includes(busq) ||
            (a.grado && a.grado.toLowerCase().includes(busq)) ||
            (a.modalidad_circulo && a.modalidad_circulo.toLowerCase().includes(busq)) ||
            (a.descripcion && a.descripcion.toLowerCase().includes(busq));

        const matchHilera = hileraFiltro === null || a.hilera_lider === hileraFiltro;
        const matchModalidad = modalidadFiltro === null || a.modalidad_circulo === modalidadFiltro;

        let matchTonalidad = true;
        if (tonalidadFiltro !== null && hileraFiltro === null) {
            const offsetBase = 2;
            const offsetActual = TONALIDAD_OFFSETS[tonalidadActual] ?? 2;
            const diff = offsetActual - offsetBase;
            const indexFiltro = CIRCULO_OFFSETS[tonalidadFiltro.toUpperCase()] ?? 0;
            const indexBuscadoEnDB = (indexFiltro - diff + 12) % 12;
            const gradosPosibles = Object.entries(CIRCULO_OFFSETS as Record<string, number>)
                .filter(([_, val]) => val === indexBuscadoEnDB)
                .map(([name]) => name);
            matchTonalidad = gradosPosibles.includes((a.grado || '').toUpperCase());
        }

        const matchGradoManual = gradoFiltro === null || a.grado === gradoFiltro;

        let matchCategoria = true;
        if (categoriaFiltro === 'Transporte') matchCategoria = a.hilera_lider === 0;
        else if (categoriaFiltro === 'Nativo') matchCategoria = a.hilera_lider > 0;

        return matchSearch && matchHilera && matchCategoria && matchModalidad && matchTonalidad && matchGradoManual;
    });

    const tonalidadesDisponibles = Array.from(new Set(acordes.map(a => a.grado))).filter(Boolean).sort() as string[];

    const cambiarTonalidadFiltro = (val: string | null) => {
        setTonalidadFiltro(val);
        if (val && tonalidadActual && HILERAS_NATIVAS[tonalidadActual]) {
            const hileras = HILERAS_NATIVAS[tonalidadActual];
            const indexHilera = hileras.indexOf(val.toUpperCase());
            if (indexHilera !== -1) setHileraFiltro(indexHilera + 1);
        }
    };

    return {
        acordes, busqueda, setBusqueda,
        hileraFiltro, setHileraFiltro,
        categoriaFiltro, setCategoriaFiltro,
        modalidadFiltro, setModalidadFiltro,
        tonalidadFiltro, cambiarTonalidadFiltro,
        gradoFiltro, setGradoFiltro,
        cargando, guardandoOrden,
        editandoNombreId, nombreTemporal, setNombreTemporal,
        confirmarEliminarId, mensajeAccion,
        filtrados, tonalidadesDisponibles,
        cargarAcordes, solicitarEliminar, cancelarEliminar, confirmarEliminar,
        duplicarAcorde, reordenar, moverArriba, moverAbajo,
        guardarOrdenEnDB, guardarNombreInline, iniciarEdicionNombre
    };
}
