// ====================================================
// 🪗 V-PRO OS v1.2 — MASTER INTEGRATION
// ACORDEÓN (48 BOTONES) + LUXURY PLAYER (MP3) + ACADEMIA
// ====================================================

#include "AudioFileSourceBuffer.h"
#include "AudioFileSourceSD.h"
#include "AudioGeneratorMP3.h"
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

// ⚙️ PINES V-PRO
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

// 🧠 ESTADOS
enum SystemState {
  STATE_MENU,
  STATE_ACCORDION,
  STATE_PLAYER,
  STATE_EDU_LIST,
  STATE_EDU_READ
};
SystemState currentState = STATE_MENU;

// 🔊 AUDIO GLOBAL
AudioOutputI2S *out = NULL;
AudioOutputMixer *mixer = NULL;

// --- 🪗 CONFIG ACORDEÓN ---
#define NUM_VOCES 10
#define VOL_MAX 0.25f
#define FADE_SPEED 0.08f
#define DEBOUNCE 20
#define MUX_DELAY 30

struct VozDinamica {
  AudioGeneratorWAV *wav = NULL;
  AudioFileSourceSD *file = NULL;
  AudioFileSourceBuffer *buff = NULL;
  AudioOutputMixerStub *stub = NULL;
  int MuxId = -1, BotonId = -1;
  bool ocupada = false, enAtaque = false, enRelease = false;
  float volumenActual = 0, volMax = 0.25f;
};
VozDinamica voces[NUM_VOCES];

bool m1F[16], m2F[16], m3F[16], m1Deb[16], m2Deb[16], m3Deb[16];
unsigned long mTime[3][16];
bool fuelleAbriendo = true;
int antSlide = 0;

// TONALIDADES
const char *NOMBRE_TONOS[] = {"EAD (ALTO)", "FSibM (Orig)",  "GCF BEMOL",
                              "Sol Do Fa",  "LRS BEMOL",     "ADG (LaReSol)",
                              "5 Letras",   "Si Mi La",      "Do Fa Sib",
                              "Do Fa Si #", "RSD (Natural)", "Mi La Re B"};
const int RATES_TONOS[] = {15592, 16520, 17501, 18542, 19644, 20812,
                           22050, 23362, 24750, 26222, 27781, 29433};
int tonoActual = 6;

