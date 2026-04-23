import { useState, useRef } from 'react';
import type { NotaHero } from '../TiposProMax';

export function useSynthesiaProMax() {
  const notasEsperandoRef = useRef<NotaHero[]>([]);
  const maestroPermitidoEnSynthesiaRef = useRef(false);

  const [notasEsperando, _setNotasEsperando] = useState<NotaHero[]>([]);
  const [botonesGuiaAlumno, setBotonesGuiaAlumno] = useState<Record<string, true>>({});
  const [mensajeMotivacional, setMensajeMotivacional] = useState('¡Prepárate para tocar!');
  const [feedbackFuelle, setFeedbackFuelle] = useState('');

  const setNotasEsperando = (notas: NotaHero[]) => {
    notasEsperandoRef.current = notas;
    _setNotasEsperando(notas);
  };

  const limpiarSynthesia = () => {
    setNotasEsperando([]);
    setBotonesGuiaAlumno({});
    maestroPermitidoEnSynthesiaRef.current = false;
  };

  return {
    notasEsperando,
    setNotasEsperando,
    botonesGuiaAlumno,
    setBotonesGuiaAlumno,
    mensajeMotivacional,
    setMensajeMotivacional,
    feedbackFuelle,
    setFeedbackFuelle,
    notasEsperandoRef,
    maestroPermitidoEnSynthesiaRef,
    limpiarSynthesia,
  };
}
