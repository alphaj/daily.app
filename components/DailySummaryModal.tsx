import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, isToday, subDays } from 'date-fns';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MORNING_PROMPT_KEY = 'last_morning_prompt';
const EVENING_PROMPT_KEY = 'last_evening_prompt';

type TimeOfDay = 'morning' | 'evening' | null;

function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 18 && hour < 22) return 'evening';
    return null;
}

interface DailySummaryModalProps {
    visible: boolean;
    onDismiss: () => void;
    habitsCompletedYesterday?: number;
    totalHabits?: number;
    tasksCompletedYesterday?: number;
    pendingTasks?: number;
}

export function DailySummaryModal({
    visible,
    onDismiss,
    habitsCompletedYesterday = 0,
    totalHabits = 0,
    tasksCompletedYesterday = 0,
    pendingTasks = 0,
}: DailySummaryModalProps) {
    const insets = useSafeAreaInsets();
    const timeOfDay = getTimeOfDay();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible, fadeAnim, slideAnim]);

    const handleDismiss = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDismiss();
    };

    const isMorning = timeOfDay === 'morning';
    const habitPercent = totalHabits > 0 ? Math.round((habitsCompletedYesterday / totalHabits) * 100) : 0;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.content,
                        {
                            paddingBottom: Math.max(insets.bottom, 24),
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Greeting */}
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: isMorning ? '#FFF9E6' : '#E6E6FF' }]}>
                            {isMorning ? (
                                <Sun size={28} color="#FFCC00" strokeWidth={2} />
                            ) : (
                                <Moon size={28} color="#5856D6" strokeWidth={2} />
                            )}
                        </View>
                        <Text style={styles.greeting}>
                            {isMorning ? 'Good morning!' : 'Good evening!'}
                        </Text>
                        <Text style={styles.date}>{format(new Date(), 'EEEE, MMM d')}</Text>
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        {isMorning ? (
                            <>
                                <Text style={styles.statsTitle}>Yesterday's Progress</Text>
                                <View style={styles.statRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{habitPercent}%</Text>
                                        <Text style={styles.statLabel}>Habits done</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{tasksCompletedYesterday}</Text>
                                        <Text style={styles.statLabel}>Tasks completed</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.statsTitle}>Today's Summary</Text>
                                <View style={styles.statRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{pendingTasks}</Text>
                                        <Text style={styles.statLabel}>Tasks remaining</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Message */}
                    <View style={styles.messageContainer}>
                        <Sparkles size={18} color="#5856D6" strokeWidth={2} />
                        <Text style={styles.message}>
                            {isMorning
                                ? habitPercent >= 80
                                    ? "Great momentum! Keep it going today. 💪"
                                    : "New day, fresh start. You've got this!"
                                : pendingTasks === 0
                                    ? "All done! Enjoy your evening. 🌙"
                                    : "Take it easy. Tomorrow is another day."}
                        </Text>
                    </View>

                    {/* Action Button */}
                    <Pressable style={styles.actionButton} onPress={handleDismiss}>
                        <Text style={styles.actionButtonText}>
                            {isMorning ? "Let's go!" : 'Got it'}
                        </Text>
                        <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
}

// Hook to manage daily summary modal visibility
export function useDailySummary() {
    const [shouldShow, setShouldShow] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(null);

    useEffect(() => {
        checkShouldShow();
    }, []);

    const checkShouldShow = async () => {
        const currentTimeOfDay = getTimeOfDay();
        if (!currentTimeOfDay) {
            setShouldShow(false);
            return;
        }

        const storageKey = currentTimeOfDay === 'morning' ? MORNING_PROMPT_KEY : EVENING_PROMPT_KEY;
        const lastShown = await AsyncStorage.getItem(storageKey);

        if (!lastShown || !isToday(new Date(lastShown))) {
            setTimeOfDay(currentTimeOfDay);
            setShouldShow(true);
        }
    };

    const markShown = async () => {
        if (!timeOfDay) return;
        const storageKey = timeOfDay === 'morning' ? MORNING_PROMPT_KEY : EVENING_PROMPT_KEY;
        await AsyncStorage.setItem(storageKey, new Date().toISOString());
        setShouldShow(false);
    };

    return { shouldShow, markShown, timeOfDay };
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    date: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statsCard: {
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
        textAlign: 'center',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 4,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#C7C7CC',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        backgroundColor: '#F5F5FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    message: {
        fontSize: 15,
        color: '#000',
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#000',
        borderRadius: 50,
        paddingVertical: 18,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    actionButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});
