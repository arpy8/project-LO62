#include "utils.h"
#include "bluetooth.h"


int previousSpeed = -1;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting Arduino BLE Client application...");

  pinMode(sensorPinMiddle, INPUT);
  pinMode(sensorPinThumb, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  for (int i = 0; i < numReadings; i++) {
    middleFilter.readings[i] = 0;
  }

  BLEDevice::init("ESP32_BLE_Client");

  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);

  while (!doConnect) {
    Serial.println("Scanning for BLE servers...");
    pBLEScan->start(5, false);

    if (!doConnect) {
      Serial.println("Server not found, scanning again...");
      delay(2000);
    }
  }

  if (doConnect) {
    if (connectToServer()) {
      Serial.println("Connected to server successfully");
    } else {
      Serial.println("Failed to connect to server");
    }
  }
}


void loop() {
  if (!connected && doConnect) {
    if (connectToServer()) {
      Serial.println("Connected to server successfully");
    } else {
      Serial.println("Failed to connect to server");
      delay(5000);
    }
  }

  fingerData.middle = processFingerReading(analogRead(sensorPinMiddle), kfMiddle, middleFilter);
  float thumbValue = analogRead(sensorPinThumb);

  unsigned long currentMillis = millis();
  if (thumbValue < thresholdThumb) {
    if (thumbBelowThresholdStartTime == 0) {
      thumbBelowThresholdStartTime = currentMillis;
    } else if (currentMillis - thumbBelowThresholdStartTime > 2000) {
      if (currentMillis - lastThumbToggleTime > debounceDelay) {
        toggleEngine();
        digitalWrite(LED_BUILTIN, isEngineOn ? HIGH : LOW);
        lastThumbToggleTime = currentMillis;
      }
      thumbBelowThresholdStartTime = 0;
    }
  } else {
    thumbBelowThresholdStartTime = 0;
  }

  if (isEngineOn && (fingerData.middle > threshold)) {
    int speed = map(fingerData.middle, threshold, 4095, 1, 100);
    speed = constrain(speed, 1, 100);

    // if (speed != previousSpeed && speed != 2147483647u) {
    if (speed != 2147483647u) {
      sendCommand(speed);
      previousSpeed = speed;
      Serial.print("Sent Speed: ");
      Serial.println(fingerData.middle);
    } else {
      Serial.println("Speed unchanged, no data sent.");
    }
  } else {
    Serial.print("No data sent - Engine: ");
    Serial.print(isEngineOn ? "ON " : "OFF ");
    Serial.print(" Thumb value: ");
    Serial.println(thumbValue);

    if (!isEngineOn || (fingerData.middle <= threshold)) {
      previousSpeed = -1;
    }
  }

  delay(50);
}