#include "KalmanFilter.h"
#include <esp_now.h>
#include <WiFi.h>

const int sensorPinRing = 36;    // Ring finger
const int sensorPinMiddle = 39;  // Middle finger
const int sensorPinIndex = 35;   // Index finger
const int sensorPinThumb = 33;     // Thumb
  
const int threshold = 1500;      // Common threshold
const int thresholdThumb = 200;

KalmanFilter kfRing(0.05, 2.0);
KalmanFilter kfMiddle(0.05, 2.0);
KalmanFilter kfIndex(0.05, 2.0);
// KalmanFilter kfThumb(0.05, 2.0);

bool isEngineOn = false;
unsigned long lastThumbToggleTime = 0;
const unsigned long debounceDelay = 1000;

uint8_t slaveAddress[] = {0xF0, 0x24, 0xF9, 0x45, 0x7B, 0x20};

// Separate moving average filters for each finger
const int numReadings = 5;
struct FingerFilter {
    int readings[numReadings];
    int readIndex = 0;
    int total = 0;
    int average = 0;
};

FingerFilter ringFilter;
FingerFilter middleFilter;
FingerFilter indexFilter;

// Structure to hold all finger values for transmission
struct FingerData {
    int ring;
    int middle;
    int index;
    bool engineState;  // Added engine state to the transmission structure
} fingerData;

void onDataSent(const uint8_t *macAddr, esp_now_send_status_t status) {
    Serial.print(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

void setup() {
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());

    // Initialize moving average arrays for all fingers
    for (int i = 0; i < numReadings; i++) {
        ringFilter.readings[i] = 0;
        middleFilter.readings[i] = 0;
        indexFilter.readings[i] = 0;
    }

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
    isEngineOn = !isEngineOn;  // Toggle the engine state
    fingerData.engineState = isEngineOn;  // Update the transmission structure
    Serial.print("Engine State Changed - Now: ");
    Serial.println(isEngineOn ? "ON" : "OFF");
    
    // Send the updated engine state immediately
    esp_err_t result = esp_now_send(slaveAddress, (uint8_t *)&fingerData, sizeof(fingerData));
}

// Function to apply deadzone to reduce sensitivity to small movements
int applyDeadzone(int value, int deadzone) {
    if (abs(value - 2000) < deadzone) {
        return 2000;
    }
    return value;
}

// Function to process each finger's reading
int processFingerReading(int rawValue, KalmanFilter &kf, FingerFilter &filter) {
    // Apply Kalman filter
    float filteredValue = kf.update(rawValue)/1.5;
    
    // Calculate mapped value
    int mappedValue = 2000 - filteredValue;
    
    // Apply moving average filter
    filter.total = filter.total - filter.readings[filter.readIndex];
    filter.readings[filter.readIndex] = mappedValue;
    filter.total = filter.total + filter.readings[filter.readIndex];
    filter.readIndex = (filter.readIndex + 1) % numReadings;
    filter.average = filter.total / numReadings;
    
    // Apply deadzone and exponential smoothing
    int finalValue = applyDeadzone(filter.average, 100);
    finalValue = map(finalValue, 0, 2000, 0, 2000);
    finalValue = (int)(pow(finalValue / 2000.0, 1.5) * 2000);
    
    return finalValue;
}

void loop() {
    // Read and process all fingers
    fingerData.ring = processFingerReading(analogRead(sensorPinRing), kfRing, ringFilter);
    fingerData.middle = processFingerReading(analogRead(sensorPinMiddle), kfMiddle, middleFilter);
    fingerData.index = processFingerReading(analogRead(sensorPinIndex), kfIndex, indexFilter);
    
    float filteredValueThumb = analogRead(sensorPinThumb);

    // Handle thumb threshold crossing and engine toggle
    unsigned long currentMillis = millis();
    if (filteredValueThumb < thresholdThumb && thresholdThumb != 2147483647 && (currentMillis - lastThumbToggleTime > debounceDelay)) {
        toggleEngine();
        lastThumbToggleTime = currentMillis;
    }

    // Only send finger data if engine is on and at least one finger is above threshold
    if (isEngineOn && (fingerData.ring > threshold || fingerData.middle > threshold || fingerData.index > threshold)) {
        esp_err_t result = esp_now_send(slaveAddress, (uint8_t *)&fingerData, sizeof(fingerData));
        Serial.print("Sending - Ring: ");
        Serial.print(fingerData.ring);
        Serial.print(" Middle: ");
        Serial.print(fingerData.middle);
        Serial.print(" Index: ");
        Serial.print(fingerData.index);
        Serial.print(" Engine: ");
        Serial.println(isEngineOn ? "ON" : "OFF");
    }
    else {
        Serial.print("No data sent - Engine: ");
        Serial.print(isEngineOn ? "ON " : "OFF ");
        // Serial.print(" - All fingers below threshold or engine off");
        Serial.println(analogRead(sensorPinThumb));
    }

    delay(100);
}