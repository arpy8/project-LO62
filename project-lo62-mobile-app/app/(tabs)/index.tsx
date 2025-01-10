import React, { useState, useRef } from 'react';
import { Text, View } from '@/components/Themed';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Throttle from '@/components/Throttle';
import Header from '@/components/Header';

export default function HomePage() {
  const [sliderValue, setSliderValue] = useState(0);
  const [currentAction, setCurrentAction] = useState<'accelerate' | 'decelerate' | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  function handleSpeed(state: 'accelerate' | 'decelerate') {
    if (currentAction === state) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setCurrentAction(state);

    function adjustSpeed(value: number) {
      if ((state === 'accelerate' && value >= 100) || (state === 'decelerate' && value <= 0)) {
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


  function TouchableButton(props) {
    return (
      <TouchableOpacity style={styles.engineOffButton} onPress={props.onPress}>
        <MaterialIcons name={props.icon} size={24} color={props.color} />
        <Text style={styles.centeredContentText}>{props.text}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titleText}>Control Panel</Text>

      <Header sliderValue={sliderValue} />

      <View style={styles.sliderContainer}>
        <Throttle value={sliderValue} setValue={setSliderValue} />
        <TouchableOpacity style={styles.emergencyButton} onPress={() => setSliderValue(0)}>
          <View style={styles.centeredContent}>
            <MaterialIcons name="report" size={24} color="#FF0000" />
            <Text style={styles.centeredContentText}>Emergency Stop</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.engineOffContainer}>
        <TouchableOpacity style={{
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          // marginBottom: 20,
          flex: 1,
          padding: 15,
          marginHorizontal: 10,
          borderRadius: 10,
          borderColor: '#00ffff',
          borderWidth: 1,
          alignItems: 'center',
        }} onPress={() => handleSpeed('accelerate')}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color="#00ffff" />
        </TouchableOpacity>

        <View style={{
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          // flex: 1,
          // padding: 15,
          marginHorizontal: 50,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 50,
            fontWeight: 'bold',
            fontFamily: 'LeJourSerif',
            color: '#F1F1F1',
          }}>0</Text>
        </View>

        <TouchableOpacity style={{
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          // marginBottom: 20,
          flex: 1,
          padding: 15,
          marginHorizontal: 10,
          borderRadius: 10,
          borderColor: '#00ffff',
          borderWidth: 1,
          alignItems: 'center',
        }} onPress={() => handleSpeed('decelerate')}>
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#00ffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.engineOffContainer}>
        <TouchableOpacity style={{
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          flex: 1,
          padding: 15,
          marginHorizontal: 10,
          borderRadius: 10,
          borderColor: '#00ff0090',
          borderWidth: 1,
          alignItems: 'center',
        }} onPress={() => handleSpeed('accelerate')}>
          <MaterialIcons name="keyboard-double-arrow-up" size={24} color="#00ff00" />
          <Text style={{
            color: '#00ff00',
            fontSize: 14,
            marginTop: 5,
          }}>Accelerate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          // marginBottom: 20,
          flex: 1,
          padding: 15,
          marginHorizontal: 10,
          borderRadius: 10,
          borderColor: '#ffff00',
          borderWidth: 1,
          alignItems: 'center',
        }} onPress={() => handleSpeed('decelerate')}>
          <MaterialIcons name="keyboard-double-arrow-down" size={24} color="#ffff00" />
          <Text style={{
            color: '#ffff00',
            fontSize: 14,
            marginTop: 5,
          }}>Decelerate</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.engineOffContainer}>
        <TouchableButton color="#FF00FF" text="Engine Off" icon="close" onPress={() => setSliderValue(0)} />

        <TouchableOpacity style={styles.engineOffButton} onPress={() => setSliderValue(0)}>
          <MaterialIcons name="close" size={24} color="#FF0000" />
          <Text style={styles.centeredContentText}>Calib. ESC</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.engineOffButton} onPress={() => setSliderValue(0)}>
          <MaterialIcons name="close" size={24} color="#FF0000" />
          <Text style={styles.centeredContentText}>Overdrive</Text>
        </TouchableOpacity>
      </View >
    </ScrollView >
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    padding: 15,
  },


  titleText: {
    marginHorizontal: 10,
    alignItems: 'center',
    paddingBottom: 30,
    backgroundColor: '#1c1c1c',
    borderRadius: 15,
    flex: 1,
    color: '#F1F1F1',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'LeJourSerif',
  },

  sliderContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'transparent',
    marginHorizontal: 10,
  },
  emergencyButton: {
    flex: 1,
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    borderColor: '#FF0000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },


  engineOffContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  engineOffButton: {
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 20,
    flex: 1,
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    borderColor: '#FF0000',
    borderWidth: 1,
    alignItems: 'center',
  },
  centeredContentText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 5,
  },
  centeredContent: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});