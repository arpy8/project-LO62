#include <ESP32Servo.h>

Servo motor;

const int motorPin = 13;
const int minPWM = 1000;    // min throttle
const int maxPWM = 2000;    // max throttle
const int inputMin = 1000;  // min input value
const int inputMax = 2000;  // max input value

unsigned long lastSignalTime = 0;
const unsigned long timeout = 500;
int motorSpeed = minPWM;

volatile bool decelerationInterrupted = false;
volatile int newTargetSpeed = 0;


void calibrateMotor() {
  Serial.println("Starting ESC recalibration...");

  Serial.println("Sending maximum throttle signal...");
  motor.writeMicroseconds(maxPWM / 1.5);
  delay(1000);

  Serial.println("Sending minimum throttle signal...");
  motor.writeMicroseconds(minPWM / 1.5);
  delay(1000);

  Serial.println("ESC recalibration complete. Returning to safe throttle.");
  motor.writeMicroseconds(minPWM);
  motorSpeed = minPWM;
}

void decelerate(float baseStep, bool emergency = false) {

  decelerationInterrupted = false;
  float currentSpeed = motorSpeed;
  unsigned long stepDelay = (emergency) ? 25 : 50;

  Serial.println(emergency ? "Emergency Stop in Progress..." : "Starting deceleration...");
  if (emergency) digitalWrite(LED_BRAKE, HIGH);

  while (currentSpeed > minPWM) {
    if (!emergency && decelerationInterrupted) {
      Serial.println("Deceleration interrupted by new command");
      return;
    }

    float step = baseStep;
    step = max((double)((currentSpeed - minPWM) * (emergency ? 0.2 : 0.1)), (double)baseStep);

    currentSpeed = max(currentSpeed - step, (float)minPWM);
    motor.writeMicroseconds((int)currentSpeed);
    motorSpeed = (int)currentSpeed;

    Serial.print(emergency ? "Emergency Decelerating: " : "Decelerating: ");
    Serial.println(currentSpeed);

    delay(stepDelay);
  }

  motorSpeed = minPWM;
  motor.writeMicroseconds(minPWM);

  Serial.println(emergency ? "Emergency Stop Complete" : "Deceleration complete");
  if (emergency) digitalWrite(LED_BRAKE, LOW);
}

void setMotorSpeed(int data) {
  decelerationInterrupted = true;
  newTargetSpeed = map(data, 0, 100, minPWM, maxPWM);

  Serial.print("New Target Speed: ");
  Serial.println(newTargetSpeed);

  int difference = newTargetSpeed - motorSpeed;

  if (abs(difference) > 50) {
    int step = (difference > 0) ? 10 : -10;
    while (motorSpeed != newTargetSpeed) {
      motorSpeed += step;

      if ((step > 0 && motorSpeed > newTargetSpeed) || (step < 0 && motorSpeed < newTargetSpeed)) {
        motorSpeed = newTargetSpeed;
      }

      motor.writeMicroseconds(motorSpeed);
      Serial.print("Current Speed: ");
      Serial.println(motorSpeed);
      delay(20);
    }
  } else {
    motorSpeed = newTargetSpeed;
    motor.writeMicroseconds(motorSpeed);
    Serial.print("Current Speed: ");
    Serial.println(motorSpeed);
  }
}

void setupMotor() {
  motor.setPeriodHertz(50);
  motor.attach(motorPin, minPWM, maxPWM);

  Serial.println(F("Arming ESC..."));
  motor.writeMicroseconds(minPWM);
  delay(2000);
  Serial.println(F("ESC armed."));
}