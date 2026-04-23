// ====================================================
// TEST DE BAJOS V-PRO — ABRIENDO + CERRANDO
// ====================================================
// MODO: Solo bajos. El slider del fuelle cambia la dirección.
// Serial muestra el pin y la nota esperada en cada presion.
// ====================================================

#include "AudioFileSourceBuffer.h"
#include "AudioFileSourceSD.h"
#include "AudioGeneratorWAV.h"
#include "AudioOutputI2S.h"
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
const int sigMux3 = 17; // SOLO BAJOS
const int slidePin  = 9;  // Slider del fuelle

// ====================================================
// NOTAS ABRIENDO (HALAR) — TONALIDAD 5 LETRAS
// Basado en el código REAL de la página (notasAcordeonDiatonico.ts)
// Pin → nota 30+pin → ID → Nota en 5 Letras halar
//
// Pin 0  → nota 30 → ID 2-6 (fila dos, col 6) → MIB nota
// Pin 1  → nota 31 → ID 2-5 (fila dos, col 5) → MIB mayor (acorde)
// Pin 2  → nota 32 → ID 2-4 (fila dos, col 4) → SIB nota
// Pin 3  → nota 33 → ID 2-3 (fila dos, col 3) → SIB mayor (acorde)
// Pin 4  → nota 34 → ID 1-2 (fila una, col 2) → DO nota
// Pin 5  → nota 35 → ID 1-1 (fila una, col 1) → DO menor (acorde)
// Pin 6  → nota 36 → ID 1-6 (fila una, col 6) → REB nota
// Pin 7  → nota 37 → ID 1-5 (fila una, col 5) → REB mayor (acorde)
// Pin 8  → nota 38 → ID 1-4 (fila una, col 4) → FA nota
// Pin 9  → nota 39 → ID 1-3 (fila una, col 3) → FA menor (acorde)
// Pin 10 → nota 40 → ID 2-2 (fila dos, col 2) → FA nota (mismo)
// Pin 11 → nota 41 → ID 2-1 (fila dos, col 1) → FA mayor (acorde)
// ====================================================

const char* BAJOS_TEST[12] = {
  "/Bajos/Bajo  Eb-cm.wav",            // Pin 0  → Mib NOTA       (ID 2-6)
  "/Bajos/Bajo  Eb  (acorde)-cm.wav",  // Pin 1  → Mib ACORDE     (ID 2-5)
  "/Bajos/Bajo Bb-cm.wav",             // Pin 2  → Sib NOTA       (ID 2-4)
  "/Bajos/Bajo Bb  (acorde)-cm.wav",   // Pin 3  → Sib ACORDE     (ID 2-3)
  "/Bajos/Bajo  F-cm.wav",             // Pin 4  → Fa NOTA        (ID 2-2) ← SWAP con pin 10
  "/Bajos/Bajo F (acorde)-cm.wav",     // Pin 5  → Fa MAYOR       (ID 2-1) ← SWAP con pin 11
  "/Bajos/Bajo Db-cm.wav",             // Pin 6  → Reb NOTA       (ID 1-6)
  "/Bajos/Bajo Db   (acorde)-cm.wav",  // Pin 7  → Reb MAYOR      (ID 1-5)
  "/Bajos/Bajo  F-cm.wav",             // Pin 8  → Fa NOTA        (ID 1-4)
  "/Bajos/Bajo Fm   (acorde)-cm.wav",  // Pin 9  → Fa MENOR       (ID 1-3)
  "/Bajos/Bajo C -cm.wav",             // Pin 10 → Do NOTA        (ID 1-2) ← SWAP con pin 4
  "/Bajos/Bajo Cm (acorde)-cm.wav"     // Pin 11 → Do MENOR       (ID 1-1) ← SWAP con pin 5
};

