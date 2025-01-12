#include <ESP32Servo.h>

Servo motor;

const int motorPin = 13;
const int minPWM = 1000;    // min throttle
const int maxPWM = 2000;    // max throttle
const int inputMin = 1000;  // min input value
const int inputMax = 2000;  // max input value

unsigned long lastSignalTime = 0;
const unsigned long timeout = 500; // 500ms timeout
int motorSpeed = minPWM;

void motorSetup() {
  motor.setPeriodHertz(50); 
  motor.attach(motorPin, minPWM, maxPWM); 

  Serial.println(F("Arming ESC..."));
  motor.writeMicroseconds(minPWM);
  delay(2000);
  Serial.println(F("ESC armed."));
}

void decelerate(float step) {
  for (float speed = motorSpeed; speed >= minPWM; speed -= step) {
    motor.writeMicroseconds((int)speed);
    Serial.println(speed);
    delay(50);
  }
  motorSpeed = minPWM;
}

void accelerate(float step) {
  for (float speed = motorSpeed; speed <= maxPWM; speed += step) {
    motor.writeMicroseconds((int)speed);
    Serial.println(speed);
    delay(50);
  }
  motorSpeed = maxPWM;
}

void recalibrateMotor() {
  Serial.println(F("Starting ESC recalibration..."));

  Serial.println(F("Sending maximum throttle signal..."));
  motor.writeMicroseconds(maxPWM);
  delay(2000);

  Serial.println(F("Sending minimum throttle signal..."));
  motor.writeMicroseconds(minPWM);
  delay(2000);

  Serial.println(F("ESC recalibration complete. Returning to safe throttle."));
  motor.writeMicroseconds(minPWM);
  motorSpeed = minPWM;
}

void setMotorSpeed(int data) {
  int targetSpeed = map(data, 0, 100, minPWM, maxPWM);
  
  Serial.print("Target Speed: ");
  Serial.println(targetSpeed);
  
  int difference = targetSpeed - motorSpeed;

  if (abs(difference) > 50) {
    int step = (difference > 0) ? 10 : -10;
    while (motorSpeed != targetSpeed) {
      motorSpeed += step;
      
      if ((step > 0 && motorSpeed > targetSpeed) || (step < 0 && motorSpeed < targetSpeed)) {
        motorSpeed = targetSpeed;
      }

      motor.writeMicroseconds(motorSpeed);
      Serial.print("Current Speed: ");
      Serial.println(motorSpeed);
      delay(20);
      
    }
  } else {
    motorSpeed = targetSpeed;
    motor.writeMicroseconds(motorSpeed);
    Serial.print("Current Speed: ");
    Serial.println(motorSpeed);
  }
}