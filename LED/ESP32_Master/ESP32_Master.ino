#include <esp_now.h>
#include <WiFi.h>

#define LED_PIN 2

uint8_t slaveAddress[] = {0x48, 0x3F, 0xDA, 0x4A, 0xAD, 0x3E};
int blinkCount = 0;

void onDataSent(const uint8_t *macAddr, esp_now_send_status_t status) {
  Serial.print("Data send status: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Success" : "Failed");
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW initialization failed");
    return;
  }
  Serial.println("ESP-NOW initialized");

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

void loop() {
  Serial.println("Enter the number of blinks (integer): ");
  
  while (Serial.available() == 0) {}

  blinkCount = Serial.parseInt();
  
  if (blinkCount > 0) {
    Serial.print("Sending blink count: "+String(blinkCount));

    esp_err_t result = esp_now_send(slaveAddress, (uint8_t *)&blinkCount, sizeof(blinkCount));
    if (result == ESP_OK) {
      Serial.println("Data sent successfully");
      digitalWrite(LED_PIN, LOW); 
      delay(2000);
      digitalWrite(LED_PIN, HIGH); 
      delay(2000);
    } else {
      Serial.println("Error sending data");
    }
  } else {
    Serial.println("Invalid input. Please enter a positive integer.");
  }

  delay(1000);
}