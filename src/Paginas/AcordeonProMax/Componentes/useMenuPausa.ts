import { useEffect, useState } from 'react';

interface UseMenuPausaParams {
  visible: boolean;
  onReanudar: () => void;
  onReiniciar: () => void;
  onSalir: () => void;
}

export function useMenuPausa({ visible, onReanudar, onReiniciar, onSalir }: UseMenuPausaParams) {
  const [vista, setVista] = useState<'principal' | 'opciones'>('principal');
  const [seleccionado, setSeleccionado] = useState(0);

  const NUM_OPCIONES = 4;

  useEffect(() => {
    if (!visible) {
      setVista('principal');
      return;
    }
    setSeleccionado(0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (vista === 'opciones') {
        if (e.key === 'Escape') { e.preventDefault(); setVista('principal'); }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSeleccionado((prev) => (prev + 1) % NUM_OPCIONES);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSeleccionado((prev) => (prev - 1 + NUM_OPCIONES) % NUM_OPCIONES);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (seleccionado === 0) onReanudar();
        else if (seleccionado === 1) onReiniciar();
        else if (seleccionado === 2) setVista('opciones');
        else onSalir();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReanudar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, seleccionado, vista, onReanudar, onReiniciar, onSalir]);

  useEffect(() => {
    if (visible) {
      document.body.style.cursor = 'default';
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [visible]);

  return { vista, setVista, seleccionado, setSeleccionado };
}
