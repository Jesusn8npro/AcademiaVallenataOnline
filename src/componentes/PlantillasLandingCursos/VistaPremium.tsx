import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DatosVista } from '../../Paginas/Cursos/LandingCurso';
import './VistaPremium.css';
import ModalPagoInteligente from '../Pagos/ModalPagoInteligente';
import BannerOferta from './secciones/BannerOferta';
import HeroSection from './secciones/HeroSection';
import VentajasSection from './secciones/VentajasSection';
import PreciosSection from './secciones/PreciosSection';
import MentorSection from './secciones/MentorSection';

interface Props {
    data: DatosVista;
    handleInscripcion: () => Promise<void>;
    verContenido: () => void;
    irAPrimeraClase: () => void;
}

const VistaPremium = ({ data, verContenido }: Props) => {
    const navigate = useNavigate();
    const [cargando] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
    const [ofertaActiva, setOfertaActiva] = useState(false);
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { contenido, estaInscrito } = data;
    const tipoContenido = contenido.tipo;

    const calcularTiempoRestante = () => {
        if (!contenido.fecha_expiracion) return;
        const diff = new Date(contenido.fecha_expiracion).getTime() - Date.now();
        if (diff <= 0) {
            setOfertaActiva(false);
            setTiempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
            return;
        }
        setTiempoRestante({
            dias: Math.floor(diff / 86400000),
            horas: Math.floor((diff % 86400000) / 3600000),
            minutos: Math.floor((diff % 3600000) / 60000),
            segundos: Math.floor((diff % 60000) / 1000),
        });
    };

    const calcularDescuento = (): number => {
        const { precio_normal: n = 0, precio_rebajado: r = 0 } = contenido;
        return n > 0 && r > 0 && r < n ? Math.round((1 - r / n) * 100) : 0;
    };

    const volver = () => window.history.length > 1 ? window.history.back() : navigate('/cursos');

    const procesarObjetivos = (): string[] => {
        const { objetivos } = contenido;
        let result: string[] = [];
        if (Array.isArray(objetivos) && objetivos.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = (objetivos as any[])
                .filter(o => (typeof o === 'object' ? o.texto : o)?.trim())
                .map(o => (typeof o === 'object' && o.texto ? o.texto : o));
        } else if (typeof objetivos === 'string' && objetivos.trim()) {
            const lines = objetivos.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
            result = lines.length === 1 && lines[0].includes(',')
                ? lines[0].split(',').map((s: string) => s.trim()).filter(Boolean)
                : lines;
        } else {
            result = ['Técnicas avanzadas', 'Contenido exclusivo', 'Soporte personalizado', 'Acceso de por vida'];
        }
        return result.map((r: string) => r.replace(/[,;]+$/, ''));
    };

    const objetivos = procesarObjetivos();
    const comprar = () => setMostrarModalPago(true);

    useEffect(() => {
        document.body.classList.add('vista-premium-activa');
        if (contenido.fecha_expiracion) {
            const fechaFin = new Date(contenido.fecha_expiracion).getTime();
            if (fechaFin > Date.now()) {
                setOfertaActiva(true);
                calcularTiempoRestante();
                intervaloRef.current = setInterval(calcularTiempoRestante, 1000);
            }
        }
        return () => {
            if (intervaloRef.current) clearInterval(intervaloRef.current);
            document.body.classList.remove('vista-premium-activa');
            document.body.classList.remove('vista-premium-banner-activo');
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        document.body.classList.toggle('vista-premium-banner-activo', ofertaActiva);
    }, [ofertaActiva]);

    const mostrarBanner = ofertaActiva;

    return (
        <div className="vista-premium-container">
            {mostrarBanner && (
                <BannerOferta tiempoRestante={tiempoRestante} descuento={calcularDescuento()} volver={volver} />
            )}
            <HeroSection
                contenido={contenido}
                estaInscrito={estaInscrito}
                tipoContenido={tipoContenido}
                objetivos={objetivos}
                cargando={cargando}
                onComprar={comprar}
                verContenido={verContenido}
            />
            <VentajasSection estaInscrito={estaInscrito} />
            <PreciosSection contenido={contenido} objetivos={objetivos} cargando={cargando} onComprar={comprar} />
            <MentorSection cargando={cargando} onComprar={comprar} />
            <ModalPagoInteligente
                mostrar={mostrarModalPago}
                setMostrar={setMostrarModalPago}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                contenido={contenido as any}
                tipoContenido={tipoContenido === 'curso' ? 'curso' : 'tutorial'}
            />
        </div>
    );
};

export default VistaPremium;
