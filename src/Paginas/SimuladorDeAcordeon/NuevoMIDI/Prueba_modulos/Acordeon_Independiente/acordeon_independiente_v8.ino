// ====================================================
// ACORDEÓN JESUS GONZALEZ — V-PRO ELR (MI-LA-RE)
// VERSIÓN "ROCA VALLENATA" — ESTABILIDAD TOTAL
// OBJETIVO: Cero Fallas, Trinos de Acero, Cero Notas Pegadas
// ====================================================

#include "AudioFileSourceBuffer.h"
#include "AudioFileSourceSD.h"
#include "AudioGeneratorWAV.h"
#include "AudioOutputI2S.h"
#include "AudioOutputMixer.h"
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <WiFi.h>

// ⚙️ PINES V-PRO
#define SD_CS   14
#define SD_SCK  35
#define SD_MOSI 36
#define SD_MISO 37

#define I2S_BCK 40
#define I2S_WS  41
#define I2S_DIN 42

const int sPines[] = {4, 5, 6, 7};
const int sigMux1 = 15;
const int sigMux2 = 16;
const int sigMux3 = 17;
const int slidePin = 9;

// ⚙️ AJUSTES DE ESTABILIDAD SUPREMA
#define NUM_VOCES 10       
#define VOL_MAX 0.15f      
#define FADE_SPEED 0.08f   
#define DEBOUNCE 20        // Filtro profesional para evitar doble nota
#define MUX_DELAY 30       // Estabilidad de lectura máxima

struct VozDinamica {
  AudioGeneratorWAV *wav = NULL;
  AudioFileSourceSD *file = NULL;
  AudioFileSourceBuffer *buff = NULL;
  int MuxId = -1;
  int BotonId = -1;
  bool ocupada = false;
  AudioOutputMixerStub *stub = NULL;
  float volumenActual = 0.0f;
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

// ==========================================
// 🔧 GESTOR DE VOCES (BLINDADO)
// ==========================================
void liberarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada) return;
  
  if (voces[v].stub) voces[v].stub->SetGain(0);
  
  if (voces[v].wav) {
    if (voces[v].wav->isRunning()) voces[v].wav->stop();
    delete voces[v].wav; voces[v].wav = NULL;
  }
  if (voces[v].buff) { delete voces[v].buff; voces[v].buff = NULL; }
  if (voces[v].file) {
    if (voces[v].file->isOpen()) voces[v].file->close();
    delete voces[v].file; voces[v].file = NULL;
  }
  
  voces[v].ocupada = false;
  voces[v].enRelease = false;
  voces[v].enAtaque = false;
  voces[v].MuxId = -1;
  voces[v].BotonId = -1;
}

void apagarVoz(int v) {
  if (v < 0 || v >= NUM_VOCES || !voces[v].ocupada || voces[v].enRelease) return;
  voces[v].enRelease = true;
  voces[v].enAtaque = false;
}

int buscarVoz(int m, int b) {
  for (int i = 0; i < NUM_VOCES; i++) {
    if (voces[i].ocupada && voces[i].MuxId == m && voces[i].BotonId == b) return i;
  }
  return -1;
}

