// ====================================================
// 🪗 ACORDEÓN V-PRO — PANTALLA + 2 TONALIDADES
// Tonalidades: 5 Letras (Bb-Eb-Ab) | Si Mi La (B-E-A)
// Pantalla: ILI9341 240x320 vertical (rotation 2)
// ====================================================
// SOLUCIÓN DE TONALIDADES:
//   Si Mi La = 5 Letras + 1 semitono exacto
//   → Usamos los MISMOS archivos WAV de 5 Letras
//   → Solo cambiamos out->SetRate() globalmente:
//      5 Letras  : SetRate(22050)
//      Si Mi La  : SetRate(23362) = 22050 × 2^(1/12) = +1 semi
//   → TODAS las notas suben 1 semitono exacto sin distorsión
//   → No se necesitan arrays separados para Si Mi La ✅
//   → Los bajos también cambian correctamente ✅
// ====================================================
// PINES PANTALLA (SPI Bus 2 — pines 8/12/13)
//   TFT_CS=2  TFT_DC=3  TFT_RST=1  TFT_LED=21  TOUCH_CS=47
// PINES SD (SPI Bus 1 — pines 35/37/36)
//   SD_CS=14
// PINES MUX: S0=4 S1=5 S2=6 S3=7  |  MUX1=15  MUX2=16  MUX3=17
// FUELLE: SLIDE=9  |  I2S: BCK=40 WS=41 DIN=42
// ====================================================

#include "AudioFileSourceBuffer.h"
#include "AudioFileSourceSD.h"
#include "AudioGeneratorWAV.h"
#include "AudioOutputI2S.h"
#include "AudioOutputMixer.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <WiFi.h>
#include <XPT2046_Touchscreen.h>

// ====================================================
// ⚙️ PINES
// ====================================================
#define TFT_CS 2
#define TFT_DC 3
#define TFT_RST 1
#define TFT_LED 21
#define TOUCH_CS 47
#define TFT_SCK 8
#define TFT_MISO 12
#define TFT_MOSI 13

#define SD_CS 14
#define SD_SCK 35
#define SD_MOSI 36
#define SD_MISO 37

#define I2S_BCK 40
#define I2S_WS 41
#define I2S_DIN 42

const int sPines[] = {4, 5, 6, 7};
const int sigMux1 = 15;
const int sigMux2 = 16;
const int sigMux3 = 17;
const int slidePin = 9;

// ====================================================
// ⚙️ MOTOR DE AUDIO (V8 estable)
// ====================================================
#define NUM_VOCES 10
#define VOL_MAX                                                                \
  0.18f // Bajamos volumen para evitar que el mezclador sature (clipping)
#define FADE_SPEED                                                             \
  0.010f // Suavizado ultra-lento para eliminar cualquier TOC/PLOP al soltar
#define DEBOUNCE 15
#define MUX_DELAY 25

// RATES DESDE -6 HASTA +5 SEMITONOS (Base: 5 Letras @ 22050)
#define RATE_6_BAJO 15592 // Mi La Re (Alto)
#define RATE_5_BAJO 16520 // Fa Sib Mib (Original)
#define RATE_4_BAJO 17501 // GCF Bemol
#define RATE_3_BAJO 18542 // Sol Do Fa
#define RATE_2_BAJO 19644 // La Re Sol (Bemol)
#define RATE_1_BAJO 20812 // La Re Sol (ADG)
#define RATE_BASE 22050   // 5 Letras (Base)
#define RATE_1_ALTO 23362 // Si Mi La
#define RATE_2_ALTO 24750 // Do Fa Sib
#define RATE_3_ALTO 26222 // Do Fa Si #
#define RATE_4_ALTO 27781 // Re Sol Do
#define RATE_5_ALTO 29433 // Mi La Re Bemol

struct VozDinamica {
  AudioGeneratorWAV *wav = NULL;
  AudioFileSourceSD *file = NULL;
  AudioFileSourceBuffer *buff = NULL;
  int MuxId = -1;
  int BotonId = -1;
  bool ocupada = false;
  AudioOutputMixerStub *stub = NULL;
  float volumenActual = 0.0f;
  float volMax = 0.25f;
  bool enAtaque = false;
  bool enRelease = false;
};

VozDinamica voces[NUM_VOCES];
AudioOutputI2S *out = NULL;
AudioOutputMixer *mixer = NULL;

