import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { busquedaService, type ResultadosBusqueda } from '../../servicios/busquedaService';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

interface UseModalBusquedaProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function useModalBusqueda({ abierto, onCerrar }: UseModalBusquedaProps) {
  const navigate = useNavigate();
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [resultadoIndiceActivo, setResultadoIndiceActivo] = useState(-1);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadosBusqueda>({
    cursos: [],
    tutoriales: [],
    blog: [],
    usuarios: [],
    eventos: [],
    paquetes: [],
    total: 0
  });

  useEffect(() => {
    if (abierto) {
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
        reproducirSonido('abrir');
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  useEffect(() => {
    const timeoutBusqueda = setTimeout(() => {
      if (terminoBusqueda.length >= 2) {
        realizarBusqueda();
      } else if (terminoBusqueda.length < 2) {
        setResultadosBusqueda({ cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0 });
      }
    }, 300);
    return () => clearTimeout(timeoutBusqueda);
  }, [terminoBusqueda]);

  useEffect(() => {
    generarSugerencias();
  }, [terminoBusqueda]);

  const realizarBusqueda = async () => {
    if (!terminoBusqueda || terminoBusqueda.length < 2) return;
    setCargandoResultados(true);
    setMostrandoSugerencias(false);
    setResultadoIndiceActivo(-1);
    try {
      const resultados = await busquedaService.buscarTodo(terminoBusqueda);
      setResultadosBusqueda(resultados);
    } catch {
      setResultadosBusqueda({ cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0 });
    } finally {
      setCargandoResultados(false);
    }
  };

  const generarSugerencias = async () => {
    if (terminoBusqueda.length >= 1) {
      const sugerenciasBasicas = [
        'acordeón', 'vallenato', 'diomedes', 'carlos vives', 'binomio de oro',
        'principiante', 'intermedio', 'avanzado', 'técnicas', 'historia',
        'la gota fría', 'mi primera cana', 'masterclass', 'festival'
      ];
      const filtradas = sugerenciasBasicas
        .filter(s => s.toLowerCase().includes(terminoBusqueda.toLowerCase()))
        .slice(0, 5);
      setSugerencias(filtradas);
      setMostrandoSugerencias(filtradas.length > 0 && terminoBusqueda.length < 3);
    } else {
      setSugerencias([]);
      setMostrandoSugerencias(false);
    }
  };

  const reproducirSonido = (tipo: string) => {
    try {
      let rutaAudio = '';
      switch (tipo) {
        case 'hover': rutaAudio = '/audio/effects/ui/ping.mp3'; break;
        case 'click': rutaAudio = '/audio/effects/ui/click.mp3'; break;
        case 'abrir': rutaAudio = '/audio/effects/ui/mopen.mp3'; break;
        case 'cerrar': rutaAudio = '/audio/effects/ui/mclose.mp3'; break;
        case 'buscar': rutaAudio = '/audio/effects/ui/flourish.mp3'; break;
        case 'sugerencia': rutaAudio = '/audio/effects/ui/pop.mp3'; break;
        case 'resultado': rutaAudio = '/audio/effects/success.mp3'; break;
        case 'error': rutaAudio = '/audio/effects/error.mp3'; break;
        default: return;
      }
      const audio = new Audio(rutaAudio);
      audio.volume = 0.2;
      audio.play().catch(() => { });
    } catch {
      // ignore audio errors
    }
  };

  const abrirChatDesdeModal = () => {
    reproducirSonido('click');
    onCerrar();
    setTimeout(() => {
      const event = new CustomEvent('abrirChatWidget', {
        detail: {
          mensaje: `Hola! Me interesa aprender sobre: "${terminoBusqueda || 'acordeón vallenato'}"`,
          origen: 'busqueda'
        }
      });
      window.dispatchEvent(event);
    }, 300);
  };

  const navigarAResultado = (url: string) => {
    reproducirSonido('resultado');
    onCerrar();
    setTimeout(() => { navigate(url); }, 10);
  };

  const manejarTeclas = (event: ReactKeyboardEvent) => {
    const { key } = event;
    const todosLosResultados = [
      ...resultadosBusqueda.cursos,
      ...resultadosBusqueda.tutoriales,
      ...resultadosBusqueda.blog,
      ...resultadosBusqueda.eventos
    ];

    switch (key) {
      case 'Escape':
        reproducirSonido('cerrar');
        onCerrar();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (todosLosResultados.length > 0) {
          setResultadoIndiceActivo(prev => Math.min(prev + 1, todosLosResultados.length - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (todosLosResultados.length > 0) {
          setResultadoIndiceActivo(prev => Math.max(prev - 1, -1));
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (resultadoIndiceActivo >= 0 && todosLosResultados[resultadoIndiceActivo]) {
          reproducirSonido('resultado');
          navigarAResultado(todosLosResultados[resultadoIndiceActivo].url);
        } else if (terminoBusqueda.length >= 2) {
          reproducirSonido('buscar');
          realizarBusqueda();
        }
        break;
    }
  };

  return {
    inputBusquedaRef,
    terminoBusqueda, setTerminoBusqueda,
    cargandoResultados,
    resultadoIndiceActivo,
    sugerencias, mostrandoSugerencias,
    resultadosBusqueda,
    reproducirSonido, abrirChatDesdeModal, navigarAResultado, manejarTeclas
  };
}
