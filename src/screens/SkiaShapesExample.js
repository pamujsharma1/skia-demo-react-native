import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import {
    Canvas,
    Circle,
    Group,
    LinearGradient,
    Path,
    Rect,
    RoundedRect,
    Skia,
    SweepGradient,
    vec,
    mix,
} from '@shopify/react-native-skia';
import {
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width;
const CENTER = CANVAS_SIZE / 2;

export default function SkiaShapesExample() {
    const navigation = useNavigation();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [progress]);

    // Derived animation values mapping progress (0 -> 1) to specific visual properties
    const animatedRadius = useDerivedValue(() => mix(progress.value, 40, 60));
    const animatedRotation = useDerivedValue(() => progress.value * Math.PI);
    const animatedScale = useDerivedValue(() => mix(progress.value, 0.8, 1.2));

    const transformCircle = useDerivedValue(() => [{ scale: animatedScale.value }]);
    const transformRect = useDerivedValue(() => [
        { translateX: CENTER },
        { translateY: CENTER },
        { rotate: animatedRotation.value },
        { translateX: -CENTER },
        { translateY: -CENTER },
    ]);

    // Create a custom Path (a star shape)
    const starPath = Skia.Path.Make();
    const starRadius = 50;
    const innerRadius = 20;
    const cx = CENTER;
    const cy = CENTER;
    const points = 5;
    const angle = Math.PI / points;

    for (let i = 0; i < 2 * points; i++) {
        const r = (i & 1) === 0 ? starRadius : innerRadius;
        const x = cx + Math.cos(i * angle - Math.PI / 2) * r;
        const y = cy + Math.sin(i * angle - Math.PI / 2) * r;
        if (i === 0) starPath.moveTo(x, y);
        else starPath.lineTo(x, y);
    }
    starPath.close();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Skia Shapes Gallery</Text>

            <View style={styles.canvasContainer}>
                <Canvas style={styles.canvas}>
                    {/* Background shapes container */}
                    <Group>
                        {/* 1. Standard Rect as a backdrop panel */}
                        <Rect x={20} y={20} width={CANVAS_SIZE - 40} height={CANVAS_SIZE - 40} color="#151515" />

                        {/* 2. RoundedRect with a Linear Gradient */}
                        <RoundedRect x={40} y={40} width={100} height={100} r={20}>
                            <LinearGradient
                                start={vec(40, 40)}
                                end={vec(140, 140)}
                                colors={['#ff00ff', '#00ffff']}
                            />
                        </RoundedRect>

                        {/* 3. Animated Rotating Rect */}
                        <Group transform={transformRect}>
                            <Rect x={CENTER - 30} y={CENTER - 150} width={60} height={60} color="#ffff00" opacity={0.8} />
                        </Group>
                    </Group>

                    {/* Foreground elements */}
                    <Group>
                        {/* 4. Animated Circle bounded within a Group */}
                        <Group transform={transformCircle} origin={vec(CANVAS_SIZE - 90, 90)}>
                            <Circle cx={CANVAS_SIZE - 90} cy={90} r={animatedRadius}>
                                <SweepGradient
                                    c={vec(CANVAS_SIZE - 90, 90)}
                                    colors={['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']}
                                />
                            </Circle>
                        </Group>

                        {/* 5. Custom Path (Star) centered */}
                        <Path path={starPath} color="#00ffcc" style="stroke" strokeWidth={4} strokeJoin="round" />

                        {/* 6. Another Path (Sine Wave) at the bottom */}
                        <Path
                            path={`M 40 ${CANVAS_SIZE - 80} Q ${CENTER / 2} ${CANVAS_SIZE - 150} ${CENTER} ${CANVAS_SIZE - 80} T ${CANVAS_SIZE - 40} ${CANVAS_SIZE - 80}`}
                            color="#ff00ff"
                            style="stroke"
                            strokeWidth={5}
                        />
                    </Group>
                </Canvas>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
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
        marginBottom: 20,
        letterSpacing: 2,
    },
    canvasContainer: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        borderColor: '#333',
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    canvas: {
        flex: 1,
    },
    backButton: {
        marginTop: 40,
        paddingVertical: 15,
        paddingHorizontal: 40,
        backgroundColor: '#222',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00ffff',
    },
    backButtonText: {
        color: '#00ffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
