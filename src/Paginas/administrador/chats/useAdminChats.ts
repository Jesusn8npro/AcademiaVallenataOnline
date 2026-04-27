import { useState, useEffect } from 'react';
import { supabase as clienteSupabase } from '../../../servicios/clienteSupabase';

export interface Lead {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    whatsapp: string;
    ciudad: string;
    direccion: string;
    tipo_consulta: string;
    estado: string;
    created_at: string;
    source: string;
    converted: boolean;
    productos_consultados: string[];
    probabilidad_compra: number;
    valor_potencial: number;
    notas_adicionales: string;
    contexto_inicial: string;
    chat_id: string;
}

export interface Mensaje {
    id: string;
    session_id: string;
    message: { type: string; data: { content: string } } | any;
    created_at: string;
}

export function useAdminChats() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroInteres, setFiltroInteres] = useState('todos');
    const [paginaActual, setPaginaActual] = useState(1);
    const leadsPorPagina = 9;
    const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [mostrarModalChat, setMostrarModalChat] = useState(false);
    const [mensajesChat, setMensajesChat] = useState<Mensaje[]>([]);
    const [cargandoChat, setCargandoChat] = useState(false);
    const [stats, setStats] = useState({ total: 0, nuevos: 0, convertidos: 0, pendientes: 0, tasaConversion: 0, valorPotencial: 0 });

    const cargarLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await clienteSupabase.from('leads_chats_anonimos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setLeads(data || []);
            calcularEstadisticas(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calcularEstadisticas = (datos: Lead[]) => {
        const total = datos.length;
        const convertidos = datos.filter(l => l.converted).length;
        const pendientes = datos.filter(l => l.estado === 'pendiente' || l.estado === 'activo').length;
        const nuevos = datos.filter(l => (new Date().getTime() - new Date(l.created_at).getTime()) < (24 * 60 * 60 * 1000)).length;
        const valor = datos.reduce((acc, curr) => acc + (Number(curr.valor_potencial) || 0), 0);
        setStats({ total, nuevos, convertidos, pendientes, tasaConversion: total > 0 ? Math.round((convertidos / total) * 100) : 0, valorPotencial: valor });
    };

    useEffect(() => { cargarLeads(); }, []);

    const cargarConversacion = async (lead: Lead) => {
        try {
            setCargandoChat(true);
            setLeadSeleccionado(lead);
            setMostrarModalChat(true);
            const { data, error } = await clienteSupabase.from('chats_envivo_academia').select('*').eq('session_id', lead.chat_id).order('created_at', { ascending: true });
            if (error) throw error;
            setMensajesChat(data || []);
        } catch { /* error no fatal */ } finally {
            setCargandoChat(false);
        }
    };

    const leadsFiltrados = leads.filter(lead => {
        const cumpleBusqueda = lead.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || lead.email?.toLowerCase().includes(busqueda.toLowerCase()) || lead.ciudad?.toLowerCase().includes(busqueda.toLowerCase());
        const cumpleEstado = filtroEstado === 'todos' || lead.estado === filtroEstado;
        let cumpleInteres = true;
        if (filtroInteres !== 'todos') {
            const prob = lead.probabilidad_compra || 0;
            if (filtroInteres === 'alto') cumpleInteres = prob >= 70;
            if (filtroInteres === 'medio') cumpleInteres = prob >= 40 && prob < 70;
            if (filtroInteres === 'bajo') cumpleInteres = prob < 40;
        }
        return cumpleBusqueda && cumpleEstado && cumpleInteres;
    });

    const indiceUltimoLead = paginaActual * leadsPorPagina;
    const indicePrimerLead = indiceUltimoLead - leadsPorPagina;
    const leadsActuales = leadsFiltrados.slice(indicePrimerLead, indiceUltimoLead);
    const totalPaginas = Math.ceil(leadsFiltrados.length / leadsPorPagina);

    return {
        loading, error, stats,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroInteres, setFiltroInteres,
        paginaActual, setPaginaActual,
        leadSeleccionado, setLeadSeleccionado,
        mostrarModalDetalle, setMostrarModalDetalle,
        mostrarModalChat, setMostrarModalChat,
        mensajesChat, cargandoChat,
        leadsFiltrados, leadsActuales, totalPaginas,
        cargarLeads, cargarConversacion
    };
}
