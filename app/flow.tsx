import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { AmbientBackground } from '@/components/AmbientBackground';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Droplets,
    Zap,
    Pill,
    Sun,
    Moon,
    Clock,
    Check
} from 'lucide-react-native';

import { useHabits } from '@/contexts/HabitContext';
import { useSupplements } from '@/contexts/SupplementContext';
import { useWater } from '@/contexts/WaterContext';
import { BottomNavBar } from '@/components/BottomNavBar';

const TimelineItem = ({
    time,
    title,
    subtitle,
    icon: Icon,
    color,
    isCompleted,
    onPress,
    isLast = false
}: {
    time: string;
    title: string;
    subtitle?: string;
    icon: any;
    color: string;
    isCompleted?: boolean;
    onPress: () => void;
    isLast?: boolean;
}) => (
    <Pressable
        style={({ pressed }) => [styles.timelineRow, pressed && styles.rowPressed]}
        onPress={() => {
            Haptics.selectionAsync();
            onPress();
        }}
    >
        <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{time}</Text>
        </View>

        <View style={styles.timelineGuide}>
            <View style={[styles.timelineDot, isCompleted && { backgroundColor: color, borderColor: color }]} />
            {!isLast && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.contentColumn}>
            <View style={[styles.card, isCompleted && { backgroundColor: color + '10' }]}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    {isCompleted ? <Check size={16} color={color} strokeWidth={3} /> : <Icon size={18} color={color} />}
                </View>
                <View style={styles.textContent}>
                    <Text style={[styles.cardTitle, isCompleted && { color: color, textDecorationLine: 'line-through' }]}>
                        {title}
                    </Text>
                    {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
                </View>
            </View>
        </View>
    </Pressable>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <View style={styles.sectionHeader}>
        <Icon size={16} color="#8E8E93" />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

export default function FlowScreen() {
    const router = useRouter();

    // Data
    const { habits } = useHabits();
    const { waterIntake, waterGoal } = useWater();
    const { activeSupplements, isTakenToday } = useSupplements();

    const morningHabits = habits.slice(0, 2); // Simulating time-based
    const eveningHabits = habits.slice(2);

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.screenTitle}>Today's Flow</Text>

                    {/* Morning Section */}
                    <SectionHeader title="MORNING ROUTINE" icon={Sun} />

                    {activeSupplements.map((s, i) => (
                        <TimelineItem
                            key={s.id}
                            time="8:00 AM"
                            title={`Take ${s.name}`}
                            icon={Pill}
                            color="#AF52DE"
                            isCompleted={isTakenToday(s)}
                            onPress={() => router.push('/add-supplement')}
                        />
                    ))}

                    {morningHabits.map((h, i) => (
                        <TimelineItem
                            key={h.id}
                            time="9:00 AM"
                            title={h.name}
                            icon={Zap}
                            color="#FF9500"
                            isCompleted={h.completedDates.includes(new Date().toISOString().split('T')[0])}
                            onPress={() => router.push('/habits')}
                        />
                    ))}

                    {/* All Day Section */}
                    <SectionHeader title="THROUGHOUT THE DAY" icon={Clock} />

                    <TimelineItem
                        time="ALL DAY"
                        title="Drink Water"
                        subtitle={`${waterIntake}/${waterGoal}ml`}
                        icon={Droplets}
                        color="#007AFF"
                        isCompleted={waterIntake >= waterGoal}
                        onPress={() => { }} // Could expand
                    />

                    {/* Evening Section */}
                    <SectionHeader title="EVENING WIND DOWN" icon={Moon} />

                    {/* End of Day */}
                    <View style={styles.endMarker}>
                        <View style={styles.endDot} />
                        <Text style={styles.endText}>End of Day</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    safeArea: { flex: 1 },
    content: { padding: 24, paddingBottom: 140 }, // Added padding bottom for nav bar
    screenTitle: { fontSize: 34, fontWeight: '800', color: '#000', marginBottom: 24 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', letterSpacing: 1 },

    timelineRow: { flexDirection: 'row', minHeight: 80 },
    rowPressed: { opacity: 0.7 },

    timeColumn: { width: 60, alignItems: 'flex-end', paddingRight: 12, paddingTop: 14 },
    timeText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },

    timelineGuide: { alignItems: 'center', width: 20 },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        marginTop: 14,
        zIndex: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E5EA',
        position: 'absolute',
        top: 26,
        bottom: -14
    },

    contentColumn: { flex: 1, paddingLeft: 12, paddingBottom: 24 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    iconContainer: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    textContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
    cardSubtitle: { fontSize: 13, color: '#8E8E93' },

    endMarker: { flexDirection: 'row', alignItems: 'center', marginLeft: 65, marginTop: 0, gap: 12 },
    endDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C7C7CC' },
    endText: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
});
