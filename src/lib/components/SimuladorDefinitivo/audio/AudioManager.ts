// Sistema de audio completo idéntico al de Rhythm Plus
import { Howl, Howler } from 'howler';
import { browser } from '$app/environment';

// Tipos de efectos de sonido organizados por categorías
export enum TipoEfectoUI {
  // Botones y clicks
  HOVER_SUTIL = 'ui/click2',
  CLICK_BOTON = 'ui/power',
  CLICK_GENERAL = 'ui/click',
  POP = 'ui/pop',
  POWER = 'ui/power',  // Agregado para compatibilidad
  SUCCESS = 'ui/flourish',  // Mapeado a flourish para éxito
  
  // Navegación
  SLIDE_1 = 'ui/slide1',
  SLIDE_2 = 'ui/slide2',
  HOVER_NAVEGACION = 'ui/ta',
  
  // Modales y alertas
  MODAL_ABRIR = 'ui/mopen',
  MODAL_CERRAR = 'ui/mclose',
  ALERTA_PING = 'ui/ping',
  ALERTA_BONK = 'ui/bonk',
  ALERTA_LOOSE = 'ui/loose',
  
  // Eventos especiales
  EVENTO_IMPORTANTE = 'ui/event',
  FLOURISH = 'ui/flourish',
  ESPACIAL = 'ui/spacey',
  TELETRANSPORTE = 'ui/teleport',
  PROFUNDO = 'ui/deep',
  INICIO = 'ui/boot',
  
  // Errores y negaciones
  DENEGAR = 'ui/deny',
  DENEGAR_2 = 'ui/deny2',
}

export enum TipoEfectoUI2 {
  // Controles
  CHECKBOX_DOWN = 'ui2/pop-down',
  CHECKBOX_ON = 'ui2/pop-up-on',
  CHECKBOX_OFF = 'ui2/pop-up-off',
  BOTON_GENERAL = 'ui2/button',
  BOTON_ATRAS = 'ui2/back',
  
  // Feedback
  EXITO = 'ui2/success',
  ERROR = 'ui2/error',
  ADVERTENCIA = 'ui2/warning',
  FANFARRIA = 'ui2/fanfare',
  DRUMS = 'ui2/909-drums',
}

export enum TipoEfectoJuego {
  // Notas musicales
  NOTA_DU = 'du',
  NOTA_DU2 = 'du2',
  NOTA_TA = 'ta',
  
  // Explosiones y efectos dramáticos
  EXPLOSION = 'explode',
  EXPLOSION_LARGA = 'explode-long',
  
  // Transiciones
  WHOOSH = 'whoosh',
  CRISTAL = 'glass',
  
  // Celebraciones
  WOW = 'wow',
  EXITO_GENERAL = 'success',
  
  // Errores del juego
  ERROR_JUEGO = 'error',
}

export class AudioManager {
  private maxVolume = 0.7;
  private player: Howl | null = null;
  private muteBg = false;
  private asBackground = false;
  private efectosCache: Map<string, Howl> = new Map();

  constructor() {
    // Solo inicializar en el cliente (no en el servidor)
    if (browser) {
      this.initializeEventListeners();
    }
  }

