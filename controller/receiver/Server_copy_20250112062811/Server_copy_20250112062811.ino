#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <motor.h>

#define LED_BUILTIN 2
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
unsigned long lastProcessTime = 0;
const int PROCESS_INTERVAL = 10;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Device disconnected");
    BLEDevice::startAdvertising();
  }
};

class MyCharacteristicCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    String value = pCharacteristic->getValue();

    if (value.length() > 0) {
      processIncomingData(value);
    }
  }

private:
  void processIncomingData(const String& value) {
    const uint8_t* data = (const uint8_t*)value.c_str();
    int len = value.length();

    // 0x00: Emergency Button
    // 0x01: Caliberate ESC
    // 0x02: Accelerate
    // 0x03: Decelerate
    // 0x04: Increase Gear
    // 0x05: Decrease Gear

    if (len == 1) {
      switch (data[0]) {
        Serial.println(data[0]);
          // case 0x00:
          //   digitalWrite(LED_BUILTIN, LOW);
          //   break;
          // case 0x01:
          //   digitalWrite(LED_BUILTIN, HIGH);
          //   break;

        case 0x00:
          // Emergency
          Serial.println("Emergency");
          break;

        case 0x01:
          // Caliberate
          armEsc();
          break;

        case 0x02:
          // Accelerate
          accelerate(20);
          break;

        case 0x03:
          // Decelerate
          decelerate(30);
          break;

        case 0x04:
          // N
          break;
        case 0x05:
          // 1
          break;
        case 0x06:
          // 2
          break;
        case 0x07:
          // 3
          break;
        case 0x08:
          // 4
          break;
        case 0x09:
          // 5
          break;
        case 0x10:
          // 6
          break;
      }
    } else {
      Serial.println(value);
    }
  }
};

void setup() {
  setCpuFrequencyMhz(240);

  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  BLEDevice::init("ESP32_BLE");

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR | BLECharacteristic::PROPERTY_NOTIFY);

  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  // advertising for maximum throughput
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);

  BLEDevice::startAdvertising();

  Serial.println(F("Ready!"));
}

void loop() {
  if (deviceConnected) {
    unsigned long currentTime = millis();

    if (currentTime - lastProcessTime >= PROCESS_INTERVAL) {
      lastProcessTime = currentTime;
    }
  }
}