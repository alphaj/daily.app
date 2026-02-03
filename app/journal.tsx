import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, parseISO, isToday, isYesterday, addDays, subDays, isFuture } from 'date-fns';

import { AmbientBackground } from '@/components/AmbientBackground';
import { BottomNavBar } from '@/components/BottomNavBar';
import { useJournal } from '@/contexts/JournalContext';
import { JournalEntry, Mood } from '@/types/journal';

const MOOD_EMOJI: Record<Mood, string> = {
    great: '🤩',
    good: '😊',
    okay: '😐',
    low: '😔',
    rough: '😣',
};

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function EntryCard({ entry }: { entry: JournalEntry }) {
    const time = format(parseISO(entry.createdAt), 'h:mm a');

    return (
        <Pressable
            style={({ pressed }) => [
                styles.entryCard,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => {
                Haptics.selectionAsync();
                // TODO: Navigate to entry detail
            }}
        >
            <View style={styles.entryHeader}>
                <View style={styles.entryMeta}>
                    <Text style={styles.entryTime}>{time}</Text>
                    <View style={styles.durationBadge}>
                        <Mic size={12} color="#8E8E93" strokeWidth={2} />
                        <Text style={styles.durationText}>{formatDuration(entry.duration)}</Text>
                    </View>
                </View>
                {entry.mood && (
                    <Text style={styles.moodEmoji}>{MOOD_EMOJI[entry.mood]}</Text>
                )}
            </View>

            <Text style={styles.entryTranscript} numberOfLines={3}>
                {entry.transcript}
            </Text>
        </Pressable>
    );
}

export default function JournalScreen() {
    const router = useRouter();
    const { getEntriesForDate } = useJournal();

    const [selectedDate, setSelectedDate] = useState(new Date());

    const selectedDateStr = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [selectedDate]);

    const selectedEntries = useMemo(() => {
        return getEntriesForDate(selectedDateStr).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
        );
    }, [getEntriesForDate, selectedDateStr]);

    const isSelectedToday = isToday(selectedDate);
    const canGoForward = !isFuture(addDays(selectedDate, 1));

    const handlePrevDay = () => {
        Haptics.selectionAsync();
        setSelectedDate(prev => subDays(prev, 1));
    };

    const handleNextDay = () => {
        if (canGoForward) {
            Haptics.selectionAsync();
            setSelectedDate(prev => addDays(prev, 1));
        }
    };

    const handleToday = () => {
        if (!isSelectedToday) {
            Haptics.selectionAsync();
            setSelectedDate(new Date());
        }
    };

    return (
        <View style={styles.container}>
            <AmbientBackground />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header with Today Button */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={24} color="#000" strokeWidth={2} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Journal</Text>

                    <Pressable
                        style={[styles.todayButton, isSelectedToday && styles.todayButtonActive]}
                        onPress={handleToday}
                        disabled={isSelectedToday}
                    >
                        <Text style={[styles.todayButtonText, isSelectedToday && styles.todayButtonTextActive]}>
                            Today
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Date Navigation */}
                    <View style={styles.dateNavigation}>
                        <Pressable
                            style={styles.navArrow}
                            onPress={handlePrevDay}
                        >
                            <ChevronLeft size={24} color="#000" strokeWidth={2} />
                        </Pressable>

                        <View style={styles.dateDisplay}>
                            <Text style={styles.dateLabel}>
                                {isToday(selectedDate) ? 'Today' : isYesterday(selectedDate) ? 'Yesterday' : format(selectedDate, 'EEEE')}
                            </Text>
                            <Text style={styles.dateFull}>
                                {format(selectedDate, 'MMMM d, yyyy')}
                            </Text>
                        </View>

                        <Pressable
                            style={[styles.navArrow, !canGoForward && styles.navArrowDisabled]}
                            onPress={handleNextDay}
                            disabled={!canGoForward}
                        >
                            <ChevronRight size={24} color={canGoForward ? "#000" : "#C7C7CC"} strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* Entries for Selected Date */}
                    {selectedEntries.length > 0 ? (
                        <View style={styles.selectedDaySection}>
                            <View style={styles.entriesHeader}>
                                <Text style={styles.entriesCount}>
                                    {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'}
                                </Text>
                            </View>
                            {selectedEntries.map(entry => (
                                <EntryCard key={entry.id} entry={entry} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyDayState}>
                            <View style={styles.emptyIconBg}>
                                <Mic size={40} color="#C7C7CC" strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No entries for this day</Text>
                            {isSelectedToday && (
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.recordNowButton,
                                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        router.push('/add-journal');
                                    }}
                                >
                                    <Mic size={18} color="#FFF" strokeWidth={2.5} />
                                    <Text style={styles.recordNowText}>Start Recording</Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Floating Action Button */}
                {isSelectedToday && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.fab,
                            pressed && { transform: [{ scale: 0.92 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            router.push('/add-journal');
                        }}
                    >
                        <Mic size={28} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                )}
            </SafeAreaView>
            <BottomNavBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        letterSpacing: -0.4,
    },
    todayButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    todayButtonActive: {
        backgroundColor: '#5856D6',
    },
    todayButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    todayButtonTextActive: {
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 140,
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    navArrow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navArrowDisabled: {
        opacity: 0.3,
    },
    dateDisplay: {
        alignItems: 'center',
        flex: 1,
    },
    dateLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 2,
        letterSpacing: -0.2,
    },
    dateFull: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        letterSpacing: -0.5,
    },
    selectedDaySection: {
        gap: 12,
    },
    entriesHeader: {
        marginBottom: 4,
    },
    entriesCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    entryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 2,
    },
    entryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    entryMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    entryTime: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(142, 142, 147, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    moodEmoji: {
        fontSize: 20,
    },
    entryTranscript: {
        fontSize: 15,
        lineHeight: 22,
        color: '#000',
        letterSpacing: -0.2,
    },
    emptyDayState: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(199, 199, 204, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    recordNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#5856D6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 20,
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    recordNowText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#5856D6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
});
