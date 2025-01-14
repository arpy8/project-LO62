import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text,
    View
} from 'react-native';
import { Snackbar } from '@/components/Snackbar';
import { BleManager } from 'react-native-ble-plx';
import { setupBluetooth } from '@/utils/bluetooth';

interface HeaderProps {
    sliderValue: number
    primaryColor: string
    secondaryColor: string
    manager: BleManager
    isScanning: boolean
    device: any
    snackbar: any
    setDevice: any
    setIsScanning: any
    vibrate: any
    hideSnackbar: any
    showSnackbar: any
    disabled: boolean
}

export default function Header({ sliderValue, primaryColor, secondaryColor, manager, isScanning, device, snackbar, setDevice, setIsScanning, vibrate, hideSnackbar, showSnackbar, disabled }: HeaderProps) {
    // useEffect(() => {
    //     if (disabled) disconnectDevice();
    // });


    useEffect(() => {
        setupBluetooth();

        return () => {
            if (isScanning) {
                manager.stopDeviceScan();
            }
        };
    }, []);

    function scanAndConnect(tryCount: number = 3) {
        if (device || isScanning) {
            console.log('Already connected or scanning in progress');
            return;
        }

        if (tryCount <= 0) {
            console.log('All connection attempts failed');
            showSnackbar('Failed to connect to device', 'error');
            return;
        }

        setIsScanning(true);

        manager.state().then((state) => {
            if (state !== 'PoweredOn') {
                console.log('Bluetooth is not powered on');
                showSnackbar('Bluetooth is not powered on', 'error');
                setIsScanning(false);
                return;
            }

            console.log('Scanning...');
            showSnackbar('Scanning for the board...');

            let scanTimeout: NodeJS.Timeout;

            manager.startDeviceScan(null, null, (error, scannedDevice) => {
                if (error) {
                    if (error.errorCode === 101) {
                        showSnackbar('Please give bluetooth permissions', 'error');
                    } else {
                        console.log('Scanning error:', error);
                    }
                    setIsScanning(false);
                    clearTimeout(scanTimeout);
                    return;
                }

                if (scannedDevice && scannedDevice.name === 'ESP32_BLE') {
                    clearTimeout(scanTimeout);
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
                            showSnackbar('Connected to ESP32', 'success');
                        })
                        .catch((error) => {
                            console.log('Connection error:', error.errorCode, error.message);
                            // showSnackbar('Failed to connect to device', 'error');
                            manager.stopDeviceScan();
                            setIsScanning(false);

                            if (!device) {
                                setTimeout(() => {
                                    scanAndConnect(tryCount - 1);
                                }, 1000);
                            }
                        });
                }
            });

            scanTimeout = setTimeout(() => {
                manager.stopDeviceScan();
                setIsScanning(false);

                if (!device && tryCount > 1) {
                    console.log('Retrying connection...');
                    setTimeout(() => {
                        scanAndConnect(tryCount - 1);
                    }, 1000);
                } else if (!device) {
                    console.log('Scan timeout, no devices found');
                    showSnackbar('No devices found during scan', 'error');
                }
            }, 5000);
        });
    }

    const disconnectDevice = async () => {
        if (device) {
            try {
                await device.cancelConnection();
                setDevice(null);
                console.log("Board disconnected");
                showSnackbar("Board disconnected");
            } catch (error) {
                //@ts-ignore
                if (error.includes('is not connected')) {
                    setDevice(null);
                    setIsScanning(false);
                    console.log('Board is not connected');
                    showSnackbar('Board is not connected', 'error');
                }
                console.error("Error disconnecting the board:", error);
                showSnackbar("Error disconnecting board", "error");
            }
        } else {
            console.log("Board not connected to disconnect");
        }
    };

    const handleBTConnection = async () => {
        if (device == null) scanAndConnect();
        else if (device) await disconnectDevice();
    };

    let currentBGColor = device != null ? primaryColor : 'transparent';
    let currentBorderColor = device != null ? primaryColor : secondaryColor;

    return (
        <View style={{ backgroundColor: '#1c1c1c' }}>
            <Text style={styles.titleText}>Control Panel</Text>

            <View style={styles.headerContainer}>
                <View style={styles.headerSubContainer}>
                    <Text style={styles.headerTextUpper}>Throttle</Text>
                    <Text style={styles.headerTextMain}>{sliderValue} %</Text>
                </View>
                <TouchableOpacity
                    style={{ ...styles.headerSubContainer, backgroundColor: currentBGColor, borderColor: currentBorderColor }}
                    onPress={handleBTConnection}
                >
                    <MaterialIcons name={device != null ? "bluetooth-connected" : "bluetooth"} size={42} color={secondaryColor} style={styles.btIcon} />
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