// ====================================================
// NOTAS CERRANDO (EMPUJAR) — TONALIDAD 5 LETRAS
// Mismo mapeo físico confirmado (swaps 4↔10 y 5↔11)
//
// Pin 0  → DOS-6 → LAB nota
// Pin 1  → DOS-5 → LAB mayor (acorde)
// Pin 2  → DOS-4 → MIB nota
// Pin 3  → DOS-3 → MIB mayor (acorde)
// Pin 4  → DOS-2 → SIB nota         (swap físico)
// Pin 5  → DOS-1 → SIB mayor        (swap físico)
// Pin 6  → UNA-6 → REB nota
// Pin 7  → UNA-5 → REB mayor (acorde)
// Pin 8  → UNA-4 → DO nota
// Pin 9  → UNA-3 → DO mayor (acorde)
// Pin 10 → UNA-2 → SOL nota         (swap físico)
// Pin 11 → UNA-1 → SOL mayor        (swap físico)
// ====================================================
const char* BAJOS_CERRANDO[12] = {
  "/Bajos/Bajo Ab-cm.wav",              // Pin 0  → Lab NOTA       (DOS-6)
  "/Bajos/Bajo Ab  (acorde)-cm.wav",   // Pin 1  → Lab MAYOR      (DOS-5)
  "/Bajos/Bajo  Eb-cm.wav",            // Pin 2  → Mib NOTA       (DOS-4)
  "/Bajos/Bajo  Eb  (acorde)-cm.wav",  // Pin 3  → Mib MAYOR      (DOS-3)
  "/Bajos/Bajo Bb-cm.wav",             // Pin 4  → Sib NOTA       (DOS-2) swap
  "/Bajos/Bajo Bb  (acorde)-cm.wav",   // Pin 5  → Sib MAYOR      (DOS-1) swap
  "/Bajos/Bajo Db-cm.wav",             // Pin 6  → Reb NOTA       (UNA-6)
  "/Bajos/Bajo Db   (acorde)-cm.wav",  // Pin 7  → Reb MAYOR      (UNA-5)
  "/Bajos/Bajo C -cm.wav",             // Pin 8  → Do NOTA        (UNA-4)
  "/Bajos/Bajo C  (acorde)-cm.wav",    // Pin 9  → Do MAYOR       (UNA-3)
  "/Bajos/Bajo  G-cm.wav",             // Pin 10 → Sol NOTA       (UNA-2) swap
  "/Bajos/Bajo G  (acorde)-cm.wav"     // Pin 11 → Sol MAYOR      (UNA-1) swap
};

// ====================================================
// Motor de audio simple (1 voz para el test)
// ====================================================
AudioGeneratorWAV *wav = NULL;
AudioFileSourceSD *file = NULL;
AudioOutputI2S *out = NULL;

bool estadoMux3[16];
bool estadoPrev3[16];
unsigned long lastTime3[16];

int pinActivo = -1; // Cuál pin está sonando

const char* NOMBRE_ABRIR[12] = {
  "0  => MIB nota   (DOS-6)", "1  => MIB mayor  (DOS-5)",
  "2  => SIB nota   (DOS-4)", "3  => SIB mayor  (DOS-3)",
  "4  => FA nota    (DOS-2)", "5  => FA mayor   (DOS-1)",
  "6  => REB nota   (UNA-6)", "7  => REB mayor  (UNA-5)",
  "8  => FA nota    (UNA-4)", "9  => FA menor   (UNA-3)",
  "10 => DO nota    (UNA-2)", "11 => DO menor   (UNA-1)"
};
const char* NOMBRE_CERRAR[12] = {
  "0  => LAB nota   (DOS-6)", "1  => LAB mayor  (DOS-5)",
  "2  => MIB nota   (DOS-4)", "3  => MIB mayor  (DOS-3)",
  "4  => SIB nota   (DOS-2)", "5  => SIB mayor  (DOS-1)",
  "6  => REB nota   (UNA-6)", "7  => REB mayor  (UNA-5)",
  "8  => DO nota    (UNA-4)", "9  => DO mayor   (UNA-3)",
  "10 => SOL nota   (UNA-2)", "11 => SOL mayor  (UNA-1)"
};

