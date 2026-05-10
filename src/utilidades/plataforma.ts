// Helpers de plataforma — detectan Capacitor y exponen utilidades nativas.
// Todos los helpers de runtime son no-op en web para no engordar el bundle web.

import { Capacitor } from '@capacitor/core';

export const esNativo = () => Capacitor.isNativePlatform();
export const esAndroid = () => Capacitor.getPlatform() === 'android';
export const esIOS = () => Capacitor.getPlatform() === 'ios';
export const esWeb = () => Capacitor.getPlatform() === 'web';

// Vibracion ligera (toques, confirmaciones suaves)
export async function vibracionLeve() {
  if (!esNativo()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // silencioso — no romper UX si el plugin falla
  }
}

// Vibracion media (acciones importantes: guardar, completar)
export async function vibracionMedia() {
  if (!esNativo()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // silencioso
  }
}
