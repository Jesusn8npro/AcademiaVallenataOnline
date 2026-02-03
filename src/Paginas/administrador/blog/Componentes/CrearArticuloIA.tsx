import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, Send, Loader2, Sparkles, RotateCcw, MessageCircle } from 'lucide-react';
import './CrearArticuloIA.css';
import FormularioArticulo from '../FormularioArticulo';
import { supabase } from '../../../../servicios/supabaseCliente'; // Ajusta ruta si es necesario

// Se simplifican las props ya que FormularioArticulo maneja el guardado
interface CrearArticuloIAProps {
    // onArticuloCreado se llamaría solo si queremos notificar al padre, 
    // pero FormularioArticulo redirige al terminar.
}

interface Mensaje {
    id: number;
    tipo: 'agente' | 'usuario';
    contenido: string;
    marcaTiempo: number;
}

const CrearArticuloIA: React.FC<CrearArticuloIAProps> = () => {
    const CLAVE_CONVERSACION = 'creador_articulo_ia_conversacion_crear';
    const CLAVE_ARTICULO_GENERADO = 'creador_articulo_ia_articulo_crear';

    const [pasoActual, setPasoActual] = useState(1);
    const [listaMensajes, setListaMensajes] = useState<Mensaje[]>([
        {
            id: 1,
            tipo: 'agente',
            contenido: '¡Hola! Soy tu asistente IA para crear artículos de blog. Dime sobre qué quieres escribir.',
            marcaTiempo: Date.now()
        }
    ]);
    const [textoMensaje, setTextoMensaje] = useState('');
    const [estaCargando, setEstaCargando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    const [articuloGenerado, setArticuloGenerado] = useState<any>(null);
    const [conversacionId, setConversacionId] = useState(`conv_${Date.now()}`);

    const referenciaChat = useRef<HTMLDivElement>(null);

    // Cargar estado
    useEffect(() => {
        const saved = localStorage.getItem(CLAVE_CONVERSACION);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.mensajes) setListaMensajes(data.mensajes);
                if (data.paso) setPasoActual(data.paso);
                if (data.articulo) setArticuloGenerado(data.articulo);
            } catch (e) {
                console.error("Error cargando conversación", e);
            }
        }
    }, []);

    // Guardar estado
    useEffect(() => {
        const estado = {
            mensajes: listaMensajes,
            paso: pasoActual,
            articulo: articuloGenerado
        };
        localStorage.setItem(CLAVE_CONVERSACION, JSON.stringify(estado));
    }, [listaMensajes, pasoActual, articuloGenerado]);

    // Scroll al fondo
    useEffect(() => {
        if (referenciaChat.current) {
            referenciaChat.current.scrollTop = referenciaChat.current.scrollHeight;
        }
    }, [listaMensajes]);

    const limpiarConversacion = () => {
        localStorage.removeItem(CLAVE_CONVERSACION);
        setListaMensajes([{
            id: 1,
            tipo: 'agente',
            contenido: '¡Hola! Soy tu asistente IA para crear artículos de blog. Dime sobre qué quieres escribir.',
            marcaTiempo: Date.now()
        }]);
        setArticuloGenerado(null);
        setPasoActual(1);
        setConversacionId(`conv_${Date.now()}`);
        setMensajeError('');
        setTextoMensaje('');
    };

    const parsearRespuestaN8N = (data: any) => {
        // Lógica simplificada de extracción basada en el ejemplo original
        const respuesta = Array.isArray(data) ? data[0] : data;
        if (!respuesta || typeof respuesta !== 'object') return { error: 'Respuesta inválida' };

        // Buscar objeto artículo
        const keysArticulo = ['articulo_generado', 'json_limpio', 'datos_articulo'];
        for (const key of keysArticulo) {
            if (respuesta[key]) {
                return { articulo: typeof respuesta[key] === 'string' ? JSON.parse(respuesta[key]) : respuesta[key] };
            }
        }

        // Si la respuesta misma es el artículo
        if (respuesta.titulo && respuesta.slug && respuesta.secciones) {
            return { articulo: respuesta };
        }

        // Buscar mensaje de texto
        const keysMsg = ['respuesta_agente', 'output', 'message', 'content'];
        for (const key of keysMsg) {
            if (respuesta[key] && typeof respuesta[key] === 'string') return { respuestaAgente: respuesta[key] };
        }

        return { error: 'No se pudo interpretar la respuesta.' };
    };

    const handleEnviarMensaje = async () => {
        if (!textoMensaje.trim() || estaCargando) return;

        const texto = textoMensaje.trim();
        setTextoMensaje('');
        setEstaCargando(true);
        setMensajeError('');

        const msgUsuario: Mensaje = { id: Date.now(), tipo: 'usuario', contenido: texto, marcaTiempo: Date.now() };
        setListaMensajes(prev => [...prev, msgUsuario]);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const payload = {
                topic: texto,
                authorId: user?.id || 'anon',
                conversacion_id: conversacionId
            };

            const response = await fetch('https://velostrategix-n8n.lnrubg.easypanel.host/webhook-test/chat_creador_articulos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error en el servicio de IA');

            const data = await response.json();
            const { articulo, respuestaAgente, error } = parsearRespuestaN8N(data);

            if (articulo) {
                setArticuloGenerado(articulo);
                setListaMensajes(prev => [...prev, {
                    id: Date.now() + 1,
                    tipo: 'agente',
                    contenido: '¡He generado un borrador! Puedes revisarlo y editarlo ahora.',
                    marcaTiempo: Date.now()
                }]);
                setPasoActual(2); // Cambiar a vista de formulario
            } else if (respuestaAgente) {
                setListaMensajes(prev => [...prev, {
                    id: Date.now() + 1,
                    tipo: 'agente',
                    contenido: respuestaAgente,
                    marcaTiempo: Date.now()
                }]);
            } else {
                throw new Error(error || 'Sin respuesta válida');
            }

        } catch (e: any) {
            setMensajeError(e.message || 'Error de conexión');
            setListaMensajes(prev => [...prev, {
                id: Date.now() + 1,
                tipo: 'agente',
                contenido: 'Lo siento, tuve un error al procesar tu solicitud.',
                marcaTiempo: Date.now()
            }]);
        } finally {
            setEstaCargando(false);
        }
    };

    return (
        <div className="chat-ia-blog-creador">
            <div className="chat-ia-blog-header">
                <h3><Sparkles size={20} /> Crear Artículo con IA</h3>
                <button onClick={limpiarConversacion} className="chat-ia-blog-btn-limpiar" title="Reiniciar chat"><RotateCcw size={16} /></button>
            </div>

            {pasoActual === 1 ? (
                <>
                    <div className="chat-ia-blog-container" ref={referenciaChat}>
                        {listaMensajes.map(m => (
                            <div key={m.id} className={`chat-ia-blog-mensaje ${m.tipo}`}>
                                <div className="chat-ia-blog-avatar">{m.tipo === 'agente' ? <Bot size={24} /> : <User size={24} />}</div>
                                <div className="chat-ia-blog-contenido">{m.contenido}</div>
                            </div>
                        ))}
                        {estaCargando && (
                            <div className="chat-ia-blog-mensaje agente">
                                <div className="chat-ia-blog-avatar"><Bot size={24} /></div>
                                <div className="chat-ia-blog-contenido"><Loader2 className="chat-ia-blog-spinner" size={20} /></div>
                            </div>
                        )}
                    </div>
                    <div className="chat-ia-blog-input">
                        <input
                            value={textoMensaje}
                            onChange={e => setTextoMensaje(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEnviarMensaje()}
                            placeholder="Describe el artículo que deseas..."
                            disabled={estaCargando}
                        />
                        <button onClick={handleEnviarMensaje} disabled={estaCargando || !textoMensaje.trim()}><Send size={18} /></button>
                    </div>
                    {mensajeError && <div className="chat-ia-blog-error-mensaje">{mensajeError}</div>}
                </>
            ) : (
                <div className="vista-previa-articulo">
                    {/* Aquí montamos el formulario con los datos generados */}
                    {articuloGenerado && (
                        <FormularioArticulo
                            datosIniciales={articuloGenerado}
                        />
                    )}

                    <button onClick={() => setPasoActual(1)} className="btn-volver-chat">
                        <MessageCircle size={16} /> Volver al Chat
                    </button>
                </div>
            )}
        </div>
    );
};

export default CrearArticuloIA;
