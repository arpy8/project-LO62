#include <ESP32Servo.h>
#include <esp_now.h>
#include <WiFi.h>

Servo motor;

const int motorPin = 13;
const int minPWM = 1000;    // ESC's minimum throttle
const int maxPWM = 2000;    // ESC's maximum throttle
const int inputMin = 1500;  // Minimum input value
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

void onDataReceive(const esp_now_recv_info_t* recv_info, const uint8_t* incomingData, int len) {
  if (len == sizeof(int)) {
    int receivedSpeed = *(int*)incomingData;
    
    // Check for special deceleration signal
    if (receivedSpeed == -1) {
      Serial.println("Received deceleration signal due to stuck value");
      decelerate();
      return;
    }
    
    // Map the received speed to the proper throttle range
    motorSpeed = mapThrottle(receivedSpeed);
    lastSignalTime = millis();
    
    // Print both received and mapped values for debugging
    Serial.print("Received Value: ");
    Serial.print(receivedSpeed);
    Serial.print(" | Mapped Throttle: ");
    Serial.println(motorSpeed);
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(onDataReceive);

  motor.setPeriodHertz(50);
  motor.attach(motorPin, minPWM, maxPWM);

  // Arming sequence
  Serial.println("Arming ESC...");
  motor.writeMicroseconds(minPWM);
  delay(2000);
  Serial.println("ESC armed.");
}

void loop() {
  if (millis() - lastSignalTime > timeout) {
    Serial.println("No signal received, decelerating motor...");
    decelerate();
  } else {
    motor.writeMicroseconds(motorSpeed);
    
    // Calculate and print throttle percentage for monitoring
    float throttlePercent = ((float)(motorSpeed - minPWM) / (maxPWM - minPWM)) * 100;
    Serial.print("Throttle: ");
    Serial.print(throttlePercent, 1);
    Serial.println("%");
  }
  delay(50);
}

void decelerate() {
  float currentPercent = ((float)(motorSpeed - minPWM) / (maxPWM - minPWM)) * 100;
  Serial.print("Decelerating from ");
  Serial.print(currentPercent, 1);
  Serial.println("%");
  
  for (int speed = motorSpeed; speed >= minPWM; speed -= 10) {
    motor.writeMicroseconds(speed);
    float percent = ((float)(speed - minPWM) / (maxPWM - minPWM)) * 100;
    Serial.print("Throttle: ");
    Serial.print(percent, 1);
    Serial.println("%");
    delay(50);
  }
  motorSpeed = minPWM;
  Serial.println("Motor at zero throttle.");
}