// 🎵 MAPEO DE ARCHIVOS (V8)
struct ArchivoAudio { const char *ruta; };
const ArchivoAudio F1_Empujar[16] = {{"/Brillante/E - 4-cm.wav"}, {"/Brillante/Bb - 3-cm.wav"}, {"/Brillante/D - 4-cm.wav"}, {"/Brillante/F - 4-cm.wav"}, {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/D - 5-cm.wav"}, {"/Brillante/F - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/D - 6-cm.wav"}, {"/Brillante/F - 6-cm.wav"}};
const ArchivoAudio F1_Halar[16] = {{"/Brillante/Gb - 4-cm.wav"}, {"/Brillante/C - 4-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"}, {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/D - 5-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/D - 6-cm.wav"}};
const ArchivoAudio F2_Empujar[16] = {{"/Brillante/A - 4-cm.wav"}, {"/Brillante/Bb - 3-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/G - 4-cm.wav"}, {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/G - 6-cm.wav"}, {"/Brillante/Bb - 6-cm.wav"}};
const ArchivoAudio F2_Halar[16] = {{"/Brillante/B - 4-cm.wav"}, {"/Brillante/D - 4-cm.wav"}, {"/Brillante/F - 4-cm.wav"}, {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/C - 5-cm.wav"}, {"/Brillante/D - 5-cm.wav"}, {"/Brillante/F - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"}, {"/Brillante/C - 6-cm.wav"}, {"/Brillante/D - 6-cm.wav"}, {"/Brillante/F - 6-cm.wav"}};
const ArchivoAudio F3_Empujar[16] = {{"/Brillante/Gb - 5-cm.wav"}, {"/Brillante/Eb - 4-cm.wav"}, {"/Brillante/Ab - 4-cm.wav"}, {"/Brillante/C - 5-cm.wav"}, {"/Brillante/Eb - 5-cm.wav"}, {"/Brillante/Ab - 5-cm.wav"}, {"/Brillante/C - 6-cm.wav"}, {"/Brillante/Eb - 6-cm.wav"}, {"/Brillante/Ab - 6-cm.wav"}, {"/Brillante/C - 7-cm.wav"}};
const ArchivoAudio F3_Halar[16] = {{"/Brillante/E - 5-cm.wav"}, {"/Brillante/G - 4-cm.wav"}, {"/Brillante/Bb - 4-cm.wav"}, {"/Brillante/Db - 5-cm.wav"}, {"/Brillante/F - 5-cm.wav"}, {"/Brillante/G - 5-cm.wav"}, {"/Brillante/Bb - 5-cm.wav"}, {"/Brillante/Db - 6-cm.wav"}, {"/Brillante/F - 6-cm.wav"}, {"/Brillante/G - 6-cm.wav"}};
const ArchivoAudio B1_Empujar[6] = {{"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoEb-cm.wav"}, {"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoG-cm.wav"}, {"/Bajos/BajoAbacorde-cm.wav"}, {"/Bajos/BajoAb-cm.wav"}};
const ArchivoAudio B1_Halar[6] = {{"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoG-cm.wav"}, {"/Bajos/BajoCmacorde-cm.wav"}, {"/Bajos/BajoC-cm.wav"}, {"/Bajos/BajoAbacorde-cm.wav"}, {"/Bajos/BajoAb-cm.wav"}};
const ArchivoAudio B2_Empujar[6] = {{"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoF-cm.wav"}, {"/Bajos/BajoBbacorde-cm.wav"}, {"/Bajos/BajoBb-cm.wav"}, {"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoEb-cm.wav"}};
const ArchivoAudio B2_Halar[6] = {{"/Bajos/BajoCacorde-cm.wav"}, {"/Bajos/BajoC-cm.wav"}, {"/Bajos/BajoEbacorde-cm.wav"}, {"/Bajos/BajoF-cm.wav"}, {"/Bajos/BajoBbacorde-cm.wav"}, {"/Bajos/BajoBb-cm.wav"}};

void sonarNota(int m, int b) {
  // 1. GUARDIA ANTI-DOBLE NOTA: Si ya suena y no está en release, NO re-disparar
  int iExistente = buscarVoz(m, b);
  if (iExistente != -1) {
    if (!voces[iExistente].enRelease) return; // Ya está sonando, ignorar rebote
    liberarVoz(iExistente); // Si estaba en release, reiniciamos para el vallenato
  }

  int h = 0, bot = 0, nb = -1;
  bool ext = false;
  if      (m == 1) { if (b < 6) { h = 2; bot = 6 - b; } else { h = 1; bot = b - 5; } }
  else if (m == 2) { if (b >= 11) { h = 2; bot = 22 - b; } else { h = 3; bot = 11 - b; } }
  else if (m == 3) {
    if (b <= 5) { ext = true; nb = b; }
    else if (b <= 11) { 
      ext = false; 
      // Mapeo no lineal idéntico a acordeon_esp32.ino
      if      (b == 6)  nb = 0; // Nota 36
      else if (b == 7)  nb = 4; // Nota 37
      else if (b == 8)  nb = 1; // Nota 38
      else if (b == 9)  nb = 2; // Nota 39
      else if (b == 10) nb = 3; // Nota 40
      else if (b == 11) nb = 5; // Nota 41
    }
    else if (b == 12) { h = 3; bot = 11; }
  }

  const ArchivoAudio *a = NULL;
  int idx = (bot > 0) ? bot - 1 : 0; if (idx > 15) idx = 15;
  if      (h == 1) a = fuelleAbriendo ? &F1_Halar[idx] : &F1_Empujar[idx];
  else if (h == 2) a = fuelleAbriendo ? &F2_Halar[idx] : &F2_Empujar[idx];
  else if (h == 3) a = fuelleAbriendo ? &F3_Halar[idx] : &F3_Empujar[idx];
  else if (nb >= 0) a = ext ? (fuelleAbriendo ? &B2_Halar[nb] : &B2_Empujar[nb]) : (fuelleAbriendo ? &B1_Halar[nb] : &B1_Empujar[nb]);

  if (!a || !a->ruta) return;

  // 2. BUSCAR SLOT LIBRE
  int v = -1;
  for (int j = 0; j < NUM_VOCES; j++) if (!voces[j].ocupada) { v = j; break; }
  if (v == -1) { v = 0; liberarVoz(0); } // Robar la voz más antigua

  // 3. CARGAR AUDIO
  voces[v].file = new AudioFileSourceSD(a->ruta);
  if (voces[v].file->isOpen()) {
    voces[v].wav = new AudioGeneratorWAV();
    voces[v].buff = new AudioFileSourceBuffer(voces[v].file, 2048);
    voces[v].ocupada = true;
    voces[v].MuxId = m;
    voces[v].BotonId = b;
    voces[v].volumenActual = 0.0f; // EMPREZA EN 0 PARA CERO "TAC"
    voces[v].enAtaque = true;
    voces[v].enRelease = false;
    if (voces[v].stub) voces[v].stub->SetGain(0.0f);
    voces[v].wav->begin(voces[v].buff, voces[v].stub);
  } else {
    delete voces[v].file; voces[v].file = NULL;
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);
  for (int i = 0; i < 4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP); pinMode(sigMux2, INPUT_PULLUP); pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  SD.begin(SD_CS, SPI, 20000000); // 20MHz: Máxima velocidad de carga

  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetBuffers(8, 256); // Buffers estables para evitar ruidos de SD
  out->SetRate(22050); 
  
  mixer = new AudioOutputMixer(512, out); // Mezclador suave y estable
  // Latencia total estimada: ~34ms (Inpercetible para el ser humano)
  for (int i = 0; i < NUM_VOCES; i++) {
    voces[i].stub = mixer->NewInput();
    voces[i].ocupada = false;
  }
}

void loop() {
  unsigned long now = millis();
  bool haySonido = false;

  // 1. MOTOR DE AUDIO (MÁXIMA PRIORIDAD)
  for (int v = 0; v < NUM_VOCES; v++) {
    if (voces[v].ocupada && voces[v].wav && voces[v].wav->isRunning()) {
      haySonido = true;
      if (voces[v].enAtaque) {
        voces[v].volumenActual += FADE_SPEED;
        if (voces[v].volumenActual >= VOL_MAX) { voces[v].volumenActual = VOL_MAX; voces[v].enAtaque = false; }
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

  // ALIMENTACIÓN DE SILENCIO (CRÍTICO PARA LA ESTABILIDAD DEL I2S)
  if (!haySonido) {
    int16_t silence[2] = {0, 0};
    for (int s = 0; s < 16; s++) out->ConsumeSample(silence);
  }

  // 2. ESCANEO DE BOTONES (ESTABLE Y SIN BLOQUEOS)
  for (int i = 0; i < 16; i++) {
    for (int p = 0; p < 4; p++) digitalWrite(sPines[p], (i >> p) & 0x01);
    delayMicroseconds(MUX_DELAY); 
    
    bool s1 = digitalRead(sigMux1);
    bool s2 = digitalRead(sigMux2);
    bool s3 = digitalRead(sigMux3);

    // Mux 1
    if (s1 != estadoDebounceM1[i] && (now - lastTimeMux[0][i] > DEBOUNCE)) {
      estadoDebounceM1[i] = s1; lastTimeMux[0][i] = now;
      if (s1 == LOW) sonarNota(1, i); else apagarVoz(buscarVoz(1, i));
    }
    // Mux 2
    if (s2 != estadoDebounceM2[i] && (now - lastTimeMux[1][i] > DEBOUNCE)) {
      estadoDebounceM2[i] = s2; lastTimeMux[1][i] = now;
      if (s2 == LOW) sonarNota(2, i); else apagarVoz(buscarVoz(2, i));
    }
    // Mux 3
    if (s3 != estadoDebounceM3[i] && (now - lastTimeMux[2][i] > DEBOUNCE)) {
      estadoDebounceM3[i] = s3; lastTimeMux[2][i] = now;
      if (s3 == LOW) sonarNota(3, i); else apagarVoz(buscarVoz(3, i));
    }

    estadoFisicoM1[i] = s1; estadoFisicoM2[i] = s2; estadoFisicoM3[i] = s3;
  }

  // 3. WATCHDOG FÍSICO (MATA NOTAS PEGADAS AL INSTANTE)
  for (int v = 0; v < NUM_VOCES; v++) {
    if (!voces[v].ocupada || voces[v].enRelease) continue;
    bool presionado = false;
    int mid = voces[v].MuxId; int bid = voces[v].BotonId;
    if      (mid == 1) presionado = (estadoFisicoM1[bid] == LOW);
    else if (mid == 2) presionado = (estadoFisicoM2[bid] == LOW);
    else if (mid == 3) presionado = (estadoFisicoM3[bid] == LOW);
    if (!presionado) apagarVoz(v);
  }

  // 4. FUELLE
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
    }
    valorAnteriorSlide = fv;
  }
}
