#include <espnow.h>
#include <ESP8266WiFi.h>

#define LED_PIN LED_BUILTIN

int receivedBlinkCount = 0;

void onDataRecv(uint8_t *mac, uint8_t *incomingData, uint8_t len) {
  if (len == sizeof(receivedBlinkCount)) {
    memcpy(&receivedBlinkCount, incomingData, sizeof(receivedBlinkCount));
    Serial.print("Received Blink Count: ");
    Serial.println(receivedBlinkCount);

    for (int i = 0; i < receivedBlinkCount; i++) {
      digitalWrite(LED_PIN, LOW); 
      delay(500);
      digitalWrite(LED_PIN, HIGH); 
      delay(500);
    }
  } else {
    Serial.println("Received data size mismatch");
  }
}

void setup() {
  Serial.begin(500000);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != 0) {
    Serial.println("ESP-NOW initialization failed");
    return;
  }
  Serial.println("ESP-NOW initialized");

  esp_now_register_recv_cb(onDataRecv);

  pinMode(LED_PrIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
}

void loop() {}