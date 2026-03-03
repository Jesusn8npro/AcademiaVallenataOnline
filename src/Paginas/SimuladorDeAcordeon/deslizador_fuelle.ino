// ====================================================
// ACORDEÓN JESUS GONZALEZ — DESLIZADOR COMO FUELLE
// Archivo: deslizador_fuelle.ino
// ====================================================

const int sPines[] = {32, 33, 25, 26}; 
const int sigMux1 = 13; 
const int sigMux2 = 14; 
const int sigMux3 = 27;

// --- 🎚️ CONFIGURACIÓN DEL DESLIZADOR ---
const int slidePin = 34; 
int valorAnterior = 0;
const int UMBRAL_MOVIMIENTO = 10; // 🚀 Más sensible: Detecta movimientos más pequeños
bool lastFuelle = false; // false = CERRAR, true = ABRIR

// --- 🛡️ SISTEMA DE ESTADOS Y DEBOUNCE ---
bool estadoM1[16], estadoM2[16], estadoM3[16];
unsigned long lastTimeM1[16], lastTimeM2[16], lastTimeM3[16];
const int DEBOUNCE_TIME = 15;

void setup() {
  Serial.begin(115200); 
  
  for(int i=0; i<4; i++) pinMode(sPines[i], OUTPUT);
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);
  pinMode(slidePin, INPUT);

  for(int i=0; i<16; i++) {
    estadoM1[i] = estadoM2[i] = estadoM3[i] = HIGH;
    lastTimeM1[i] = lastTimeM2[i] = lastTimeM3[i] = 0;
  }
  
  valorAnterior = analogRead(slidePin);
}

void selectMux(int channel) {
  for (int i = 0; i < 4; i++) {
    digitalWrite(sPines[i], (channel >> i) & 0x01);
  }
}

void reportar(String tipo, int n, int st) {
  Serial.print(tipo); Serial.print(",");
  Serial.print(n); Serial.print(",");
  Serial.println(st);
}

void loop() {
  // 1. --- 💨 LÓGICA DE MOVIMIENTO (DESLIZADOR) ---
  int valorActual = analogRead(slidePin);
  int delta = valorActual - valorAnterior;

  // Si el movimiento es significativo
  if (abs(delta) > UMBRAL_MOVIMIENTO) {
    bool currentFuelle;
    
    // 🚩 LÓGICA: Hacia ARRIBA (valor sube) = CERRAR
    // Hacia ATRÁS (valor baja) = ABRIR
    if (delta > 0) {
      currentFuelle = false; // CERRAR
    } else {
      currentFuelle = true;  // ABRIR
    }

    if (currentFuelle != lastFuelle) {
      Serial.print("FUELLE,");
      Serial.println(currentFuelle ? "ABRIR" : "CERRAR");
      lastFuelle = currentFuelle;
    }
    
    valorAnterior = valorActual;
  }

  // 2. --- 🎹 MATRIZ DE BOTONES ---
  for (int i = 0; i < 16; i++) {
    selectMux(i);
    delayMicroseconds(10); 

    bool s1 = digitalRead(sigMux1);
    bool s2 = digitalRead(sigMux2);
    bool s3 = digitalRead(sigMux3);

    unsigned long t = millis();

    if (s1 != estadoM1[i] && (t - lastTimeM1[i] > DEBOUNCE_TIME)) {
      reportar("H1", i, (s1 == LOW ? 1 : 0));
      estadoM1[i] = s1;
      lastTimeM1[i] = t;
    }
    if (s2 != estadoM2[i] && (t - lastTimeM2[i] > DEBOUNCE_TIME)) {
      reportar("H2", i, (s2 == LOW ? 1 : 0));
      estadoM2[i] = s2;
      lastTimeM2[i] = t;
    }
    if (s3 != estadoM3[i] && (t - lastTimeM3[i] > DEBOUNCE_TIME)) {
      reportar("BA", i, (s3 == LOW ? 1 : 0));
      estadoM3[i] = s3;
      lastTimeM3[i] = t;
    }
  }
  
  delay(1); 
}
