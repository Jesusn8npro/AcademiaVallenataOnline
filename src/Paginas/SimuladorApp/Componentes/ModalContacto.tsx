import React, { useState } from 'react';
import { X } from 'lucide-react';
import './ModalContacto.css';

interface ModalContactoProps {
    visible: boolean;
    onCerrar: () => void;
}

const CATEGORIAS = [
    "Lentitud",
    "Demasiados anuncios",
    "Afinación faltante o incorrecta",
    "App cierra abruptamente",
    "Retardo de sonido",
    "Sugerencias",
    "Error después de actualizar",
    "Falta traducción",
    "Otros",
    "Ejercicios o Escalas",
    "Solicitar canción"
];

const ModalContacto: React.FC<ModalContactoProps> = ({ visible, onCerrar }) => {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState("");
    const [modoEnfoque, setModoEnfoque] = useState(false);

    if (!visible) return null;

    const puedeEnviar = categoriaSeleccionada !== null && mensaje.length >= 10;
    const maxCaracteres = 400;

    const handleEnviar = () => {
        if (puedeEnviar) {
            console.log("Enviando mensaje:", { categoria: categoriaSeleccionada, mensaje });
            alert("¡Mensaje enviado con éxito!");
            setModoEnfoque(false);
            setMensaje("");
            setCategoriaSeleccionada(null);
            onCerrar();
        }
    };

    return (
        <div className={`modal-contacto-overlay ${modoEnfoque ? 'modo-enfoque' : ''}`} onClick={onCerrar}>
            <div className="modal-contacto-contenedor" onClick={(e) => e.stopPropagation()}>

                {/* 🎯 VISTA DE ENFOQUE (Estilo Imagen 1) */}
                {modoEnfoque ? (
                    <div className="vista-enfoque-teclado">
                        <div className="enfoque-cabecera">
                            <span className="enfoque-conteo">({mensaje.length}/{maxCaracteres})</span>
                            <h2 className="modal-contacto-titulo">Cuéntanos el problema que has encontrado</h2>
                            <div className="enfoque-acciones">
                                <button className="btn-enfoque-cancelar" onClick={() => setModoEnfoque(false)}>CANCELAR</button>
                                <button
                                    className={`btn-enfoque-concluido ${puedeEnviar ? 'activo' : ''}`}
                                    onClick={handleEnviar}
                                    disabled={!puedeEnviar}
                                >
                                    CONCLUIDO
                                </button>
                            </div>
                        </div>
                        <div className="enfoque-cuerpo">
                            <textarea
                                autoFocus
                                className="contacto-textarea-enfoque"
                                value={mensaje}
                                maxLength={maxCaracteres}
                                onChange={(e) => setMensaje(e.target.value)}
                                placeholder="Escribe aquí los detalles..."
                            />
                        </div>
                    </div>
                ) : (
                    /* 🎯 VISTA NORMAL (Imagen 2 corregida) */
                    <>
                        <div className="modal-contacto-cabecera">
                            <div className="label-solucion">Solución de Problemas</div>
                            <h2 className="modal-contacto-titulo">Cuéntanos el problema que has encontrado</h2>
                            <button className="btn-cerrar-rojo" onClick={onCerrar}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-contacto-cuerpo">
                            <div className="contacto-categorias-grid">
                                {CATEGORIAS.map((cat) => (
                                    <button
                                        key={cat}
                                        className={`btn-categoria ${categoriaSeleccionada === cat ? 'activa' : ''}`}
                                        onClick={() => setCategoriaSeleccionada(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="contacto-mensaje-contenedor" onClick={() => setModoEnfoque(true)}>
                                <div className="placeholder-falso">
                                    {mensaje || "Cuéntanos más detalles para que podamos identificar y resolver tu cuanto antes (mínimo 10 caracteres)"}
                                </div>
                            </div>
                        </div>

                        {puedeEnviar && (
                            <div className="modal-contacto-footer">
                                <button className="btn-enviar-contacto" onClick={handleEnviar}>
                                    Enviar
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ModalContacto;
