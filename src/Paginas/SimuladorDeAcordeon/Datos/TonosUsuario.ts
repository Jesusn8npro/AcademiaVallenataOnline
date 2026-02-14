// Este archivo define la configuración INICIAL y PERMANENTE de los tonos personalizados.
// NOTA: Se han eliminado los ajustes visuales de aquí para que NO interfieran con tu diseño global.
// El diseño (posición, tamaño) ahora se maneja EXCLUSIVAMENTE desde la base de datos Supabase.

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
        // 1. RE - SOL - DO (DGC)
        "ajustes_acordeon_vPRO_DGC": {
            "mapeoPersonalizado": {
                "1-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-5-cm.mp3"], "1-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"], "1-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"], "1-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"], "1-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"], "1-10-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"],
                "2-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-5-cm.mp3"], "2-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-5-cm.mp3"], "2-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3"], "2-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"], "2-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-6-cm.mp3"], "2-10-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/B-4-cm.mp3"], "2-11-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"],
                "3-1-empujar": ["/audio/Muestras_Cromaticas/Brillante/Bb-5-cm.mp3"], "3-3-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-5-cm.mp3"], "3-4-empujar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "3-5-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-5-cm.mp3"], "3-6-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-6-cm.mp3"], "3-7-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "3-8-empujar": ["/audio/Muestras_Cromaticas/Brillante/G-6-cm.mp3"], "3-9-empujar": ["/audio/Muestras_Cromaticas/Brillante/C-7-cm.mp3"], "3-10-empujar": ["pitch:12|/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"],
                "2-1-halar": ["/audio/Muestras_Cromaticas/Brillante/Eb-5-cm.mp3"], "2-4-halar": ["/audio/Muestras_Cromaticas/Brillante/C-5-cm.mp3"], "2-5-halar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"], "2-2-halar": ["/audio/Muestras_Cromaticas/Brillante/Gb-4-cm.mp3"], "2-7-halar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"], "2-8-halar": ["/audio/Muestras_Cromaticas/Brillante/C-6-cm.mp3"], "2-6-halar": ["/audio/Muestras_Cromaticas/Brillante/Gb-5-cm.mp3"]
            },
            "pitchPersonalizado": { "1-9-empujar": 12, "1-10-empujar": 12, "2-7-empujar": 12, "2-10-empujar": 12, "2-11-empujar": 12, "3-1-empujar": 0, "3-7-empujar": 0, "3-8-empujar": 0, "3-10-empujar": 12, "2-5-halar": 0, "2-7-halar": 0 }
        },

        // 2. DO - FA - SIB (CFB)
        "ajustes_acordeon_vPRO_CFB": {
            "mapeoPersonalizado": {
                "2-10-halar": ["/audio/Muestras_Cromaticas/Brillante/E-5-cm.mp3"],
                "3-1-empujar": ["/audio/Muestras_Cromaticas/Brillante/Ab-5-cm.mp3"],
                "3-7-empujar": ["/audio/Muestras_Cromaticas/Brillante/D-6-cm.mp3"],
                "2-10-empujar": ["/audio/Muestras_Cromaticas/Brillante/A-5-cm.mp3"]
            },
            "pitchPersonalizado": { "2-10-halar": 12, "2-10-empujar": 12 }
        },

        // 3. CINCO LETRAS (BES - Sib Mib Lab)
        "ajustes_acordeon_vPRO_BES": {
            "mapeoPersonalizado": {}
        },

        // 4. ORIGINAL (FBE - Fa Sib Mib)
        "ajustes_acordeon_vPRO_FBE": {
            "mapeoPersonalizado": {},
            "pitchPersonalizado": {}
        }
    }
};
