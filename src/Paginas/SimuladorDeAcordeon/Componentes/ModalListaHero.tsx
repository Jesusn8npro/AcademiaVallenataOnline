import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, X, Music, BookOpen, Activity, Loader2, Calendar, Gauge } from 'lucide-react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { CancionHero } from '../videojuego_acordeon/tipos_Hero';

interface ModalListaHeroProps {
    visible: boolean;
    onCerrar: () => void;
    onReproducir: (cancion: CancionHero) => void;
}

const ModalListaHero: React.FC<ModalListaHeroProps> = ({ visible, onCerrar, onReproducir }) => {
    const [canciones, setCanciones] = useState<CancionHero[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtro, setFiltro] = useState<'todos' | 'secuencia' | 'tutorial' | 'ejercicio'>('todos');

    const cargarCanciones = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('canciones_hero')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            setCanciones(data || []);
        } catch (e) {
            console.error("Error cargando canciones:", e);
        } finally {
            setCargando(false);
        }
    };

    const borrarCancion = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar esta grabación?")) return;
        try {
            const { error } = await supabase
                .from('canciones_hero')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setCanciones(prev => prev.filter(c => (c as any).id !== id));
        } catch (e) {
            alert("Error al borrar");
        }
    };

    useEffect(() => {
        if (visible) cargarCanciones();
    }, [visible]);

    if (!visible) return null;

    const filtradas = filtro === 'todos' ? canciones : canciones.filter(c => c.tipo === filtro);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    style={{
                        width: '100%', maxWidth: '700px', maxHeight: '85vh',
                        backgroundColor: '#111', borderRadius: '24px', border: '1px solid #333',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Mis Grabaciones 🎥</h2>
                            <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px' }}>Gestiona y reproduce tus interpretaciones</p>
                        </div>
                        <button onClick={onCerrar} style={{ background: '#222', border: '1px solid #333', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Filtros */}
                    <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #1a1a1a' }}>
                        {['todos', 'secuencia', 'ejercicio', 'tutorial'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f as any)}
                                style={{
                                    padding: '8px 16px', border: 'none',
                                    backgroundColor: filtro === f ? '#00e5ff' : '#222',
                                    color: filtro === f ? '#000' : '#888',
                                    fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer',
                                    transition: 'all 0.2s', textTransform: 'capitalize', borderRadius: '20px'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Lista */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cargando ? (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', gap: '16px' }}>
                                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} color="#00e5ff" />
                                <span>Cargando tu arte...</span>
                            </div>
                        ) : filtradas.length === 0 ? (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', gap: '12px', textAlign: 'center' }}>
                                <Music size={48} />
                                <span>Aún no tienes grabaciones en esta categoría.</span>
                            </div>
                        ) : (
                            filtradas.map((cancion, index) => (
                                <motion.div
                                    key={(cancion as any).id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{
                                        backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '16px',
                                        border: '1px solid #222', display: 'flex', alignItems: 'center', gap: '16px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    whileHover={{ borderColor: '#333', backgroundColor: '#1f1f1f' }}
                                >
                                    {/* Icono por tipo */}
                                    <div style={{ 
                                        width: '48px', height: '48px', borderRadius: '12px', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: cancion.tipo === 'tutorial' ? 'rgba(239, 68, 68, 0.1)' : 
                                                         cancion.tipo === 'ejercicio' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 229, 255, 0.1)',
                                        color: cancion.tipo === 'tutorial' ? '#ef4444' : 
                                               cancion.tipo === 'ejercicio' ? '#22c55e' : '#00e5ff'
                                    }}>
                                        {cancion.tipo === 'tutorial' ? <Music size={24} /> : 
                                         cancion.tipo === 'ejercicio' ? <BookOpen size={24} /> : <Activity size={24} />}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{cancion.titulo}</h3>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                            <span style={{ color: '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Gauge size={12} /> {cancion.bpm} BPM
                                            </span>
                                            <span style={{ color: '#666', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> {(cancion as any).creado_en ? new Date((cancion as any).creado_en).toLocaleDateString() : 'Hoy'}
                                            </span>
                                            <span style={{ 
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px',
                                                backgroundColor: '#222', color: '#888', textTransform: 'uppercase', fontWeight: 'bold'
                                            }}>
                                                {cancion.dificultad}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => onReproducir(cancion)}
                                            style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                                                backgroundColor: '#00e5ff', color: '#000', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Reproducir"
                                        >
                                            <Play size={20} fill="currentColor" />
                                        </button>
                                        <button 
                                            onClick={() => borrarCancion((cancion as any).id)}
                                            style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #333',
                                                backgroundColor: 'transparent', color: '#666', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer / Nota */}
                    <div style={{ padding: '16px 24px', backgroundColor: '#161616', borderTop: '1px solid #222', textAlign: 'center' }}>
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>Estas grabaciones se sincronizan automáticamente con tu cuenta Academia Vallenata.</span>
                    </div>
                </motion.div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default ModalListaHero;
