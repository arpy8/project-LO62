#include "KalmanFilter.h"
#include <esp_now.h>
#include <WiFi.h>

const int sensorPinRing = 34;
const int sensorPinThumb = 27;
  
const int thresholdRing = 1500;
const int thresholdThumb = 1200;

KalmanFilter kfRing(0.1, 1.0);
KalmanFilter kfThumb(0.1, 1.0);

bool isEngineOn = false;
unsigned long lastThumbToggleTime = 0;
const unsigned long debounceDelay = 1000;

uint8_t slaveAddress[] = {0xF0, 0x24, 0xF9, 0x45, 0x7B, 0x20};
int mappedValueRing = 0;

void onDataSent(const uint8_t *macAddr, esp_now_send_status_t status) {
  Serial.print(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_send_cb(onDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, slaveAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }
}

void toggleEngine() {
  isEngineOn = !isEngineOn;
  Serial.println("Engine On: " + String(isEngineOn) + String(","));
}

void loop() {
  int rawValueRing = analogRead(sensorPinRing);
  int rawValueThumb = analogRead(sensorPinThumb);

  float filteredValueRing = kfRing.update(rawValueRing);
  float filteredValueThumb = kfThumb.update(rawValueThumb);

  mappedValueRing = map(filteredValueRing, 0, 4095, 0, 2000);
  mappedValueRing = 2000 - constrain(mappedValueRing, 0, 2000);

  unsigned long currentMillis = millis();
  if (filteredValueThumb < thresholdThumb && (currentMillis - lastThumbToggleTime > debounceDelay)) {
    // toggleEngine();  
    // lastThumbToggleTime = currentMillis;
  }

  if (mappedValueRing > thresholdRing) {
  // if (isEngineOn && mappedValueRing > thresholdRing) {
      esp_err_t result = esp_now_send(slaveAddress, (uint8_t *)&mappedValueRing, sizeof(mappedValueRing));
      Serial.print("Sending: ");
      Serial.println(mappedValueRing);  
  }
  else { 
      Serial.println("Engine Off");
  }

  delay(100);
}

// void decelarate(int maxPWM) {
//   for (int speed = maxPWM; speed >= 1000; speed -= 10) {
//     motor.writeMicroseconds(speed);
//     delay(50);
//   }
// }