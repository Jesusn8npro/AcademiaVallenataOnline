import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, RefreshCw, Trash2, Upload, Music2, Star } from 'lucide-react';
import './ModalGrabacionAdmin.css';

// Modal que aparece al detener REC SI el usuario es admin. Permite elegir
// entre guardar como "mi grabación personal" (tabla grabaciones_hero, igual
// que el alumno) o como "canción para alumnos" (tabla canciones_hero via
// crearCancionV2). Mobile-first: pantalla casi completa, controles grandes,
// botones touch-friendly. Re-grabar = descartar pendiente y volver a empezar.

type Destino = 'personal' | 'cancion_hero';
type Dificultad = 'basico' | 'intermedio' | 'avanzado';
type Tipo = 'cancion' | 'secuencia' | 'melodia';

interface Props {
    visible: boolean;
    guardando: boolean;
    error: string | null;
    /** Resumen de la grabación pendiente — null si no hay nada que mostrar. */
    resumen: {
        notas: number;
        duracionMs: number;
        bpm: number;
        tonalidad: string;
    } | null;
    /** Default sugerido. */
    tituloSugerido: string;
    /** Email del admin para autor default. */
    autorDefault: string;
    /** Si en la grabación se usó el metrónomo. */
    usoMetronomo: boolean;
    onCancelar: () => void;
    /** Descarta la grabación pendiente y vuelve a iniciar REC desde cero. */
    onRegrabar: () => void;
    /** Mismo contrato que ModalGuardarSimulador.onGuardar — args posicionales. */
    onGuardarPersonal: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
    onGuardarCancionHero: (datos: {
        titulo: string;
        autor: string;
        bpm: number;
        tonalidad: string;
        dificultad: Dificultad;
        tipo: Tipo;
        usoMetronomo: boolean;
        audioFondoFile?: File | null;
    }) => Promise<unknown>;
}

