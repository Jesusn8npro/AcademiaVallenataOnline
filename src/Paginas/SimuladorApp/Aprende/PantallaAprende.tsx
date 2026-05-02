import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, HelpCircle, Search, Music, Hand, ListMusic, BarChart3, Disc3,
    Star, Wrench, Play, Settings, Headphones
} from 'lucide-react';
import { useCancionesProMax } from '../../AcordeonProMax/Hooks/useLogicaProMax';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import type { CancionHeroConTonalidad } from '../../AcordeonProMax/TiposProMax';
import PantallaConfigCancion from './PantallaConfigCancion';
import type { ConfigCancion } from './useConfigCancion';
import './PantallaAprende.css';

type Vista = 'inicio' | 'lista';
type Categoria = 'canciones' | 'escalas' | 'ejercicios' | 'acordes';
type FiltroCanciones = 'populares' | 'no_tocadas' | 'nombre' | 'dificultad';
type Dificultad = 'NORMAL' | 'FACIL' | 'EXTREMO';

const PLACEHOLDER_IMG = '/Acordeon PRO MAX.png';

const ETIQUETAS_DIFICULTAD: Record<string, Dificultad> = {
    basico: 'FACIL',
    intermedio: 'NORMAL',
    profesional: 'EXTREMO',
};

const ESTRELLAS_DIFICULTAD: Record<string, number> = {
    basico: 1,
    intermedio: 2,
    profesional: 3,
};

const COLOR_DIFICULTAD: Record<Dificultad, string> = {
    FACIL: '#22c55e',
    NORMAL: '#fbbf24',
    EXTREMO: '#ef4444',
};

// Mapeo categoría UI → tipo en la BD
const TIPO_BD: Record<Categoria, string> = {
    canciones: 'cancion',
    escalas: 'secuencia',
    ejercicios: 'ejercicio',
    acordes: 'secuencia',
};

const TITULO_CATEGORIA: Record<Categoria, string> = {
    canciones: 'CANCIONES',
    escalas: 'ESCALAS',
    ejercicios: 'EJERCICIOS',
    acordes: 'ACORDES',
};

interface PantallaAprendeProps {
    visible: boolean;
    onCerrar: () => void;
    onEmpezarCancion: (config: ConfigCancion) => void;
    tonalidadActual?: string;
}

