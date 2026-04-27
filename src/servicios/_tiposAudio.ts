export const TipoEfectoUI = {
    HOVER_SUTIL: 'ui/click2',
    CLICK_BOTON: 'ui/power',
    CLICK_GENERAL: 'ui/click',
    POP: 'ui/pop',
    POWER: 'ui/power',
    SUCCESS: 'ui/flourish',
    SLIDE_1: 'ui/slide1',
    SLIDE_2: 'ui/slide2',
    HOVER_NAVEGACION: 'ui/ta',
    MODAL_ABRIR: 'ui/mopen',
    MODAL_CERRAR: 'ui/mclose',
    ALERTA_PING: 'ui/ping',
    ALERTA_BONK: 'ui/bonk',
    ALERTA_LOOSE: 'ui/loose',
    EVENTO_IMPORTANTE: 'ui/event',
    FLOURISH: 'ui/flourish',
    ESPACIAL: 'ui/spacey',
    TELETRANSPORTE: 'ui/teleport',
    PROFUNDO: 'ui/deep',
    INICIO: 'ui/boot',
    DENEGAR: 'ui/deny',
    DENEGAR_2: 'ui/deny2',
} as const;

export type TipoEfectoUI = typeof TipoEfectoUI[keyof typeof TipoEfectoUI];

export const TipoEfectoUI2 = {
    CHECKBOX_DOWN: 'ui2/pop-down',
    CHECKBOX_ON: 'ui2/pop-up-on',
    CHECKBOX_OFF: 'ui2/pop-up-off',
    BOTON_GENERAL: 'ui2/button',
    BOTON_ATRAS: 'ui2/back',
    EXITO: 'ui2/success',
    ERROR: 'ui2/error',
    ADVERTENCIA: 'ui2/warning',
    FANFARRIA: 'ui2/fanfare',
    DRUMS: 'ui2/909-drums',
} as const;

export type TipoEfectoUI2 = typeof TipoEfectoUI2[keyof typeof TipoEfectoUI2];

export const TipoEfectoJuego = {
    NOTA_DU: 'du',
    NOTA_DU2: 'du2',
    NOTA_TA: 'ta',
    EXPLOSION: 'explode',
    EXPLOSION_LARGA: 'explode-long',
    WHOOSH: 'whoosh',
    CRISTAL: 'glass',
    WOW: 'wow',
    EXITO_GENERAL: 'success',
    ERROR_JUEGO: 'error',
} as const;

export type TipoEfectoJuego = typeof TipoEfectoJuego[keyof typeof TipoEfectoJuego];
