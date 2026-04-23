#include "AudioFileSourceSD.h"
#include "AudioGeneratorWAV.h"
#include "AudioOutputI2S.h"
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <WiFi.h>

// ==========================================
// 🔌 PINES SD Y DAC (ESP32-S3)
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
const int sigMux1 = 15; // H1 / H2a
const int sigMux2 = 16; // H3 / H2b
const int sigMux3 = 17; // Bajos / Extra
const int slidePin = 9;
const int pinTrig = 10; // Trig Sensor Ultrasónico
const int pinEcho = 11; // Echo Sensor Ultrasónico

// ==========================================
// 🎵 ESTRUCTURA Y MAPAS MUSICALES (Original F-Bb-Eb)
// ==========================================
struct ArchivoAudio {
  const char *ruta;
  float multiplicadorPitch;
};

// --- FILA 1 (Afuera) ---
const ArchivoAudio F1_Empujar[16] = {{"/Brillante/Bb-3-cm.wav", 1.0595},
                                     {"/Brillante/Bb-3-cm.wav", 0.7492},
                                     {"/Brillante/Bb-3-cm.wav", 0.9439},
                                     {"/Brillante/C-4-cm.wav", 1.0000},
                                     {"/Brillante/F-4-cm.wav", 1.0000},
                                     {"/Brillante/A-4-cm.wav", 1.0000},
                                     {"/Brillante/C-5-cm.wav", 1.0000},
                                     {"/Brillante/F-5-cm.wav", 1.0000},
                                     {"/Brillante/A-5-cm.wav", 1.0000},
                                     {"/Brillante/C-6-cm.wav", 1.0000},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0}};
const ArchivoAudio F1_Halar[16] = {{"/Brillante/C-4-cm.wav", 1.0595},
                                   {"/Brillante/Bb-3-cm.wav", 0.8409},
                                   {"/Brillante/Bb-3-cm.wav", 1.0000},
                                   {"/Brillante/D-4-cm.wav", 1.0000},
                                   {"/Brillante/E-4-cm.wav", 1.0000},
                                   {"/Brillante/G-4-cm.wav", 1.0000},
                                   {"/Brillante/Bb-4-cm.wav", 1.0000},
                                   {"/Brillante/D-5-cm.wav", 1.0000},
                                   {"/Brillante/E-5-cm.wav", 1.0000},
                                   {"/Brillante/G-5-cm.wav", 1.0000},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0}};

// --- FILA 2 (Medio) ---
const ArchivoAudio F2_Empujar[16] = {{"/Brillante/E-4-cm.wav", 1.0000},
                                     {"/Brillante/Bb-3-cm.wav", 0.7492},
                                     {"/Brillante/Bb-3-cm.wav", 1.0000},
                                     {"/Brillante/D-4-cm.wav", 1.0000},
                                     {"/Brillante/F-4-cm.wav", 1.0000},
                                     {"/Brillante/Bb-4-cm.wav", 1.0000},
                                     {"/Brillante/D-5-cm.wav", 1.0000},
                                     {"/Brillante/F-5-cm.wav", 1.0000},
                                     {"/Brillante/Bb-5-cm.wav", 1.0000},
                                     {"/Brillante/D-6-cm.wav", 1.0000},
                                     {"/Brillante/F-6-cm.wav", 1.0000},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0}};
const ArchivoAudio F2_Halar[16] = {{"/Brillante/Gb-4-cm.wav", 1.0000},
                                   {"/Brillante/Bb-3-cm.wav", 0.9439},
                                   {"/Brillante/C-4-cm.wav", 1.0000},
                                   {"/Brillante/Eb-4-cm.wav", 1.0000},
                                   {"/Brillante/G-4-cm.wav", 1.0000},
                                   {"/Brillante/A-4-cm.wav", 1.0000},
                                   {"/Brillante/C-5-cm.wav", 1.0000},
                                   {"/Brillante/Eb-5-cm.wav", 1.0000},
                                   {"/Brillante/G-5-cm.wav", 1.0000},
                                   {"/Brillante/A-5-cm.wav", 1.0000},
                                   {"/Brillante/C-6-cm.wav", 1.0000},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0}};

