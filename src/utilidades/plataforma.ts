// Helpers de plataforma — detectan Capacitor y exponen utilidades nativas.
// Todos los helpers de runtime son no-op en web para no engordar el bundle web.
//
// IMPORTANT: NO importar @capacitor/core estaticamente — eso jala 7KB al
// critical path web aunque siempre returna false. Capacitor inyecta
// `window.Capacitor` antes que el JS app cargue, por eso lo leemos directo.

const cap = () => (typeof window !== 'undefined' ? (window as any).Capacitor : null);

export const esNativo = () => !!cap()?.isNativePlatform?.();
export const esAndroid = () => cap()?.getPlatform?.() === 'android';
export const esIOS = () => cap()?.getPlatform?.() === 'ios';
export const esWeb = () => !esNativo();

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
