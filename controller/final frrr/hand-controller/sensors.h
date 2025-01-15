#define LED_BT 2
#define sensorPinThumb 33
#define sensorPinMiddle 39
#define calibrationTime 5000


struct SensorCalibration {
  int minVal;
  int maxVal;
};

SensorCalibration thumbCal = { 4095, 0 };
SensorCalibration middleCal = { 4095, 0 };


void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BT, HIGH);
    delay(delayMs);
    digitalWrite(LED_BT, LOW);
    delay(delayMs);
  }
}

void pulseLED(int duration, int steps) {
  int delayTime = duration / (steps * 2);
  for (int i = 0; i < steps; i++) {
    int pwmValue = (i * 255) / steps;
    analogWrite(LED_BT, pwmValue);
    delay(delayTime);
  }
  for (int i = steps; i >= 0; i--) {
    int pwmValue = (i * 255) / steps;
    analogWrite(LED_BT, pwmValue);
    delay(delayTime);
  }
}

void calibrateSensors() {
  unsigned long startTime = millis();
  Serial.println("Keep fingers straight for calibration...");

  blinkLED(3, 200);


  while (millis() - startTime < calibrationTime / 2) {
    int thumbVal = analogRead(sensorPinThumb);
    int middleVal = analogRead(sensorPinMiddle);


    thumbCal.minVal = min(thumbCal.minVal, thumbVal);
    middleCal.minVal = min(middleCal.minVal, middleVal);


    pulseLED(500, 50);
  }

  Serial.println("Now bend fingers fully...");
  digitalWrite(LED_BT, LOW);
  delay(1000);


  blinkLED(2, 500);
  startTime = millis();


  while (millis() - startTime < calibrationTime / 2) {
    int thumbVal = analogRead(sensorPinThumb);
    int middleVal = analogRead(sensorPinMiddle);


    thumbCal.maxVal = max(thumbCal.maxVal, thumbVal);
    middleCal.maxVal = max(middleCal.maxVal, middleVal);


    pulseLED(250, 50);
  }

  digitalWrite(LED_BT, HIGH);
  delay(1000);
  digitalWrite(LED_BT, LOW);

  Serial.println("Calibration complete!");
  Serial.println("Thumb range: " + String(thumbCal.minVal) + " to " + String(thumbCal.maxVal));
  Serial.println("Middle range: " + String(middleCal.minVal) + " to " + String(middleCal.maxVal));
} 

int normalizeValue(int rawValue, SensorCalibration cal) {
  int constrained = constrain(rawValue, cal.minVal, cal.maxVal);
  int normalized = map(constrained, cal.minVal, cal.maxVal, 1, 100);

  return normalized;
}

void setupSensor() {
  Serial.begin(115200);
  pinMode(LED_BT, OUTPUT);

  delay(1000);

  blinkLED(5, 100);

  Serial.println("Starting calibration in 3 seconds...");
  delay(3000);

  calibrateSensors();
}