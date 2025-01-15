#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>

#define LED_BUILTIN 15
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"


static BLEUUID serviceUUID(SERVICE_UUID);
static BLEUUID charUUID(CHAR_UUID);

static BLEAddress* pServerAddress;
static boolean doConnect = false;
static boolean connected = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;

class MyClientCallback : public BLEClientCallbacks {
  void onConnect(BLEClient* pclient) {
    connected = true;
    Serial.println("Connected to server");

    for (int i = 0; i < 2; i++) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(500);
      digitalWrite(LED_BUILTIN, LOW);
      delay(500);
    }
  }

  void onDisconnect(BLEClient* pclient) {
    connected = false;
    Serial.println("Disconnected from server");
    digitalWrite(LED_BUILTIN, LOW);
  }
};

class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    Serial.print("Found Device: ");
    Serial.println(advertisedDevice.toString().c_str());

    if (advertisedDevice.getName() == "ESP32_BLE") {
      Serial.println("Found ESP32_BLE server!");
      advertisedDevice.getScan()->stop();
      pServerAddress = new BLEAddress(advertisedDevice.getAddress());
      doConnect = true;
    }
  }
};

bool connectToServer() {
  Serial.print("Forming a connection to ");
  Serial.println(pServerAddress->toString().c_str());

  BLEClient* pClient = BLEDevice::createClient();
  Serial.println(" - Created client");

  pClient->setClientCallbacks(new MyClientCallback());

  pClient->connect(*pServerAddress);
  Serial.println(" - Connected to server");

  BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
  if (pRemoteService == nullptr) {
    Serial.print("Failed to find our service UUID: ");
    Serial.println(serviceUUID.toString().c_str());
    pClient->disconnect();
    return false;
  }
  Serial.println(" - Found our service");

  pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
  if (pRemoteCharacteristic == nullptr) {
    Serial.print("Failed to find our characteristic UUID: ");
    Serial.println(charUUID.toString().c_str());
    pClient->disconnect();
    return false;
  }
  Serial.println(" - Found our characteristic");

  return true;
}

void sendCommand(uint8_t command) {
  if (connected && pRemoteCharacteristic != nullptr) {
    pRemoteCharacteristic->writeValue(&command, 1);
    // Serial.print("Sent command: 0x");
    // Serial.println(command, HEX);
  } else {
    Serial.println("Not connected to server");
  }
}

void setupBluetooth() {
  BLEDevice::init("ESP32_BLE_Client");

  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);

  while (!doConnect) {
    Serial.println("Scanning for BLE servers...");
    pBLEScan->start(5, false);

    if (!doConnect) {
      Serial.println("Server not found, scanning again...");
      delay(2000);
    }
  }

  if (doConnect) {
    if (connectToServer()) {
      Serial.println("Connected to server successfully");
    } else {
      Serial.println("Failed to connect to server");
    }
  }
}