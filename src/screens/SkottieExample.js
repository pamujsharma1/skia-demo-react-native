import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Skia, Canvas, Skottie } from "@shopify/react-native-skia";
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing, cancelAnimation } from "react-native-reanimated";

const animationJSON = require('../../assets/animations/animation.json');
const animation = Skia.Skottie.Make(JSON.stringify(animationJSON));

export default function SkottieExample() {
    const progress = useSharedValue(0);

    useEffect(() => {
        // Start an infinite loop from 0 to 1 over the duration of the animation
        if (animation) {
            progress.value = withRepeat(
                withTiming(1, { duration: animation.duration() * 1000, easing: Easing.linear }),
                -1, // infinite
                false // no reverse
            );
        }
        return () => {
            cancelAnimation(progress);
        };
    }, []);

    const frame = useDerivedValue(() => {
        if (!animation) return 0;
        const fps = animation.fps();
        const duration = animation.duration();
        // Calculate the exact frame relative to the progress
        return progress.value * (duration * fps);
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Skottie Lottie Animation</Text>
            <Text style={styles.subtitle}>Rendered at 60fps using Skia Graphics</Text>

            <View style={styles.canvasContainer}>
                {animation ? (
                    <Canvas style={{ width: 300, height: 300 }}>
                        <Skottie
                            animation={animation}
                            frame={frame}
                            style={{
                                width: 300,
                                height: 300
                            }}
                        />
                    </Canvas>
                ) : (
                    <Text style={{ color: 'red' }}>Failed to load animation</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 40,
    },
    canvasContainer: {
        width: 300,
        height: 300,
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#00ffff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00ffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    }
});
