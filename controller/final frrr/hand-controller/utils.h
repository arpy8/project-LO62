#include "KalmanFilter.h"

const int sensorPinMiddle = 39;    // Middle finger
const int sensorPinThumb = 33;     // Thumb
  
const int threshold = 1100;        // Common threshold
const int thresholdThumb = 200;
unsigned long thumbBelowThresholdStartTime = 0;

KalmanFilter kfMiddle(0.1, 2.0);

bool isEngineOn = false;
unsigned long lastThumbToggleTime = 0;
const unsigned long debounceDelay = 1000;

const int numReadings = 5;
struct FingerFilter {
    int readings[numReadings];
    int readIndex = 0;
    int total = 0;
    int average = 0;
};

FingerFilter middleFilter;

struct FingerData {
    int ring;
    int middle;
    int index;
    bool engineState;  
} fingerData;

void toggleEngine() {
    isEngineOn = !isEngineOn; 
    fingerData.engineState = isEngineOn;
    Serial.print("Engine State Changed - Now: ");
    Serial.println(isEngineOn ? "ON" : "OFF");
}

int applyDeadzone(int value, int deadzone) {
    if (abs(value - 2000) < deadzone) {
        return 2000;
    }
    return value;
}

int processFingerReading(int rawValue, KalmanFilter &kf, FingerFilter &filter) {
    float filteredValue = kf.update(rawValue)/1.5;
    int mappedValue = 2000 - filteredValue;
    
    filter.total = filter.total - filter.readings[filter.readIndex];
    filter.readings[filter.readIndex] = mappedValue;
    filter.total = filter.total + filter.readings[filter.readIndex];
    filter.readIndex = (filter.readIndex + 1) % numReadings;
    filter.average = filter.total / numReadings;
    
    int finalValue = applyDeadzone(filter.average, 200);

    finalValue = map(finalValue, 0, 2000, 0, 2000);
    finalValue = (int)(pow(finalValue / 2000.0, 1.2) * 2000);
    
    return finalValue;
}