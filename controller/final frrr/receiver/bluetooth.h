#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

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
    decelerate(1);
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

    if (len == 1) {
      switch (data[0]) {
        case CALIBRATE:
          calibrateMotor();
          break;
        case DISCONNECT:
          disconnectBLE();
          break;
        case ENGINE_OFF:
          decelerate(1);
          break;
        case EMERGENCY:
          decelerate(2, true);
          break;
        case LIGHT_ON:
          digitalWrite(LED_BRAKE, HIGH);
          break;
        case LIGHT_OFF:
          digitalWrite(LED_BRAKE, LOW);
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

  pinMode(LED_BRAKE, OUTPUT);
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