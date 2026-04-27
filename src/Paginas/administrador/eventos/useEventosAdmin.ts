import React, { useState, useEffect } from 'react';
import { eventosService } from '../../../servicios/eventosService';
import type { EventoCompleto } from '../../../types/eventos';

const EVENTO_INICIAL = {
    titulo: '',
    descripcion: '',
    descripcion_corta: '',
    tipo_evento: 'masterclass',
    fecha_inicio: '',
    fecha_fin: '',
    modalidad: 'online',
    precio: 0,
    categoria: 'tecnica',
    nivel_dificultad: 'principiante',
    instructor_nombre: '',
    capacidad_maxima: 100,
    requiere_inscripcion: true,
    es_publico: true,
    estado: 'programado',
    link_transmision: '',
    imagen_portada: ''
};

export type NuevoEventoForm = typeof EVENTO_INICIAL;

export function useEventosAdmin() {
    const [eventos, setEventos] = useState<EventoCompleto[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [nuevoEvento, setNuevoEvento] = useState<NuevoEventoForm>(EVENTO_INICIAL);
    const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);

    useEffect(() => { cargarEventos(); }, []);

    async function cargarEventos() {
        setCargando(true);
        const resultado = await eventosService.obtenerEventos();
        if (resultado.error) setError(resultado.error);
        else setEventos(resultado.eventos);
        setCargando(false);
    }

    function mostrarFormularioCrear() {
        setMostrarFormulario(true);
        setNuevoEvento(EVENTO_INICIAL);
    }

    function cancelarCreacion() {
        setMostrarFormulario(false);
    }

    function generarSlug(titulo: string): string {
        return titulo.toLowerCase()
            .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    }

    async function crearEvento(e: React.FormEvent) {
        e.preventDefault();
        if (!nuevoEvento.titulo || !nuevoEvento.fecha_inicio) { setError('El título y la fecha de inicio son obligatorios'); return; }
        setCargando(true);
        setError('');
        try {
            const eventoData = {
                titulo: nuevoEvento.titulo,
                descripcion: nuevoEvento.descripcion || undefined,
                descripcion_corta: nuevoEvento.descripcion_corta || undefined,
                slug: generarSlug(nuevoEvento.titulo),
                tipo_evento: nuevoEvento.tipo_evento as any,
                fecha_inicio: nuevoEvento.fecha_inicio,
                fecha_fin: nuevoEvento.fecha_fin || undefined,
                modalidad: nuevoEvento.modalidad as any,
                precio: nuevoEvento.precio,
                categoria: nuevoEvento.categoria,
                nivel_dificultad: nuevoEvento.nivel_dificultad as any,
                instructor_nombre: nuevoEvento.instructor_nombre || undefined,
                capacidad_maxima: nuevoEvento.capacidad_maxima,
                requiere_inscripcion: nuevoEvento.requiere_inscripcion,
                es_publico: nuevoEvento.es_publico,
                estado: nuevoEvento.estado as any,
                link_transmision: nuevoEvento.link_transmision || undefined,
                imagen_portada: nuevoEvento.imagen_portada || undefined,
                participantes_inscritos: 0,
                total_visualizaciones: 0,
                calificacion_promedio: 0,
                total_calificaciones: 0
            };
            const resultado = await eventosService.crearEvento(eventoData);
            if (resultado.error) setError(`Error al crear el evento: ${resultado.error}`);
            else { await cargarEventos(); setMostrarFormulario(false); setError(''); }
        } catch (err: any) {
            setError(`Error inesperado: ${err.message}`);
        }
        setCargando(false);
    }

    function solicitarEliminar(id: string) {
        setConfirmarEliminarId(id);
    }

    function cancelarEliminar() {
        setConfirmarEliminarId(null);
    }

    async function confirmarEliminar() {
        if (!confirmarEliminarId) return;
        const id = confirmarEliminarId;
        setConfirmarEliminarId(null);
        const resultado = await eventosService.eliminarEvento(id);
        if (resultado.error) setError(resultado.error);
        else await cargarEventos();
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setNuevoEvento(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
    };

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function formatearPrecio(precio: number): string {
        if (precio === 0) return 'Gratuito';
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
    }

    return {
        eventos, cargando, error, mostrarFormulario, nuevoEvento,
        confirmarEliminarId,
        mostrarFormularioCrear, cancelarCreacion, crearEvento,
        solicitarEliminar, cancelarEliminar, confirmarEliminar,
        handleInputChange, formatearFecha, formatearPrecio
    };
}
