
#include "AudioFileSourceSD.h"
#include "AudioGeneratorWAV.h"
#include "AudioOutputI2S.h"
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <WiFi.h>

// ==========================================
// 🔌 PINES SD Y DAC
// ==========================================
#define SD_CS 14
#define SD_MOSI 13
#define SD_MISO 12
#define SD_SCK 8

#define I2S_BCK 40
#define I2S_WS 41
#define I2S_DIN 42

// ==========================================
// 🎛️ PINES MUX Y FUELLE
// ==========================================
const int sPines[] = {4, 5, 6, 7};
const int sigMux1 = 15; // H1 (Afuera)
const int sigMux2 = 16; // H2 (Medio)
const int sigMux3 = 17; // H3 (Adentro)
const int slidePin = 9;

// ==========================================
// 🎵 ESTRUCTURA Y MAPAS MUSICALES
// ==========================================
struct ArchivoAudio {
  const char *ruta;
  float multiplicadorPitch;
};

// --- AQUI SE PEGAN LOS ARRAYS DE output_maps.txt ---
// =========================================================
// 🎼 MAPA DE ARRAYS C++ PARA EL ESP32-S3 (CINCO LETRAS: Bb-Eb-Ab)
// =========================================================

// ------------- HILERA 1 (MUX 1) -------------
const ArchivoAudio H1_Empujar[16] = 
{
  {"/Brillante/A-4-cm.wav", 0.5612},
  {"/Brillante/A-4-cm.wav", 0.3969},
  {"/Brillante/A-4-cm.wav", 0.5000},
  {"/Brillante/A-4-cm.wav", 0.5946},
  {"/Brillante/A-4-cm.wav", 0.7937},
  {"/Brillante/A-4-cm.wav", 1.0000},
  {"/Brillante/C-5-cm.wav", 1.0000},
  {"/Brillante/A-5-cm.wav", 0.7937},
  {"/Brillante/A-5-cm.wav", 1.0000},
  {"/Brillante/C-6-cm.wav", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

const ArchivoAudio H1_Halar[16] = 
{
  {"/Brillante/A-4-cm.wav", 0.6300},
  {"/Brillante/A-4-cm.wav", 0.4454},
  {"/Brillante/A-4-cm.wav", 0.5297},
  {"/Brillante/A-4-cm.wav", 0.6674},
  {"/Brillante/A-4-cm.wav", 0.7492},
  {"/Brillante/A-4-cm.wav", 0.8909},
  {"/Brillante/Bb-4-cm.wav", 1.0000},
  {"/Brillante/D-5-cm.wav", 1.0000},
  {"/Brillante/A-5-cm.wav", 0.7492},
  {"/Brillante/A-5-cm.wav", 0.8909},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

// ------------- HILERA 2 (MUX 2) -------------
const ArchivoAudio H2_Empujar[16] = 
{
  {"/Brillante/A-4-cm.wav", 0.7492},
  {"/Brillante/A-4-cm.wav", 0.3969},
  {"/Brillante/A-4-cm.wav", 0.5297},
  {"/Brillante/A-4-cm.wav", 0.6674},
  {"/Brillante/A-4-cm.wav", 0.7937},
  {"/Brillante/Bb-4-cm.wav", 1.0000},
  {"/Brillante/D-5-cm.wav", 1.0000},
  {"/Brillante/A-5-cm.wav", 0.7937},
  {"/Brillante/Bb-5-cm.wav", 1.0000},
  {"/Brillante/D-6-cm.wav", 1.0000},
  {"/Brillante/Ab-6-cm.wav", 0.8409},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

const ArchivoAudio H2_Halar[16] = 
{
  {"/Brillante/A-4-cm.wav", 0.8409},
  {"/Brillante/A-4-cm.wav", 0.5000},
  {"/Brillante/A-4-cm.wav", 0.5946},
  {"/Brillante/A-4-cm.wav", 0.7071},
  {"/Brillante/A-4-cm.wav", 0.8909},
  {"/Brillante/A-4-cm.wav", 1.0000},
  {"/Brillante/C-5-cm.wav", 1.0000},
  {"/Brillante/Ab-5-cm.wav", 0.7492},
  {"/Brillante/A-5-cm.wav", 0.8909},
  {"/Brillante/A-5-cm.wav", 1.0000},
  {"/Brillante/C-6-cm.wav", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

// ------------- HILERA 3 & BAJOS (MUX 3) -------------
const ArchivoAudio H3_Empujar[16] = 
{
  {"/Brillante/Db-5-cm.wav", 1.0000},
  {"/Brillante/A-4-cm.wav", 0.5297},
  {"/Brillante/A-4-cm.wav", 0.7071},
  {"/Brillante/A-4-cm.wav", 0.8909},
  {"/Brillante/Bb-4-cm.wav", 1.0000},
  {"/Brillante/Ab-5-cm.wav", 0.7492},
  {"/Brillante/A-5-cm.wav", 0.8909},
  {"/Brillante/Bb-5-cm.wav", 1.0000},
  {"/Brillante/Ab-6-cm.wav", 0.7492},
  {"/Brillante/Ab-6-cm.wav", 0.9439},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

const ArchivoAudio H3_Halar[16] = 
{
  {"/Brillante/B-4-cm.wav", 1.0000},
  {"/Brillante/A-4-cm.wav", 0.6674},
  {"/Brillante/A-4-cm.wav", 0.7937},
  {"/Brillante/A-4-cm.wav", 0.9439},
  {"/Brillante/C-5-cm.wav", 1.0000},
  {"/Brillante/D-5-cm.wav", 1.0000},
  {"/Brillante/A-5-cm.wav", 0.7937},
  {"/Brillante/A-5-cm.wav", 0.9439},
  {"/Brillante/C-6-cm.wav", 1.0000},
  {"/Brillante/D-6-cm.wav", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000},
  {"", 1.0000}
};

const ArchivoAudio B_Interiores_Empujar[6] = 
{
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoEb-cm.wav", 1.0000},
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoG-cm.wav", 1.0000},
  {"/Bajos/BajoAb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoAb-cm.wav", 1.0000}
};

const ArchivoAudio B_Interiores_Halar[6] = 
{
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoG-cm.wav", 1.0000},
  {"/Bajos/BajoCm(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoC-cm.wav", 1.0000},
  {"/Bajos/BajoAb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoAb-cm.wav", 1.0000}
};

const ArchivoAudio B_Exteriores_Empujar[6] = 
{
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoF-cm.wav", 1.0000},
  {"/Bajos/BajoBb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoBb-cm.wav", 1.0000},
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoEb-cm.wav", 1.0000}
};

const ArchivoAudio B_Exteriores_Halar[6] = 
{
  {"/Bajos/BajoC(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoC-cm.wav", 1.0000},
  {"/Bajos/BajoEb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoF-cm.wav", 1.0000},
  {"/Bajos/BajoBb(acorde)-cm.wav", 1.0000},
  {"/Bajos/BajoBb-cm.wav", 1.0000}
};


// ---------------------------------------------------

// ==========================================
// 🧠 ESTADOS Y MOTORES
// ==========================================
AudioGeneratorWAV *wav = NULL;
AudioFileSourceSD *file = NULL;
AudioOutputI2S *out = NULL;

bool estadoM1[16];
bool estadoM2[16];
bool estadoM3[16];
unsigned long lastTime[3][16];
const int DEBOUNCE = 20;

int valorAnteriorSlide = 0;
bool fuelleAbriendo = true;
const int UMBRAL_DIRECCION = 5;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);

  // Config MUX
  for (int i = 0; i < 4; i++) {
    pinMode(sPines[i], OUTPUT);
  }
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);

  for (int i = 0; i < 16; i++) {
    estadoM1[i] = HIGH;
    estadoM2[i] = HIGH;
    estadoM3[i] = HIGH;
    lastTime[0][i] = 0;
    lastTime[1][i] = 0;
    lastTime[2][i] = 0;
  }

  valorAnteriorSlide = analogRead(slidePin);

  Serial.println("\n============ V-PRO S3: MOTOR WAV REAL ============");

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, SPI, 16000000)) {
    Serial.println("❌ ERROR: La SD no responde.");
    return;
  }
  Serial.println("✅ Micro SD Detectada");

  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetGain(1.0);

  wav = new AudioGeneratorWAV();
  Serial.println("✅ SINTETIZADOR V-PRO LISTO PARA LA BATALLA");
}

void tocarNota(const char *ruta, float pitch) {
  if (String(ruta) == "")
    return; // Botón vacío

  // 1. Detener audio anterior
  if (wav && wav->isRunning()) {
    wav->stop();
  }
  if (file) {
    file->close();
    delete file;
    file = NULL;
  }

  // 2. Cargar nuevo archivo WAV
  file = new AudioFileSourceSD(ruta);
  if (!file->isOpen()) {
    Serial.println("❌ ERROR abriendo: " + String(ruta));
    return;
  }

  // 3. Iniciar archivo y aplicar Pitch Shift en tiempo real
  wav->begin(file, out);

  // ¡MAGIA! Engañamos al I2S para que toque más rapido/lento = Pitch Shift
  out->SetRate(44100 * pitch);

  Serial.print("🎶 TOCANDO: ");
  Serial.print(ruta);
  Serial.print(" | PITCH: ");
  Serial.println(pitch, 4);
}

void loop() {
  // MANTENER EL AUDIO CORRIENDO
  if (wav && wav->isRunning()) {
    if (!wav->loop()) {
      wav->stop();
    }
  }

  unsigned long t = millis();

  // 1. DIRECCIÓN DEL FUELLE
  int slideActual = analogRead(slidePin);
  int diferencia = slideActual - valorAnteriorSlide;
  if (abs(diferencia) > UMBRAL_DIRECCION) {
    fuelleAbriendo =
        (diferencia < 0); // Ajusta según la dirección física de tu fuelle
    valorAnteriorSlide = slideActual;
  }

  // 2. LEER BOTONES MUX
  for (int i = 0; i < 16; i++) {
    digitalWrite(sPines[0], (i & 0x01));
    digitalWrite(sPines[1], (i >> 1) & 0x01);
    digitalWrite(sPines[2], (i >> 2) & 0x01);
    digitalWrite(sPines[3], (i >> 3) & 0x01);
    delayMicroseconds(5);

    bool h1 = digitalRead(sigMux1);
    bool h2 = digitalRead(sigMux2);
    bool h3 = digitalRead(sigMux3);

    // Si detectamos Presión (LOW)
    if (h1 == LOW && estadoM1[i] == HIGH && (t - lastTime[0][i] > DEBOUNCE)) {
      estadoM1[i] = LOW;
      lastTime[0][i] = t;
      tocarNota(fuelleAbriendo ? H1_Halar[i].ruta : H1_Empujar[i].ruta,
                fuelleAbriendo ? H1_Halar[i].multiplicadorPitch
                               : H1_Empujar[i].multiplicadorPitch);
    } else if (h1 == HIGH && estadoM1[i] == LOW) {
      estadoM1[i] = HIGH;
    }

    if (h2 == LOW && estadoM2[i] == HIGH && (t - lastTime[1][i] > DEBOUNCE)) {
      estadoM2[i] = LOW;
      lastTime[1][i] = t;
      tocarNota(fuelleAbriendo ? H2_Halar[i].ruta : H2_Empujar[i].ruta,
                fuelleAbriendo ? H2_Halar[i].multiplicadorPitch
                               : H2_Empujar[i].multiplicadorPitch);
    } else if (h2 == HIGH && estadoM2[i] == LOW) {
      estadoM2[i] = HIGH;
    }

    if (h3 == LOW && estadoM3[i] == HIGH && (t - lastTime[2][i] > DEBOUNCE)) {
      estadoM3[i] = LOW;
      lastTime[2][i] = t;
      tocarNota(fuelleAbriendo ? H3_Halar[i].ruta : H3_Empujar[i].ruta,
                fuelleAbriendo ? H3_Halar[i].multiplicadorPitch
                               : H3_Empujar[i].multiplicadorPitch);
    } else if (h3 == HIGH && estadoM3[i] == LOW) {
      estadoM3[i] = HIGH;
    }
  }
}