// --- FILA 3 (Adentro) ---
const ArchivoAudio F3_Empujar[16] = {{"/Brillante/Db-5-cm.wav", 1.0000},
                                     {"/Brillante/Bb-3-cm.wav", 1.0000},
                                     {"/Brillante/Eb-4-cm.wav", 1.0000},
                                     {"/Brillante/G-4-cm.wav", 1.0000},
                                     {"/Brillante/Bb-4-cm.wav", 1.0000},
                                     {"/Brillante/Eb-5-cm.wav", 1.0000},
                                     {"/Brillante/G-5-cm.wav", 1.0000},
                                     {"/Brillante/Bb-5-cm.wav", 1.0000},
                                     {"/Brillante/Eb-6-cm.wav", 1.0000},
                                     {"/Brillante/G-6-cm.wav", 1.0000},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0},
                                     {"", 1.0}};
const ArchivoAudio F3_Halar[16] = {{"/Brillante/B-4-cm.wav", 1.0000},
                                   {"/Brillante/D-4-cm.wav", 1.0000},
                                   {"/Brillante/F-4-cm.wav", 1.0000},
                                   {"/Brillante/Ab-4-cm.wav", 1.0000},
                                   {"/Brillante/C-5-cm.wav", 1.0000},
                                   {"/Brillante/D-5-cm.wav", 1.0000},
                                   {"/Brillante/F-5-cm.wav", 1.0000},
                                   {"/Brillante/Ab-5-cm.wav", 1.0000},
                                   {"/Brillante/C-6-cm.wav", 1.0000},
                                   {"/Brillante/D-6-cm.wav", 1.0000},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0},
                                   {"", 1.0}};

// --- BAJOS ---
const ArchivoAudio B1_Empujar[6] = {
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoEb-cm.wav", 1.0},
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoG-cm.wav", 1.0},
    {"/Bajos/BajoAbacorde-cm.wav", 1.0}, {"/Bajos/BajoAb-cm.wav", 1.0}};
const ArchivoAudio B1_Halar[6] = {
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoG-cm.wav", 1.0},
    {"/Bajos/BajoCmacorde-cm.wav", 1.0}, {"/Bajos/BajoC-cm.wav", 1.0},
    {"/Bajos/BajoAbacorde-cm.wav", 1.0}, {"/Bajos/BajoAb-cm.wav", 1.0}};
