import { Text, View } from '@/components/Themed';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';


export default function Header(props) {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.headerSubContainer}>
                <Text style={styles.headerTextUpper}>Throttle</Text>
                <Text style={styles.headerTextMain}>{props.sliderValue} %</Text>
            </View>
            <View style={styles.headerSubContainer}>
                <Text style={styles.headerTextUpper}>BT Status</Text>
                <Text style={styles.headerTextMain}>Connected</Text>
            </View>
        </View>
    );
}


const styles = StyleSheet.create(
    {
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
            borderColor: '#0000ff',
            backgroundColor: '#1d1f23',
            borderRadius: 15,
            flex: 1,
        },
        headerTextUpper: {
            fontSize: 20,
            paddingBottom: 10,
            color: '#F1F1F180',
            textAlign: 'center',
        },
        headerTextMain: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#F1F1F1',
            textAlign: 'center',
        },

    }
)