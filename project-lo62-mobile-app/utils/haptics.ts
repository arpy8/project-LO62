import { useState } from 'react';
import * as Haptics from 'expo-haptics';

type VibrationPattern = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';

export const useVibration = () => {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const patternMap = {
        'light': Haptics.ImpactFeedbackStyle.Light,
        'medium': Haptics.ImpactFeedbackStyle.Medium,
        'heavy': Haptics.ImpactFeedbackStyle.Heavy,
        'soft': Haptics.ImpactFeedbackStyle.Soft,
        'rigid': Haptics.ImpactFeedbackStyle.Rigid,
    };

    const vibrate = async (seconds: number, pattern: VibrationPattern = 'heavy'): Promise<void> => {
        if (intervalId) {
            return;
        }

        try {
            const id = setInterval(async () => {
                await Haptics.impactAsync(patternMap[pattern]);
            }, 0);

            setIntervalId(id);

            return new Promise((resolve) => {
                setTimeout(() => {
                    clearInterval(id);
                    setIntervalId(null);
                    resolve();
                }, seconds);
            });
        } catch (error) {
            console.error('Haptic feedback error:', error);
            throw error;
        }
    };

    return { vibrate };
};