// ====================================================
// ACORDEÓN JESUS GONZALEZ — OLED KEYMAP + NOTES
// Archivo: acordeon_esp32.ino
// ====================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

const int sPines[] = {32, 33, 25, 26}; 
const int sigMux1 = 13; 
const int sigMux2 = 14; 
const int sigMux3 = 27;
const int pinTrig = 5;  
const int pinEcho = 18; 

// --- 🛡️ SISTEMA DE ESTADOS ---
bool estadoM1[16], estadoM2[16], estadoM3[16];
unsigned long lastTimeM1[16], lastTimeM2[16], lastTimeM3[16];
const int DEBOUNCE_TIME = 15; 
bool lastFuelle = false; // false = CER, true = ABR

// --- 🎹 MAPEO DE NOTAS (BESAS - 5 LETRAS) ---
// Simplificado para la pantalla
const char* notas1H[] = {"Reb","Sol","Sib","Re","Mi","Sol","Sib","Re","Mi","Sol"};
const char* notas1E[] = {"Si","Fa","La","Do","Fa","La","Do","Fa","La","Do"};
const char* notas2H[] = {"Solb","La","Do","Mib","Sol","La","Do","Mib","Sol","La","Do"};
const char* notas2E[] = {"Mi","Fa","Sib","Re","Fa","Sib","Re","Fa","Sib","Re","Fa"};
const char* notas3H[] = {"Si","Re","Fa","Lab","Do","Re","Fa","Lab","Do","Re"};
const char* notas3E[] = {"Reb","Sib","Mib","Sol","Sib","Mib","Sol","Sib","Mib","Sol"};

String ultimaNota = "---";
int ultimoMux = 0;
int ultimoIndice = -1;

void setup() {
  Serial.begin(115200); 
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) for(;;);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(30,25);
  display.println("INICIANDO...");
  display.display();
  delay(1000);

  for(int i=0; i<4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP); pinMode(sigMux2, INPUT_PULLUP); pinMode(sigMux3, INPUT_PULLUP);
  pinMode(pinTrig, OUTPUT); pinMode(pinEcho, INPUT);

  for(int i=0; i<16; i++) {
    estadoM1[i]=estadoM2[i]=estadoM3[i]=HIGH;
    lastTimeM1[i]=lastTimeM2[i]=lastTimeM3[i]=0;
  }
}

void selectMux(int channel) {
  for (int i = 0; i < 4; i++) digitalWrite(sPines[i], (channel >> i) & 0x01);
}

void reportar(String tipo, int n, int st) {
  Serial.print(tipo); Serial.print(","); Serial.print(n); Serial.print(","); Serial.println(st);
  if (st == 1) { 
    ultimoMux = (tipo == "H1") ? 1 : (tipo == "H2" ? 2 : 3);
    ultimoIndice = n;
    
    // Asignar nombre de nota basado en fuelle y botón
    if (ultimoMux == 1 && n < 10) ultimaNota = lastFuelle ? notas1H[n] : notas1E[n];
    else if (ultimoMux == 2 && n < 11) ultimaNota = lastFuelle ? notas2H[n] : notas2E[n];
    else if (ultimoMux == 3 && n < 10) ultimaNota = lastFuelle ? notas3H[n] : notas3E[n];
    else if (tipo == "BA") ultimaNota = "BAJO";
    else ultimaNota = "???";
  }
}

void dibujarTeclado() {
  display.clearDisplay();
  
  // Título e Info de Aire
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.print(lastFuelle ? "HALAR" : "EMPUJAR");
  
  // Dibujar Pitos (3 hileras en zigzag estilo Hohner)
  // Hilera 1 (Afuera): 10 botones
  // Hilera 2 (Medio): 11 botones (desplazada hacia abajo)
  // Hilera 3 (Adentro): 10 botones
  
  int xBase = 75;
  int yBase = 8;
  int radio = 2;
  int espacioY = 5;
  int espacioX = 14;

  for(int f=0; f<3; f++) {
    int x = xBase + (f * espacioX);
    int numBotones = (f == 1) ? 11 : 10;
    int offsetV = (f == 1) ? 3 : 0; // Desplazamiento para el zigzag del medio

    for(int b=0; b<numBotones; b++) {
      int y = yBase + (b * espacioY) + offsetV;
      
      // Si este es el botón que se está tocando (Mux f+1 e Índice b)
      if (ultimoMux == (f+1) && ultimoIndice == b) {
        display.fillCircle(x, y, radio + 1, WHITE); // Resaltado activo
      } else {
        display.drawCircle(x, y, radio, WHITE); // Inactivo
      }
    }
  }

  // --- SECCIÓN DE NOTA GRANDE ---
  display.setTextSize(1);
  display.setCursor(5, 25);
  display.print("NOTA:");
  
  display.setTextSize(2);
  display.setCursor(5, 38);
  display.print(ultimaNota);

  // Vúmetro de aire pequeño abajo
  int vumetro = map(constrain(ultimoIndice, 0, 15), 0, 15, 0, 60); // Opcional: mostrar algo dinámico
  display.drawFastHLine(5, 60, 60, WHITE);
  
  display.display();
}

bool tipoMux3EsBajo(int n) { return n >= 0; } // Asumimos Mux 3 para Bajos en este prototipo

void loop() {
  unsigned long now = millis();
  
  // FUELLE
  static unsigned long ultimoFuelleT = 0;
  if (now - ultimoFuelleT > 60) {
    digitalWrite(pinTrig, LOW); delayMicroseconds(2);
    digitalWrite(pinTrig, HIGH); delayMicroseconds(10);
    digitalWrite(pinTrig, LOW);
    long d = pulseIn(pinEcho, HIGH, 7100);
    int dist = d * 0.034 / 2;
    bool currentFuelle = (dist == 0 || dist > 20); // Simulación simple
    if (currentFuelle != lastFuelle) {
      lastFuelle = currentFuelle;
      Serial.print("FUELLE,"); Serial.println(lastFuelle ? "ABRIR" : "CERRAR");
    }
    ultimoFuelleT = now;
  }

  // BOTONES
  for (int i = 0; i < 16; i++) {
    selectMux(i); delayMicroseconds(5);
    bool s1 = digitalRead(sigMux1), s2 = digitalRead(sigMux2), s3 = digitalRead(sigMux3);
    unsigned long t = millis();
    if (s1 != estadoM1[i] && (t - lastTimeM1[i] > DEBOUNCE_TIME)) { reportar("H1", i, (s1 == LOW ? 1 : 0)); estadoM1[i] = s1; lastTimeM1[i] = t; }
    if (s2 != estadoM2[i] && (t - lastTimeM2[i] > DEBOUNCE_TIME)) { reportar("H2", i, (s2 == LOW ? 1 : 0)); estadoM2[i] = s2; lastTimeM2[i] = t; }
    if (s3 != estadoM3[i] && (t - lastTimeM3[i] > DEBOUNCE_TIME)) { reportar("BA", i, (s3 == LOW ? 1 : 0)); estadoM3[i] = s3; lastTimeM3[i] = t; }
  }

  static unsigned long ultimaP = 0;
  if (now - ultimaP > 100) { dibujarTeclado(); ultimaP = now; }
}