struct ArchivoAudio {
  const char *ruta;
};
const ArchivoAudio F1_Halar[16] = {
    {"/Brillante/Gb - 4-cm.wav"}, {"/Brillante/C - 4-cm.wav"},
    {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"},
    {"/Brillante/A - 4-cm.wav"},  {"/Brillante/C - 5-cm.wav"},
    {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"},
    {"/Brillante/A - 5-cm.wav"},  {"/Brillante/C - 6-cm.wav"}};
const ArchivoAudio F1_Empujar[16] = {
    {"/Brillante/E - 4-cm.wav"},  {"/Brillante/Bb - 3-cm.wav"},
    {"/Brillante/D - 4-cm.wav"},  {"/Brillante/F - 4-cm.wav"},
    {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/D - 5-cm.wav"},
    {"/Brillante/F - 5-cm.wav"},  {"/Brillante/Bb - 5-cm.wav"},
    {"/Brillante/D - 6-cm.wav"},  {"/Brillante/F - 6-cm.wav"}};
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
const ArchivoAudio F3_Halar[16] = {
    {"/Brillante/E - 5-cm.wav"},  {"/Brillante/G - 4-cm.wav"},
    {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Db - 5-cm.wav"},
    {"/Brillante/F - 5-cm.wav"},  {"/Brillante/G - 5-cm.wav"},
    {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Db - 6-cm.wav"},
    {"/Brillante/F - 6-cm.wav"},  {"/Brillante/G - 6-cm.wav"}};
const ArchivoAudio F3_Empujar[16] = {
    {"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"},
    {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/C - 5-cm.wav"},
    {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"},
    {"/Brillante/C - 6-cm.wav"},  {"/Brillante/Eb - 6-cm.wav"},
    {"/Brillante/Ab - 6-cm.wav"}, {"/Brillante/C - 7-cm.wav"}};
const ArchivoAudio BAJOS_H[12] = {
    {"/Bajos/Bajo  Eb-cm.wav"}, {"/Bajos/Bajo  Eb  (acorde)-cm.wav"},
    {"/Bajos/Bajo Bb-cm.wav"},  {"/Bajos/Bajo Bb  (acorde)-cm.wav"},
    {"/Bajos/Bajo  F-cm.wav"},  {"/Bajos/Bajo F (acorde)-cm.wav"},
    {"/Bajos/Bajo Db-cm.wav"},  {"/Bajos/Bajo Db   (acorde)-cm.wav"},
    {"/Bajos/Bajo  F-cm.wav"},  {"/Bajos/Bajo Fm   (acorde)-cm.wav"},
    {"/Bajos/Bajo C -cm.wav"},  {"/Bajos/Bajo Cm (acorde)-cm.wav"}};
const ArchivoAudio BAJOS_E[12] = {
    {"/Bajos/Bajo Ab-cm.wav"},  {"/Bajos/Bajo Ab  (acorde)-cm.wav"},
    {"/Bajos/Bajo  Eb-cm.wav"}, {"/Bajos/Bajo  Eb  (acorde)-cm.wav"},
    {"/Bajos/Bajo Bb-cm.wav"},  {"/Bajos/Bajo Bb  (acorde)-cm.wav"},
    {"/Bajos/Bajo Db-cm.wav"},  {"/Bajos/Bajo Db   (acorde)-cm.wav"},
    {"/Bajos/Bajo C -cm.wav"},  {"/Bajos/Bajo C  (acorde)-cm.wav"},
    {"/Bajos/Bajo  G-cm.wav"},  {"/Bajos/Bajo G  (acorde)-cm.wav"}};

// --- 🎧 CONFIG PLAYER (MP3) ---
AudioGeneratorMP3 *mp3 = NULL;
AudioFileSourceSD *fmp3 = NULL;
AudioFileSourceBuffer *bmp3 = NULL;
String playlist[40];
int totMp3 = 0, songIdx = 0;
bool mp3Playing = false;

// --- 📚 CONFIG ACADEMIA ---
int eduArtId = 0;
const char *EDU_T[] = {"REALISMO FISICO", "CAMINO AL EXITO", "HOJA DE RUTA"};
const char *EDU_C[] = {
    "MOTOR DE INSTRUMENTO\nESP32-S3 + DAC PCM5102\n10 Voces "
    "Polifonicas\nMuestras WAV Reales\nMapeo Fisico de 48 botones\n\nTu "
    "proyecto es un instrumento musical autonomo real de alta gama.",
    "STANDALONE INTEGRADO\nSin computadora, sin cables.\nSensor BMP280 en "
    "fuelle.\nBaterias 18650.\nAmplificador 80W.\nTodo dentro de la caja de "
    "madera.",
    "PROXIMOS PASOS\n1. Firmware Pro OS v1.2\n2. Diseño de PCB Unico\n3. "
    "Construcción en Madera\n4. Lanzamiento Academia\n\nSuena como un Rey "
    "Vallenato pero pesa la mitad."};

// --- 🖥️ PANTALLA & TOUCH ---
SPIClass spiTFT(HSPI);
Adafruit_ILI9341 tft(&spiTFT, TFT_DC, TFT_CS, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);

// ==========================================
// 🎨 EFECTO VISUALIZADOR (WAVE)
// ==========================================
void dibujarOnda() {
  if (!mp3Playing || currentState != STATE_PLAYER)
    return;
  for (int i = 0; i < 6; i++) {
    int x = 85 + (i * 12);
    tft.fillRect(x, 85, 8, 50, 0x000F); // Navy
    int h = random(5, 40);
    tft.fillRect(x, 110 - (h / 2), 8, h, 0xCE79); // Gold
  }
}

// ==========================================
// 🎨 FUNCIONES DE UI
// ==========================================
void drawVProMenu() {
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(3);
  tft.setCursor(50, 30);
  tft.println("V-PRO");
  tft.setTextSize(1);
  tft.setCursor(65, 60);
  tft.println("GESTOR DE SONIDO PRO");

  tft.fillRoundRect(20, 100, 200, 55, 12, 0x07E0);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(45, 118);
  tft.println("TOCAR NOTAS");
  tft.fillRoundRect(20, 170, 200, 55, 12, 0x001F);
  tft.setCursor(45, 188);
  tft.println("ROCKOLA MP3");
  tft.fillRoundRect(20, 240, 200, 55, 12, 0xFDA0);
  tft.setCursor(45, 258);
  tft.println("ACADEMIA V-P");
}

void drawVProBack(const char *tit) {
  tft.fillScreen(ILI9341_BLACK);
  tft.fillRect(0, 0, 240, 45, 0xCE79); // Gold header
  tft.fillRoundRect(5, 5, 60, 35, 8, ILI9341_RED);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(12, 18);
  tft.print("< RETOR");
  tft.setTextColor(ILI9341_BLACK);
  tft.setTextSize(2);
  tft.setCursor(75, 15);
  tft.print(tit);
}

void drawAccUI() {
  drawVProBack("12 TONOS");
  for (int i = 0; i < 12; i++) {
    int x = (i % 2 == 0) ? 10 : 125, y = 60 + (i / 2) * 38;
    tft.fillRoundRect(x, y, 105, 33, 6, (i == tonoActual) ? 0x07E0 : 0x2104);
    tft.drawRoundRect(x, y, 105, 33, 6, ILI9341_WHITE);
    tft.setTextColor(ILI9341_WHITE);
    tft.setTextSize(1);
    tft.setCursor(x + 5, y + 13);
    tft.print(NOMBRE_TONOS[i]);
  }
}

void drawVProPlayer() {
  tft.fillScreen(0x000F); // Navy
  tft.fillRect(0, 0, 240, 45, ILI9341_BLACK);
  tft.fillRoundRect(5, 5, 50, 35, 5, ILI9341_RED);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(10, 18);
  tft.print("< ATRE");
  tft.setTextColor(0xCE79);
  tft.setTextSize(2);
  tft.setCursor(65, 12);
  tft.println("V-PRO ROCKOLA");

  tft.drawCircle(120, 110, 60, 0xCE79);
  tft.drawCircle(120, 110, 10, ILI9341_WHITE);
  tft.setTextColor(ILI9341_LIGHTGREY);
  tft.setTextSize(1);
  tft.setCursor(20, 180);
  tft.println("REPRODUCIENDO:");
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(20, 195);
  tft.println(totMp3 > 0 ? playlist[songIdx] : "SD Vacia");

  tft.fillRoundRect(40, 240, 45, 45, 8, ILI9341_BLUE);
  tft.setCursor(50, 258);
  tft.print("PREV");
  tft.fillRoundRect(95, 235, 50, 55, 10, mp3Playing ? 0x9000 : 0x0480);
  tft.setCursor(105, 258);
  tft.print(mp3Playing ? "PAUSE" : "PLAY");
  tft.fillRoundRect(155, 240, 45, 45, 8, ILI9341_BLUE);
  tft.setCursor(165, 258);
  tft.print("NEXT");
}

void drawEduL() {
  drawVProBack("APRENDER");
  for (int i = 0; i < 3; i++) {
    int y = 80 + i * 70;
    tft.fillRoundRect(20, y, 200, 55, 12, 0xFDA0);
    tft.setTextColor(ILI9341_BLACK);
    tft.setTextSize(2);
    tft.setCursor(35, y + 20);
    tft.print(EDU_T[i]);
  }
}

void drawEduR(int id) {
  drawVProBack("LECTURA");
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(15, 65);
  tft.println(EDU_C[id]);
}

// ==========================================
// 🔈 MOTOR DE AUDIO — LOGICA COMPLETA
// ==========================================
void stopVProAudio() {
  for (int i = 0; i < NUM_VOCES; i++) {
    if (voces[i].wav) {
      voces[i].wav->stop();
      delete voces[i].wav;
      voces[i].wav = NULL;
    }
    if (voces[i].buff) {
      delete voces[i].buff;
      voces[i].buff = NULL;
    }
    if (voces[i].file) {
      if (voces[i].file->isOpen())
        voces[i].file->close();
      delete voces[i].file;
      voces[i].file = NULL;
    }
    voces[i].ocupada = false;
  }
  if (mp3) {
    mp3->stop();
    delete mp3;
    mp3 = NULL;
  }
  if (bmp3) {
    delete bmp3;
    bmp3 = NULL;
  }
  if (fmp3) {
    if (fmp3->isOpen())
      fmp3->close();
    delete fmp3;
    fmp3 = NULL;
  }
  mp3Playing = false;
}

void playMP3File(int idx) {
  stopVProAudio();
  if (totMp3 == 0)
    return;
  songIdx = idx;
  String p = "/Musica/" + playlist[songIdx];
  fmp3 = new AudioFileSourceSD(p.c_str());
  if (fmp3->isOpen()) {
    bmp3 = new AudioFileSourceBuffer(fmp3, 8192);
    mp3 = new AudioGeneratorMP3();
    mp3->begin(bmp3, out);
    mp3Playing = true;
    drawVProPlayer();
  }
}

// 🎹 ACORDEON CORE
void libV(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada)
    return;
  if (voces[v].stub)
    voces[v].stub->SetGain(0);
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
}

int findV(int m, int b) {
  for (int i = 0; i < NUM_VOCES; i++)
    if (voces[i].ocupada && voces[i].MuxId == m && voces[i].BotonId == b)
      return i;
  return -1;
}

void son(int m, int b) {
  int ex = findV(m, b);
  if (ex != -1) {
    if (!voces[ex].enRelease)
      return;
    libV(ex);
  }
  int h = 0, bot = 0, nb = -1;
  bool eb = false;
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
      eb = true;
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
  else if (eb && nb >= 0 && nb < 12)
    a = fuelleAbriendo ? &BAJOS_H[nb] : &BAJOS_E[nb];
  if (!a || !a->ruta)
    return;
  int v = -1;
  for (int j = 0; j < NUM_VOCES; j++)
    if (!voces[j].ocupada) {
      v = j;
      break;
    }
  if (v == -1) {
    v = 0;
    libV(0);
  }
  voces[v].file = new AudioFileSourceSD(a->ruta);
  if (voces[v].file->isOpen()) {
    voces[v].wav = new AudioGeneratorWAV();
    voces[v].buff = new AudioFileSourceBuffer(voces[v].file, 2048);
    voces[v].ocupada = true;
    voces[v].MuxId = m;
    voces[v].BotonId = b;
    voces[v].volMax = eb ? 0.45f : 0.25f;
    voces[v].volumenActual = 0.005f;
    voces[v].enAtaque = true;
    voces[v].stub->SetGain(0.005f);
    voces[v].wav->begin(voces[v].buff, voces[v].stub);
  } else {
    delete voces[v].file;
    voces[v].file = NULL;
  }
}

// ==========================================
// 🚀 SETUP & LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);
  for (int i = 0; i < 4; i++)
    pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SD.begin(SD_CS, SPI, 16000000);
  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetRate(RATES_TONOS[tonoActual]);
  out->SetGain(1.2f);
  mixer = new AudioOutputMixer(512, out);
  for (int i = 0; i < NUM_VOCES; i++)
    voces[i].stub = mixer->NewInput();
  spiTFT.begin(TFT_SCK, TFT_MISO, TFT_MOSI, -1);
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);
  tft.begin();
  tft.setRotation(2);
  touch.begin(spiTFT);
  touch.setRotation(2);
  File root = SD.open("/Musica");
  while (File e = root.openNextFile()) {
    if (e.name()[0] != '.' && totMp3 < 40)
      playlist[totMp3++] = String(e.name());
    e.close();
  }
  drawVProMenu();
}

void loop() {
  unsigned long now = millis();
  if (currentState == STATE_ACCORDION) {
    for (int v = 0; v < NUM_VOCES; v++) {
      if (voces[v].ocupada && voces[v].wav && voces[v].wav->isRunning()) {
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
            libV(v);
            continue;
          }
          voces[v].stub->SetGain(voces[v].volumenActual);
        }
        if (!voces[v].wav->loop())
          libV(v);
      } else if (voces[v].ocupada)
        libV(v);
    }
    for (int i = 0; i < 16; i++) {
      for (int p = 0; p < 4; p++)
        digitalWrite(sPines[p], (i >> p) & 0x01);
      delayMicroseconds(MUX_DELAY);
      bool s1 = digitalRead(sigMux1), s2 = digitalRead(sigMux2),
           s3 = digitalRead(sigMux3);
      if (s1 != m1Deb[i] && (now - mTime[0][i] > DEBOUNCE)) {
        m1Deb[i] = s1;
        mTime[0][i] = now;
        if (s1 == LOW)
          son(1, i);
        else {
          int v = findV(1, i);
          if (v != -1) {
            voces[v].enRelease = true;
            voces[v].enAtaque = false;
          }
        }
      }
      if (s2 != m2Deb[i] && (now - mTime[1][i] > DEBOUNCE)) {
        m2Deb[i] = s2;
        mTime[1][i] = now;
        if (s2 == LOW)
          son(2, i);
        else {
          int v = findV(2, i);
          if (v != -1) {
            voces[v].enRelease = true;
            voces[v].enAtaque = false;
          }
        }
      }
      if (s3 != m3Deb[i] && (now - mTime[2][i] > DEBOUNCE)) {
        m3Deb[i] = s3;
        mTime[2][i] = now;
        if (s3 == LOW)
          son(3, i);
        else {
          int v = findV(3, i);
          if (v != -1) {
            voces[v].enRelease = true;
            voces[v].enAtaque = false;
          }
        }
      }
      m1F[i] = s1;
      m2F[i] = s2;
      m3F[i] = s3;
    }
    int sv = analogRead(slidePin);
    static int fv = 0;
    fv = (fv * 3 + sv) >> 2;
    if (abs(fv - antSlide) > 120) {
      bool d = (fv - antSlide < 0);
      if (d != fuelleAbriendo) {
        fuelleAbriendo = d;
        for (int i = 0; i < NUM_VOCES; i++) {
          if (voces[i].ocupada) {
            voces[i].enRelease = true;
            voces[i].enAtaque = false;
          }
        }
        for (int i = 0; i < 16; i++) {
          if (m1F[i] == LOW)
            son(1, i);
          if (m2F[i] == LOW)
            son(2, i);
          if (m3F[i] == LOW)
            son(3, i);
        }
      }
      antSlide = fv;
    }
  } else if (currentState == STATE_PLAYER) {
    if (mp3Playing && mp3 && mp3->isRunning())
      if (!mp3->loop())
        mp3Playing = false;
    static unsigned long lastW = 0;
    if (now - lastW > 100) {
      lastW = now;
      dibujarOnda();
    }
  }

  static unsigned long lastT = 0;
  if (touch.touched() && now - lastT > 350) {
    lastT = now;
    TS_Point p = touch.getPoint();
    int x = map(p.x, 3800, 300, 0, 240), y = map(p.y, 3700, 200, 0, 320);
    if (currentState != STATE_MENU && x < 65 && y < 45) {
      stopVProAudio();
      currentState = STATE_MENU;
      drawVProMenu();
      return;
    }
    switch (currentState) {
    case STATE_MENU:
      if (y > 100 && y < 155) {
        currentState = STATE_ACCORDION;
        out->SetRate(RATES_TONOS[tonoActual]);
        drawAccUI();
      } else if (y > 170 && y < 225) {
        currentState = STATE_PLAYER;
        drawVProPlayer();
      } else if (y > 240 && y < 295) {
        currentState = STATE_EDU_LIST;
        drawEduL();
      }
      break;
    case STATE_ACCORDION:
      if (y > 60) {
        int c = (x > 120) ? 1 : 0, r = (y - 60) / 38, id = r * 2 + c;
        if (id < 12) {
          tonoActual = id;
          out->SetRate(RATES_TONOS[tonoActual]);
          drawAccUI();
        }
      }
      break;
    case STATE_PLAYER:
      if (y > 230 && y < 290) {
        if (x < 85) {
          songIdx = (songIdx - 1 + totMp3) % totMp3;
          playMP3File(songIdx);
        } else if (x < 150) {
          if (mp3Playing) {
            mp3Playing = false;
            mp3->stop();
          } else
            playMP3File(songIdx);
          drawVProPlayer();
        } else {
          songIdx = (songIdx + 1) % totMp3;
          playMP3File(songIdx);
        }
      }
      break;
    case STATE_EDU_LIST:
      if (y > 80 && y < 290) {
        eduArtId = (y - 80) / 70;
        currentState = STATE_EDU_READ;
        drawEduR(eduArtId);
      }
      break;
    case STATE_EDU_READ:
      currentState = STATE_EDU_LIST;
      drawEduL();
      break;
    }
  }
}
