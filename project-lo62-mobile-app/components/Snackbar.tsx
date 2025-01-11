import React, { useEffect, useState } from 'react';
import { Animated, Text } from 'react-native';

export const Snackbar = ({ message, type, visible, onDismiss }) => { 
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2700),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                onDismiss();
            });
        }
    }, [visible]);

    if (!visible) return null;

    const backgroundColor = type === 'error' ? '#ef4444' : '#10b981';

    return (
        <Animated.View style={{
            position: 'absolute',
            top: 730,
            zIndex: 1000,
            left: 20,
            right: 20,
            backgroundColor,
            padding: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: fadeAnim,
            transform: [{
                translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                })
            }]
        }}>
            <Text style={{
                color: '#ffffff',
                flex: 1,
                fontSize: 16,
                fontFamily: 'Comfortaa',
            }}>
                {message}
            </Text>
        </Animated.View>
    );
};
