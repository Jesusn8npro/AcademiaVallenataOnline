#include <Arduino.h>
#include <driver/i2s.h>
#include <math.h>

// ==========================================
// PRUEBA DE AUDIO "PITAZO" PARA ESP32-S3 + PCM5102A
// ==========================================

// --- PINES PARA EL I2S ESP32-S3 (Asegúrate de conectarlos así) ---
#define I2S_BCLK       12  // A conectar al pin BCK del módulo PCM5102A
#define I2S_LRC        13  // A conectar al pin LCK (o WSEL) del PCM5102A
#define I2S_DOUT       14  // A conectar al pin DIN del PCM5102A

// Frecuencia y Volumen
#define SAMPLE_RATE     44100
#define FREQUENCY       440.0 // 440 Hz (Nota LA - Puedes cambiarlo)
#define AMPLITUDE       10000 // Volumen (max ~32000, no lo pongas al maximo aun)

float phase = 0.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("🎶 Iniciando prueba de DAC PCM5102A...");

  // Configuración del protocolo I2S para enviar los datos de audio
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = true
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_LRC,
    .data_out_num = I2S_DOUT,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  // Instalar driver y configurar
  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM_0, &pin_config);
  i2s_set_clk(I2S_NUM_0, SAMPLE_RATE, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_STEREO);

  Serial.println("✅ I2S Configurado. Deberías estar escuchando un pitazo (Nota LA).");
}

void loop() {
  size_t bytes_written;
  int16_t samples[64]; // 32 samples estéreo (32 izquierdo, 32 derecho)
  
  float phaseIncrement = (2.0f * PI * FREQUENCY) / SAMPLE_RATE;

  // Generamos una onda senoidal matemáticamente para que el DAC la convierta en sonido
  for (int i = 0; i < 32; i++) {
    int16_t sample = (int16_t)(AMPLITUDE * sin(phase));
    samples[i*2] = sample;     // Canal Izquierdo
    samples[i*2 + 1] = sample; // Canal Derecho
    
    phase += phaseIncrement;
    if (phase >= 2.0f * PI) {
      phase -= 2.0f * PI;
    }
  }

  // Enviamos buffer de audio al PCM5102A
  i2s_write(I2S_NUM_0, samples, sizeof(samples), &bytes_written, portMAX_DELAY);
}