  private initializeEventListeners() {
    // Pausar cuando la ventana no está visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else if (this.asBackground) {
        this.play();
      }
    });
  }

  // ==================== MÉTODOS ESPECÍFICOS POR CATEGORÍA ====================

  // Efectos UI principales
  reproducirEfectoUI(efecto: TipoEfectoUI) {
    this.playEffect(efecto);
  }

  reproducirEfectoUI2(efecto: TipoEfectoUI2) {
    this.playEffect(efecto);
  }

  reproducirEfectoJuego(efecto: TipoEfectoJuego) {
    this.playEffect(efecto);
  }

  // ==================== MÉTODOS ESPECÍFICOS DE ACCIONES ====================

  // Botones
  hoverBoton() {
    this.playHoverEffect(TipoEfectoUI.HOVER_SUTIL);
  }

  clickBoton() {
    this.playEffect(TipoEfectoUI.CLICK_BOTON);
  }

  clickGeneral() {
    this.playEffect(TipoEfectoUI.CLICK_GENERAL);
  }

  // Navegación
  cambiarTab() {
    this.playEffect(TipoEfectoUI.SLIDE_2);
  }

  deslizarPagina() {
    this.playEffect(TipoEfectoUI.SLIDE_1);
  }

  hoverNavegacion() {
    this.playHoverEffect(TipoEfectoUI.HOVER_NAVEGACION);
  }

  // Modales
  abrirModal() {
    this.playEffect(TipoEfectoUI.MODAL_ABRIR);
  }

  cerrarModal() {
    this.playEffect(TipoEfectoUI.MODAL_CERRAR);
  }

  // Alertas
  mostrarAlerta() {
    this.playEffect(TipoEfectoUI.ALERTA_PING);
  }

  errorAccion() {
    this.playEffect(TipoEfectoUI.ALERTA_BONK);
  }

  // Checkbox
  toggleCheckbox(estado: boolean) {
    if (estado) {
      this.playEffect(TipoEfectoUI2.CHECKBOX_ON);
    } else {
      this.playEffect(TipoEfectoUI2.CHECKBOX_OFF);
    }
  }

  // Juego
  tocarNota(tipo: 'du' | 'du2' | 'ta' = 'du') {
    switch (tipo) {
      case 'du':
        this.playEffect(TipoEfectoJuego.NOTA_DU);
        break;
      case 'du2':
        this.playEffect(TipoEfectoJuego.NOTA_DU2);
        break;
      case 'ta':
        this.playEffect(TipoEfectoJuego.NOTA_TA);
        break;
    }
  }

  explosion() {
    this.playEffect(TipoEfectoJuego.EXPLOSION);
  }

  celebracion() {
    this.playEffect(TipoEfectoJuego.WOW);
  }

  exito() {
    this.playEffect(TipoEfectoUI2.EXITO);
  }

  error() {
    this.playEffect(TipoEfectoUI2.ERROR);
  }

  transicion() {
    this.playEffect(TipoEfectoJuego.WHOOSH);
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  // Reproducir efectos de sonido (exacto como Rhythm Plus)
  playEffect(name: string) {
    if (!browser) return; // No ejecutar en el servidor
    
    try {
      // Usar cache para mejor rendimiento
      if (this.efectosCache.has(name)) {
        const cachedEffect = this.efectosCache.get(name)!;
        cachedEffect.stop(); // Detener instancia anterior
        cachedEffect.play();
        return;
      }

      const url = `/audio/effects/${name}.mp3`;
      const effectPlayer = new Howl({
        volume: 0.5, // Volumen exacto de Rhythm Plus
        src: [url],
        loop: false,
        preload: true,
      });
      
      effectPlayer.on('loaderror', () => {
        console.warn(`No se pudo cargar el efecto de sonido: ${name}`);
      });
      
      // Guardar en cache
      this.efectosCache.set(name, effectPlayer);
      effectPlayer.play();
    } catch (error) {
      console.warn(`Error al reproducir efecto de sonido: ${name}`, error);
    }
  }

  // Efectos de hover solo en desktop (exacto como Rhythm Plus)
  playHoverEffect(name: string) {
    if (!browser) return; // No ejecutar en el servidor
    
    if (window.innerWidth > 1000) {
      this.playEffect(name);
    }
  }

  // Reproducir música de fondo automáticamente (exacto como Rhythm Plus)
  playBgm(songToExclude?: string) {
    if (!browser) return; // No ejecutar en el servidor
    
    // Lista de canciones de fondo de Rhythm Plus
    let bgmUrlArr = [
      '/audio/bgm/aurora.mp3',
      '/audio/bgm/beyond.mp3',
    ];
    
    if (songToExclude && !bgmUrlArr.includes(songToExclude)) return; // is playing result bgm
    
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
    if (!browser) return; // No ejecutar en el servidor
    
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
        // Reproducir siguiente canción de fondo automáticamente
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

    // Mientras queden elementos por mezclar...
    while (currentIndex !== 0) {
      // Tomar un elemento restante...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // Y intercambiarlo con el elemento actual
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

  // Limpiar cache de efectos
  limpiarCache() {
    this.efectosCache.forEach(effect => {
      effect.unload();
    });
    this.efectosCache.clear();
  }

  stop(stopBackground?: boolean) {
    if (!browser) return; // No ejecutar en el servidor
    
    if (!stopBackground && this.asBackground) return;
    this.player?.stop();
    if (this.asBackground) {
      this.player?.unload();
      this.player = null;
    }
  }

  pause() {
    if (!browser) return; // No ejecutar en el servidor
    this.player?.pause();
  }

  play() {
    if (!browser) return; // No ejecutar en el servidor
    this.player?.pause();
    this.player?.play();
  }

  mute(mute: boolean) {
    if (!browser) return; // No ejecutar en el servidor
    if (mute) this.player?.fade(this.maxVolume, 0, 500);
    else this.player?.fade(0, this.maxVolume, 2000);
  }

  toggleBgMute() {
    if (!browser) return; // No ejecutar en el servidor
    this.muteBg = !this.muteBg;
    this.mute(this.muteBg);
  }

  getCurrentTime(): number {
    if (!browser) return 0; // No ejecutar en el servidor
    return this.player ? this.player.seek() as number : 0;
  }

  seek(sec: number) {
    if (!browser) return; // No ejecutar en el servidor
    this.player?.seek(sec);
  }

  getDuration(): number {
    if (!browser) return 0; // No ejecutar en el servidor
    return this.player?.duration() || 0;
  }

  setRate(rate: number) {
    if (!browser) return; // No ejecutar en el servidor
    this.player?.rate(rate);
  }
}

// Instancia global del audio manager
export const audioManager = new AudioManager(); 