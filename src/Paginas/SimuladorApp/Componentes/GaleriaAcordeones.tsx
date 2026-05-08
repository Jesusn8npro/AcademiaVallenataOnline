import React, { useMemo, useState } from 'react';
import { X, Crown, Check, Sparkles } from 'lucide-react';
import {
    TEMAS_ACORDEON, ETIQUETAS_CATEGORIA, type CategoriaTema, type TemaAcordeon,
} from '../Datos/temasAcordeon';
import './GaleriaAcordeones.css';

// Modal "de lujo" para elegir el modelo visual del acordeón. Tabs por
// categoría (Todos / Pro MAX / Originales / Personalizados). Mobile-first.
// Click en una tarjeta selecciona y aplica el modelo al simulador.

interface Props {
    visible: boolean;
    temaActivoId: string;
    esPremium?: boolean;
    onCerrar: () => void;
    onSeleccionar: (temaId: string) => void;
    /** Callback cuando un usuario free intenta seleccionar premium. F3. */
    onIntentoPremium?: (tema: TemaAcordeon) => void;
}

type Tab = 'todos' | CategoriaTema;

const TABS: Tab[] = ['todos', 'pro_max', 'originales', 'personalizados'];

const GaleriaAcordeones: React.FC<Props> = ({
    visible, temaActivoId, esPremium = false, onCerrar, onSeleccionar, onIntentoPremium,
}) => {
    const [tab, setTab] = useState<Tab>('todos');

    const temasFiltrados = useMemo(() => {
        if (tab === 'todos') return TEMAS_ACORDEON;
        return TEMAS_ACORDEON.filter((t) => t.categoria === tab);
    }, [tab]);

    if (!visible) return null;

    const handleClick = (tema: TemaAcordeon) => {
        if (tema.premiumOnly && !esPremium) {
            onIntentoPremium?.(tema);
            return;
        }
        onSeleccionar(tema.id);
    };

    return (
        <div className="gal-overlay" onClick={onCerrar} role="dialog" aria-modal="true">
            <div className="gal-contenido" onClick={(e) => e.stopPropagation()}>
                <header className="gal-header">
                    <div className="gal-header-titulo">
                        <Sparkles size={18} className="gal-icono-titulo" />
                        <h2>Galería de Acordeones</h2>
                    </div>
                    <button
                        type="button"
                        className="gal-btn-cerrar"
                        onClick={onCerrar}
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="gal-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={`gal-tab ${tab === t ? 'activo' : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {ETIQUETAS_CATEGORIA[t]}
                        </button>
                    ))}
                </div>

                <div className="gal-grid">
                    {temasFiltrados.map((tema) => {
                        const esActivo = tema.id === temaActivoId;
                        const bloqueado = !!tema.premiumOnly && !esPremium;
                        return (
                            <button
                                key={tema.id}
                                type="button"
                                className={`gal-card ${esActivo ? 'activo' : ''} ${bloqueado ? 'bloqueado' : ''}`}
                                onClick={() => handleClick(tema)}
                                title={tema.descripcion}
                            >
                                {esActivo && (
                                    <div className="gal-badge-activo">
                                        <Check size={14} />
                                        <span>EN USO</span>
                                    </div>
                                )}
                                {tema.premiumOnly && (
                                    <div className={`gal-badge-premium ${bloqueado ? 'bloqueado' : ''}`}>
                                        <Crown size={11} />
                                        <span>PLUS</span>
                                    </div>
                                )}
                                <div className="gal-card-imagen">
                                    <img
                                        src={tema.preview}
                                        alt={tema.nombre}
                                        loading="lazy"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0.3';
                                        }}
                                    />
                                </div>
                                <div className="gal-card-info">
                                    <h3 className="gal-card-nombre">{tema.nombre}</h3>
                                    {tema.descripcion && (
                                        <p className="gal-card-desc">{tema.descripcion}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {/* Placeholder para el editor de personalización (F2) */}
                    {tab === 'personalizados' && temasFiltrados.length === 0 && (
                        <div className="gal-placeholder-vacio">
                            <Sparkles size={28} />
                            <h3>Aún no tienes modelos personalizados</h3>
                            <p>Pronto podrás crear tu propio acordeón con los colores que quieras.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GaleriaAcordeones;
