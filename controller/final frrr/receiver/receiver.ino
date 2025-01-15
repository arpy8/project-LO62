#include <constants.h>
#include <motor.h>
#include <bluetooth.h>

unsigned long lastProcessTime = 0;
const int PROCESS_INTERVAL = 10;

void setup() {
  setupBLE();
  setupMotor();
  Serial.println("Ready!");
}

void loop() {
  if (deviceConnected) {
    unsigned long currentTime = millis();

    if (currentTime - lastProcessTime >= PROCESS_INTERVAL) {
      lastProcessTime = currentTime;
    }
  }
}