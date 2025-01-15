import { Buffer } from 'buffer';
import { useCallback } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { StyleSheet, ScrollView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';

import Header from '@/components/Header';
import { View } from '@/components/Themed';
import Throttle from '@/components/Throttle';
import { Snackbar } from '@/components/Snackbar';
import { sendCommand } from '@/utils/bluetooth';
import { useVibration } from '@/utils/haptics';
import { EmergencyButton } from '@/components/EmergencyButton';
import { TouchableButton, GearView } from '@/components/IndexComponents';
import commandMap from '@/constants/commandMap';


global.Buffer = Buffer;

class SignalManager {
  private lastValue: number | null = null;
  private device: any;
  private minInterval = 8;
  private lastSendTime = 0;
  private pendingValue: number | null = null;
  private sendTimeout: NodeJS.Timeout | null = null;
  private emergency: boolean = false;

  constructor(device: any) {
    this.device = device;
  }

  setEmergency(state: boolean) {
    this.emergency = state;
    if (state) {
      if (this.sendTimeout) {
        clearTimeout(this.sendTimeout);
        this.sendTimeout = null;
      }
      this.pendingValue = null;
    }
  }

  async send(value: number) {
    if (this.emergency) return;

    this.pendingValue = value;

    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;

    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }

    if (timeSinceLastSend < this.minInterval) {
      this.sendTimeout = setTimeout(() => {
        this.executeSignal();
      }, this.minInterval - timeSinceLastSend);
      return;
    }

    await this.executeSignal();
  }

  private async executeSignal() {
    if (this.pendingValue === null || !this.device) return;

    const valueToSend = this.pendingValue;
    if (valueToSend === this.lastValue || valueToSend % 2 != 0) return;

    try {
      sendCommand(this.device, `0x${valueToSend.toString(16).toUpperCase().padStart(2, '0')}`, this.setDevice);

      this.lastValue = valueToSend;
      this.lastSendTime = Date.now();
    } catch (error) {
      console.error('Signal send error:', error);
    }

    this.pendingValue = null;
  }

  setDevice(device: any) {
    this.device = device;
  }
}

