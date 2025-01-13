#include "KalmanFilter.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Sensor pins
const int sensorPinMiddle = 39;  // Middle finger
const int sensorPinThumb = 33;   // Thumb

const int threshold = 1500;
const int thresholdThumb = 200;

// Kalman filters for smoothing
KalmanFilter kfMiddle(0.05, 2.0);
KalmanFilter kfThumb(0.05, 2.0);

// Engine state management
bool isEngineOn = false;
unsigned long lastThumbToggleTime = 0;
const unsigned long debounceDelay = 1000;

// BLE server variables
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false;

// Define UUIDs for the service and characteristic (matching the receiver)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Moving average filter structure
const int numReadings = 5;
struct FingerFilter {
    int readings[numReadings];
    int readIndex = 0;
    int total = 0;
    int average = 0;
};

FingerFilter middleFilter;

// Define ServerCallbacks class
class ServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        deviceConnected = true;
        Serial.println("Device connected");
    }

    void onDisconnect(BLEServer* pServer) override {
        deviceConnected = false;
        Serial.println("Device disconnected");
        // Restart advertising after disconnection
        BLEDevice::startAdvertising();
    }
};

void setup() {
    Serial.begin(115200);
    
    // Initialize finger filters
    for (int i = 0; i < numReadings; i++) {
        middleFilter.readings[i] = 0;
    }

    // Initialize BLE with matching name format
    BLEDevice::init("ESP32_BLE_SENDER");
    pServer = BLEDevice::createServer();
    
    // Set up callbacks
    pServer->setCallbacks(new ServerCallbacks());

    // Create BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Create BLE Characteristic with matching properties
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_WRITE_NR |
        BLECharacteristic::PROPERTY_NOTIFY
    );

    pCharacteristic->addDescriptor(new BLE2902());

    // Start the service
    pService->start();

    // Configure advertising to match receiver
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x12);
    
    BLEDevice::startAdvertising();

    Serial.println("BLE server ready");
}

void toggleEngine() {
    isEngineOn = !isEngineOn;
    Serial.print("Engine State Changed - Now: ");
    Serial.println(isEngineOn ? "ON" : "OFF");
    
    if (deviceConnected && isEngineOn) {
        // Send engine state change
        uint8_t engineState = isEngineOn ? 0x01 : 0x00;
        pCharacteristic->setValue(&engineState, 1);
        pCharacteristic->notify();
    }
}

int processFingerReading(int rawValue, KalmanFilter &kf, FingerFilter &filter) {
    float filteredValue = kf.update(rawValue)/1.5;
    int mappedValue = 2000 - filteredValue;
    
    filter.total = filter.total - filter.readings[filter.readIndex];
    filter.readings[filter.readIndex] = mappedValue;
    filter.total = filter.total + filter.readings[filter.readIndex];
    filter.readIndex = (filter.readIndex + 1) % numReadings;
    filter.average = filter.total / numReadings;
    
    int finalValue = applyDeadzone(filter.average, 100);
    finalValue = map(finalValue, 0, 2000, 0, 2000);
    finalValue = (int)(pow(finalValue / 2000.0, 1.5) * 2000);
    
    return finalValue;
}

int applyDeadzone(int value, int deadzone) {
    if (abs(value - 2000) < deadzone) {
        return 2000;
    }
    return value;
}

void loop() {
    if (deviceConnected) {  // Only process and send data if connected
        int middleValue = processFingerReading(analogRead(sensorPinMiddle), kfMiddle, middleFilter);
        float thumbValue = analogRead(sensorPinThumb);

        unsigned long currentMillis = millis();
        if (thumbValue < thresholdThumb && (currentMillis - lastThumbToggleTime > debounceDelay)) {
            toggleEngine();
            lastThumbToggleTime = currentMillis;
        }

        if (isEngineOn && (middleValue > threshold)) {
            // Map the middle finger value to 0-255 range for motor control
            uint8_t speedValue = map(middleValue, threshold, 2000, 0, 255);
            
            // Send the speed value
            pCharacteristic->setValue(&speedValue, 1);
            pCharacteristic->notify();
            
            Serial.print("Sending speed: ");
            Serial.println(speedValue);
        }
    }
    delay(100);  // Maintain the same delay for stability
}