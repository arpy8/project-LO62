import { Audio } from 'expo-av';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<string, Audio.Sound>;

    private constructor() {
        this.sounds = new Map();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    async setupAudio() {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
                interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        } catch (error) {
            console.error('Error setting up audio:', error);
        }
    }

    async loadSound(key: string, source: any) {
        try {
            const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
            this.sounds.set(key, sound);
        } catch (error) {
            console.error(`Error loading sound ${key}:`, error);
        }
    }

    async playSound(key: string) {
        try {
            const sound = this.sounds.get(key);
            if (sound) {
                await sound.replayAsync();
            } else {
                console.warn(`Sound ${key} not loaded`);
            }
        } catch (error) {
            console.error(`Error playing sound ${key}:`, error);
        }
    }

    async unloadSound(key: string) {
        try {
            const sound = this.sounds.get(key);
            if (sound) {
                await sound.unloadAsync();
                this.sounds.delete(key);
            }
        } catch (error) {
            console.error(`Error unloading sound ${key}:`, error);
        }
    }

    async unloadAllSounds() {
        const unloadPromises = Array.from(this.sounds.entries()).map(async ([key, sound]) => {
            await this.unloadSound(key);
        });
        await Promise.all(unloadPromises);
    }
}

export const soundManager = SoundManager.getInstance();

export const setupAudio = () => soundManager.setupAudio();
export const loadSound = (key: string, source: any) => soundManager.loadSound(key, source);
export const playSound = (key: string) => soundManager.playSound(key);
export const unloadSound = (key: string) => soundManager.unloadSound(key);
export const unloadAllSounds = () => soundManager.unloadAllSounds();