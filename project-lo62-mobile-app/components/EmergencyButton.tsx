import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';


export function EmergencyButton(props) {

    const styles = StyleSheet.create({
        emergencyButton: {
            flex: 1,
            padding: 15,
            marginHorizontal: 20,
            borderRadius: 10,
            borderColor: props.disabled ? '#9ca3af' : '#FA3636',
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
        },
        centeredContentText: {
            color: props.disabled ? '#9ca3af' : '#FA3636',
            fontSize: 20,
            marginTop: 5,
            fontFamily: 'Comfortaa',
        },
        centeredContent: {
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
        },
    })

    function handlePress() {
        if (props.sliderValue > 0) {
            console.log(props.sliderValue);
            props.vibrate(800, 'heavy');
            props.adjustSpeedSmoothly(0, 500);
        }
    }

    return (
        <TouchableOpacity style={styles.emergencyButton} onPress={handlePress} disabled={props.disabled}>
            <View style={styles.centeredContent}>
                <MaterialIcons name="report" size={42} color={props.disabled ? '#9ca3af' : "#FA3636"} />
                <Text style={styles.centeredContentText}>Emergency Stop</Text>
            </View>
        </TouchableOpacity>
    );
}