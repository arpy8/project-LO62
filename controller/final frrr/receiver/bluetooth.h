#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <motor.h>

#define LED_BUILTIN 2
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"


bool deviceConnected = false;
BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;

void disconnectBLE() {
  Serial.println("Disconnecting Bluetooth");

  if (deviceConnected) {
    if (!decelerationInterrupted) {
      pServer->disconnect(pServer->getConnId());
      digitalWrite(LED_BUILTIN, LOW);
    }
    decelerate(10);
  }
}

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");
    digitalWrite(LED_BUILTIN, HIGH);
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Device disconnected");
    digitalWrite(LED_BUILTIN, LOW);

    decelerate(10);

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

    // 0x65: caliberate esc
    // 0x66: disconnect bt
    // 0x67: engine off
    // 0x68: emergency stop
    // default: handle speed

    if (len == 1) {
      switch (data[0]) {
        case 0x65:
          recalibrateMotor();
          break;
        case 0x66:
          disconnectBLE();
          break;
        case 0x67:
          decelerate(10);
          break;
        case 0x68:
          // emergency
          decelerate(50, true);
          break;
        default:
          setMotorSpeed(data[0]);
          break;
      }
    }
  }
};

void setupBLE() {
  Serial.begin(115200);

  pinMode(LED_BUILTIN, OUTPUT);

  setCpuFrequencyMhz(240);
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

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);

  BLEDevice::startAdvertising();
}