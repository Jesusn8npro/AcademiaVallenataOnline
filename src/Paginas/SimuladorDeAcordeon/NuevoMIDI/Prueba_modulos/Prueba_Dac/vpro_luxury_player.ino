// ====================================================
// V-PRO LUXURY ROCKOLA — VERSIÓN WAVE & FIX
// OBJETIVO: Onda de Sonido + Lista Clara + Touch Seguro
// UBICACIÓN: /Prueba_modulos/Prueba_Dac/vpro_luxury_player.ino
// ====================================================

#include <Arduino.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>
#include "AudioFileSourceSD.h"
#include "AudioFileSourceBuffer.h"
#include "AudioGeneratorMP3.h"
#include "AudioOutputI2S.h"

// ⚙️ PINES V-PRO
#define SD_CS     14
#define SD_SCK    35
#define SD_MOSI   36
#define SD_MISO   37
#define TFT_CS    2
#define TFT_DC    3
#define TFT_RST   1
#define TFT_LED   21
#define TOUCH_CS  47
#define VPRO_SCK   8
#define VPRO_MISO  12
#define VPRO_MOSI  13
#define I2S_BCK   40
#define I2S_WS    41
#define I2S_DIN   42

// 📺 CONFIG
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);
SPIClass spiSD(HSPI);

// 🔊 AUDIO
AudioGeneratorMP3 *mp3 = NULL;
AudioFileSourceSD *file = NULL;
AudioFileSourceBuffer *buff = NULL;
AudioOutputI2S *out = NULL;

// 📂 GESTIÓN
#define MAX_MP3 40
String mp3Playlist[MAX_MP3];
int totalMp3 = 0, songIndex = 0;
enum ViewMode { PLAYER_VIEW, LIST_VIEW };
ViewMode currentScreen = PLAYER_VIEW;
bool isPlaying = false;
unsigned long lastTouchTime = 0; // Para evitar rebotes de pantalla

// 🎨 COLORES
#define VPRO_GOLD    0xCE79 
#define VPRO_NAVY    0x000F
#define VPRO_EMERALD 0x0480
#define VPRO_CRIMSON 0x9000

// ==========================================
// 🎨 EFECTO VISUALIZADOR (WAVE)
// ==========================================
void dibujarOnda() {
  if (!isPlaying) return;
  static int alturas[6] = {10, 20, 15, 25, 12, 18};
  for (int i = 0; i < 6; i++) {
    int x = 85 + (i * 12);
    // Borrar anterior
    tft.fillRect(x, 110 - 25, 8, 50, VPRO_NAVY);
    // Generar nueva altura aleatoria pero suave
    alturas[i] = random(5, 40);
    tft.fillRect(x, 110 - (alturas[i]/2), 8, alturas[i], VPRO_GOLD);
  }
}

// ==========================================
// 📂 ESCANEO DE SD
// ==========================================
void escanearSD() {
  totalMp3 = 0;
  File root = SD.open("/");
  while (true) {
    File entry = root.openNextFile();
    if (!entry) break;
    String name = entry.name();
    if (name.endsWith(".mp3") || name.endsWith(".MP3")) {
      if (totalMp3 < MAX_MP3) {
        mp3Playlist[totalMp3] = name; // Quitamos el "/" para visualización
        totalMp3++;
      }
    }
    entry.close();
  }
}

// ==========================================
// 🎨 INTERFAZ GRÁFICA CORREGIDA
// ==========================================
void dibujarBotonesPlayer() {
  tft.fillRoundRect(5, 260, 40, 40, 5, 0x4208); // -20s
  tft.setCursor(10, 275); tft.setTextColor(ILI9341_WHITE); tft.setTextSize(1); tft.print("-20s");

  tft.fillRoundRect(50, 260, 40, 40, 5, ILI9341_BLUE); // Prev
  tft.fillTriangle(80, 270, 80, 290, 60, 280, ILI9341_WHITE);

  uint16_t playCol = isPlaying ? VPRO_CRIMSON : VPRO_EMERALD;
  tft.fillRoundRect(95, 255, 50, 50, 10, playCol); // Play/Pause
  if(isPlaying) { tft.fillRect(108, 265, 8, 30, ILI9341_WHITE); tft.fillRect(124, 265, 8, 30, ILI9341_WHITE); }
  else tft.fillTriangle(105, 265, 105, 295, 135, 280, ILI9341_WHITE);

  tft.fillRoundRect(150, 260, 40, 40, 5, ILI9341_BLUE); // Next
  tft.fillTriangle(155, 270, 155, 290, 185, 280, ILI9341_WHITE);

  tft.fillRoundRect(195, 260, 40, 40, 5, 0x4208); // +20s
  tft.setCursor(200, 275); tft.print("+20s");
  
  tft.fillRoundRect(50, 215, 140, 30, 8, VPRO_GOLD);
  tft.setTextColor(ILI9341_BLACK); tft.setTextSize(2);
  tft.setCursor(65, 222); tft.println("VER LISTA");
}

