#include <ESP32Servo.h>

Servo motor;

const int motorPin = 13;
const int minPWM = 1000;    // ESC's minimum throttle
const int maxPWM = 2000;    // ESC's maximum throttle
const int inputMin = 1000;  // Minimum input value
const int inputMax = 2000;  // Maximum input value

unsigned long lastSignalTime = 0;
const unsigned long timeout = 500; // 500ms timeout
int motorSpeed = minPWM;

// Map the input range (1000-2000) to the actual ESC range for proper throttle control
int mapThrottle(int input) {
  // Ensure input is within bounds
  input = constrain(input, inputMin, inputMax);
  
  // Calculate the percentage of full throttle (0-100%)
  float throttlePercent = (float)(input - inputMin) / (inputMax - inputMin);
  
  // Apply the percentage to the ESC's range
  return minPWM + (throttlePercent * (maxPWM - minPWM));
}

// void onDataReceive(const esp_now_recv_info_t* recv_info, const uint8_t* incomingData, int len) {
//   if (len == sizeof(int)) {
//     int receivedSpeed = *(int*)incomingData;
    
//     // Check for special deceleration signal
//     if (receivedSpeed == -1) {
//       Serial.println(F("Received deceleration signal due to stuck value");
//       decelerate();
//       return;
//     }
    
//     // Map the received speed to the proper throttle range
//     motorSpeed = mapThrottle(receivedSpeed);
//     lastSignalTime = millis();
    
//     // Print both received and mapped values for debugging
//     Serial.print("Received Value: ");
//     Serial.print(receivedSpeed);
//     Serial.print(" | Mapped Throttle: ");
//     Serial.println(F(motorSpeed);
//   }
// }

void motorSetup() {
  motor.setPeriodHertz(50);
  motor.attach(motorPin, minPWM, maxPWM);

  // Arming sequence
  Serial.println(F("Arming ESC..."));
  motor.writeMicroseconds(minPWM);
  delay(2000);
  Serial.println(F("ESC armed."));
}

void armEsc(){
  Serial.println(F("Arming ESC"));
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
