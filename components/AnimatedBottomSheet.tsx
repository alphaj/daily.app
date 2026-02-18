import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPRING = { damping: 28, stiffness: 350, mass: 0.8 };

interface Props {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function AnimatedBottomSheet({ visible, onClose, children }: Props) {
    const [mounted, setMounted] = useState(false);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdrop = useSharedValue(0);
    const startY = useSharedValue(0);

    useEffect(() => {
        if (visible && mounted) {
            translateY.value = withSpring(0, SPRING);
            backdrop.value = withTiming(1, { duration: 250 });
        } else if (visible && !mounted) {
            translateY.value = SCREEN_HEIGHT;
            backdrop.value = 0;
            setMounted(true);
        } else if (!visible && mounted) {
            translateY.value = withSpring(SCREEN_HEIGHT, SPRING, (fin) => {
                if (fin) runOnJS(setMounted)(false);
            });
            backdrop.value = withTiming(0, { duration: 200 });
        }
    }, [visible, mounted]);

    const dismiss = useCallback(() => { onClose(); }, [onClose]);

    const pan = Gesture.Pan()
        .onStart(() => {
            startY.value = translateY.value;
        })
        .onUpdate((e) => {
            translateY.value = Math.max(0, startY.value + e.translationY);
        })
        .onEnd((e) => {
            if (e.translationY > 80 || e.velocityY > 500) {
                runOnJS(dismiss)();
            } else {
                translateY.value = withSpring(0, SPRING);
            }
        });

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdrop.value,
    }));

    if (!mounted) return null;

    return (
        <View style={StyleSheet.absoluteFillObject}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss} />
            </Animated.View>
            <View style={styles.bottom} pointerEvents="box-none">
                <Animated.View style={[styles.sheet, sheetStyle]}>
                    <GestureDetector gesture={pan}>
                        <Animated.View style={styles.handleArea}>
                            <View style={styles.handle} />
                        </Animated.View>
                    </GestureDetector>
                    {children}
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    bottom: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    handleArea: {
        paddingTop: 10,
        paddingBottom: 6,
        alignItems: 'center',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DDDDE0',
    },
});
