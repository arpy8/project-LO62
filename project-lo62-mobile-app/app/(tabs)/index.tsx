import { Buffer } from 'buffer';
import { View } from '@/components/Themed';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import Throttle from '@/components/Throttle';
import Header from '@/components/Header';
import { TouchableButton, GearView } from '@/components/IndexComponents';
import { EmergencyButton } from '@/components/EmergencyButton';


global.Buffer = Buffer;

export default function HomePage() {
  const [sliderValue, setSliderValue] = useState(0);
  const [maxThrottle, setMaxThrottle] = useState(70);
  const [engineOn, setEngineOn] = useState(false);
  const [overdriveOn, setOverdriveOn] = useState(false);
  const [gearValue, setGearValue] = useState<'N' | '1' | '2' | '3' | '4' | '5' | '6'>('N');
  const [currentAction, setCurrentAction] = useState<'accelerate' | 'decelerate' | null>(null);
  const timeoutsRef = useRef<number[]>([]);

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

  function handleSpeed(state: 'accelerate' | 'decelerate') {
    if (!engineOn || currentAction === state) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setCurrentAction(state);

    function adjustSpeed(value: number) {
      if ((state === 'accelerate' && value >= maxThrottle) || (state === 'decelerate' && value <= 0)) {
        setCurrentAction(null);
        return;
      }

      timeoutsRef.current.push(
        setTimeout(() => {
          setSliderValue((prevValue) => (state === 'accelerate' ? prevValue + 1 : prevValue - 1));
          adjustSpeed(state === 'accelerate' ? value + 1 : value - 1);
        }, 100) as unknown as number
      );
    }

    adjustSpeed(sliderValue);
  }

  function adjustSpeedSmoothly(targetValue: number, duration: number) {
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
  }
  function handleGear(state: '+' | '-') {
    if (!engineOn) return;

    const gearValues = ['N', '1', '2', '3', '4', '5', '6'];
    let newGear: 'N' | '1' | '2' | '3' | '4' | '5' | '6' = gearValue;

    if (state === '+') {
      const currentIndex = gearValues.indexOf(gearValue);
      if (currentIndex < gearValues.length - 1) {
        newGear = gearValues[currentIndex + 1] as 'N' | '1' | '2' | '3' | '4' | '5' | '6';
      }
    } else if (state === '-') {
      const currentIndex = gearValues.indexOf(gearValue);
      if (currentIndex > 0) {
        newGear = gearValues[currentIndex - 1] as 'N' | '1' | '2' | '3' | '4' | '5' | '6';
      }
    }

    const newGearRange = gearRanges.find(range => range.gear === newGear);
    if (newGearRange) {
      adjustSpeedSmoothly(newGearRange.max, 2000);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Header
        sliderValue={sliderValue}
        engineOn={engineOn}
        disabled={!engineOn}
        primaryColor="#2196f3"
        secondaryColor="#FFF"
      />

      <View style={{ ...styles.rowContainer, marginHorizontal: 10, width: '100%' }}>
        <Throttle value={sliderValue} setValue={setSliderValue} disabled={!engineOn} />
        <EmergencyButton adjustSpeedSmoothly={adjustSpeedSmoothly} disabled={!engineOn} />
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
          fontSize={27}
          primaryColor="#72D82D"
          secondaryColor="#FFFFFF"
          text="Accelerate"
          icon="keyboard-double-arrow-up"
          onPress={() => handleSpeed('accelerate')}
          disabled={!engineOn}
        // active={engineOn} 
        />
        <TouchableButton
          fontSize={27}
          primaryColor="#FA3636"
          secondaryColor="#FFFFFF"
          text="Decelerate"
          icon="keyboard-double-arrow-down"
          onPress={() => handleSpeed('decelerate')}
          disabled={!engineOn}
        // active={engineOn}
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
          onPress={() => { setEngineOn((prevValue) => !prevValue) }}
          active={engineOn}
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#FFFF00"
          secondaryColor="#FFFFFF"
          text="Calib. ESC"
          icon="replay"
          disabled={!engineOn}
        // onPress={() => setSliderValue(0)} 
        />
        <TouchableButton
          fontSize={15}
          primaryColor="#a294f9"
          secondaryColor="#FFFFFF"
          text="Overdrive"
          icon="local-fire-department"
          onPress={() => { setOverdriveOn((prevValue) => !prevValue) }}
          active={overdriveOn}
          disabled={!engineOn}
        />
      </View>
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


// import App from "@/components/Bluetooth";

// export default function HomePage() {
//   return (
//     <ScrollView >
//       <App />
//     </ScrollView >
//   );
// }