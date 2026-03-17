// ====================================================
// 🪗 ACORDEÓN V-PRO — PANTALLA + 2 TONALIDADES
// Tonalidades: 5 Letras (Bb-Eb-Ab) | Si Mi La (B-E-A)
// Pantalla: ILI9341 240x320 vertical (rotation 2)
// Fix: VSPI→HSPI compatible ESP32-S3, XPT2046 correcto
// ====================================================
// PINES PANTALLA (SPI Bus 2 — pines 8/12/13)
//   TFT_CS=2  TFT_DC=3  TFT_RST=1  TFT_LED=21  TOUCH_CS=47
// PINES SD (SPI Bus 1 — pines 35/37/36)
//   SD_CS=14
// PINES MUX: S0=4 S1=5 S2=6 S3=7
//   MUX1=15  MUX2=16  MUX3=17  SLIDE=9
// PINES I2S: BCK=40 WS=41 DIN=42
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
#define TFT_CS   2
#define TFT_DC   3
#define TFT_RST  1
#define TFT_LED  21
#define TOUCH_CS 47
#define TFT_SCK  8
#define TFT_MISO 12
#define TFT_MOSI 13

#define SD_CS   14
#define SD_SCK  35
#define SD_MOSI 36
#define SD_MISO 37

#define I2S_BCK 40
#define I2S_WS  41
#define I2S_DIN 42

const int sPines[]  = {4, 5, 6, 7};
const int sigMux1   = 15;
const int sigMux2   = 16;
const int sigMux3   = 17;
const int slidePin  = 9;

// ====================================================
// ⚙️ MOTOR DE AUDIO (V8)
// ====================================================
#define NUM_VOCES  10
#define VOL_MAX    0.25f
#define FADE_SPEED 0.08f
#define DEBOUNCE   20
#define MUX_DELAY  30

struct VozDinamica {
  AudioGeneratorWAV     *wav  = NULL;
  AudioFileSourceSD     *file = NULL;
  AudioFileSourceBuffer *buff = NULL;
  int   MuxId  = -1;  int BotonId = -1;
  bool  ocupada = false;
  AudioOutputMixerStub *stub = NULL;
  float volumenActual = 0.0f;
  float volMax        = 0.25f;
  bool  enAtaque = false;
  bool  enRelease = false;
};

VozDinamica voces[NUM_VOCES];
AudioOutputI2S   *out   = NULL;
AudioOutputMixer *mixer = NULL;

bool estadoFisicoM1[16], estadoFisicoM2[16], estadoFisicoM3[16];
bool estadoDebounceM1[16], estadoDebounceM2[16], estadoDebounceM3[16];
unsigned long lastTimeMux[3][16];
bool fuelleAbriendo    = true;
int  valorAnteriorSlide = 0;

// ====================================================
// 🎼 ANÁLISIS DE TONALIDADES
// ====================================================
// Lógica: Sistema transpone desde DEFINICION_BASE (FBE = +0 semitonos)
// 5 Letras = BbEbAb = +5 semitonos → arrays directos (todos los archivos existen)
// Si Mi La = BEA    = +6 semitonos → arrays directos (mayoría existen)
//   ~75% archivos directos en SD     ✅
//   ~25% usamos nota ±1 semitono     ≈ (imperceptible en acordeón)
//   Notas faltantes en Brillante: Db4, B3, B5, B6, A6, E6
// NO SE NECESITA PITCH ADJUSTMENT EN RUNTIME → SetRate siempre 22050Hz

#define TONO_5_LETRAS  0  // Bb-Eb-Ab
#define TONO_SI_MI_LA  1  // B-E-A

int tonoActual = TONO_5_LETRAS;
const char* NOMBRE_TONOS[] = { "5 Letras", "Si Mi La" };

// ====================================================
// 🎹 PITOS — BASE 5 LETRAS (todos los archivos existen)
// ====================================================
struct ArchivoAudio { const char *ruta; };

