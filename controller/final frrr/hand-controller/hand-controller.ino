// #include "KalmanFilter.h"
#include "utils.h"
#include "bluetooth.h"
#include "sensors.h"

int previousSpeed = -1;
const int threshold = 10;
const int thresholdThumb = 200;
unsigned long lastThumbToggleTime = 0;
const unsigned long debounceDelay = 1000;
unsigned long thumbBelowThresholdStartTime = 0;


void setup() {
  Serial.begin(115200);
  Serial.println("Starting...");

  setupSensor();
  setupBluetooth();
}

void loop() {
  if (!connected && doConnect) {
    if (connectToServer()) {
      Serial.println("Connected to board");
    } else {
      Serial.println("Failed to connect to the board");
      delay(5000);
    }
  }

  // normalizedMiddle = processFingerReading(analogRead(sensorPinMiddle), kfMiddle, middleFilter);
  float thumbValue = analogRead(sensorPinThumb);
  float rawMiddle = analogRead(sensorPinMiddle);

  int normalizedMiddle = normalizeValue(rawMiddle, middleCal);
  normalizedMiddle = abs(100 - normalizedMiddle);

  unsigned long currentMillis = millis();

  if (thumbValue < thresholdThumb) {
    if (thumbBelowThresholdStartTime == 0) {
      thumbBelowThresholdStartTime = currentMillis;
    } else if (currentMillis - thumbBelowThresholdStartTime > 2000) {
      if (currentMillis - lastThumbToggleTime > debounceDelay) {
        toggleEngine();

        // digitalWrite(LED_BUILTIN, isEngineOn ? HIGH : LOW);
        int brightness = map(normalizedMiddle, 1, 100, 0, 255);
        analogWrite(LED_BUILTIN, brightness);

        lastThumbToggleTime = currentMillis;
      }
      thumbBelowThresholdStartTime = 0;
    }
  } else {
    thumbBelowThresholdStartTime = 0;
  }

  if (isEngineOn && (normalizedMiddle > threshold)) {
    if (normalizedMiddle != 2147483647 || normalizedMiddle % 3 == 0) {
      sendCommand(normalizedMiddle);
      previousSpeed = normalizedMiddle;
      Serial.print("Sent Speed: ");
      Serial.println(normalizedMiddle);
    } else {
      Serial.println("Speed unchanged, no data sent.");
    }
  } else {
    Serial.print("No data sent: ");
    Serial.println(normalizedMiddle);

    if (!isEngineOn || (normalizedMiddle <= threshold)) {
      previousSpeed = -1;
    }
  }

  delay(50);
}