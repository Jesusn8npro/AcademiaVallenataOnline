import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import espanol from './traducciones/espanol.json';
import ingles from './traducciones/ingles.json';
import portugues from './traducciones/portugues.json';
import frances from './traducciones/frances.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: espanol },
            en: { translation: ingles },
            pt: { translation: portugues },
            fr: { translation: frances },
        },
        lng: 'es', // Idioma por defecto
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false // React ya protege contra XSS
        }
    });

export default i18n;
