import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight } from 'lucide-react-native';
import { Gyroscope } from 'expo-sensors';

const { width } = Dimensions.get('window');

// Mock Data for the Preview Card
const INITIAL_PREVIEW_HABITS = [
    { id: '1', title: 'Morning meditation', completed: true, color: '#34C759' },
    { id: '2', title: 'Read 30 mins', completed: false, color: '#FF9500' },
    { id: '3', title: 'Drink water', completed: false, color: '#007AFF' },
];

function ProductivityCard() {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [habits, setHabits] = React.useState(INITIAL_PREVIEW_HABITS);

    // Gyroscope-based parallax effect for that premium iOS feel
    const parallaxX = useRef(new Animated.Value(0)).current;
    const parallaxY = useRef(new Animated.Value(0)).current;
    const rotateX = useRef(new Animated.Value(0)).current;
    const rotateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial slide-in animation
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // Set up gyroscope for parallax effect
        Gyroscope.setUpdateInterval(16); // ~60fps

        const subscription = Gyroscope.addListener((gyroscopeData) => {
            const { x, y, z } = gyroscopeData;

            // DEBUG: Log gyroscope values
            console.log('Gyroscope:', { x, y, z });

            // MUCH higher sensitivity for obvious effect
            const sensitivity = 50;
            const maxOffset = 40;

            // Calculate target positions (inverted for natural feel)
            const targetX = Math.max(-maxOffset, Math.min(maxOffset, -y * sensitivity));
            const targetY = Math.max(-maxOffset, Math.min(maxOffset, x * sensitivity));

            console.log('Parallax targets:', { targetX, targetY });

            // Smooth spring animation for natural motion
            Animated.parallel([
                Animated.spring(parallaxX, {
                    toValue: targetX,
                    tension: 20,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.spring(parallaxY, {
                    toValue: targetY,
                    tension: 20,
                    friction: 10,
                    useNativeDriver: true,
                }),
                // Rotate for depth effect - more aggressive
                Animated.spring(rotateX, {
                    toValue: x * 5, // degrees - increased from 2
                    tension: 20,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.spring(rotateY, {
                    toValue: -y * 5, // degrees - increased from 2
                    tension: 20,
                    friction: 10,
                    useNativeDriver: true,
                })
            ]).start();
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const toggleHabit = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setHabits(current =>
            current.map(h => {
                if (h.id === id) {
                    const newCompleted = !h.completed;
                    if (newCompleted) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    return { ...h, completed: newCompleted };
                }
                return h;
            })
        );
    };

    // Get dynamic date
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

    return (
        <Animated.View style={[
            styles.cardContainer,
            {
                opacity: fadeAnim,
                transform: [
                    { translateX: parallaxX },
                    {
                        translateY: Animated.add(slideAnim, parallaxY)
                    },
                    { perspective: 1000 },
                    {
                        rotateX: rotateX.interpolate({
                            inputRange: [-10, 10],
                            outputRange: ['-10deg', '10deg']
                        })
                    },
                    {
                        rotateY: rotateY.interpolate({
                            inputRange: [-10, 10],
                            outputRange: ['-10deg', '10deg']
                        })
                    },
                    { scale: 0.95 }
                ]
            }
        ]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardSubtitle}>{dateString}</Text>
                    <Text style={styles.cardTitle}>Today</Text>
                </View>
                <View style={styles.avatarPlaceholder} />
            </View>

            {/* Card List */}
            <View style={styles.cardList}>
                {habits.map((habit, index) => (
                    <Pressable
                        key={habit.id}
                        onPress={() => toggleHabit(habit.id)}
                        style={({ pressed }) => [
                            styles.habitRow,
                            index !== habits.length - 1 && styles.habitRowBorder,
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <View style={[
                            styles.checkbox,
                            habit.completed ? { backgroundColor: habit.color, borderColor: habit.color } : { borderColor: '#C7C7CC' }
                        ]}>
                            {habit.completed && <Check size={12} color="white" strokeWidth={4} />}
                        </View>
                        <Text style={[
                            styles.habitText,
                            habit.completed && styles.habitTextCompleted
                        ]}>{habit.title}</Text>
                    </Pressable>
                ))}
            </View>
        </Animated.View>
    );
}

export default function GetStartedScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/(onboarding)/notifications');
    };

    const handleLogin = () => {
        Haptics.selectionAsync();
        // Placeholder for login logic
        alert("Login flow not implemented yet!");
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#F2F2F7', '#FFFFFF', '#E0F7FA']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.visualsContainer}>
                    <ProductivityCard />
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>
                        Reach{'\n'}
                        <Text style={{ fontWeight: '400' }}>your</Text>{'\n'}
                        life{'\n'}
                        goals
                    </Text>

                    <View style={styles.bottomActions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.getStartedButton,
                                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                            ]}
                            onPress={handleGetStarted}
                        >
                            <Text style={styles.getStartedText}>Get started</Text>
                            <ChevronRight size={20} color="white" />
                        </Pressable>

                        <View style={styles.disclaimerContainer}>
                            <Text style={styles.disclaimerText}>
                                By continuing you're accepting our{'\n'}
                            </Text>
                            <View style={styles.disclaimerLinks}>
                                <Pressable onPress={() => router.push('/privacy-policy')}>
                                    <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Terms of Use</Text>
                                </Pressable>
                                <Text style={styles.disclaimerText}> and </Text>
                                <Pressable onPress={() => router.push('/privacy-policy')}>
                                    <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Privacy Notice</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    visualsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    contentContainer: {
        paddingHorizontal: 32,
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    title: {
        fontSize: 64,
        fontWeight: '900',
        color: '#1c1c1e',
        lineHeight: 60,
        textTransform: 'lowercase',
        marginBottom: 40,
        letterSpacing: -2,
    },
    bottomActions: {
        gap: 16,
        alignItems: 'center',
    },
    getStartedButton: {
        backgroundColor: '#000',
        width: '100%',
        paddingVertical: 20,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    getStartedText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 8,
    },
    secondaryText: {
        color: '#1c1c1e',
        fontSize: 16,
        fontWeight: '500',
    },
    disclaimerContainer: {
        alignItems: 'center',
    },
    disclaimerText: {
        textAlign: 'center',
        color: '#8e8e93',
        fontSize: 12,
        lineHeight: 18,
    },
    disclaimerLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disclaimerLink: {
        textDecorationLine: 'underline',
    },

    // Card Styles
    cardContainer: {
        width: width * 0.75,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F2F2F7',
    },
    cardList: {
        gap: 0,
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    habitRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    habitText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    habitTextCompleted: {
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    }
});