const PantallaAprende: React.FC<PantallaAprendeProps> = ({
    visible,
    onCerrar,
    onEmpezarCancion,
    tonalidadActual = 'Bb/Eb/Ab'
}) => {
    const { canciones, cargando } = useCancionesProMax();
    const { usuario } = useUsuario();

    const [vista, setVista] = useState<Vista>('inicio');
    const [categoria, setCategoria] = useState<Categoria>('canciones');
    const [filtro, setFiltro] = useState<FiltroCanciones>('populares');
    const [busqueda, setBusqueda] = useState('');
    const [dificultadActiva, setDificultadActiva] = useState<Dificultad>('NORMAL');
    const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);
    const [cancionConfigurando, setCancionConfigurando] = useState<CancionHeroConTonalidad | null>(null);

    useEffect(() => {
        const cargarFavoritos = async () => {
            if (!usuario?.id) return;
            const { data, error } = await (supabase
                .from('favoritos_acordeon_hero' as any) as any)
                .select('cancion_id')
                .eq('user_id', usuario.id);
            if (!error && data) setIdsFavoritos(data.map((f: any) => f.cancion_id));
        };
        if (visible) cargarFavoritos();
    }, [usuario, visible]);

    // Reset a vista inicio al cerrar/abrir
    useEffect(() => {
        if (visible) {
            setVista('inicio');
            setBusqueda('');
        }
    }, [visible]);

    // ─── Conteos reales por tipo ─────────────────────────────
    const conteos = useMemo(() => {
        const porTipo = (tipo: string) => canciones.filter(c => (c as any).tipo === tipo);
        const aprendidasPorTipo = (tipo: string) =>
            porTipo(tipo).filter(c => idsFavoritos.includes(c.id)).length;

        return {
            canciones: { total: porTipo('cancion').length, aprendidas: aprendidasPorTipo('cancion') },
            ejercicios: { total: porTipo('ejercicio').length, aprendidas: aprendidasPorTipo('ejercicio') },
            secuencias: { total: porTipo('secuencia').length, aprendidas: aprendidasPorTipo('secuencia') },
        };
    }, [canciones, idsFavoritos]);

    const datosCategoria: Record<Categoria, { total: number; aprendidas: number }> = {
        canciones: conteos.canciones,
        ejercicios: conteos.ejercicios,
        escalas: conteos.secuencias,
        acordes: conteos.secuencias,
    };

    const calcularPorcentaje = (aprendidas: number, total: number) =>
        total === 0 ? 0 : Math.round((aprendidas / total) * 100);

    // ─── Lista filtrada de la categoría activa ───────────────
    const cancionesFiltradas = useMemo(() => {
        const tipoBd = TIPO_BD[categoria];
        let lista = canciones.filter(c => (c as any).tipo === tipoBd);

        const txt = busqueda.trim().toLowerCase();
        if (txt) {
            lista = lista.filter(c =>
                c.titulo.toLowerCase().includes(txt) ||
                c.autor.toLowerCase().includes(txt)
            );
        }

        switch (filtro) {
            case 'nombre':
                lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo));
                break;
            case 'dificultad':
                lista = [...lista].sort((a, b) =>
                    (ESTRELLAS_DIFICULTAD[a.dificultad] || 0) - (ESTRELLAS_DIFICULTAD[b.dificultad] || 0)
                );
                break;
            case 'no_tocadas':
                lista = lista.filter(c => !idsFavoritos.includes(c.id));
                break;
            case 'populares':
            default:
                break;
        }
        return lista;
    }, [canciones, busqueda, filtro, categoria, idsFavoritos]);

    const totalDelTab = datosCategoria[categoria].total;
    const aprendidasDelTab = datosCategoria[categoria].aprendidas;

    const abrirCategoria = (cat: Categoria) => {
        setCategoria(cat);
        setVista('lista');
    };

    const renderEstrellas = (dificultad: string) => {
        const llenas = ESTRELLAS_DIFICULTAD[dificultad] || 1;
        return (
            <div className="cancion-estrellas">
                {[1, 2, 3].map(i => (
                    <Star
                        key={i}
                        size={16}
                        fill={i <= llenas ? '#fbbf24' : 'transparent'}
                        color={i <= llenas ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
                    />
                ))}
            </div>
        );
    };

    // ─── PANTALLA INICIO ─────────────────────────────────────
    const renderInicio = () => (
        <>
            <header className="aprende-header aprende-header-inicio">
                <button className="aprende-icon-btn" onClick={onCerrar} aria-label="Volver">
                    <ArrowLeft size={20} />
                </button>
                <button className="aprende-icon-btn" aria-label="Ayuda">
                    <HelpCircle size={20} />
                </button>

                <h1 className="aprende-titulo-inicio">¡APRENDE A TOCAR EL ACORDEON!</h1>

                <button className="aprende-icon-btn aprende-icon-btn-derecha" aria-label="Configuracion">
                    <Settings size={20} />
                </button>
            </header>

            <main className="aprende-inicio-grid">
                <TarjetaCategoria
                    titulo="CANCIONES"
                    icono={<Music size={24} />}
                    aprendidas={conteos.canciones.aprendidas}
                    total={conteos.canciones.total}
                    porcentaje={calcularPorcentaje(conteos.canciones.aprendidas, conteos.canciones.total)}
                    descripcion={`${conteos.canciones.aprendidas} ${conteos.canciones.aprendidas === 1 ? 'CANCION APRENDIDA' : 'CANCIONES APRENDIDAS'}`}
                    imagen="/Acordeon PRO MAX.png"
                    cargando={cargando}
                    onComenzar={() => abrirCategoria('canciones')}
                    delay={0}
                />

                <TarjetaCategoria
                    titulo="ESCALAS"
                    icono={<BarChart3 size={24} />}
                    aprendidas={0}
                    total={0}
                    porcentaje={0}
                    descripcion="0 ESCALAS APRENDIDAS"
                    imagen={null}
                    cargando={false}
                    onComenzar={() => abrirCategoria('escalas')}
                    delay={0.06}
                    proximamente
                />

                <TarjetaCategoria
                    titulo="EJERCICIOS"
                    icono={<Hand size={24} />}
                    aprendidas={conteos.ejercicios.aprendidas}
                    total={conteos.ejercicios.total}
                    porcentaje={calcularPorcentaje(conteos.ejercicios.aprendidas, conteos.ejercicios.total)}
                    descripcion="MOD. 1 - AGILIDAD"
                    imagen="/Acordeon Jugador.png"
                    cargando={cargando}
                    onComenzar={() => abrirCategoria('ejercicios')}
                    delay={0.12}
                />

                <TarjetaCategoria
                    titulo="ACORDES"
                    icono={<Disc3 size={24} />}
                    aprendidas={conteos.secuencias.aprendidas}
                    total={conteos.secuencias.total}
                    porcentaje={calcularPorcentaje(conteos.secuencias.aprendidas, conteos.secuencias.total)}
                    descripcion={`${conteos.secuencias.aprendidas} ACORDES APRENDIDOS`}
                    imagen="/Diapason Acordeon PNG.png"
                    cargando={cargando}
                    onComenzar={() => abrirCategoria('acordes')}
                    delay={0.18}
                />
            </main>
        </>
    );

    // ─── PANTALLA LISTA ──────────────────────────────────────
    const renderLista = () => (
        <>
            <header className="aprende-header">
                <button className="aprende-icon-btn" onClick={() => setVista('inicio')} aria-label="Volver">
                    <ArrowLeft size={20} />
                </button>
                <button className="aprende-icon-btn" aria-label="Ayuda">
                    <HelpCircle size={20} />
                </button>

                <div className="aprende-titulo-wrap">
                    {categoria === 'canciones' && <Music size={20} className="aprende-titulo-icon" />}
                    {categoria === 'ejercicios' && <Hand size={20} className="aprende-titulo-icon" />}
                    {categoria === 'escalas' && <BarChart3 size={20} className="aprende-titulo-icon" />}
                    {categoria === 'acordes' && <Disc3 size={20} className="aprende-titulo-icon" />}
                    <h1 className="aprende-titulo">{TITULO_CATEGORIA[categoria]}</h1>
                </div>

                <button className="aprende-solicitar">
                    <span>Solicitar cancion</span>
                    <Headphones size={16} />
                </button>

                <div className="aprende-afinacion">
                    <span className="aprende-afinacion-label">AFINACION:</span>
                    <span className="aprende-afinacion-valor">{tonalidadActual}</span>
                </div>

                <button className="aprende-icon-btn aprende-icon-btn-derecha" aria-label="Configuracion">
                    <Settings size={20} />
                </button>
            </header>

            <main className="aprende-contenido">
                <div className="aprende-filtros">
                    <button className={`filtro-pill ${filtro === 'populares' ? 'activo' : ''}`} onClick={() => setFiltro('populares')}>
                        POPULARES <span className="filtro-flecha">▾</span>
                    </button>
                    <button className={`filtro-pill ${filtro === 'no_tocadas' ? 'activo' : ''}`} onClick={() => setFiltro('no_tocadas')}>
                        AUN NO TOCADAS
                    </button>
                    <button className={`filtro-pill ${filtro === 'nombre' ? 'activo' : ''}`} onClick={() => setFiltro('nombre')}>
                        NOMBRE
                    </button>
                    <button className={`filtro-pill ${filtro === 'dificultad' ? 'activo' : ''}`} onClick={() => setFiltro('dificultad')}>
                        DIFICULTAD
                    </button>

                    <div className="aprende-buscador">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>

                <div className="aprende-lista">
                    {cargando ? (
                        <div className="aprende-cargando">
                            <div className="aprende-spinner" />
                            <span>Cargando {TITULO_CATEGORIA[categoria].toLowerCase()}...</span>
                        </div>
                    ) : cancionesFiltradas.length === 0 ? (
                        <div className="aprende-vacio">
                            <Music size={48} />
                            <p>No hay {TITULO_CATEGORIA[categoria].toLowerCase()} disponibles</p>
                        </div>
                    ) : (
                        cancionesFiltradas.map((c) => {
                            const etiqueta = ETIQUETAS_DIFICULTAD[c.dificultad] || 'NORMAL';
                            const imagen = c.youtube_id
                                ? `https://img.youtube.com/vi/${c.youtube_id}/mqdefault.jpg`
                                : PLACEHOLDER_IMG;
                            return (
                                <div key={c.id} className="cancion-card">
                                    <div className="cancion-imagen">
                                        <img
                                            src={imagen}
                                            alt={c.titulo}
                                            onError={(e) => {
                                                const el = e.currentTarget as HTMLImageElement;
                                                if (!el.src.endsWith(PLACEHOLDER_IMG)) el.src = PLACEHOLDER_IMG;
                                            }}
                                        />
                                    </div>

                                    <div className="cancion-info">
                                        <h3 className="cancion-titulo">
                                            {idsFavoritos.includes(c.id) && (
                                                <Star size={13} fill="#fbbf24" color="#fbbf24" style={{ marginRight: 4 }} />
                                            )}
                                            {c.titulo}
                                        </h3>
                                        <p className="cancion-autor">{c.autor}</p>
                                    </div>

                                    <div className="cancion-dificultad">
                                        <span
                                            className="cancion-dificultad-label"
                                            style={{ color: COLOR_DIFICULTAD[etiqueta] }}
                                        >
                                            {etiqueta}
                                        </span>
                                        {renderEstrellas(c.dificultad)}
                                    </div>

                                    <div className="cancion-progreso">
                                        <span>100%</span>
                                        <Wrench size={14} />
                                    </div>

                                    <button
                                        className="cancion-jugar"
                                        onClick={() => setCancionConfigurando(c)}
                                    >
                                        <Play size={14} fill="#000" />
                                        JUGAR
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            <footer className="aprende-footer">
                <div className="aprende-footer-tabs">
                    <button
                        className={`tab-inferior ${categoria === 'canciones' ? 'activo' : ''}`}
                        onClick={() => setCategoria('canciones')}
                    >
                        <Music size={18} />
                        <span>CANCIONES</span>
                    </button>
                    <button
                        className={`tab-inferior ${categoria === 'ejercicios' ? 'activo' : ''}`}
                        onClick={() => setCategoria('ejercicios')}
                    >
                        <Hand size={18} />
                        <span>EJERCICIOS</span>
                    </button>
                    <button
                        className={`tab-inferior ${categoria === 'acordes' ? 'activo' : ''}`}
                        onClick={() => setCategoria('acordes')}
                    >
                        <ListMusic size={18} />
                        <span>SECUENCIAS</span>
                    </button>
                </div>

                <div className="aprende-footer-stats">
                    <div className="aprende-favoritos">
                        <Star size={18} fill="#fbbf24" color="#fbbf24" />
                        <span>{aprendidasDelTab} / {totalDelTab}</span>
                    </div>

                    <button
                        className="aprende-dificultad-btn"
                        style={{ background: COLOR_DIFICULTAD[dificultadActiva] }}
                        onClick={() => {
                            const orden: Dificultad[] = ['FACIL', 'NORMAL', 'EXTREMO'];
                            const idx = orden.indexOf(dificultadActiva);
                            setDificultadActiva(orden[(idx + 1) % orden.length]);
                        }}
                    >
                        {dificultadActiva}
                    </button>
                </div>
            </footer>
        </>
    );

    if (!visible) return null;

    return (
        <motion.div
            className="aprende-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            {vista === 'inicio' ? renderInicio() : renderLista()}

            {cancionConfigurando && (
                <PantallaConfigCancion
                    cancion={cancionConfigurando}
                    onCerrar={() => setCancionConfigurando(null)}
                    onEmpezar={(config) => {
                        // Coordinacion: cerramos config primero, luego arrancamos juego
                        // un tick despues para que React desmonte limpio antes del cambio raiz.
                        setCancionConfigurando(null);
                        setTimeout(() => onEmpezarCancion(config), 30);
                    }}
                />
            )}
        </motion.div>
    );
};

// ─── COMPONENTE TARJETA CATEGORÍA ─────────────────────────
interface TarjetaCategoriaProps {
    titulo: string;
    icono: React.ReactNode;
    aprendidas: number;
    total: number;
    porcentaje: number;
    descripcion: string;
    imagen: string | null;
    cargando: boolean;
    onComenzar: () => void;
    delay: number;
    proximamente?: boolean;
}

const TarjetaCategoria: React.FC<TarjetaCategoriaProps> = ({
    titulo, icono, aprendidas, total, porcentaje, descripcion, imagen, cargando, onComenzar, delay, proximamente
}) => {
    return (
        <motion.div
            className="tarjeta-categoria"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="tarjeta-titulo-row">
                <span className="tarjeta-titulo-icon">{icono}</span>
                <h2 className="tarjeta-titulo">{titulo}</h2>
            </div>
            <div className="tarjeta-divider" />

            <div className="tarjeta-imagen">
                {imagen ? (
                    <img src={imagen} alt={titulo} />
                ) : (
                    <div className="tarjeta-imagen-placeholder">{icono}</div>
                )}
            </div>

            <div className="tarjeta-stats">
                <div className="tarjeta-progreso-circulo">
                    <span className="tarjeta-progreso-pct">{porcentaje}%</span>
                </div>
                <div className="tarjeta-conteo">
                    <Star size={20} fill="#fbbf24" color="#fbbf24" />
                    <span>{aprendidas} / {total}</span>
                </div>
            </div>

            <div className="tarjeta-descripcion">• {descripcion}</div>

            <button
                className="tarjeta-cta"
                onClick={onComenzar}
                disabled={cargando}
            >
                {proximamente ? 'PROXIMAMENTE' : 'COMENZAR'}
            </button>
        </motion.div>
    );
};

export default PantallaAprende;
