// Este archivo define la configuración INICIAL y PERMANENTE de los tonos personalizados.
// NOTA: Los cambios hechos en el navegador NO se guardan aquí automáticamente (el navegador no tiene permiso de escribir archivos).
// Para guardar cambios nuevos, debes usar el botón "EXPORTAR TODO" y actualizar este archivo manualmente.

export const configuracionUsuario = {
    // Tus sonidos creados a mano (Los intocables 💎)
    sonidosVirtuales: [
        { "id": "custom_1770872749169", "nombre": "E-7-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3", "pitch": 12, "tipo": "Brillante" },
        { "id": "custom_1770872538921", "nombre": "B-5-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3", "pitch": 12, "tipo": "Brillante" },
        { "id": "custom_1770871835288", "nombre": "B-4-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3", "pitch": 12, "tipo": "Brillante" },
        { "id": "custom_1770871740720", "nombre": "A-6-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3", "pitch": 12, "tipo": "Brillante" },
        { "id": "custom_1770871703144", "nombre": "Gb-6-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3", "pitch": 12, "tipo": "Brillante" },
        { "id": "custom_1770869200038", "nombre": "E-6-cm.mp3", "rutaBase": "/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3", "pitch": 12, "tipo": "Brillante" }
    ],
    tonalidades: {
        // 1. RE - SOL - DO (DGC) - ¡Tu Obra Maestra en Progreso! 🏗️
        "ajustes_acordeon_vPRO_DGC": {
            "tamano": "82vh", "x": "53.5%", "y": "50%", "pitosBotonTamano": "4.4vh", "pitosFuenteTamano": "1.6vh", "bajosBotonTamano": "4.2vh", "bajosFuenteTamano": "1.3vh", "teclasLeft": "5.05%", "teclasTop": "13%", "bajosLeft": "82.5%", "bajosTop": "28%",
            "mapeoPersonalizado": {
                "1-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-5-cm.mp3"], "1-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"], "1-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"], "1-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"], "1-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"], "1-10-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"],
                "2-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-5-cm.mp3"], "2-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-5-cm.mp3"], "2-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3"], "2-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"], "2-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-6-cm.mp3"], "2-10-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3"], "2-11-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"],
                "3-1-empujar": ["/audio/Muestras_Cromaticas/Brillante/Bb-5-cm.mp3"], "3-3-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-5-cm.mp3"], "3-4-empujar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "3-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-5-cm.mp3"], "3-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-6-cm.mp3"], "3-7-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "3-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-6-cm.mp3"], "3-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-7-cm.mp3"], "3-10-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"],
                "2-1-halar": ["/audio/Muestras_Cromaticas/Brillante/Eb-5-cm.mp3"], "2-4-halar": ["/audio/Muestras_Cromaticas/Brillante/C-5-cm.mp3"], "2-5-halar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "2-2-halar": ["/audio/Muestras_Cromaticas/Brillante/Gb-4-cm.mp3"], "2-7-halar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"], "2-8-halar": ["/audio/Muestras_Cromaticas/Brillante/C-6-cm.mp3"], "2-6-halar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"]
            },
            "pitchPersonalizado": { "1-9-empujar": 12, "1-10-empujar": 12, "2-7-empujar": 12, "2-10-empujar": 12, "2-11-empujar": 12, "3-1-empujar": 0, "3-7-empujar": 0, "3-8-empujar": 0, "3-10-empujar": 12, "2-5-halar": 0, "2-7-halar": 0 }
        },

        // 2. DO - FA - SIB (CFB) - ¡Totalmente funcional! ✅
        "ajustes_acordeon_vPRO_CFB": {
            "tamano": "82vh", "x": "53.5%", "y": "50%", "pitosBotonTamano": "4.4vh", "pitosFuenteTamano": "1.6vh", "bajosBotonTamano": "4.2vh", "bajosFuenteTamano": "1.3vh", "teclasLeft": "5.05%", "teclasTop": "13%", "bajosLeft": "82.5%", "bajosTop": "28%",
            "mapeoPersonalizado": {
                "2-10-halar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"],
                "3-1-empujar": ["/audio/Muestras_Cromaticas/Brillante/Ab-5-cm.mp3"],
                "3-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"],
                "2-10-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"]
            },
            "pitchPersonalizado": { "2-10-halar": 12, "2-10-empujar": 12 }
        },

        // 3. CINCO LETRAS (BES - Sib Mib Lab) - ¡Cuidado, NO TOCAR! ⚠️
        "ajustes_acordeon_vPRO_BES": {
            "tamano": "79vh", "x": "31.8%", "y": "50%", "pitosBotonTamano": "4.4vh", "pitosFuenteTamano": "1.6vh", "bajosBotonTamano": "4.2vh", "bajosFuenteTamano": "2.1vh", "teclasLeft": "5.05%", "teclasTop": "13%", "bajosLeft": "82.5%", "bajosTop": "28%",
            "mapeoPersonalizado": {}
        },

        // 4. ORIGINAL (F-Bb-Eb - Fa Sib Mib) - Referencia Base
        "ajustes_acordeon_vPRO_F-Bb-Eb": {
            "tamano": "80vh", "x": "50%", "y": "50%", "pitosBotonTamano": "4.4vh", "pitosFuenteTamano": "1.6vh", "bajosBotonTamano": "4.2vh", "bajosFuenteTamano": "1.3vh", "teclasLeft": "5.05%", "teclasTop": "13%", "bajosLeft": "82.5%", "bajosTop": "28%",
            "mapeoPersonalizado": {},
            "pitchPersonalizado": {}
        }
    }
};