export default function HomePage() {
  const [sliderValue, setSliderValue] = useState(0);
  const [maxThrottle, setMaxThrottle] = useState(60);
  const [engineOn, setEngineOn] = useState(false);
  const [overdriveOn, setOverdriveOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [ignoreSendingSignals, setIgnoreSendingSignals] = useState(false);
  const [gearValue, setGearValue] = useState<'N' | '1' | '2' | '3' | '4' | '5' | '6'>('N');
  const [currentAction, setCurrentAction] = useState<'accelerate' | 'decelerate' | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [manager] = useState(new BleManager());
  const [device, setDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const signalManager = useRef<SignalManager | null>(null);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success'
  });
  const { vibrate } = useVibration();

  const gearRanges = [
    { gear: 'N', min: 0, max: 0, default: 0 },
    { gear: '1', min: 1, max: 15, default: 8 },
    { gear: '2', min: 16, max: 30, default: 23 },
    { gear: '3', min: 31, max: 45, default: 38 },
    { gear: '4', min: 46, max: 60, default: 53 },
    { gear: '5', min: 61, max: 75, default: 68 },
    { gear: '6', min: 76, max: 100, default: 83 }
  ];

  useEffect(() => {
    if (device) {
      if (!signalManager.current) {
        signalManager.current = new SignalManager(device);
      } else {
        signalManager.current.setDevice(device);
      }
    }
  }, [device]);

  const showSnackbar = useCallback((message: string, type = 'success') => {
    setSnackbar({
      visible: true,
      message,
      type
    });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    setMaxThrottle(overdriveOn ? 100 : 60);
  }, [overdriveOn]);

  useEffect(() => {
    if (!engineOn) {
      setGearValue('N');
      return;
    }

    const appropriateGear = gearRanges.find(
      range => sliderValue >= range.min && sliderValue <= range.max
    );

    if (appropriateGear) {
      setGearValue(appropriateGear.gear as 'N' | '1' | '2' | '3' | '4' | '5' | '6');
    }
  }, [sliderValue, engineOn]);

  useEffect(() => {
    if (device && signalManager.current && engineOn && 0 <= sliderValue && sliderValue <= 100 && !ignoreSendingSignals) {
      signalManager.current.send(sliderValue);
    }
  }, [sliderValue, device, engineOn]);

  const handleSpeed = useCallback((state: 'accelerate' | 'decelerate') => {
    if (!engineOn) return;
    if (currentAction === state) return;

    if (speedIntervalRef.current) {
      clearInterval(speedIntervalRef.current);
      speedIntervalRef.current = null;
    }

    if (currentAction !== null && currentAction !== state) {
      setCurrentAction(null);
      return;
    }

    setCurrentAction(state);
    const speedInterval = 50;

    speedIntervalRef.current = setInterval(() => {
      setSliderValue(currentValue => {
        const nextValue = state === 'accelerate'
          ? Math.min(currentValue + 1, maxThrottle)
          : Math.max(currentValue - 1, 0);

        if ((state === 'accelerate' && nextValue >= maxThrottle) ||
          (state === 'decelerate' && nextValue <= 0)) {
          if (speedIntervalRef.current) {
            clearInterval(speedIntervalRef.current);
            speedIntervalRef.current = null;
          }
          setTimeout(() => setCurrentAction(null), 0);
        }

        return nextValue;
      });
    }, speedInterval);

    return () => {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
        speedIntervalRef.current = null;
      }
    };
  }, [engineOn, currentAction, maxThrottle]);

  const handleEngineChange = useCallback(async () => {
    if (engineOn) {
      if (device) {
        signalManager.current?.setEmergency(true);

        sendCommand(device, commandMap.ENGINE_OFF, setDevice);
        setIgnoreSendingSignals(true);
        adjustSpeedSmoothly(0, 500);

        setTimeout(() => {
          signalManager.current?.setEmergency(false);
          setIgnoreSendingSignals(false);
        }, 600);
      }
      setMaxThrottle(60);
      setOverdriveOn(false);
      setCurrentAction(null);

      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
        speedIntervalRef.current = null;
      }
    }

    setEngineOn((prevValue) => !prevValue);
  }, [engineOn, showSnackbar]);

  const adjustSpeedSmoothly = useCallback((targetValue: number, duration: number) => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const startValue = sliderValue;
    const steps = Math.abs(targetValue - startValue);
    const intervalTime = duration / steps;
    const isIncreasing = targetValue > startValue;

    for (let i = 0; i <= steps; i++) {
      const timeout = setTimeout(() => {
        setSliderValue(isIncreasing ? startValue + i : startValue - i);
      }, i * intervalTime);

      timeoutsRef.current.push(timeout as unknown as number);
    }
  }, [sliderValue]);

  const handleGear = useCallback((state: '+' | '-') => {
    if (!engineOn) return;

    const gearSequence = ['N', '1', '2', '3', '4', '5', '6'] as const;
    const currentIndex = gearSequence.indexOf(gearValue);

    let newGear = gearValue;

    if (state === '+' && currentIndex < gearSequence.length - 1) {
      const nextGearRange = gearRanges[currentIndex + 1];
      if (nextGearRange.max > maxThrottle) {
        showSnackbar('Enable Overdrive for higher gears', 'error');
        return;
      }
      newGear = gearSequence[currentIndex + 1];
    } else if (state === '-' && currentIndex > 0) {
      newGear = gearSequence[currentIndex - 1];
    }

    const newGearRange = gearRanges.find(range => range.gear === newGear);
    if (newGearRange) {
      const targetSpeed = Math.min(newGearRange.max, maxThrottle);
      adjustSpeedSmoothly(targetSpeed, 1000);
      // setGearValue(newGear);
    }
  }, [engineOn, gearValue, maxThrottle, adjustSpeedSmoothly, showSnackbar]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Header
        sliderValue={sliderValue}
        primaryColorBT="#2196f3"
        secondaryColorBT="#FFF"
        primaryColorLT="#ffa133"
        secondaryColorLT="#FFF"
        manager={manager}
        device={device}
        isScanning={isScanning}
        snackbar={snackbar}
        setDevice={setDevice}
        setIsScanning={setIsScanning}
        vibrate={vibrate}
        showSnackbar={showSnackbar}
        hideSnackbar={hideSnackbar}
        setLightOn={setLightOn}
        lightOn={lightOn}
      />

      <View style={{
        ...styles.rowContainer,
        marginHorizontal: 10,
        width: '100%'
      }}>
        <Throttle
          value={sliderValue}
          setValue={setSliderValue}
          disabled={!engineOn}
          device={device}
        />
        <EmergencyButton
          device={device}
          sliderValue={sliderValue}
          adjustSpeedSmoothly={adjustSpeedSmoothly}
          setIgnoreSendingSignals={setIgnoreSendingSignals}
          vibrate={vibrate}
          disabled={!engineOn}
          signalManager={signalManager.current}
        />
      </View>

      <View style={styles.rowContainer}>
        <TouchableButton
          primaryColor="#7cf5ff"
          secondaryColor="#FFFFFF"
          icon="keyboard-arrow-left"
          onPress={() => handleGear("-")}
          disabled={!engineOn}
        />
        <GearView gear={gearValue} />
        <TouchableButton
          primaryColor="#7CF5FF"
          secondaryColor="#FFFFFF"
          icon="keyboard-arrow-right"
          onPress={() => handleGear("+")}
          disabled={!engineOn}
        />
      </View>

      <View style={styles.rowContainer}>
        <TouchableButton
          fontSize={15}
          primaryColor="#72D82D"
          secondaryColor="#FFFFFF"
          text="Accelerate"
          icon="keyboard-double-arrow-up"
          onPress={() => handleSpeed('accelerate')}
          disabled={!engineOn}
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#ffd65a"
          secondaryColor="#FFFFFF"
          text="Hold"
          icon="pause"
          // onPress={() => handleSpeed('accelerate')}
          disabled={!engineOn}
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#FA3636"
          secondaryColor="#FFFFFF"
          text="Decelerate"
          icon="keyboard-double-arrow-down"
          onPress={() => handleSpeed('decelerate')}
          disabled={!engineOn}
        />
      </View>

      <View style={styles.rowContainer}>
        <TouchableButton
          fontSize={15}
          primaryColor="#e0e0e0"
          secondaryColor="#000"
          text="Engine Off"
          activeText="Engine On"
          icon="key-off"
          activeIcon="key"
          onPress={handleEngineChange}
          active={engineOn}
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#ffd65a"
          secondaryColor="#FFFFFF"
          text="Calibrate"
          icon="replay"
          disabled={!engineOn || sliderValue > 0}
          onPress={() => {
            if (device) sendCommand(device, commandMap.CALIBRATE, setDevice);
          }}
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#a294f9"
          secondaryColor="#FFFFFF"
          text="Overdrive"
          icon="local-fire-department"
          onPress={() => setOverdriveOn((prevValue) => !prevValue)}
          active={overdriveOn}
          disabled={!engineOn}
        />
      </View>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    padding: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 20,
  }
});