bool estadoFisicoM1[16], estadoFisicoM2[16], estadoFisicoM3[16];
bool estadoDebounceM1[16], estadoDebounceM2[16], estadoDebounceM3[16];
unsigned long lastTimeMux[3][16];
bool fuelleAbriendo = true;
int valorAnteriorSlide = 0;

// ====================================================
// 🎼 SELECTOR DE TONALIDAD
// ====================================================
// IDs según el orden de la página (dropdown)
const char *NOMBRE_TONOS[] = {"EAD (ALTO)", "FSibM (Orig)",  "GCF BEMOL",
                              "Sol Do Fa",  "LRS BEMOL",     "ADG (LaReSol)",
                              "5 Letras",   "Si Mi La",      "Do Fa Sib",
                              "Do Fa Si #", "RSD (Natural)", "Mi La Re B"};
const int RATES_TONOS[] = {RATE_6_BAJO, RATE_5_BAJO, RATE_4_BAJO, RATE_3_BAJO,
                           RATE_2_BAJO, RATE_1_BAJO, RATE_BASE,   RATE_1_ALTO,
                           RATE_2_ALTO, RATE_3_ALTO, RATE_4_ALTO, RATE_5_ALTO};

int tonoActual = 6;          // Por defecto empezamos en "5 Letras" (índice 6)
int instrumentoActual = 0;   // 0: Acordeón, 1: Guitarra
bool modoArmonizado = false; // Solo para Acordeón
const char *NOMBRES_INST[] = {"ACORDEON", "GUITARRA"};
const char *NOMBRES_TIMBRES[] = {"BRILLANTE", "ARMONIZADO"};

// ====================================================
// 🎹 PITOS — TONALIDAD 5 LETRAS (base)
// Para Si Mi La: MISMOS archivos + SetRate(23362) = +1 semi exacto
// ====================================================
struct ArchivoAudio {
  const char *ruta;
};

