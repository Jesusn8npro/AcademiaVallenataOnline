// ====================================================
// V-PRO SCREEN SIGNAL TEST — SOLUCIÓN PANTALLA BLANCA
// OBJETIVO: Forzar señal de video en pines 8, 12, 13
// ====================================================

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

// ⚙️ PINES V-PRO (RE-VERIFICADOS)
#define TFT_CS   2
#define TFT_DC   3
#define TFT_RST  1
#define TFT_LED  21 // Encendido

// SPI Bus 1 (Cables soldados)
#define TFT_SCK  8
#define TFT_MISO 12
#define TFT_MOSI 13

// Forzamos el objeto con los pines directos
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_MOSI, TFT_SCK, TFT_RST, TFT_MISO);

void setup() {
  Serial.begin(115200);

  // 1. LUZ DE FONDO (Si está blanca, esto ya funciona, pero lo aseguramos)
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);

  Serial.println("Iniciando pantalla...");

  // 2. INICIAR HARDWARE
  // El S3 necesita que le digamos explícitamente qué pines usar
  tft.begin();
  tft.setRotation(1); // Landscape
  
  // 3. LIMPIAR PANTALLA
  // Si deja de estar blanca y se pone negra, ¡HEMOS GANADO!
  tft.fillScreen(ILI9341_BLACK);

  // 4. DIBUJAR ALGO FUERTE
  tft.drawRect(0, 0, 320, 240, ILI9341_RED);
  tft.setCursor(50, 110);
  tft.setTextColor(ILI9341_GREEN);
  tft.setTextSize(3);
  tft.println("SEÑAL V-PRO OK!");
  
  Serial.println("Si la pantalla no es blanca, la señal llego.");
}

void loop() {
  // Parpadeo de un círculo para saber que el procesador no se trabó
  tft.fillCircle(160, 180, 20, ILI9341_BLUE);
  delay(500);
  tft.fillCircle(160, 180, 20, ILI9341_YELLOW);
  delay(500);
}