const ModalGrabacionAdmin: React.FC<Props> = ({
    visible, guardando, error, resumen, tituloSugerido, autorDefault, usoMetronomo,
    onCancelar, onRegrabar, onGuardarPersonal, onGuardarCancionHero,
}) => {
    const [destino, setDestino] = useState<Destino>('cancion_hero');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [autor, setAutor] = useState(autorDefault);
    const [dificultad, setDificultad] = useState<Dificultad>('basico');
    const [tipo, setTipo] = useState<Tipo>('cancion');
    const [audioFondoFile, setAudioFondoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // En mobile landscape el teclado virtual ocupa la mitad inferior y tapa
    // los inputs. Al recibir focus, esperamos a que el teclado termine de
    // aparecer (~300ms) y hacemos scroll del input hacia el centro del
    // viewport disponible para que el alumno vea lo que escribe.
    const handleFocusInput = (e: React.FocusEvent<HTMLElement>) => {
        const el = e.currentTarget;
        setTimeout(() => {
            try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (_) { /* navegadores antiguos: no-op */ }
        }, 300);
    };

    // Reset al abrir/cerrar.
    useEffect(() => {
        if (!visible) return;
        setTitulo(tituloSugerido || 'Mi grabación');
        setDescripcion('');
        setAudioFondoFile(null);
        setDestino('cancion_hero');
        setDificultad('basico');
        setTipo('cancion');
    }, [visible, tituloSugerido]);

    useEffect(() => { setAutor(autorDefault); }, [autorDefault]);

    const duracionTexto = useMemo(() => {
        if (!resumen) return '0:00';
        const seg = Math.round(resumen.duracionMs / 1000);
        const m = Math.floor(seg / 60);
        const s = seg % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }, [resumen]);

    if (!visible || !resumen) return null;

    const handleGuardar = async () => {
        if (destino === 'personal') {
            await onGuardarPersonal(titulo, descripcion);
        } else {
            await onGuardarCancionHero({
                titulo,
                autor,
                bpm: resumen.bpm,
                tonalidad: resumen.tonalidad,
                dificultad,
                tipo,
                usoMetronomo,
                audioFondoFile,
            });
        }
    };

    const handleSelectArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        if (f && !f.type.startsWith('audio/')) {
            // Aviso simple — no abrimos un toast porque ya tenemos `error` arriba.
            alert('El archivo debe ser de audio (MP3, WAV, OGG…)');
            e.target.value = '';
            return;
        }
        setAudioFondoFile(f);
    };

    return (
        <div className="mga-overlay" onClick={onCancelar} role="dialog" aria-modal="true">
            <div className="mga-contenido" onClick={(e) => e.stopPropagation()}>
                <header className="mga-header">
                    <div className="mga-header-titulo">
                        <Star size={18} className="mga-icono-admin" />
                        <h2>Guardar grabación · Admin</h2>
                    </div>
                    <button
                        type="button"
                        className="mga-btn-cerrar"
                        onClick={onCancelar}
                        aria-label="Cerrar"
                        disabled={guardando}
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="mga-cuerpo">
                    {/* Resumen rápido */}
                    <div className="mga-resumen">
                        <div className="mga-resumen-item">
                            <span className="mga-resumen-label">Notas</span>
                            <span className="mga-resumen-valor">{resumen.notas}</span>
                        </div>
                        <div className="mga-resumen-item">
                            <span className="mga-resumen-label">Duración</span>
                            <span className="mga-resumen-valor">{duracionTexto}</span>
                        </div>
                        <div className="mga-resumen-item">
                            <span className="mga-resumen-label">BPM</span>
                            <span className="mga-resumen-valor">{resumen.bpm}</span>
                        </div>
                        <div className="mga-resumen-item">
                            <span className="mga-resumen-label">Tono</span>
                            <span className="mga-resumen-valor">{resumen.tonalidad}</span>
                        </div>
                    </div>

                    {/* Re-grabar: descarta y reinicia. Útil para corregir notas
                        sucias sin guardar lo malo. */}
                    <button
                        type="button"
                        className="mga-btn-regrabar"
                        onClick={onRegrabar}
                        disabled={guardando}
                    >
                        <RefreshCw size={16} />
                        Volver a grabar todo
                    </button>

                    {/* Toggle de destino */}
                    <div className="mga-grupo">
                        <span className="mga-grupo-titulo">Guardar como</span>
                        <div className="mga-tabs-destino">
                            <button
                                type="button"
                                className={`mga-tab ${destino === 'personal' ? 'activo' : ''}`}
                                onClick={() => setDestino('personal')}
                                disabled={guardando}
                            >
                                <Save size={14} />
                                Mi grabación
                            </button>
                            <button
                                type="button"
                                className={`mga-tab mga-tab-hero ${destino === 'cancion_hero' ? 'activo' : ''}`}
                                onClick={() => setDestino('cancion_hero')}
                                disabled={guardando}
                            >
                                <Star size={14} />
                                Canción para alumnos
                            </button>
                        </div>
                    </div>

                    {/* Campo título — común a ambos destinos */}
                    <label className="mga-campo">
                        <span className="mga-campo-label">Título</span>
                        <input
                            type="text"
                            className="mga-input"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            onFocus={handleFocusInput}
                            placeholder="Ej: Camino de la noche"
                            disabled={guardando}
                            maxLength={120}
                        />
                    </label>

                    {/* Campos exclusivos PERSONAL */}
                    {destino === 'personal' && (
                        <label className="mga-campo">
                            <span className="mga-campo-label">Descripción (opcional)</span>
                            <textarea
                                className="mga-textarea"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                onFocus={handleFocusInput}
                                rows={2}
                                disabled={guardando}
                                maxLength={500}
                            />
                        </label>
                    )}

                    {/* Campos exclusivos CANCIÓN HERO */}
                    {destino === 'cancion_hero' && (
                        <>
                            <label className="mga-campo">
                                <span className="mga-campo-label">Autor</span>
                                <input
                                    type="text"
                                    className="mga-input"
                                    value={autor}
                                    onChange={(e) => setAutor(e.target.value)}
                                    onFocus={handleFocusInput}
                                    placeholder="Nombre del autor / artista"
                                    disabled={guardando}
                                    maxLength={120}
                                />
                            </label>

                            <div className="mga-fila-2">
                                <label className="mga-campo">
                                    <span className="mga-campo-label">Dificultad</span>
                                    <select
                                        className="mga-select"
                                        value={dificultad}
                                        onChange={(e) => setDificultad(e.target.value as Dificultad)}
                                        onFocus={handleFocusInput}
                                        disabled={guardando}
                                    >
                                        <option value="basico">Básico</option>
                                        <option value="intermedio">Intermedio</option>
                                        <option value="avanzado">Avanzado</option>
                                    </select>
                                </label>
                                <label className="mga-campo">
                                    <span className="mga-campo-label">Tipo</span>
                                    <select
                                        className="mga-select"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value as Tipo)}
                                        onFocus={handleFocusInput}
                                        disabled={guardando}
                                    >
                                        <option value="cancion">Canción</option>
                                        <option value="secuencia">Secuencia</option>
                                        <option value="melodia">Melodía</option>
                                    </select>
                                </label>
                            </div>

                            {/* Audio de fondo opcional */}
                            <div className="mga-campo">
                                <span className="mga-campo-label">
                                    <Music2 size={12} /> Pista MP3 de fondo (opcional)
                                </span>
                                {!audioFondoFile ? (
                                    <button
                                        type="button"
                                        className="mga-btn-archivo"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={guardando}
                                    >
                                        <Upload size={14} />
                                        Subir archivo
                                    </button>
                                ) : (
                                    <div className="mga-archivo-preview">
                                        <span className="mga-archivo-nombre" title={audioFondoFile.name}>
                                            {audioFondoFile.name}
                                        </span>
                                        <span className="mga-archivo-tamano">
                                            {(audioFondoFile.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                        <button
                                            type="button"
                                            className="mga-btn-quitar-archivo"
                                            onClick={() => setAudioFondoFile(null)}
                                            disabled={guardando}
                                            aria-label="Quitar archivo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*"
                                    className="mga-file-hidden"
                                    onChange={handleSelectArchivo}
                                />
                            </div>
                        </>
                    )}

                    {error && <div className="mga-error">{error}</div>}
                </div>

                <footer className="mga-footer">
                    <button
                        type="button"
                        className="mga-btn-secundario"
                        onClick={onCancelar}
                        disabled={guardando}
                    >
                        Descartar
                    </button>
                    <button
                        type="button"
                        className="mga-btn-primario"
                        onClick={handleGuardar}
                        disabled={guardando || !titulo.trim()}
                    >
                        {guardando ? 'Guardando…' : (
                            <>
                                <Save size={14} />
                                {destino === 'personal' ? 'Guardar' : 'Publicar canción'}
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ModalGrabacionAdmin;