void dibujarPlayer() {
  tft.fillScreen(VPRO_NAVY);
  tft.fillRect(0, 0, 240, 45, ILI9341_BLACK);
  tft.setTextColor(VPRO_GOLD); tft.setTextSize(2);
  tft.setCursor(45, 12); tft.println("V-PRO ROCKOLA");

  tft.drawCircle(120, 110, 60, VPRO_GOLD); // Disco
  tft.drawCircle(120, 110, 10, ILI9341_WHITE); // Centro disco
  
  tft.setTextColor(ILI9341_LIGHTGREY); tft.setTextSize(1);
  tft.setCursor(20, 180); tft.println("AHORA REPRODUCIENDO:");
  
  tft.setTextColor(ILI9341_WHITE); tft.setTextSize(1);
  tft.setCursor(20, 195); 
  if(totalMp3 > 0) tft.println(mp3Playlist[songIndex]); // Nombre completo
  
  dibujarBotonesPlayer();
}

void dibujarLista() {
  tft.fillScreen(ILI9341_BLACK);
  tft.fillRect(0, 0, 240, 45, VPRO_GOLD);
  tft.setTextColor(ILI9341_BLACK); tft.setTextSize(2);
  tft.setCursor(65, 12); tft.println("PLAYLIST");

  for (int i = 0; i < totalMp3 && i < 11; i++) {
    int y = 60 + (i * 20);
    if(i == songIndex) tft.fillRect(0, y-2, 240, 18, 0x2104);
    tft.setCursor(10, y);
    tft.setTextColor(i == songIndex ? VPRO_GOLD : ILI9341_WHITE);
    tft.setTextSize(1);
    String displayName = mp3Playlist[i];
    if(displayName.length() > 38) displayName = displayName.substring(0, 35) + "...";
    tft.println(displayName);
  }
  
  tft.fillRoundRect(70, 285, 100, 30, 8, ILI9341_BLUE);
  tft.setTextColor(ILI9341_WHITE); tft.setCursor(95, 295); tft.println("VOLVER");
}

// ==========================================
// 🔊 LÓGICA DE AUDIO
// ==========================================
void stopAudio() {
  if (mp3) { mp3->stop(); delete mp3; mp3 = NULL; }
  if (buff) { delete buff; buff = NULL; }
  if (file) { file->close(); delete file; file = NULL; }
  isPlaying = false;
}

void playAudio(int index) {
  stopAudio();
  if (totalMp3 == 0) return;
  songIndex = index;
  String fullPath = "/" + mp3Playlist[songIndex];
  file = new AudioFileSourceSD(fullPath.c_str());
  if (file->isOpen()) {
    buff = new AudioFileSourceBuffer(file, 8192);
    mp3 = new AudioGeneratorMP3();
    mp3->begin(buff, out);
    isPlaying = true;
    currentScreen = PLAYER_VIEW;
    dibujarPlayer();
  }
}

// ==========================================
// 🚀 SETUP Y LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  pinMode(TFT_LED, OUTPUT); digitalWrite(TFT_LED, HIGH);
  SPI.begin(VPRO_SCK, VPRO_MISO, VPRO_MOSI, -1);
  tft.begin(); tft.setRotation(2); 
  touch.begin(SPI); touch.setRotation(2);
  spiSD.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (SD.begin(SD_CS, spiSD, 4000000)) escanearSD();
  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  dibujarPlayer();
}

unsigned long lastWave = 0;

void loop() {
  if (mp3 && mp3->isRunning()) { if (!mp3->loop()) stopAudio(); }

  // Animación de onda cada 100ms
  if (isPlaying && currentScreen == PLAYER_VIEW && millis() - lastWave > 100) {
    dibujarOnda();
    lastWave = millis();
  }

  if (touch.touched() && millis() - lastTouchTime > 300) {
    TS_Point pt = touch.getPoint();
    int tx = map(pt.x, 3800, 300, 0, 240);
    int ty = map(pt.y, 3700, 200, 0, 320);
    lastTouchTime = millis();

    if (currentScreen == PLAYER_VIEW) {
      if (ty > 250) {
        if (tx < 45) { /* -20s logic */ long t=(long)file->getPos()-320000; file->seek(t<0?0:t, SEEK_SET); }
        else if (tx < 90) { songIndex--; if(songIndex < 0) songIndex = totalMp3-1; playAudio(songIndex); }
        else if (tx < 145) { if(isPlaying) stopAudio(); else playAudio(songIndex); dibujarPlayer(); }
        else if (tx < 190) { songIndex++; if(songIndex >= totalMp3) songIndex = 0; playAudio(songIndex); }
        else { long t=(long)file->getPos()+320000; file->seek(t, SEEK_SET); }
      } else if (ty > 210 && ty < 245) {
        currentScreen = LIST_VIEW; dibujarLista();
      }
    } 
    else if (currentScreen == LIST_VIEW) {
      if (ty > 60 && ty < 280) {
        int selected = (ty - 60) / 20;
        if (selected < totalMp3) playAudio(selected);
      } else if (ty > 280) {
        currentScreen = PLAYER_VIEW; dibujarPlayer();
      }
    }
  }
}