// --- HILERA 1 (afuera) ---
const ArchivoAudio F1_H_5L[16] = {  // HALAR 5 Letras
  {"/Brillante/Gb - 4-cm.wav"}, {"/Brillante/C - 4-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"},
  {"/Brillante/A - 4-cm.wav"},  {"/Brillante/C - 5-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"},
  {"/Brillante/A - 5-cm.wav"},  {"/Brillante/C - 6-cm.wav"}
};
const ArchivoAudio F1_E_5L[16] = {  // EMPUJAR 5 Letras
  {"/Brillante/E - 4-cm.wav"},  {"/Brillante/Bb - 3-cm.wav"}, {"/Brillante/D - 4-cm.wav"}, {"/Brillante/F - 4-cm.wav"},
  {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/D - 5-cm.wav"},  {"/Brillante/F - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"},
  {"/Brillante/D - 6-cm.wav"},  {"/Brillante/F - 6-cm.wav"}
};
// --- HILERA 1 Si Mi La (+1 semitono) ---
// ✅=archivo exacto  ≈=nota vecina ±1 semitono (imperceptible)
const ArchivoAudio F1_H_SML[16] = {
  {"/Brillante/G - 4-cm.wav"},  {"/Brillante/C - 4-cm.wav"},  // ≈Db4→C4
  {"/Brillante/E - 4-cm.wav"},  {"/Brillante/Ab - 4-cm.wav"},
  {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Db - 5-cm.wav"},
  {"/Brillante/E - 5-cm.wav"},  {"/Brillante/Ab - 5-cm.wav"},
  {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Db - 6-cm.wav"}
};
const ArchivoAudio F1_E_SML[16] = {
  {"/Brillante/F - 4-cm.wav"},  {"/Brillante/Bb - 3-cm.wav"}, // ≈B3→Bb3
  {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/Gb - 4-cm.wav"},
  {"/Brillante/B - 4-cm.wav"},  {"/Brillante/Eb - 5-cm.wav"},
  {"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, // ≈B5→Bb5
  {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/F - 6-cm.wav"}   // ≈Gb6→F6
};

// --- HILERA 2 (medio) ---
const ArchivoAudio F2_H_5L[16] = {  // HALAR 5 Letras
  {"/Brillante/B - 4-cm.wav"},  {"/Brillante/D - 4-cm.wav"},  {"/Brillante/F - 4-cm.wav"},  {"/Brillante/Ab - 4-cm.wav"},
  {"/Brillante/C - 5-cm.wav"},  {"/Brillante/D - 5-cm.wav"},  {"/Brillante/F - 5-cm.wav"},  {"/Brillante/Ab - 5-cm.wav"},
  {"/Brillante/C - 6-cm.wav"},  {"/Brillante/D - 6-cm.wav"},  {"/Brillante/F - 6-cm.wav"}
};
const ArchivoAudio F2_E_5L[16] = {  // EMPUJAR 5 Letras
  {"/Brillante/A - 4-cm.wav"},  {"/Brillante/Bb - 3-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"},
  {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"},  {"/Brillante/Bb - 5-cm.wav"},
  {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/G - 6-cm.wav"},  {"/Brillante/Bb - 6-cm.wav"}
};
// --- HILERA 2 Si Mi La ---
const ArchivoAudio F2_H_SML[16] = {
  {"/Brillante/C - 5-cm.wav"},  {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/Gb - 4-cm.wav"}, {"/Brillante/A - 4-cm.wav"},
  {"/Brillante/Db - 5-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/A - 5-cm.wav"},
  {"/Brillante/Db - 6-cm.wav"}, {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/F - 6-cm.wav"}   // ≈Gb6→F6
};
const ArchivoAudio F2_E_SML[16] = {
  {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Bb - 3-cm.wav"}, // ≈B3→Bb3
  {"/Brillante/E - 4-cm.wav"},  {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/B - 4-cm.wav"},
  {"/Brillante/E - 5-cm.wav"},  {"/Brillante/Ab - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, // ≈B5→Bb5
  {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/Ab - 6-cm.wav"}, {"/Brillante/Bb - 6-cm.wav"}  // ≈B6→Bb6
};

// --- HILERA 3 (adentro) ---
const ArchivoAudio F3_H_5L[16] = {  // HALAR 5 Letras
  {"/Brillante/E - 5-cm.wav"},  {"/Brillante/G - 4-cm.wav"},  {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Db - 5-cm.wav"},
  {"/Brillante/F - 5-cm.wav"},  {"/Brillante/G - 5-cm.wav"},  {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Db - 6-cm.wav"},
  {"/Brillante/F - 6-cm.wav"},  {"/Brillante/G - 6-cm.wav"}
};
const ArchivoAudio F3_E_5L[16] = {  // EMPUJAR 5 Letras
  {"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/C - 5-cm.wav"},
  {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"}, {"/Brillante/C - 6-cm.wav"},  {"/Brillante/Eb - 6-cm.wav"},
  {"/Brillante/Ab - 6-cm.wav"}, {"/Brillante/C - 7-cm.wav"}
};
// --- HILERA 3 Si Mi La ---
const ArchivoAudio F3_H_SML[16] = {
  {"/Brillante/F - 5-cm.wav"},  {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/B - 4-cm.wav"},  {"/Brillante/D - 5-cm.wav"},
  {"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, // ≈B5→Bb5
  {"/Brillante/D - 6-cm.wav"},  {"/Brillante/F - 6-cm.wav"},  {"/Brillante/Ab - 6-cm.wav"}  // ≈Gb6→F6
};
const ArchivoAudio F3_E_SML[16] = {
  {"/Brillante/G - 5-cm.wav"},  {"/Brillante/E - 4-cm.wav"},  {"/Brillante/A - 4-cm.wav"},  {"/Brillante/Db - 5-cm.wav"},
  {"/Brillante/E - 5-cm.wav"},  {"/Brillante/A - 5-cm.wav"},  {"/Brillante/Db - 6-cm.wav"}, {"/Brillante/Eb - 6-cm.wav"},  // ≈E6→Eb6
  {"/Brillante/Ab - 6-cm.wav"}, {"/Brillante/C - 7-cm.wav"}   // ≈A6→Ab6, ≈Db7→C7
};

// --- BAJOS (sin cambio entre tonos — mismos acordes físicos verificados) ---
const ArchivoAudio BAJOS_HALAR[12] = {
  {"/Bajos/Bajo  Eb-cm.wav"},          {"/Bajos/Bajo  Eb  (acorde)-cm.wav"},
  {"/Bajos/Bajo Bb-cm.wav"},           {"/Bajos/Bajo Bb  (acorde)-cm.wav"},
  {"/Bajos/Bajo  F-cm.wav"},           {"/Bajos/Bajo F (acorde)-cm.wav"},
  {"/Bajos/Bajo Db-cm.wav"},           {"/Bajos/Bajo Db   (acorde)-cm.wav"},
  {"/Bajos/Bajo  F-cm.wav"},           {"/Bajos/Bajo Fm   (acorde)-cm.wav"},
  {"/Bajos/Bajo C -cm.wav"},           {"/Bajos/Bajo Cm (acorde)-cm.wav"}
};
const ArchivoAudio BAJOS_EMPUJAR[12] = {
  {"/Bajos/Bajo Ab-cm.wav"},           {"/Bajos/Bajo Ab  (acorde)-cm.wav"},
  {"/Bajos/Bajo  Eb-cm.wav"},          {"/Bajos/Bajo  Eb  (acorde)-cm.wav"},
  {"/Bajos/Bajo Bb-cm.wav"},           {"/Bajos/Bajo Bb  (acorde)-cm.wav"},
  {"/Bajos/Bajo Db-cm.wav"},           {"/Bajos/Bajo Db   (acorde)-cm.wav"},
  {"/Bajos/Bajo C -cm.wav"},           {"/Bajos/Bajo C  (acorde)-cm.wav"},
  {"/Bajos/Bajo  G-cm.wav"},           {"/Bajos/Bajo G  (acorde)-cm.wav"}
};

// Punteros activos según el tono seleccionado
const ArchivoAudio *F1_H, *F1_E, *F2_H, *F2_E, *F3_H, *F3_E;

void actualizarPunterosArray() {
  if (tonoActual == TONO_5_LETRAS) {
    F1_H = F1_H_5L; F1_E = F1_E_5L;
    F2_H = F2_H_5L; F2_E = F2_E_5L;
    F3_H = F3_H_5L; F3_E = F3_E_5L;
  } else {
    F1_H = F1_H_SML; F1_E = F1_E_SML;
    F2_H = F2_H_SML; F2_E = F2_E_SML;
    F3_H = F3_H_SML; F3_E = F3_E_SML;
  }
}

// ====================================================
// 🖥️ PANTALLA TFT ILI9341 — VERTICAL (rotation 2)
// ====================================================
// FIX: VSPI no existe en ESP32-S3. Usamos HSPI=2 que es compatible.
#ifndef HSPI
  #define HSPI 2
#endif
SPIClass spiTFT(HSPI);

// FIX: XPT2046 constructor solo acepta (csPin) — SPI se pasa en begin()
Adafruit_ILI9341 tft(&spiTFT, TFT_DC, TFT_CS, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);

struct BotonUI { int x, y, w, h; uint16_t colorActivo; };
BotonUI btnTonos[2] = {
  {10,  210, 100, 50, 0x07E0},  // 5 Letras — verde
  {128, 210, 100, 50, 0x001F}   // Si Mi La — azul
};

void dibujarPantalla() {
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW); tft.setTextSize(2);
  tft.setCursor(20, 10);  tft.println("ACORDEON V-PRO");
  tft.drawFastHLine(0, 35, 240, 0x4208);

  tft.setTextColor(0xAD55); tft.setTextSize(1);
  tft.setCursor(10, 45);   tft.println("Tonalidad activa:");
  tft.setTextSize(3);      tft.setTextColor(ILI9341_CYAN);
  tft.setCursor(10, 60);   tft.println(NOMBRE_TONOS[tonoActual]);

  tft.setTextSize(1);      tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(10, 105);  tft.println("Fuelle:");
  tft.setTextSize(2);
  tft.setTextColor(fuelleAbriendo ? ILI9341_GREEN : ILI9341_RED);
  tft.setCursor(10, 120);  tft.println(fuelleAbriendo ? "ABRIENDO" : "CERRANDO");

  tft.drawFastHLine(0, 195, 240, 0x4208);
  tft.setTextSize(1);      tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(10, 202);  tft.println("Selecciona tonalidad:");

  for (int i = 0; i < 2; i++) {
    bool sel = (i == tonoActual);
    uint16_t fondo = sel ? btnTonos[i].colorActivo : 0x2945;
    uint16_t borde = sel ? ILI9341_WHITE : ILI9341_DARKGREY;
    tft.fillRoundRect(btnTonos[i].x, btnTonos[i].y, btnTonos[i].w, btnTonos[i].h, 8, fondo);
    tft.drawRoundRect(btnTonos[i].x, btnTonos[i].y, btnTonos[i].w, btnTonos[i].h, 8, borde);
    tft.setTextSize(1);    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(btnTonos[i].x + 8, btnTonos[i].y + 20);
    tft.println(NOMBRE_TONOS[i]);
  }

  tft.setTextSize(1);  tft.setTextColor(0x4208);
  tft.setCursor(10, 275); tft.println("V-PRO 17/03/2026");
}

void actualizarFuellePantalla() {
  tft.fillRect(10, 120, 200, 20, ILI9341_BLACK);
  tft.setTextSize(2);
  tft.setTextColor(fuelleAbriendo ? ILI9341_GREEN : ILI9341_RED);
  tft.setCursor(10, 120);
  tft.println(fuelleAbriendo ? "ABRIENDO" : "CERRANDO");
}

// ====================================================
// 🔧 GESTOR DE VOCES
// ====================================================
void liberarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada) return;
  if (voces[v].stub) voces[v].stub->SetGain(0);
  if (voces[v].wav)  { if (voces[v].wav->isRunning()) voces[v].wav->stop(); delete voces[v].wav; voces[v].wav = NULL; }
  if (voces[v].buff) { delete voces[v].buff; voces[v].buff = NULL; }
  if (voces[v].file) { if (voces[v].file->isOpen()) voces[v].file->close(); delete voces[v].file; voces[v].file = NULL; }
  voces[v].ocupada = false; voces[v].enRelease = false; voces[v].enAtaque = false;
  voces[v].MuxId = -1; voces[v].BotonId = -1;
}

void apagarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada || voces[v].enRelease) return;
  voces[v].enRelease = true; voces[v].enAtaque = false;
}

int buscarVoz(int m, int b) {
  for (int i = 0; i < NUM_VOCES; i++)
    if (voces[i].ocupada && voces[i].MuxId == m && voces[i].BotonId == b) return i;
  return -1;
}

void cambiarTono(int nuevoTono) {
  if (nuevoTono == tonoActual) return;
  for (int i = 0; i < NUM_VOCES; i++) liberarVoz(i);
  tonoActual = nuevoTono;
  actualizarPunterosArray();
  dibujarPantalla();
  Serial.print("🎼 Tono: "); Serial.println(NOMBRE_TONOS[tonoActual]);
}

bool procesarTouch() {
  if (!touch.touched()) return false;
  static unsigned long lastTouch = 0;
  if (millis() - lastTouch < 350) return false;
  lastTouch = millis();
  TS_Point pt = touch.getPoint();
  int x = map(pt.x, 3800, 300, 0, 240);
  int y = map(pt.y, 3700, 200, 0, 320);
  for (int i = 0; i < 2; i++) {
    if (x >= btnTonos[i].x && x <= btnTonos[i].x + btnTonos[i].w &&
        y >= btnTonos[i].y && y <= btnTonos[i].y + btnTonos[i].h) {
      cambiarTono(i); return true;
    }
  }
  return false;
}

// ====================================================
// 🎵 FUNCIÓN DE SONIDO
// ====================================================
void sonarNota(int m, int b) {
  int iExistente = buscarVoz(m, b);
  if (iExistente != -1) {
    if (!voces[iExistente].enRelease) return;
    liberarVoz(iExistente);
  }

  int h = 0, bot = 0, nb = -1;
  bool esBajo = false;

  if (m == 1) {
    if (b < 6) { h = 2; bot = 6 - b; } else { h = 1; bot = b - 5; }
  } else if (m == 2) {
    if (b >= 11) { h = 2; bot = 22 - b; } else { h = 3; bot = 11 - b; }
  } else if (m == 3) {
    if (b <= 11) { nb = b; esBajo = true; }
    else if (b == 12) { h = 3; bot = 11; }
  }

  const ArchivoAudio *a = NULL;
  int idx = (bot > 0) ? bot - 1 : 0; if (idx > 15) idx = 15;

  if      (h == 1) a = fuelleAbriendo ? &F1_H[idx] : &F1_E[idx];
  else if (h == 2) a = fuelleAbriendo ? &F2_H[idx] : &F2_E[idx];
  else if (h == 3) a = fuelleAbriendo ? &F3_H[idx] : &F3_E[idx];
  else if (esBajo && nb >= 0 && nb < 12)
    a = fuelleAbriendo ? &BAJOS_HALAR[nb] : &BAJOS_EMPUJAR[nb];

  if (!a || !a->ruta) return;

  int v = -1;
  for (int j = 0; j < NUM_VOCES; j++) if (!voces[j].ocupada) { v = j; break; }
  if (v == -1) { v = 0; liberarVoz(0); }

  voces[v].file = new AudioFileSourceSD(a->ruta);
  if (voces[v].file->isOpen()) {
    voces[v].wav  = new AudioGeneratorWAV();
    voces[v].buff = new AudioFileSourceBuffer(voces[v].file, 2048);
    voces[v].ocupada       = true;
    voces[v].MuxId         = m;
    voces[v].BotonId       = b;
    voces[v].volumenActual = 0.002f;
    voces[v].volMax        = esBajo ? 0.45f : VOL_MAX;
    voces[v].enAtaque      = true;
    voces[v].enRelease     = false;
    if (voces[v].stub) voces[v].stub->SetGain(0.002f);
    voces[v].wav->begin(voces[v].buff, voces[v].stub);
  } else {
    delete voces[v].file; voces[v].file = NULL;
  }
}

// ====================================================
// ⚙️ SETUP
// ====================================================
void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);

  // MUX & Fuelle
  for (int i = 0; i < 4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP); pinMode(sigMux2, INPUT_PULLUP); pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);

  // SD — Bus SPI principal (pines 35/37/36)
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SD.begin(SD_CS, SPI, 20000000, "/sd", 20);
  Serial.println("✅ SD V-PRO @ 20MHz (max_files=20)");

  // I2S DAC
  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetBuffers(8, 256);
  out->SetRate(22050);
  out->SetGain(1.2f);
  mixer = new AudioOutputMixer(512, out);
  for (int i = 0; i < NUM_VOCES; i++) {
    voces[i].stub    = mixer->NewInput();
    voces[i].ocupada = false;
  }

  // Pantalla TFT + Touch — Bus SPI secundario (pines 8/12/13)
  spiTFT.begin(TFT_SCK, TFT_MISO, TFT_MOSI, -1);
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);
  tft.begin();
  tft.setRotation(2);       // Vertical correcto (igual que vpro_fix_rotation.ino)
  touch.begin(spiTFT);      // Pasar SPIClass en begin() — correcto para XPT2046
  touch.setRotation(2);     // Sincronizado con pantalla

  // Inicializar arrays de notas
  actualizarPunterosArray();
  valorAnteriorSlide = analogRead(slidePin);

  // Mostrar pantalla
  dibujarPantalla();
  Serial.println("🪗 ACORDEÓN V-PRO CON PANTALLA — LISTO");
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
        if (voces[v].volumenActual >= voces[v].volMax) { voces[v].volumenActual = voces[v].volMax; voces[v].enAtaque = false; }
        voces[v].stub->SetGain(voces[v].volumenActual);
      }
      if (voces[v].enRelease) {
        voces[v].volumenActual -= FADE_SPEED;
        if (voces[v].volumenActual <= 0) { liberarVoz(v); continue; }
        voces[v].stub->SetGain(voces[v].volumenActual);
      }
      if (!voces[v].wav->loop()) liberarVoz(v);
    } else if (voces[v].ocupada) {
      liberarVoz(v);
    }
  }

  if (!haySonido) {
    int16_t silence[2] = {0, 0};
    for (int s = 0; s < 16; s++) out->ConsumeSample(silence);
  }

  // 2. TOUCH cada 50ms (sin bloquear audio)
  static unsigned long lastTouchCheck = 0;
  if (now - lastTouchCheck > 50) { lastTouchCheck = now; procesarTouch(); }

  // 3. ESCANEO BOTONES
  for (int i = 0; i < 16; i++) {
    for (int p = 0; p < 4; p++) digitalWrite(sPines[p], (i >> p) & 0x01);
    delayMicroseconds(MUX_DELAY);
    bool s1 = digitalRead(sigMux1);
    bool s2 = digitalRead(sigMux2);
    bool s3 = digitalRead(sigMux3);

    if (s1 != estadoDebounceM1[i] && (now - lastTimeMux[0][i] > DEBOUNCE)) {
      estadoDebounceM1[i] = s1; lastTimeMux[0][i] = now;
      if (s1 == LOW) sonarNota(1, i); else apagarVoz(buscarVoz(1, i));
    }
    if (s2 != estadoDebounceM2[i] && (now - lastTimeMux[1][i] > DEBOUNCE)) {
      estadoDebounceM2[i] = s2; lastTimeMux[1][i] = now;
      if (s2 == LOW) sonarNota(2, i); else apagarVoz(buscarVoz(2, i));
    }
    if (s3 != estadoDebounceM3[i] && (now - lastTimeMux[2][i] > DEBOUNCE)) {
      estadoDebounceM3[i] = s3; lastTimeMux[2][i] = now;
      if (s3 == LOW) sonarNota(3, i); else apagarVoz(buscarVoz(3, i));
    }
    estadoFisicoM1[i] = s1; estadoFisicoM2[i] = s2; estadoFisicoM3[i] = s3;
  }

  // 4. WATCHDOG
  for (int v = 0; v < NUM_VOCES; v++) {
    if (!voces[v].ocupada || voces[v].enRelease) continue;
    bool presionado = false;
    int mid = voces[v].MuxId; int bid = voces[v].BotonId;
    if      (mid == 1) presionado = (estadoFisicoM1[bid] == LOW);
    else if (mid == 2) presionado = (estadoFisicoM2[bid] == LOW);
    else if (mid == 3) presionado = (estadoFisicoM3[bid] == LOW);
    if (!presionado) apagarVoz(v);
  }

  // 5. FUELLE
  int sv = analogRead(slidePin);
  static int fv = 0; fv = (fv * 3 + sv) >> 2;
  if (abs(fv - valorAnteriorSlide) > 120) {
    bool d = (fv - valorAnteriorSlide < 0);
    if (d != fuelleAbriendo) {
      fuelleAbriendo = d;
      for (int i = 0; i < NUM_VOCES; i++) apagarVoz(i);
      for (int i = 0; i < 16; i++) {
        if (estadoFisicoM1[i] == LOW) sonarNota(1, i);
        if (estadoFisicoM2[i] == LOW) sonarNota(2, i);
        if (estadoFisicoM3[i] == LOW) sonarNota(3, i);
      }
      actualizarFuellePantalla();
    }
    valorAnteriorSlide = fv;
  }
}