bool fuelleAbriendo = true;
int valorAnteriorSlide = 0;

void tocarBajoTest(int pin) {
  if (pin < 0 || pin > 11) return;

  const char* ruta = fuelleAbriendo ? BAJOS_TEST[pin] : BAJOS_CERRANDO[pin];

  // Detener lo anterior
  if (wav && wav->isRunning()) wav->stop();
  if (file) { file->close(); delete file; file = NULL; }

  // Cargar nuevo
  file = new AudioFileSourceSD(ruta);
  if (!file->isOpen()) {
    Serial.print("❌ NO ENCONTRADO EN SD: ");
    Serial.println(ruta);
    delete file; file = NULL;
    return;
  }

  wav->begin(file, out);
  pinActivo = pin;

  // Imprimir info muy clara
  const char* dir = fuelleAbriendo ? "[ABRIENDO]" : "[CERRANDO]";
  const char* nombre = fuelleAbriendo ? NOMBRE_ABRIR[pin] : NOMBRE_CERRAR[pin];
  Serial.println("================================");
  Serial.print(dir);
  Serial.print(" PIN ");
  Serial.println(nombre);
  Serial.println("================================");
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);

  for (int i = 0; i < 4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);
  valorAnteriorSlide = analogRead(slidePin);

  for (int i = 0; i < 16; i++) {
    estadoMux3[i] = HIGH;
    estadoPrev3[i] = HIGH;
    lastTime3[i] = 0;
  }

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, SPI, 20000000)) {
    Serial.println("❌ SD no montó. Revisa cables.");
  } else {
    Serial.println("✅ SD lista en V-PRO Bus 2");
  }

  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetBuffers(8, 512);
  out->SetRate(22050);
  out->SetGain(0.5);
  
  wav = new AudioGeneratorWAV();

  Serial.println("================================================");
  Serial.println("🎸 TEST BAJOS ABRIENDO + CERRANDO");
  Serial.println("Mueve el slider para cambiar la direccion.");
  Serial.println("================================================");
}

void loop() {
  unsigned long now = millis();

  // Motor de audio
  if (wav && wav->isRunning()) {
    if (!wav->loop()) {
      wav->stop();
      if (file) { file->close(); delete file; file = NULL; }
      pinActivo = -1;
    }
  }

  // Leer slider del fuelle
  int lecturaSlide = analogRead(slidePin);
  static int vF = lecturaSlide;
  vF = (vF * 2 + lecturaSlide) / 3; // filtro suavizado
  int dif = vF - valorAnteriorSlide;
  if (abs(dif) > 15) {
    bool nuevoEstado = (dif < 0); // bajar = abrir
    if (nuevoEstado != fuelleAbriendo) {
      fuelleAbriendo = nuevoEstado;
      Serial.println(fuelleAbriendo ? ">>> FUELLE ABRIENDO <<<" : ">>> FUELLE CERRANDO <<<");
    }
    valorAnteriorSlide = vF;
  }

  // Escaneo SOLO MUX3 (Bajos)
  for (int i = 0; i < 16; i++) {
    for (int p = 0; p < 4; p++) digitalWrite(sPines[p], (i >> p) & 0x01);
    delayMicroseconds(40);
    bool s = digitalRead(sigMux3);

    if (s != estadoPrev3[i] && (now - lastTime3[i] > 25)) {
      estadoPrev3[i] = s;
      lastTime3[i] = now;

      if (s == LOW && i < 12) {
        // Botón presionado — tocar el sonido
        tocarBajoTest(i);
      } else if (s == HIGH && i == pinActivo) {
        // Botón soltado — detener
        if (wav && wav->isRunning()) {
          wav->stop();
          if (file) { file->close(); delete file; file = NULL; }
        }
        pinActivo = -1;
      }
    }
    estadoMux3[i] = s;
  }
}
