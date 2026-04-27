import { Howl } from 'howler';
export { TipoEfectoUI, TipoEfectoUI2, TipoEfectoJuego } from './_tiposAudio';
import type { TipoEfectoUI, TipoEfectoUI2, TipoEfectoJuego } from './_tiposAudio';

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

        let scrollTimeout: any;
        window.addEventListener('scroll', () => {
            if (typeof window !== 'undefined' && window.scrollY > 50) {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => { }, 100);
            }
        }, { passive: true });
    }

    reproducirEfectoUI(efecto: TipoEfectoUI) { this.playEffect(efecto); }
    reproducirEfectoUI2(efecto: TipoEfectoUI2) { this.playEffect(efecto); }
    reproducirEfectoJuego(efecto: TipoEfectoJuego) { this.playEffect(efecto); }

    playEffect(name: string) {
        if (typeof window === 'undefined') return;
        try {
            if (this.efectosCache.has(name)) {
                const cachedEffect = this.efectosCache.get(name)!;
                cachedEffect.stop();
                cachedEffect.play();
                return;
            }
            const effectPlayer = new Howl({
                volume: 0.5,
                src: [`/audio/effects/${name}.mp3`],
                loop: false,
                preload: true,
            });
            effectPlayer.on('loaderror', () => { });
            this.efectosCache.set(name, effectPlayer);
            effectPlayer.play();
        } catch { }
    }

    playHoverEffect(name: string) {
        if (typeof window === 'undefined') return;
        if (window.innerWidth > 1000) this.playEffect(name);
    }

    playBgm(songToExclude?: string) {
        if (typeof window === 'undefined') return;
        let bgmUrlArr = ['/audio/bgm/aurora.mp3', '/audio/bgm/beyond.mp3'];
        if (songToExclude && !bgmUrlArr.includes(songToExclude)) return;
        this.shuffle(bgmUrlArr);
        bgmUrlArr = bgmUrlArr.filter((e) => e !== songToExclude);
        this.stop();
        this.loadSong(bgmUrlArr[0], true);
    }

    async loadSong(songSrc: string, asBackground: boolean, loadedCallback?: () => void, finishedCallback?: () => void, errorCallback?: () => void) {
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
            this.player.on('load', () => { if (loadedCallback) loadedCallback(); });
            this.player.on('end', () => {
                if (finishedCallback) finishedCallback();
                if (asBackground) this.playBgm(songSrc);
            });
            this.player.on('loaderror', () => { if (errorCallback) errorCallback(); });
        } catch {
            if (errorCallback) errorCallback();
        }
    }

    private shuffle(array: string[]): string[] {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    get isMuted(): boolean { return this.muteBg; }

    limpiarCache() {
        this.efectosCache.forEach(effect => effect.unload());
        this.efectosCache.clear();
    }

    stop(stopBackground?: boolean) {
        if (typeof window === 'undefined') return;
        if (!stopBackground && this.asBackground) return;
        this.player?.stop();
        if (this.asBackground) { this.player?.unload(); this.player = null; }
    }

    pause() { if (typeof window !== 'undefined') this.player?.pause(); }
    play() { if (typeof window !== 'undefined') { this.player?.pause(); this.player?.play(); } }

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

    seek(sec: number) { if (typeof window !== 'undefined') this.player?.seek(sec); }
    getDuration(): number { return typeof window === 'undefined' ? 0 : this.player?.duration() || 0; }
    setRate(rate: number) { if (typeof window !== 'undefined') this.player?.rate(rate); }
}

export const audioManager = new AudioManager();
