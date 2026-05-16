/** @type {import('postcss-load-config').Config} */
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    // PurgeCSS: solo en producción. Elimina CSS no usado de los archivos de
    // componentes personalizados (no afecta a las utilidades de Tailwind, que
    // tienen su propio proceso de purga en v4).
    ...(isProduction && {
      '@fullhuman/postcss-purgecss': {
        // Escanear todos los archivos fuente que puedan usar clases CSS
        content: [
          './index.html',
          './src/**/*.{tsx,ts,jsx,js}',
        ],
        // Extraer clases con nombres compuestos (guiones, dos puntos, etc.)
        defaultExtractor: content => {
          const matches = content.matchAll(
            /[\w-:/[\].#@()%]+/g
          );
          return Array.from(matches, m => m[0]);
        },
        // Safelist: clases generadas dinámicamente o por librerías externas.
        // Usar patrones amplios para no romper animaciones, framer-motion,
        // estados de acordeón, etc.
        safelist: {
          standard: [
            'html', 'body', '#root',
            // Estados dinámicos del acordeón / simulador
            /^activo$/, /^nota-activa$/, /^hay-objetivo$/,
            /^modo-/, /^estado-/, /^pista-/,
            // Framer Motion genera clases en runtime
            /^framer-/, /^motion-/,
            // Lucide icons
            /^lucide-/,
            // Animaciones CSS de Tailwind / custom
            /^animate-/,
            // Clases del juego / simulador
            /^juego-/, /^sim-/, /^simulador-/, /^acordeon-/,
            /^hero-/, /^pro-max-/, /^grabador-/,
            // Clases admin / perfil
            /^admin-/, /^perfil-/, /^panel-/,
            // Clases de modos / estados dinámicos
            /^con-sidebar/, /^juego-sim-/, /^pito-/, /^boton-/,
          ],
          deep: [/data-\[/, /aria-/],
          greedy: [/modal/, /overlay/, /toast/, /spinner/],
        },
      }
    }),
  }
};
