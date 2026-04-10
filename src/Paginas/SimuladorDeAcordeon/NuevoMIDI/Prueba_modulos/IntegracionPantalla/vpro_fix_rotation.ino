// ====================================================
// V-PRO TOUCH — MODO VERTICAL CORRECTO (ROTACION 2)
// OBJETIVO: Poner la pantalla al derecho y calbrar ejes
// ====================================================

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>

#define TFT_CS    2
#define TFT_DC    3
#define TFT_RST   1
#define TFT_LED   21
#define TOUCH_CS  47
#define VPRO_SCK   8
#define VPRO_MISO  12
#define VPRO_MOSI  13

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);

void setup() {
  Serial.begin(115200);
  pinMode(TFT_LED, OUTPUT);
  digitalWrite(TFT_LED, HIGH);

  SPI.begin(VPRO_SCK, VPRO_MISO, VPRO_MOSI, -1);
  tft.begin();
  
  // 📐 GIRAMOS 180 GRADOS PARA QUE NO QUEDE BOCA ABAJO
  tft.setRotation(2); 
  
  touch.begin(SPI);
  touch.setRotation(2); // Sincronizado

  tft.fillScreen(ILI9341_BLACK);
  
  // Guías Verticales
  tft.drawFastVLine(120, 0, 320, ILI9341_BLUE); 
  tft.drawFastHLine(0, 160, 240, ILI9341_BLUE); 
  
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(20, 20);
  tft.println("V-PRO VERTICAL OK");
  
  tft.setTextSize(1);
  tft.setCursor(20, 50); tft.println("ARRIBA IZQ");
  tft.setCursor(150, 50); tft.println("ARRIBA DER");
  tft.setCursor(20, 300); tft.println("ABAJO IZQ");
  tft.setCursor(150, 300); tft.println("ABAJO DER");
}

void loop() {
  if (touch.touched()) {
    TS_Point pt = touch.getPoint();

    // 🔬 RE-CALIBRACION SEGUN TU REPORTE:
    // Al usar Rotation 2, invertimos los rangos para que no haya espejo.
    int x = map(pt.x, 3800, 300, 0, 240); 
    int y = map(pt.y, 3700, 200, 0, 320); 

    // Pintar para verificar
    tft.fillCircle(x, y, 3, ILI9341_WHITE);

    Serial.print("X: "); Serial.print(x);
    Serial.print(" | Y: "); Serial.println(y);
  }
}
