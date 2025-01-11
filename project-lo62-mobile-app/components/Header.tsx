import * as ExpoDevice from 'expo-device';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import {
    PermissionsAndroid,
    StyleSheet,
    TouchableOpacity,
    Text,
    View,
    Platform,
} from 'react-native';
import { useVibration } from '@/components/haptics';
import { Snackbar } from '@/components/Snackbar';

// const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
// const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export default function Header(props) {
    const [manager] = useState(new BleManager());
    const [device, setDevice] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [snackbar, setSnackbar] = useState({
        visible: false,
        message: '',
        type: 'success'
    });
    const { vibrate } = useVibration();

    const showSnackbar = (message, type = 'success') => {
        setSnackbar({
            visible: true,
            message,
            type
        });
    };

    const hideSnackbar = () => {
        setSnackbar(prev => ({ ...prev, visible: false }));
    };

    const setupBluetooth = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy requires Location",
                        buttonPositive: "OK",
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        } else {
            return true;
        }
    };

    useEffect(() => {
        setupBluetooth();

        return () => {
            if (isScanning) {
                manager.stopDeviceScan();
            }
        };
    }, []);

    function scanAndConnect() {
        setIsScanning(true);

        manager.state().then((state) => {
            if (state !== 'PoweredOn') {
                console.log('Bluetooth is not powered on');
                showSnackbar('Bluetooth is not powered on', 'error');
                return;
            }

            console.log('Scanning...');

            manager.startDeviceScan(null, null, (error, scannedDevice) => {
                if (error) {
                    console.log('Scanning error:', error);
                    return;
                }

                if (scannedDevice && scannedDevice.name === 'ESP32_BLE') {
                    manager.stopDeviceScan();
                    setIsScanning(false);

                    scannedDevice
                        .connect()
                        .then((device) => {
                            return device.discoverAllServicesAndCharacteristics();
                        })
                        .then((device) => {
                            setDevice(device);
                            vibrate(300, 'soft');
                            console.log('Connected to ESP32');
                            showSnackbar('Connected to ESP32');
                        })
                        .catch((error) => {
                            console.log('Connection error:', error);
                            showSnackbar('Failed to connect to device', 'error');
                        });
                }
            });

            setTimeout(() => {
                manager.stopDeviceScan();
                setIsScanning(false);
            }, 5000);
        });
    }

    const disconnectDevice = async () => {
        if (device) {
            try {
                await device.cancelConnection();
                setDevice(null);
                console.log("Device disconnected successfully");
                showSnackbar("Device disconnected successfully");
            } catch (error) {
                console.error("Error disconnecting the device:", error);
                showSnackbar("Error disconnecting device", "error");
            }
        } else {
            console.log("No device connected to disconnect");
        }
    };

    const handleBTConnection = async () => {
        if (device == null) scanAndConnect();
        else if (device) await disconnectDevice();
    };

    let currentBGColor = device != null ? props.primaryColor : 'transparent';
    let currentBorderColor = device != null ? props.primaryColor : props.secondaryColor;

    return (
        <View style={{ backgroundColor: '#1c1c1c' }}>
            <Text style={styles.titleText}>Control Panel</Text>

            <View style={styles.headerContainer}>
                <View style={styles.headerSubContainer}>
                    <Text style={styles.headerTextUpper}>Throttle</Text>
                    <Text style={styles.headerTextMain}>{props.sliderValue} %</Text>
                </View>
                <TouchableOpacity
                    style={{ ...styles.headerSubContainer, backgroundColor: currentBGColor, borderColor: currentBorderColor }}
                    onPress={handleBTConnection}
                >
                    <MaterialIcons name={device != null ? "bluetooth-connected" : "bluetooth"} size={42} color={props.secondaryColor} style={styles.btIcon} />
                </TouchableOpacity>
            </View>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                onDismiss={hideSnackbar}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    titleText: {
        alignItems: 'center',
        marginBottom: 20,
        flex: 1,
        color: '#F1F1F1',
        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'RockSaltRegular',
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    headerSubContainer: {
        marginHorizontal: 10,
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#7CF5FF',
        backgroundColor: '#1d1f23',
        borderRadius: 15,
        flex: 1,
    },
    headerTextUpper: {
        fontSize: 18,
        paddingBottom: 2,
        color: '#F1F1F180',
        textAlign: 'center',
        fontFamily: 'Comfortaa',
    },
    headerTextMain: {
        fontSize: 24,
        color: '#F1F1F1',
        textAlign: 'center',
        fontFamily: 'Comfortaa',
    },
    btIcon: {
        marginTop: 5,
    },
});