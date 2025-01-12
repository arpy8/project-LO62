import { View } from '@/components/Themed';
import { StyleSheet } from 'react-native';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@/components/ui/slider';
import { Image } from 'react-native';

export default function Throttle(props) {
    const handleChange = (value) => {
        props.setValue(value);
    };

    return (
        <View style={styles.container}>
            <Slider
                value={props.value}
                size="sm"
                orientation="vertical"
                isDisabled={props.disabled}
                isReversed={false}
                style={styles.slider}
                onChange={handleChange}
            >
                <SliderTrack style={styles.sliderTrack}>
                    <SliderFilledTrack style={{
                        backgroundColor: '#0f0',
                    }} />
                </SliderTrack>
                {
                    !props.disabled &&
                    <SliderThumb>
                        <Image
                            source={require('@/assets/images/slider.png')}
                            style={styles.sliderThumbImage}
                        />
                    </SliderThumb>
                }
            </Slider>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: 325,
        backgroundColor: '#1c1c1c',
        position: 'relative',
        top: 55,
    },
    slider: {
        height: 280,
        borderRadius: 10,
        top: -25,
    },
    sliderTrack: {
        backgroundColor: '#1c1c1c',
        borderColor: '#0f0',
        borderWidth: 1,
        borderRadius: 10,
        width: 58,
    },
    sliderThumbImage: {
        width: 80,
        height: 80,
        position: 'absolute',
        left: -33,
        top: -40,
        resizeMode: 'contain',
    },
});