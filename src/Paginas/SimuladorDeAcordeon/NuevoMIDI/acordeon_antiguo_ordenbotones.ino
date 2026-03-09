// ====================================================
// ACORDEÓN JESUS GONZALEZ — HARDWARE COMPLETO (ESP32-S3)
// ====================================================

// --- 🔌 PINES ACTUALIZADOS PARA ESP32-S3 (Fila Superior) ---
const int sPines[] = {4, 5, 6, 7}; // Selección MUX (S0, S1, S2, S3)
const int sigMux1 = 15;            // SIG Mux 1 (Pitos Afuera -> Interfaz H1)
const int sigMux2 = 16;            // SIG Mux 2 (Pitos Medio -> Interfaz H2)
const int sigMux3 = 17; // SIG Mux 3 (Pitos Adentro/Bajos -> Interfaz BA)

const int pinTrig = 10; // Trig Sensor Ultrasónico
const int pinEcho = 11; // Echo Sensor Ultrasónico
const int slidePin = 9; // Pin analógico libre en la fila superior

// --- 🛡️ SISTEMA DE ESTADOS (BOTONES) ---
bool estadoM1[16], estadoM2[16], estadoM3[16];
unsigned long lastTimeM1[16], lastTimeM2[16], lastTimeM3[16];
const int DEBOUNCE_TIME = 15;

// --- 🦇 ESTADOS FUELLE ULTRASÓNICO ---
bool lastFuelleUS = false;
unsigned long ultimoFuelleUST = 0;

// --- 🎚️ ESTADOS FUELLE DESLIZADOR ---
int valorAnteriorSlide = 0;
const int UMBRAL_SLIDE = 15; // Sensibilidad para no enviar lecturas falsas
bool lastFuelleSlide = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Configurar Pines Mux
  for (int i = 0; i < 4; i++) {
    pinMode(sPines[i], OUTPUT);
    digitalWrite(sPines[i], LOW);
  }
  pinMode(sigMux1, INPUT_PULLUP);
  pinMode(sigMux2, INPUT_PULLUP);
  pinMode(sigMux3, INPUT_PULLUP);

  // Configurar Pines Sensores
  pinMode(pinTrig, OUTPUT);
  pinMode(pinEcho, INPUT);
  pinMode(slidePin, INPUT);

  // Inicializar estados de los 48 botones como NO PRESIONADOS (HIGH)
  for (int i = 0; i < 16; i++) {
    estadoM1[i] = estadoM2[i] = estadoM3[i] = HIGH;
    lastTimeM1[i] = lastTimeM2[i] = lastTimeM3[i] = 0;
  }

  valorAnteriorSlide = analogRead(slidePin);
}

void loop() {
  unsigned long now = millis();

  // ==========================================
  // 1. FUELLE: SENSOR ULTRASÓNICO (F_US)
  // ==========================================
  if (now - ultimoFuelleUST > 60) {
    digitalWrite(pinTrig, LOW);
    delayMicroseconds(2);
    digitalWrite(pinTrig, HIGH);
    delayMicroseconds(10);
    digitalWrite(pinTrig, LOW);
    long d = pulseIn(pinEcho, HIGH, 30000);
    int dist = d * 0.034 / 2;

    // Si la distancia es 0 (rebote fallido) o superior a 150, está ABRIENDO. Si
    // es < 150, está CERRANDO
    bool currentFuelleUS = (dist == 0 || dist > 150);
    if (currentFuelleUS != lastFuelleUS) {
      lastFuelleUS = currentFuelleUS;
      Serial.print("F_US,");
      Serial.println(lastFuelleUS ? "ABRIR" : "CERRAR");
    }
    ultimoFuelleUST = now;
  }

  // ==========================================
  // 2. FUELLE: DESLIZADOR (F_SL)
  // ==========================================
  int valorActualSlide = analogRead(slidePin);
  int deltaSlide = valorActualSlide - valorAnteriorSlide;

  if (abs(deltaSlide) > UMBRAL_SLIDE) {
    // Si la palanca sube, consideramos cerrar. Bajar es Abrir.
    bool currentFuelleSlide = (deltaSlide > 0) ? false : true;

    if (currentFuelleSlide != lastFuelleSlide) {
      lastFuelleSlide = currentFuelleSlide;
      Serial.print("F_SL,");
      Serial.println(lastFuelleSlide ? "ABRIR" : "CERRAR");
    }
    valorAnteriorSlide = valorActualSlide;
  }

  // ==========================================
  // 3. MATRIZ DE BOTONES (MUX 1, 2, 3)
  // ==========================================
  for (int i = 0; i < 16; i++) {
    digitalWrite(sPines[0], (i & 0x01));
    digitalWrite(sPines[1], (i >> 1) & 0x01);
    digitalWrite(sPines[2], (i >> 2) & 0x01);
    digitalWrite(sPines[3], (i >> 3) & 0x01);
    delayMicroseconds(40); // Estabilidad para el ESP32-S3

    bool s1 = digitalRead(sigMux1);
    bool s2 = digitalRead(sigMux2);
    bool s3 = digitalRead(sigMux3);
    unsigned long t = millis();

    // Enviar código tal cual lo espera React: H1,0,1 | H2,5,0 | BA,10,1
    if (s1 != estadoM1[i] && (t - lastTimeM1[i] > DEBOUNCE_TIME)) {
      Serial.print("H1,");
      Serial.print(i);
      Serial.print(",");
      Serial.println(s1 == LOW ? 1 : 0);
      estadoM1[i] = s1;
      lastTimeM1[i] = t;
    }
    if (s2 != estadoM2[i] && (t - lastTimeM2[i] > DEBOUNCE_TIME)) {
      Serial.print("H2,");
      Serial.print(i);
      Serial.print(",");
      Serial.println(s2 == LOW ? 1 : 0);
      estadoM2[i] = s2;
      lastTimeM2[i] = t;
    }
    if (s3 != estadoM3[i] && (t - lastTimeM3[i] > DEBOUNCE_TIME)) {
      Serial.print("BA,");
      Serial.print(i);
      Serial.print(",");
      Serial.println(s3 == LOW ? 1 : 0);
      estadoM3[i] = s3;
      lastTimeM3[i] = t;
    }
  }
}
