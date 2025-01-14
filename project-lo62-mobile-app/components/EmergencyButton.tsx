import { StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { sendCommand } from '@/utils/bluetooth';


interface EmergencyButtonProps {
    sliderValue: number
    vibrate: any
    device: any
    setIgnoreSendingSignals: any
    adjustSpeedSmoothly: any
    disabled: boolean
    signalManager: any
}

export function EmergencyButton(props: EmergencyButtonProps) {

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

    async function handlePress() {
        if (props.sliderValue > 0) {
            props.vibrate(800, 'heavy');

            if (props.device) {
                props.signalManager?.setEmergency(true);

                await sendCommand(props.device, 0x68);

                props.setIgnoreSendingSignals(true);
                await props.adjustSpeedSmoothly(0, 500);

                setTimeout(() => {
                    props.signalManager?.setEmergency(false);
                    props.setIgnoreSendingSignals(false);
                }, 600);
            }
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