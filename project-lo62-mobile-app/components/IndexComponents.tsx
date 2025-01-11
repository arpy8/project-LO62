import { Text, View } from '@/components/Themed';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';

export function TouchableButton(props) {
    const styles = StyleSheet.create({
        container: {
            justifyContent: 'space-between',
            backgroundColor: !props.disabled && props.active ? props.primaryColor : 'transparent',
            flex: 1,
            padding: 15,
            marginHorizontal: 10,
            borderRadius: 10,
            borderColor: props.disabled ? '#9ca3af' : props.primaryColor,
            borderWidth: 1,
            alignItems: 'center',
        },
        containerText: {
            color: props.disabled ? '#9ca3af' : props.active ? props.secondaryColor : props.primaryColor,
            fontSize: props.fontSize,
            marginTop: 5,
            fontFamily: 'Comfortaa',
        },
    });

    return (
        <TouchableOpacity TouchableOpacity style={styles.container} onPress={props.onPress} disabled={props.disabled}>
            <MaterialIcons name={props.active && props.activeIcon ? props.activeIcon : props.icon} size={24} color={props.disabled ? '#9ca3af' : props.active ? props.secondaryColor : props.primaryColor} />
            {props.text && <Text style={styles.containerText}>{props.active && props.activeText ? props.activeText : props.text}</Text>}
        </TouchableOpacity>
    );
}

export function GearView(props) {
    return (
        <View style={{
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            marginHorizontal: 30,
            alignItems: 'center',
            width: 25
        }}>
            {props.gear && <Text style={{
                fontSize: 40,
                fontFamily: 'Comfortaa',
                color: '#F1F1F1',
            }}>{props.gear}</Text>}
        </View>
    );
}