// Hilera 1 — Afuera (MUX1 b=6 a 15 → bot 1-10)
const ArchivoAudio F1_Halar[16] = {
    {"/Brillante/Gb - 4-cm.wav"}, {"/Brillante/C - 4-cm.wav"},
    {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"},
    {"/Brillante/A - 4-cm.wav"},  {"/Brillante/C - 5-cm.wav"},
    {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"},
    {"/Brillante/A - 5-cm.wav"},  {"/Brillante/C - 6-cm.wav"}};
const ArchivoAudio F1_Empujar[16] = {
    {"/Brillante/E - 4-cm.wav"},
    {"/Brillante/Bb - 3-cm.wav"},
    {"/Brillante/D - 4-cm.wav"},
    {"/Brillante/F - 4-cm.wav"},
    {"/Brillante/Bb - 4-cm.wav"},
    {"/Brillante/D - 5-cm.wav"},
    {"/Brillante/F - 5-cm.wav"},
    {"/Brillante/Bb - 5-cm.wav"},
    {"/Brillante/D - 6-cm.wav"},
    {"/Brillante/F - 6-cm.wav"}
    // En Si Mi La (rate 23362): Bb-3 → B-3 | Bb-5 → B-5 | F-6 → Gb-6 (exacto)
};

// Hilera 2 — Medio (MUX1 b=0 a 5 + MUX2 b=11 a 15)
const ArchivoAudio F2_Halar[16] = {
    {"/Brillante/B - 4-cm.wav"}, {"/Brillante/D - 4-cm.wav"},
    {"/Brillante/F - 4-cm.wav"}, {"/Brillante/Ab - 4-cm.wav"},
    {"/Brillante/C - 5-cm.wav"}, {"/Brillante/D - 5-cm.wav"},
    {"/Brillante/F - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"},
    {"/Brillante/C - 6-cm.wav"}, {"/Brillante/D - 6-cm.wav"},
    {"/Brillante/F - 6-cm.wav"}};
const ArchivoAudio F2_Empujar[16] = {
    {"/Brillante/A - 4-cm.wav"},  {"/Brillante/Bb - 3-cm.wav"},
    {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"},
    {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"},
    {"/Brillante/G - 5-cm.wav"},  {"/Brillante/Bb - 5-cm.wav"},
    {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/G - 6-cm.wav"},
    {"/Brillante/Bb - 6-cm.wav"}};

// Hilera 3 — Adentro (MUX2 b=0 a 10)
const ArchivoAudio F3_Halar[16] = {
    {"/Brillante/E - 5-cm.wav"},  {"/Brillante/G - 4-cm.wav"},
    {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Db - 5-cm.wav"},
    {"/Brillante/F - 5-cm.wav"},  {"/Brillante/G - 5-cm.wav"},
    {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Db - 6-cm.wav"},
    {"/Brillante/F - 6-cm.wav"},  {"/Brillante/G - 6-cm.wav"}};
const ArchivoAudio F3_Empujar[16] = {
    {"/Brillante/Gb - 5-cm.wav"},
    {"/Brillante/Eb - 4-cm.wav"},
    {"/Brillante/Ab - 4-cm.wav"},
    {"/Brillante/C - 5-cm.wav"},
    {"/Brillante/Eb - 5-cm.wav"},
    {"/Brillante/Ab - 5-cm.wav"},
    {"/Brillante/C - 6-cm.wav"},
    {"/Brillante/Eb - 6-cm.wav"},
    {"/Brillante/Ab - 6-cm.wav"},
    {"/Brillante/C - 7-cm.wav"}
    // En Si Mi La (rate 23362): Eb-6 → E-6 | Ab-6 → A-6 | C-7 → Db-7 (exacto)
};

// Bajos — Verificados físicamente (swaps pines 4↔10 y 5↔11)
// En Si Mi La (rate 23362): Mib→Mi, Sib→Si, Fa→Solb, Reb→Re, Do→Reb, Sol→Lab
// (exacto)
const ArchivoAudio BAJOS_HALAR[12] = {
    {"/Bajos/Bajo  Eb-cm.wav"},
    {"/Bajos/Bajo  Eb  (acorde)-cm.wav"}, // 0,1  Mib
    {"/Bajos/Bajo Bb-cm.wav"},
    {"/Bajos/Bajo Bb  (acorde)-cm.wav"}, // 2,3  Sib
    {"/Bajos/Bajo  F-cm.wav"},
    {"/Bajos/Bajo F (acorde)-cm.wav"}, // 4,5  Fa  (swap)
    {"/Bajos/Bajo Db-cm.wav"},
    {"/Bajos/Bajo Db   (acorde)-cm.wav"}, // 6,7  Reb
    {"/Bajos/Bajo  F-cm.wav"},
    {"/Bajos/Bajo Fm   (acorde)-cm.wav"}, // 8,9  Fa menor
    {"/Bajos/Bajo C -cm.wav"},
    {"/Bajos/Bajo Cm (acorde)-cm.wav"} // 10,11 Do (swap)
};
const ArchivoAudio BAJOS_EMPUJAR[12] = {
    {"/Bajos/Bajo Ab-cm.wav"},
    {"/Bajos/Bajo Ab  (acorde)-cm.wav"}, // 0,1  Lab
    {"/Bajos/Bajo  Eb-cm.wav"},
    {"/Bajos/Bajo  Eb  (acorde)-cm.wav"}, // 2,3  Mib
    {"/Bajos/Bajo Bb-cm.wav"},
    {"/Bajos/Bajo Bb  (acorde)-cm.wav"}, // 4,5  Sib (swap)
    {"/Bajos/Bajo Db-cm.wav"},
    {"/Bajos/Bajo Db   (acorde)-cm.wav"}, // 6,7  Reb
    {"/Bajos/Bajo C -cm.wav"},
    {"/Bajos/Bajo C  (acorde)-cm.wav"}, // 8,9  Do
    {"/Bajos/Bajo  G-cm.wav"},
    {"/Bajos/Bajo G  (acorde)-cm.wav"} // 10,11 Sol (swap)
};

// ====================================================
// 🖥️ PANTALLA TFT ILI9341 — VERTICAL (rotation 2)
// ====================================================
// Fix ESP32-S3: VSPI no existe, usamos HSPI=2
#ifndef HSPI
#define HSPI 2
#endif
SPIClass spiTFT(HSPI);
// XPT2046: SPI se pasa en begin(), NO en el constructor
Adafruit_ILI9341 tft(&spiTFT, TFT_DC, TFT_CS, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);

// Área de botones en pantalla (2 columnas x 6 filas)
struct BotonUI {
  int x, y, w, h;
  uint16_t colorActivo;
};
BotonUI btnTonos[12] = {
    {10, 150, 105, 26, 0x780F}, {125, 150, 105, 26, 0x001F},
    {10, 178, 105, 26, 0x0410}, {125, 178, 105, 26, 0x07E0},
    {10, 206, 105, 26, 0xF81F}, {125, 206, 105, 26, 0xF800},
    {10, 234, 105, 26, 0xFFE0}, {125, 234, 105, 26, 0xFDA0},
    {10, 262, 105, 26, 0x07FF}, {125, 262, 105, 26, 0xAD55},
    {10, 290, 105, 26, 0x4208}, {125, 290, 105, 26, 0x001F}};

void dibujarBaseUI() {
  tft.fillScreen(0x0000); // Negro profundo

  // Header Premium (Español)
  tft.fillRoundRect(5, 5, 230, 40, 4, 0x2104);
  tft.drawRoundRect(5, 5, 230, 40, 4, 0x4208);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(40, 15);
  tft.println("V-PRO DIGITAL");
}

void dibujarSeccionTono() {
  // Área del selector de Tono (Inferior)
  tft.fillRect(5, 160, 230, 100, 0x0000);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(20, 170);
  tft.println("SELECCIONAR TONALIDAD:");

  // Botón Flecha Izquierda <
  tft.fillRoundRect(10, 190, 50, 50, 6, 0x3186);
  tft.drawRoundRect(10, 190, 50, 50, 6, ILI9341_WHITE);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(25, 205);
  tft.print("<");

  // Caja de Tono Central
  tft.fillRoundRect(65, 190, 110, 50, 6, 0x0410);
  tft.drawRoundRect(65, 190, 110, 50, 6, ILI9341_YELLOW);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(75, 210);
  tft.println(NOMBRE_TONOS[tonoActual]);

  // Botón Flecha Derecha >
  tft.fillRoundRect(180, 190, 50, 50, 6, 0x3186);
  tft.drawRoundRect(180, 190, 50, 50, 6, ILI9341_WHITE);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(195, 205);
  tft.print(">");
}

void dibujarControles() {
  // Área Central (Instrumento y Timbre)
  tft.fillRect(5, 50, 230, 105, 0x0000);

  // --- CARD: INSTRUMENTO ---
  uint16_t colorInst = (instrumentoActual == 0) ? 0x0154 : 0xFD20;
  tft.fillRoundRect(10, 55, 220, 45, 8, colorInst);
  tft.drawRoundRect(10, 55, 220, 45, 8, ILI9341_WHITE);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(25, 62);
  tft.print("INSTRUMENTO:");
  tft.setTextSize(2);
  tft.setCursor(25, 75);
  tft.print(instrumentoActual == 0 ? " [ ACORDEON ]" : " [ GUITARRA ]");

  // --- CARD: TIMBRE (Solo Acordeón) ---
  if (instrumentoActual == 0) {
    uint16_t colorT = modoArmonizado ? 0xF800 : 0x07E0;
    tft.fillRoundRect(10, 105, 220, 45, 8, colorT);
    tft.drawRoundRect(10, 105, 220, 45, 8, 0xCE59);
    tft.setTextColor(ILI9341_WHITE);
    tft.setTextSize(1);
    tft.setCursor(25, 112);
    tft.print("MODO TIMBRE:");
    tft.setTextSize(2);
    tft.setCursor(25, 125);
    tft.print(modoArmonizado ? " > ARMONIZADO" : " > BRILLANTE");
  } else {
    tft.fillRoundRect(10, 105, 220, 45, 8, 0x2104);
    tft.drawRoundRect(10, 105, 220, 45, 8, ILI9341_DARKGREY);
    tft.setTextColor(ILI9341_DARKGREY);
    tft.setTextSize(2);
    tft.setCursor(25, 120);
    tft.print(" GUITARRA PURA");
  }
}

void dibujarPantalla() {
  dibujarBaseUI();
  dibujarControles();
  dibujarSeccionTono();
}

void actualizarFuellePantalla() {
  tft.fillRect(10, 45, 200, 10, ILI9341_BLACK);
  tft.setCursor(10, 45);
  tft.setTextSize(1);
  tft.print("FUELLE: ");
  tft.setTextColor(fuelleAbriendo ? ILI9341_GREEN : ILI9341_RED);
  tft.println(fuelleAbriendo ? "ABRIENDO" : "CERRANDO");
}

// ====================================================
// 🔧 GESTOR DE VOCES
// ====================================================
void liberarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada)
    return;

  // 🛡️ SEGURIDAD EN CERO: Silenciar antes de matar el buffer
  if (voces[v].stub) {
    voces[v].stub->SetGain(0.0f);
    delayMicroseconds(50); // Microsilencio para estabilizar el I2S
  }

  if (voces[v].wav) {
    if (voces[v].wav->isRunning())
      voces[v].wav->stop();
    delete voces[v].wav;
    voces[v].wav = NULL;
  }
  if (voces[v].buff) {
    delete voces[v].buff;
    voces[v].buff = NULL;
  }
  if (voces[v].file) {
    if (voces[v].file->isOpen())
      voces[v].file->close();
    delete voces[v].file;
    voces[v].file = NULL;
  }

  voces[v].ocupada = false;
  voces[v].enRelease = false;
  voces[v].enAtaque = false;
  voces[v].volumenActual = 0.0f;
  voces[v].MuxId = -1;
  voces[v].BotonId = -1;
}

void apagarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada || voces[v].enRelease)
    return;
  voces[v].enRelease = true;
  voces[v].enAtaque = false;
}

int buscarVoz(int m, int b) {
  for (int i = 0; i < NUM_VOCES; i++)
    if (voces[i].ocupada && voces[i].MuxId == m && voces[i].BotonId == b)
      return i;
  return -1;
}

void cambiarTono(int nuevoTono) {
  if (nuevoTono < 0)
    nuevoTono = 11;
  if (nuevoTono > 11)
    nuevoTono = 0;
  for (int i = 0; i < NUM_VOCES; i++)
    liberarVoz(i);
  tonoActual = nuevoTono;
  out->SetRate(RATES_TONOS[tonoActual]);
  dibujarSeccionTono(); // Actualizar solo la caja central
}

bool procesarTouch() {
  if (!touch.touched())
    return false;
  static unsigned long lastTouch = 0;
  if (millis() - lastTouch < 350)
    return false;
  lastTouch = millis();
  TS_Point pt = touch.getPoint();
  int x = map(pt.x, 3800, 300, 0, 240);
  int y = map(pt.y, 3700, 200, 0, 320);
  // CLICK INSTRUMENTO (Área del botón: 55 a 100)
  if (x >= 10 && x <= 230 && y >= 55 && y <= 100) {
    instrumentoActual = (instrumentoActual + 1) % 2;
    dibujarControles();
    return true;
  }
  // CLICK TIMBRE (Área del botón: 105 a 150)
  if (instrumentoActual == 0 && x >= 10 && x <= 230 && y >= 105 && y <= 150) {
    modoArmonizado = !modoArmonizado;
    dibujarControles();
    return true;
  }

  // FLECHA IZQUIERDA < (Área: 10 a 60 en X, 190 a 240 en Y)
  if (x >= 10 && x <= 60 && y >= 190 && y <= 240) {
    cambiarTono(tonoActual - 1);
    return true;
  }

  // FLECHA DERECHA > (Área: 180 a 230 en X, 190 a 240 en Y)
  if (x >= 180 && x <= 230 && y >= 190 && y <= 240) {
    cambiarTono(tonoActual + 1);
    return true;
  }
  return false;
}

// ====================================================
// 🎵 FUNCIÓN DE SONIDO
// ====================================================
void sonarNota(int m, int b) {
  int iExistente = buscarVoz(m, b);
  if (iExistente != -1) {
    if (!voces[iExistente].enRelease)
      return;
    liberarVoz(iExistente);
  }

  int h = 0, bot = 0, nb = -1;
  bool esBajo = false;

  if (m == 1) {
    if (b < 6) {
      h = 2;
      bot = 6 - b;
    } else {
      h = 1;
      bot = b - 5;
    }
  } else if (m == 2) {
    if (b >= 11) {
      h = 2;
      bot = 22 - b;
    } else {
      h = 3;
      bot = 11 - b;
    }
  } else if (m == 3) {
    if (b <= 11) {
      nb = b;
      esBajo = true;
    } else if (b == 12) {
      h = 3;
      bot = 11;
    }
  }

  const ArchivoAudio *a = NULL;
  int idx = (bot > 0) ? bot - 1 : 0;
  if (idx > 15)
    idx = 15;

  if (h == 1)
    a = fuelleAbriendo ? &F1_Halar[idx] : &F1_Empujar[idx];
  else if (h == 2)
    a = fuelleAbriendo ? &F2_Halar[idx] : &F2_Empujar[idx];
  else if (h == 3)
    a = fuelleAbriendo ? &F3_Halar[idx] : &F3_Empujar[idx];
  else if (esBajo && nb >= 0 && nb < 12)
    a = fuelleAbriendo ? &BAJOS_HALAR[nb] : &BAJOS_EMPUJAR[nb];

  if (!a || !a->ruta)
    return;

  // ⚡ MAPEO IDENTICO 1:1 (Totalmente afinado en la SD)
  char rutaFinal[64];
  strcpy(rutaFinal, a->ruta);

  if (strstr(rutaFinal, "/Brillante/")) {
    if (instrumentoActual == 1) { // MUNDO GUITARRA
      char temp[64] = "/Guitarra/";
      strcat(temp, a->ruta + 11);
      strcpy(rutaFinal, temp);
    } else if (modoArmonizado) { // ACORDEON ARMONIZADO
      char temp[64] = "/Armonizado/";
      strcat(temp, a->ruta + 11);
      strcpy(rutaFinal, temp);
    }
  }

  int v = -1;
  // 1️⃣ BUSCAR VOZ VACÍA
  for (int j = 0; j < NUM_VOCES; j++) {
    if (!voces[j].ocupada) {
      v = j;
      break;
    }
  }

  // 2️⃣ VOICE STEALING INTELIGENTE (Si no hay vacías, roba la que esté en Release
  // o tenga menos volumen)
  if (v == -1) {
    float minVol = 999.0f;
    int indexPeorVoz = 0;
    for (int j = 0; j < NUM_VOCES; j++) {
      if (voces[j].enRelease) {
        v = j;
        break;
      } // Robar primero las que ya se están apagando
      if (voces[j].volumenActual < minVol) {
        minVol = voces[j].volumenActual;
        indexPeorVoz = j;
      }
    }
    if (v == -1)
      v = indexPeorVoz; // Robar la de volumen más bajo
    liberarVoz(v);
  }

  // 🎼 Carga directa y veloz
  voces[v].file = new AudioFileSourceSD(rutaFinal);

  if (!voces[v].file->isOpen() && (instrumentoActual != 0 || modoArmonizado)) {
    delete voces[v].file;
    voces[v].file = new AudioFileSourceSD(a->ruta);
  }

  if (voces[v].file->isOpen()) {
    voces[v].wav = new AudioGeneratorWAV();
    voces[v].buff = new AudioFileSourceBuffer(voces[v].file, 2048);
    voces[v].ocupada = true;
    voces[v].MuxId = m;
    voces[v].BotonId = b;
    voces[v].volumenActual = 0.0f; // ⚡ Empezar desde CERO absoluto
    voces[v].volMax = esBajo ? 0.45f : VOL_MAX;
    voces[v].enAtaque = true;
    voces[v].enRelease = false;
    if (voces[v].stub)
      voces[v].stub->SetGain(0.0f);
    voces[v].wav->begin(voces[v].buff, voces[v].stub);
  } else {
    delete voces[v].file;
    voces[v].file = NULL;
  }
}

// ====================================================
// ⚙️ SETUP
// ====================================================
void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);

  // MUX & Fuelle
  for (int i = 0; i < 4; i++)
    pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);

  // SD (SPI Bus 1 — pines 35/37/36)
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SD.begin(SD_CS, SPI, 20000000, "/sd", 20);
  Serial.println("✅ SD V-PRO @ 20MHz");

  // I2S DAC - BUFFER ROBUSTO (Elimina ruidos de la pantalla)
  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetBuffers(10, 512); // Subimos de 8, 256 para evitar mico-pausas
  out->SetRate(RATES_TONOS[tonoActual]);
  out->SetGain(1.0f); // Normalizamos ganancia

  mixer = new AudioOutputMixer(512, out);
  for (int i = 0; i < NUM_VOCES; i++) {
    voces[i].stub = mixer->NewInput();
    voces[i].ocupada = false;
  }

  // Pantalla TFT + Touch (SPI Bus 2 — pines 8/12/13)
  spiTFT.begin(TFT_SCK, TFT_MISO, TFT_MOSI, -1);
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);
  tft.begin();
  tft.setRotation(2);
  touch.begin(spiTFT);
  touch.setRotation(2);

  valorAnteriorSlide = analogRead(slidePin);
  dibujarPantalla();
  Serial.println("🪗 V-PRO CON PANTALLA — LISTO");
}

