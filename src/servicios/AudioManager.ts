import { Howl } from 'howler';

// Tipos de efectos de sonido organizados por categorías
// Tipos de efectos de sonido organizados por categorías
export const TipoEfectoUI = {
    // Botones y clicks
    HOVER_SUTIL: 'ui/click2',
    CLICK_BOTON: 'ui/power',
    CLICK_GENERAL: 'ui/click',
    POP: 'ui/pop',
    POWER: 'ui/power',
    SUCCESS: 'ui/flourish',

    // Navegación
    SLIDE_1: 'ui/slide1',
    SLIDE_2: 'ui/slide2',
    HOVER_NAVEGACION: 'ui/ta',

    // Modales y alertas
    MODAL_ABRIR: 'ui/mopen',
    MODAL_CERRAR: 'ui/mclose',
    ALERTA_PING: 'ui/ping',
    ALERTA_BONK: 'ui/bonk',
    ALERTA_LOOSE: 'ui/loose',

    // Eventos especiales
    EVENTO_IMPORTANTE: 'ui/event',
    FLOURISH: 'ui/flourish',
    ESPACIAL: 'ui/spacey',
    TELETRANSPORTE: 'ui/teleport',
    PROFUNDO: 'ui/deep',
    INICIO: 'ui/boot',

    // Errores y negaciones
    DENEGAR: 'ui/deny',
    DENEGAR_2: 'ui/deny2',
} as const;

export type TipoEfectoUI = typeof TipoEfectoUI[keyof typeof TipoEfectoUI];

export const TipoEfectoUI2 = {
    // Controles
    CHECKBOX_DOWN: 'ui2/pop-down',
    CHECKBOX_ON: 'ui2/pop-up-on',
    CHECKBOX_OFF: 'ui2/pop-up-off',
    BOTON_GENERAL: 'ui2/button',
    BOTON_ATRAS: 'ui2/back',

    // Feedback
    EXITO: 'ui2/success',
    ERROR: 'ui2/error',
    ADVERTENCIA: 'ui2/warning',
    FANFARRIA: 'ui2/fanfare',
    DRUMS: 'ui2/909-drums',
} as const;

export type TipoEfectoUI2 = typeof TipoEfectoUI2[keyof typeof TipoEfectoUI2];

export const TipoEfectoJuego = {
    // Notas musicales
    NOTA_DU: 'du',
    NOTA_DU2: 'du2',
    NOTA_TA: 'ta',

    // Explosiones y efectos dramáticos
    EXPLOSION: 'explode',
    EXPLOSION_LARGA: 'explode-long',

    // Transiciones
    WHOOSH: 'whoosh',
    CRISTAL: 'glass',

    // Celebraciones
    WOW: 'wow',
    EXITO_GENERAL: 'success',

    // Errores del juego
    ERROR_JUEGO: 'error',
} as const;

export type TipoEfectoJuego = typeof TipoEfectoJuego[keyof typeof TipoEfectoJuego];


