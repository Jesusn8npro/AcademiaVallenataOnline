// Helpers de plataforma — detectan Capacitor y exponen utilidades nativas.
// Todos los helpers de runtime son no-op en web.
//
// Capacitor inyecta `window.Capacitor` antes que el JS app cargue,
// por eso lo leemos directo en lugar de importar @capacitor/core.
// Las funciones de vibración son no-op en web (esNativo() === false siempre).
// Para habilitar vibración nativa, reinstalar @capacitor/haptics y descomentar
// los imports dinámicos dentro de vibracionLeve/vibracionMedia.

const cap = () => (typeof window !== 'undefined' ? (window as any).Capacitor : null);

export const esNativo = () => !!cap()?.isNativePlatform?.();
export const esAndroid = () => cap()?.getPlatform?.() === 'android';
export const esIOS = () => cap()?.getPlatform?.() === 'ios';
export const esWeb = () => !esNativo();

// Vibración ligera — no-op en web, activa en nativo con @capacitor/haptics
export async function vibracionLeve() {
  if (!esNativo()) return;
  // Requiere: npm install @capacitor/haptics
  // const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  // await Haptics.impact({ style: ImpactStyle.Light });
}

// Vibración media — no-op en web, activa en nativo con @capacitor/haptics
export async function vibracionMedia() {
  if (!esNativo()) return;
  // Requiere: npm install @capacitor/haptics
  // const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  // await Haptics.impact({ style: ImpactStyle.Medium });
}