// ====================================================
// 🔄 LOOP
// ====================================================
void loop() {
  unsigned long now = millis();
  bool haySonido = false;

  // 1. MOTOR DE AUDIO
  for (int v = 0; v < NUM_VOCES; v++) {
    if (voces[v].ocupada && voces[v].wav && voces[v].wav->isRunning()) {
      haySonido = true;
      if (voces[v].enAtaque) {
        voces[v].volumenActual += FADE_SPEED;
        if (voces[v].volumenActual >= voces[v].volMax) {
          voces[v].volumenActual = voces[v].volMax;
          voces[v].enAtaque = false;
        }
        voces[v].stub->SetGain(voces[v].volumenActual);
      }
      if (voces[v].enRelease) {
        voces[v].volumenActual -= FADE_SPEED;
        if (voces[v].volumenActual <= 0) {
          liberarVoz(v);
          continue;
        }
        voces[v].stub->SetGain(voces[v].volumenActual);
      }
      if (!voces[v].wav->loop())
        liberarVoz(v);
    } else if (voces[v].ocupada) {
      liberarVoz(v);
    }
  }

  if (!haySonido) {
    int16_t silence[2] = {0, 0};
    for (int s = 0; s < 16; s++)
      out->ConsumeSample(silence);
  }

  // 2. TOUCH (cada 50ms — no bloquea audio)
  static unsigned long lastTouchCheck = 0;
  if (now - lastTouchCheck > 50) {
    lastTouchCheck = now;
    procesarTouch();
  }

  // 3. ESCANEO BOTONES
  for (int i = 0; i < 16; i++) {
    for (int p = 0; p < 4; p++)
      digitalWrite(sPines[p], (i >> p) & 0x01);
    delayMicroseconds(MUX_DELAY);
    bool s1 = digitalRead(sigMux1);
    bool s2 = digitalRead(sigMux2);
    bool s3 = digitalRead(sigMux3);

    if (s1 != estadoDebounceM1[i] && (now - lastTimeMux[0][i] > DEBOUNCE)) {
      estadoDebounceM1[i] = s1;
      lastTimeMux[0][i] = now;
      if (s1 == LOW)
        sonarNota(1, i);
      else
        apagarVoz(buscarVoz(1, i));
    }
    if (s2 != estadoDebounceM2[i] && (now - lastTimeMux[1][i] > DEBOUNCE)) {
      estadoDebounceM2[i] = s2;
      lastTimeMux[1][i] = now;
      if (s2 == LOW)
        sonarNota(2, i);
      else
        apagarVoz(buscarVoz(2, i));
    }
    if (s3 != estadoDebounceM3[i] && (now - lastTimeMux[2][i] > DEBOUNCE)) {
      estadoDebounceM3[i] = s3;
      lastTimeMux[2][i] = now;
      if (s3 == LOW)
        sonarNota(3, i);
      else
        apagarVoz(buscarVoz(3, i));
    }
    estadoFisicoM1[i] = s1;
    estadoFisicoM2[i] = s2;
    estadoFisicoM3[i] = s3;
  }

  // 4. WATCHDOG — mata notas pegadas
  for (int v = 0; v < NUM_VOCES; v++) {
    if (!voces[v].ocupada || voces[v].enRelease)
      continue;
    bool presionado = false;
    int mid = voces[v].MuxId;
    int bid = voces[v].BotonId;
    if (mid == 1)
      presionado = (estadoFisicoM1[bid] == LOW);
    else if (mid == 2)
      presionado = (estadoFisicoM2[bid] == LOW);
    else if (mid == 3)
      presionado = (estadoFisicoM3[bid] == LOW);
    if (!presionado)
      apagarVoz(v);
  }

  // 5. FUELLE
  int sv = analogRead(slidePin);
  static int fv = 0;
  fv = (fv * 3 + sv) >> 2;
  if (abs(fv - valorAnteriorSlide) > 120) {
    bool d = (fv - valorAnteriorSlide < 0);
    if (d != fuelleAbriendo) {
      fuelleAbriendo = d;
      for (int i = 0; i < NUM_VOCES; i++)
        apagarVoz(i);
      for (int i = 0; i < 16; i++) {
        if (estadoFisicoM1[i] == LOW)
          sonarNota(1, i);
        if (estadoFisicoM2[i] == LOW)
          sonarNota(2, i);
        if (estadoFisicoM3[i] == LOW)
          sonarNota(3, i);
      }
      actualizarFuellePantalla();
    }
    valorAnteriorSlide = fv;
  }
}