const ArchivoAudio B2_Empujar[6] = {
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoF-cm.wav", 1.0},
    {"/Bajos/BajoBbacorde-cm.wav", 1.0}, {"/Bajos/BajoBb-cm.wav", 1.0},
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoEb-cm.wav", 1.0}};
const ArchivoAudio B2_Halar[6] = {
    {"/Bajos/BajoCacorde-cm.wav", 1.0},  {"/Bajos/BajoC-cm.wav", 1.0},
    {"/Bajos/BajoEbacorde-cm.wav", 1.0}, {"/Bajos/BajoF-cm.wav", 1.0},
    {"/Bajos/BajoBbacorde-cm.wav", 1.0}, {"/Bajos/BajoBb-cm.wav", 1.0}};

// ==========================================
// 🧠 ESTADOS GLOBALES
// ==========================================
AudioGeneratorWAV *wav = NULL;
AudioFileSourceSD *file = NULL;
AudioOutputI2S *out = NULL;

String rutaActual = "";
float pitchActual = 0;
int ultimaHL = 0, ultimaBL = 0, ultimaNB = 0;
bool ultimaDirGlobal = true;

bool estadoM1[16], estadoM2[16], estadoM3[16];
unsigned long lastTime[3][16];
int valorAnteriorSlide = 0;
bool fuelleAbriendo = true;
bool lastFuelleSlide = false;

bool lastFuelleUS = false;
unsigned long ultimoFuelleUST = 0;

void detenerAudio() {
  if (wav && wav->isRunning()) {
    wav->stop();
    rutaActual = "";
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_OFF);

  for (int i = 0; i < 4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);
  pinMode(pinTrig, OUTPUT);
  pinMode(pinEcho, INPUT);

  for (int i = 0; i < 16; i++) {
    estadoM1[i] = estadoM2[i] = estadoM3[i] = HIGH;
    lastTime[0][i] = lastTime[1][i] = lastTime[2][i] = 0;
  }

  valorAnteriorSlide = analogRead(slidePin);
  // 🚀 INICIALIZACIÓN BUS SPI 2 (PARA LA SD)
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  
  if (!SD.begin(SD_CS, SPI, 16000000)) {
    Serial.println("❌ ERROR: No SD en pines 35,36,37");
    // No bloqueamos para permitir modo USB-MIDI
  } else {
    Serial.println("✅ SD V-PRO LISTA EN BUS 2");
  }

  out = new AudioOutputI2S();
  out->SetPinout(I2S_BCK, I2S_WS, I2S_DIN);
  out->SetGain(1.0);
  wav = new AudioGeneratorWAV();
  
  Serial.println("✅ ACORDEÓN V-PRO CONECTADO AL SIMULADOR");
}

void tocarNota(const char *ruta, float pitch) {
  if (!ruta || String(ruta) == "" || String(ruta) == "null")
    return;
  if (wav && wav->isRunning() && rutaActual == String(ruta)) {
    if (abs(pitchActual - pitch) > 0.01) {
      out->SetRate(44100 * pitch);
      pitchActual = pitch;
    }
    return;
  }
  if (wav && wav->isRunning())
    wav->stop();
  if (file) {
    file->close();
    delete file;
    file = NULL;
  }

  file = new AudioFileSourceSD(ruta);
  if (!file->isOpen()) {
    Serial.print("❌ NO:");
    Serial.println(ruta);
    return;
  }
  wav->begin(file, out);
  out->SetRate(44100 * pitch);
  rutaActual = String(ruta);
  pitchActual = pitch;
}

void tocarSonidoLogico(int hileraLogica, int botonIndice) {
  if (botonIndice < 1 || botonIndice > 16)
    return;
  int idx = botonIndice - 1;
  const ArchivoAudio *a = NULL;

  if (hileraLogica == 1)
    a = fuelleAbriendo ? &F1_Halar[idx] : &F1_Empujar[idx];
  else if (hileraLogica == 2)
    a = fuelleAbriendo ? &F2_Halar[idx] : &F2_Empujar[idx];
  else if (hileraLogica == 3)
    a = fuelleAbriendo ? &F3_Halar[idx] : &F3_Empujar[idx];

  if (a)
    tocarNota(a->ruta, a->multiplicadorPitch);
}

void tocarBajo(int note) {
  const ArchivoAudio *a = NULL;
  if (note >= 30 && note <= 35) {
    int idx = note - 30;
    a = fuelleAbriendo ? &B2_Halar[idx] : &B2_Empujar[idx];
  } else {
    int idx = -1;
    if (note == 36)
      idx = 0;
    else if (note == 38)
      idx = 1;
    else if (note == 39)
      idx = 2;
    else if (note == 40)
      idx = 3;
    else if (note == 37)
      idx = 4;
    else if (note == 41)
      idx = 5;
    if (idx != -1)
      a = fuelleAbriendo ? &B1_Halar[idx] : &B1_Empujar[idx];
  }
  if (a)
    tocarNota(a->ruta, a->multiplicadorPitch);
}

void loop() {
  if (wav && wav->isRunning()) {
    if (!wav->loop()) {
      String r = rutaActual;
      float p = pitchActual;
      detenerAudio();
      tocarNota(r.c_str(), p);
    }
  }

  unsigned long t = millis();

  // --- FUELLE: ULTRASÓNICO (F_US) ---
  if (t - ultimoFuelleUST > 60) {
    digitalWrite(pinTrig, LOW);
    delayMicroseconds(2);
    digitalWrite(pinTrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(pinTrig, LOW);
    long d_us = pulseIn(pinEcho, HIGH, 30000);
    int dist = d_us * 0.034 / 2;

    bool currentFuelleUS = (dist == 0 || dist > 150);
    if (currentFuelleUS != lastFuelleUS) {
      lastFuelleUS = currentFuelleUS;
      fuelleAbriendo = currentFuelleUS; // Sincroniza estado para SD local
      Serial.print("F_US,");
      Serial.println(lastFuelleUS ? "ABRIR" : "CERRAR");
    }
    ultimoFuelleUST = t;
  }

  // --- FUELLE: DESLIZADOR (F_SL) ---
  int lecturaRaw = analogRead(slidePin);
  static int vFiltro = lecturaRaw;
  vFiltro = (vFiltro * 2 + lecturaRaw) / 3;
  int d = vFiltro - valorAnteriorSlide;
  if (abs(d) > 15) { // Subimos umbral a 15 para estabilidad
    // Si la palanca sube, consideramos cerrar. Bajar es Abrir.
    bool currentFuelleSlide = (d < 0);
    if (currentFuelleSlide != lastFuelleSlide) {
      lastFuelleSlide = currentFuelleSlide;
      fuelleAbriendo = currentFuelleSlide; // Sincroniza estado para SD local
      Serial.print("F_SL,");
      Serial.println(lastFuelleSlide ? "ABRIR" : "CERRAR");
    }
    valorAnteriorSlide = vFiltro;
  }

  // --- ESCANEO MUX ---
  for (int i = 0; i < 16; i++) {
    for (int p = 0; p < 4; p++)
      digitalWrite(sPines[p], (i >> p) & 0x01);
    delayMicroseconds(40);
    bool s1 = digitalRead(sigMux1), s2 = digitalRead(sigMux2),
         s3 = digitalRead(sigMux3);

    if (s1 != estadoM1[i] && (t - lastTime[0][i] > 20)) {
      estadoM1[i] = s1;
      lastTime[0][i] = t;
      Serial.print("H1,");
      Serial.print(i);
      Serial.println(s1 == LOW ? ",1" : ",0");
    }
    if (s2 != estadoM2[i] && (t - lastTime[1][i] > 20)) {
      estadoM2[i] = s2;
      lastTime[1][i] = t;
      Serial.print("H2,");
      Serial.print(i);
      Serial.println(s2 == LOW ? ",1" : ",0");
    }
    if (s3 != estadoM3[i] && (t - lastTime[2][i] > 20)) {
      estadoM3[i] = s3;
      lastTime[2][i] = t;
      Serial.print("BA,");
      Serial.print(i);
      Serial.println(s3 == LOW ? ",1" : ",0");
    }
  }

  // --- DECISOR (Prioridad Musical) ---
  int HileraLogica = 0, BotonLogico = 0, NotaBajo = 0;
  bool encontrado = false;

  for (int i = 6; i < 16; i++)
    if (estadoM1[i] == LOW) {
      HileraLogica = 1;
      BotonLogico = i - 5;
      encontrado = true;
      break;
    }
  if (!encontrado) {
    for (int i = 0; i < 6; i++)
      if (estadoM1[i] == LOW) {
        HileraLogica = 2;
        BotonLogico = 6 - i;
        encontrado = true;
        break;
      }
    if (!encontrado)
      for (int i = 11; i < 16; i++)
        if (estadoM2[i] == LOW) {
          HileraLogica = 2;
          BotonLogico = 22 - i;
          encontrado = true;
          break;
        }
  }
  if (!encontrado) {
    for (int i = 0; i < 11; i++)
      if (estadoM2[i] == LOW) {
        HileraLogica = 3;
        BotonLogico = 11 - i;
        encontrado = true;
        break;
      }
    if (!encontrado && estadoM3[12] == LOW) {
      HileraLogica = 3;
      BotonLogico = 11;
      encontrado = true;
    }
  }
  if (!encontrado) {
    for (int i = 0; i < 12; i++)
      if (estadoM3[i] == LOW) {
        NotaBajo = 30 + i;
        encontrado = true;
        break;
      }
  }

  if (HileraLogica != ultimaHL || BotonLogico != ultimaBL ||
      NotaBajo != ultimaNB || fuelleAbriendo != ultimaDirGlobal) {
    ultimaHL = HileraLogica;
    ultimaBL = BotonLogico;
    ultimaNB = NotaBajo;
    ultimaDirGlobal = fuelleAbriendo;
    if (HileraLogica != 0)
      tocarSonidoLogico(HileraLogica, BotonLogico);
    else if (NotaBajo != 0)
      tocarBajo(NotaBajo);
    else
      detenerAudio();
  }
}