export class AudioManager {
    private maxVolume = 0.7;
    private player: Howl | null = null;
    private muteBg = false;
    private asBackground = false;
    private efectosCache: Map<string, Howl> = new Map();

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeEventListeners();
        }
    }

    private initializeEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.asBackground) {
                this.play();
            }
        });

        // Listener para scroll (debounced)
        let scrollTimeout: any;
        window.addEventListener('scroll', () => {
            // Solo reproducir si el scroll es significativo
            if (typeof window !== 'undefined' && window.scrollY > 50) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    // Sonido muy sutil al terminar scroll o durante scroll rápido
                    // this.reproducirEfectoUI(TipoEfectoUI.HOVER_SUTIL); // Opcional: comentar si es muy molesto
                }, 100);
            }
        }, { passive: true });
    }

    // ==================== MÉTODOS ESPECÍFICOS POR CATEGORÍA ====================

    reproducirEfectoUI(efecto: TipoEfectoUI) {
        this.playEffect(efecto);
    }

    reproducirEfectoUI2(efecto: TipoEfectoUI2) {
        this.playEffect(efecto);
    }

    reproducirEfectoJuego(efecto: TipoEfectoJuego) {
        this.playEffect(efecto);
    }

    // ==================== MÉTODOS PRINCIPALES ====================

    playEffect(name: string) {
        if (typeof window === 'undefined') return;

        try {
            if (this.efectosCache.has(name)) {
                const cachedEffect = this.efectosCache.get(name)!;
                cachedEffect.stop();
                cachedEffect.play();
                return;
            }

            const url = `/audio/effects/${name}.mp3`;
            const effectPlayer = new Howl({
                volume: 0.5,
                src: [url],
                loop: false,
                preload: true,
            });

            effectPlayer.on('loaderror', () => {
                console.warn(`No se pudo cargar el efecto de sonido: ${name}`);
            });

            this.efectosCache.set(name, effectPlayer);
            effectPlayer.play();
        } catch (error) {
            console.warn(`Error al reproducir efecto de sonido: ${name}`, error);
        }
    }

    playHoverEffect(name: string) {
        if (typeof window === 'undefined') return;

        if (window.innerWidth > 1000) {
            this.playEffect(name);
        }
    }

    // Reproducir música de fondo automáticamente
    playBgm(songToExclude?: string) {
        if (typeof window === 'undefined') return;

        // Lista de canciones de fondo
        let bgmUrlArr = [
            '/audio/bgm/aurora.mp3',
            '/audio/bgm/beyond.mp3',
        ];

        if (songToExclude && !bgmUrlArr.includes(songToExclude)) return;

        // Mezclar aleatoriamente
        this.shuffle(bgmUrlArr);
        bgmUrlArr = bgmUrlArr.filter((e) => e !== songToExclude);

        this.stop();
        console.log('Reproduciendo música de fondo:', bgmUrlArr);
        this.loadSong(bgmUrlArr[0], true);
    }

    // Cargar canción de fondo
    async loadSong(
        songSrc: string,
        asBackground: boolean,
        loadedCallback?: () => void,
        finishedCallback?: () => void,
        errorCallback?: () => void
    ) {
        if (typeof window === 'undefined') return;

        try {
            this.player?.unload();
            this.asBackground = asBackground;

            this.player = new Howl({
                volume: this.muteBg && asBackground ? 0 : this.maxVolume,
                src: [songSrc],
                loop: asBackground,
            });

            if (asBackground) this.player.play();

            this.player.on('load', () => {
                if (loadedCallback) loadedCallback();
                console.log('Audio loaded');
            });

            this.player.on('end', () => {
                if (finishedCallback) finishedCallback();
                // Reproducir siguiente canción de fondo automáticamente si es BGM
                if (asBackground) this.playBgm(songSrc);
            });

            this.player.on('loaderror', () => {
                console.warn('Error al cargar la canción:', songSrc);
                if (errorCallback) errorCallback();
            });
        } catch (error) {
            console.warn('Error al cargar la canción:', error);
            if (errorCallback) errorCallback();
        }
    }

    // Función para mezclar array aleatoriamente
    private shuffle(array: string[]): string[] {
        let currentIndex = array.length;
        let randomIndex = 0;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
            ];
        }

        return array;
    }

    // Getter para el estado de silencio
    get isMuted(): boolean {
        return this.muteBg;
    }

    limpiarCache() {
        this.efectosCache.forEach(effect => {
            effect.unload();
        });
        this.efectosCache.clear();
    }

    stop(stopBackground?: boolean) {
        if (typeof window === 'undefined') return;

        if (!stopBackground && this.asBackground) return;
        this.player?.stop();
        if (this.asBackground) {
            this.player?.unload();
            this.player = null;
        }
    }

    pause() {
        if (typeof window === 'undefined') return;
        this.player?.pause();
    }

    play() {
        if (typeof window === 'undefined') return;
        this.player?.pause();
        this.player?.play();
    }

    mute(mute: boolean) {
        if (typeof window === 'undefined') return;
        if (mute) this.player?.fade(this.maxVolume, 0, 500);
        else this.player?.fade(0, this.maxVolume, 2000);
    }

    toggleBgMute() {
        if (typeof window === 'undefined') return;
        this.muteBg = !this.muteBg;
        this.mute(this.muteBg);
    }

    getCurrentTime(): number {
        if (typeof window === 'undefined') return 0;
        return this.player ? this.player.seek() as number : 0;
    }

    seek(sec: number) {
        if (typeof window === 'undefined') return;
        this.player?.seek(sec);
    }

    getDuration(): number {
        if (typeof window === 'undefined') return 0;
        return this.player?.duration() || 0;
    }

    setRate(rate: number) {
        if (typeof window === 'undefined') return;
        this.player?.rate(rate);
    }
}

// Instancia global del audio manager
export const audioManager = new AudioManager();
