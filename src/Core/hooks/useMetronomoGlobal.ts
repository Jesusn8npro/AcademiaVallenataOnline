import { useState, useEffect } from 'react';
import { motorAudioPro } from '../audio/AudioEnginePro';

interface Props {
  bpmHero: number;
  reproduciendo: boolean;
}

export const useMetronomoGlobal = ({ bpmHero, reproduciendo }: Props) => {
  const [metronomoActivo, setMetronomoActivo] = useState(false);

  useEffect(() => {
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_fuerte', '/audio/effects/du2.mp3').catch(() => {});
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_debil', '/audio/effects/du.mp3').catch(() => {});
  }, []);

  useEffect(() => {
    if (!metronomoActivo || reproduciendo) return;
    const intervalMs = (60 / bpmHero) * 1000;
    let beatCount = 0;
    const interval = setInterval(() => {
      const beatEnCompas = beatCount % 4;
      motorAudioPro.reproducir(
        beatEnCompas === 0 ? 'click_fuerte' : 'click_debil',
        'metronomo',
        beatEnCompas === 0 ? 0.6 : 0.4
      );
      beatCount++;
    }, intervalMs);
    return () => clearInterval(interval);
  }, [metronomoActivo, bpmHero, reproduciendo]);

  return { metronomoActivo, setMetronomoActivo };
};
