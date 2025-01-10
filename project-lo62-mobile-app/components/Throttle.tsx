import { View } from '@/components/Themed';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@/components/ui/slider';
import { Image } from 'react-native';

interface ThrottleProps {
    value: number;
    setValue: (value: number) => void;
}

export default function Throttle({value, setValue}: ThrottleProps) {
    const handleChange = (value) => {
        setValue(value);
        console.log('Current value:', value);
    };

    return (
        <View style={{
            width: 80,
            height: 325,
            backgroundColor: '#1c1c1c',
            position: 'relative',
            top: 55,
        }}>
            <Slider
                value={value}
                size="sm"
                orientation="vertical"
                isDisabled={false}
                isReversed={false}
                style={{
                    height: 280,
                    borderRadius: 10,
                    top: -25,
                }}
                onChange={handleChange}
            >
                <SliderTrack style={{
                    backgroundColor: '#1c1c1c',
                    borderColor: '#00FF0080',
                    borderWidth: 1,
                    borderRadius: 10,
                    width: 58,
                }}>
                    <SliderFilledTrack style={{
                        backgroundColor: '#00FF00',
                    }} />
                </SliderTrack>
                <SliderThumb>
                    <Image
                        source={require('@/assets/images/slider.png')}
                        style={{
                            width: 80,
                            height: 80,
                            position: 'absolute',
                            left: -33,
                            top: -40,
                            resizeMode: 'contain',
                        }}
                    />
                </SliderThumb>
            </Slider>
        </View>
    );
};