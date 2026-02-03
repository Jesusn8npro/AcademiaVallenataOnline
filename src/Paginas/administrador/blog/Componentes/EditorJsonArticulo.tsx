import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import './EditorJsonArticulo.css';

// Usamos la misma interfaz que en ArticuloBlog pero adaptada para edición
export interface SeccionArticulo {
    tipo: 'parrafo' | 'encabezado' | 'imagen' | 'lista' | 'html';
    contenido: string; // Para parrafo, encabezado, html
    url?: string; // Para imagen
    alt?: string; // Para imagen
    caption?: string; // Para imagen
    nivel?: number; // Para encabezado (1-6)
    ordenada?: boolean; // Para lista
    items?: string[]; // Para lista
    [key: string]: any; // Flexibilidad para otros campos
}

export interface CtaItem {
    texto: string;
    href: string;
    estilo: 'primary' | 'outline' | 'whatsapp';
}

interface EditorJsonArticuloProps {
    secciones_json: SeccionArticulo[];
    cta_json: { items: CtaItem[] };
    onChange: (campo: 'secciones' | 'cta', valor: any) => void;
}

const EditorJsonArticulo: React.FC<EditorJsonArticuloProps> = ({ secciones_json, cta_json, onChange }) => {
    // Asegurar que sea array
    const safeSecciones = Array.isArray(secciones_json) ? secciones_json : [];
    const safeCtaItems = cta_json?.items && Array.isArray(cta_json.items) ? cta_json.items : [];

    // Estado para colapsar secciones (opcional, para UI más limpia)
    const [seccionesExpandidas, setSeccionesExpandidas] = useState<Record<number, boolean>>({});

    const toggleExpand = (index: number) => {
        setSeccionesExpandidas(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const agregarSeccion = () => {
        const nuevaSeccion: SeccionArticulo = { tipo: 'parrafo', contenido: '' };
        onChange('secciones', [...safeSecciones, nuevaSeccion]);
        // Expandir la nueva
        setSeccionesExpandidas(prev => ({ ...prev, [safeSecciones.length]: true }));
    };

    const actualizarSeccion = (index: number, campo: string, valor: any) => {
        const nuevas = [...safeSecciones];
        nuevas[index] = { ...nuevas[index], [campo]: valor };
        onChange('secciones', nuevas);
    };

    const eliminarSeccion = (index: number) => {
        const nuevas = safeSecciones.filter((_, i) => i !== index);
        onChange('secciones', nuevas);
    };

    const moverSeccion = (index: number, direccion: 'arriba' | 'abajo') => {
        if ((direccion === 'arriba' && index === 0) || (direccion === 'abajo' && index === safeSecciones.length - 1)) return;
        const nuevas = [...safeSecciones];
        const temp = nuevas[index];
        const nuevoIndex = direccion === 'arriba' ? index - 1 : index + 1;
        nuevas[index] = nuevas[nuevoIndex];
        nuevas[nuevoIndex] = temp;
        onChange('secciones', nuevas);
        // Ajustar expandidos sería ideal pero complejo, simplificamos por ahora
    };

    // --- CTA MANEJO ---
    const agregarCta = () => {
        const nuevoItem: CtaItem = { texto: 'Click aquí', href: '#', estilo: 'primary' };
        const nuevosItems = [...safeCtaItems, nuevoItem];
        onChange('cta', { items: nuevosItems });
    };

    const actualizarCta = (index: number, campo: keyof CtaItem, valor: string) => {
        const nuevosItems = [...safeCtaItems];
        nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
        onChange('cta', { items: nuevosItems });
    };

    const eliminarCta = (index: number) => {
        const nuevosItems = safeCtaItems.filter((_, i) => i !== index);
        onChange('cta', { items: nuevosItems });
    };

    return (
        <div className="editor-completo">
            {/* Editor de Secciones */}
            <div className="editor-json-container mb-6">
                <div className="editor-json-header">
                    <h4>Secciones del Artículo</h4>
                    <button type="button" onClick={agregarSeccion} className="btn-agregar-seccion">
                        <Plus size={16} /> Agregar Sección
                    </button>
                </div>

                <div className="lista-secciones">
                    {safeSecciones.map((seccion, index) => (
                        <div key={index} className="seccion-item">
                            <div className="seccion-header" onClick={() => toggleExpand(index)}>
                                <GripVertical size={16} className="text-gray-400 mr-2" />
                                <span>{seccion.tipo.toUpperCase()} - {index + 1}</span>
                                <div className="acciones-header" onClick={e => e.stopPropagation()}>
                                    <button type="button" onClick={() => moverSeccion(index, 'arriba')} disabled={index === 0} className="p-1 text-gray-400 hover:text-blue-500"><ChevronUp size={16} /></button>
                                    <button type="button" onClick={() => moverSeccion(index, 'abajo')} disabled={index === safeSecciones.length - 1} className="p-1 text-gray-400 hover:text-blue-500"><ChevronDown size={16} /></button>
                                    <button type="button" onClick={() => eliminarSeccion(index)} className="btn-eliminar-seccion"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {(seccionesExpandidas[index] || true) && ( // Por defecto expandido o controlado? Vamos a dejarlo siempre expandido si es simple
                                <div className="seccion-contenido">
                                    <select
                                        value={seccion.tipo}
                                        onChange={(e) => actualizarSeccion(index, 'tipo', e.target.value)}
                                        className="mb-2"
                                    >
                                        <option value="parrafo">Párrafo</option>
                                        <option value="encabezado">Encabezado</option>
                                        <option value="imagen">Imagen (URL)</option>
                                        <option value="lista">Lista</option>
                                        <option value="html">HTML Raw</option>
                                    </select>

                                    {seccion.tipo === 'encabezado' && (
                                        <select
                                            value={seccion.nivel || 2}
                                            onChange={(e) => actualizarSeccion(index, 'nivel', parseInt(e.target.value))}
                                            className="mb-2"
                                        >
                                            <option value={1}>H1 (Título Principal)</option>
                                            <option value={2}>H2 (Subtítulo)</option>
                                            <option value={3}>H3 (Sección)</option>
                                        </select>
                                    )}

                                    {seccion.tipo === 'imagen' ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="URL de la imagen"
                                                value={seccion.url || ''}
                                                onChange={(e) => actualizarSeccion(index, 'url', e.target.value)}
                                                className="mb-2"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Texto Alternativo (ALT)"
                                                value={seccion.alt || ''}
                                                onChange={(e) => actualizarSeccion(index, 'alt', e.target.value)}
                                                className="mb-2"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pie de foto (Caption)"
                                                value={seccion.caption || ''}
                                                onChange={(e) => actualizarSeccion(index, 'caption', e.target.value)}
                                            />
                                        </>
                                    ) : seccion.tipo === 'lista' ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={seccion.ordenada || false}
                                                    onChange={(e) => actualizarSeccion(index, 'ordenada', e.target.checked)}
                                                />
                                                <label>¿Lista Ordenada (1, 2, 3)?</label>
                                            </div>
                                            <textarea
                                                value={Array.isArray(seccion.items) ? seccion.items.join('\n') : seccion.items || ''}
                                                onChange={(e) => actualizarSeccion(index, 'items', e.target.value.split('\n'))}
                                                placeholder="Items de la lista (uno por línea)"
                                                rows={4}
                                            />
                                        </>
                                    ) : (
                                        <textarea
                                            value={seccion.contenido || ''}
                                            onChange={(e) => actualizarSeccion(index, 'contenido', e.target.value)}
                                            placeholder="Contenido..."
                                            rows={3}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor de CTA */}
            <div className="editor-json-container">
                <div className="editor-json-header">
                    <h4>Botones de Acción (CTA)</h4>
                    <button type="button" onClick={agregarCta} className="btn-agregar-seccion">
                        <Plus size={16} /> Agregar Botón
                    </button>
                </div>

                {safeCtaItems.map((item, index) => (
                    <div key={index} className="cta-item">
                        <input
                            type="text"
                            value={item.texto}
                            onChange={(e) => actualizarCta(index, 'texto', e.target.value)}
                            placeholder="Texto del botón"
                        />
                        <input
                            type="text"
                            value={item.href}
                            onChange={(e) => actualizarCta(index, 'href', e.target.value)}
                            placeholder="Enlace (URL)"
                        />
                        <select
                            value={item.estilo}
                            onChange={(e) => actualizarCta(index, 'estilo', e.target.value as any)}
                        >
                            <option value="primary">Primario</option>
                            <option value="outline">Borde</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                        <button type="button" onClick={() => eliminarCta(index)} className="btn-eliminar-cta">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EditorJsonArticulo;
