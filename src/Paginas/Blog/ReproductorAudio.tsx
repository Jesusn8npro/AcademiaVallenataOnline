import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

const ReproductorAudio = ({ texto }: { texto: string }) => {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [tiempoActual, setTiempoActual] = useState('0:00');
  const [duracion, setDuracion] = useState('0:00');
  const [vozSeleccionada, setVozSeleccionada] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const cargarVoces = () => {
      const voces = window.speechSynthesis.getVoices();
      let vozElegida = voces.find(v => v.lang === 'es-CO');
      if (!vozElegida) {
        vozElegida = voces.find(v =>
          (v.name.includes('Pablo') || v.name.includes('Raul') || v.name.includes('Latinoamérica')) && v.lang.startsWith('es')
        );
      }
      if (!vozElegida) vozElegida = voces.find(v => v.lang.startsWith('es'));
      if (vozElegida) setVozSeleccionada(vozElegida);
    };
    window.speechSynthesis.onvoiceschanged = cargarVoces;
    cargarVoces();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const formatearTiempo = (segundos: number) => {
    if (!isFinite(segundos) || isNaN(segundos)) return '0:00';
    const s = Math.floor(segundos);
    return `${Math.floor(s / 60)}:${('0' + (s % 60)).slice(-2)}`;
  };

  const limpiarSpeech = () => { window.speechSynthesis.cancel(); };

  useEffect(() => {
    if (!texto) return;
    limpiarSpeech();
    const ut = new SpeechSynthesisUtterance(texto);
    ut.rate = 1.0;
    ut.pitch = 1.0;
    if (vozSeleccionada) ut.voice = vozSeleccionada;
    else ut.lang = 'es-ES';
    const palabras = texto.split(/\s+/).length;
    const duracionEstimadaSegundos = palabras / 2.5;
    setDuracion(formatearTiempo(duracionEstimadaSegundos));
    utteranceRef.current = ut;
    return () => limpiarSpeech();
  }, [texto, vozSeleccionada]);

  const togglePlay = () => {
    const synth = window.speechSynthesis;
    if (!utteranceRef.current) return;
    if (reproduciendo) {
      synth.pause();
      setReproduciendo(false);
    } else {
      if (synth.paused) {
        synth.resume();
      } else {
        utteranceRef.current.onend = () => { setReproduciendo(false); setProgreso(100); };
        utteranceRef.current.onboundary = (event) => {
          const charIndex = event.charIndex;
          const textLen = utteranceRef.current?.text.length || 1;
          const percent = (charIndex / textLen) * 100;
          setProgreso(percent);
          const palabras = texto.split(/\s+/).length;
          const totalSeg = palabras / 2.5;
          setTiempoActual(formatearTiempo((percent / 100) * totalSeg));
        };
        synth.speak(utteranceRef.current);
      }
      setReproduciendo(true);
    }
  };

  if (!texto) return null;

  return (
    <div className="reproductor-audio">
      <span className="reproductor-label">Audio Artículo</span>
      <button onClick={togglePlay} className="btn-play" aria-label={reproduciendo ? 'Pausar' : 'Escuchar'}>
        {reproduciendo ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>
      <div className="progreso-audio">
        <div className="barra-progreso" style={{ width: `${progreso}%` }} />
      </div>
      <div className="tiempo-audio">{tiempoActual}</div>
    </div>
  );
};

export default ReproductorAudio;
