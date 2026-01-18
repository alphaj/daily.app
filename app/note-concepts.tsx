import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    PenLine,
    Sparkles,
    Sun,
    Moon,
    ChevronDown,
    Clock,
    ListTodo,
    Target,
    Check,
    Flame,
} from 'lucide-react-native';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    TextInput,
    Animated,
    PanResponder,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// CONCEPT 1: Capture Bar (iMessage style)
// ============================================
function Concept1CaptureBar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteText, setNoteText] = useState('');
    const expandAnim = useRef(new Animated.Value(0)).current;

    const toggleExpand = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const toValue = isExpanded ? 0 : 1;
        Animated.spring(expandAnim, {
            toValue,
            useNativeDriver: false,
            damping: 20,
            stiffness: 90,
        }).start();
        setIsExpanded(!isExpanded);
    };

    const containerHeight = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [56, SCREEN_HEIGHT * 0.7],
    });

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 1</Text>
                <Text style={styles.conceptTitle}>Capture Bar</Text>
                <Text style={styles.conceptSubtitle}>iMessage-style floating input that expands</Text>
            </View>

            <View style={styles.mockPhone}>
                {/* Mock header */}
                <View style={styles.mockHeader}>
                    <Text style={styles.mockHeaderText}>Today</Text>
                </View>

                {/* Mock content */}
                <ScrollView style={styles.mockContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.mockSection}>
                        <View style={styles.mockSectionHeader}>
                            <ListTodo size={16} color="#000" />
                            <Text style={styles.mockSectionTitle}>Tasks</Text>
                        </View>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.mockTask}>
                                <View style={styles.mockCheckbox} />
                                <View style={styles.mockTaskLine} />
                            </View>
                        ))}
                    </View>

                    <View style={styles.mockSection}>
                        <View style={styles.mockSectionHeader}>
                            <Target size={16} color="#5856D6" />
                            <Text style={styles.mockSectionTitle}>Habits</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={styles.mockHabitCard}>
                                    <Text style={styles.mockEmoji}>🧘</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>

                {/* Capture Bar */}
                <Animated.View style={[styles.captureBarContainer, { height: containerHeight }]}>
                    <Pressable onPress={toggleExpand} style={styles.captureBar}>
                        {!isExpanded ? (
                            <>
                                <PenLine size={18} color="#8E8E93" />
                                <Text style={styles.captureBarPlaceholder}>What's on your mind?</Text>
                            </>
                        ) : (
                            <View style={styles.captureBarExpanded}>
                                <View style={styles.captureBarExpandedHeader}>
                                    <Text style={styles.captureBarExpandedTitle}>Today's Note</Text>
                                    <Pressable onPress={toggleExpand}>
                                        <Text style={styles.captureBarDone}>Done</Text>
                                    </Pressable>
                                </View>
                                <TextInput
                                    style={styles.captureBarInput}
                                    placeholder="Start writing..."
                                    placeholderTextColor="#C7C7CC"
                                    multiline
                                    value={noteText}
                                    onChangeText={setNoteText}
                                    autoFocus={isExpanded}
                                />
                            </View>
                        )}
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

// ============================================
// CONCEPT 2: Daily Canvas (Note as Background)
// ============================================
function Concept2DailyCanvas() {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    const toggleFocus = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const toValue = isFocused ? 0 : 1;
        Animated.spring(focusAnim, {
            toValue,
            useNativeDriver: true,
            damping: 20,
        }).start();
        setIsFocused(!isFocused);
    };

    const contentOpacity = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.15],
    });

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 2</Text>
                <Text style={styles.conceptTitle}>Daily Canvas</Text>
                <Text style={styles.conceptSubtitle}>Note lives behind content as a "journal page"</Text>
            </View>

            <Pressable style={styles.mockPhone} onPress={toggleFocus}>
                {/* Background Note Layer */}
                <View style={styles.canvasBackground}>
                    <Text style={[styles.canvasText, { opacity: isFocused ? 1 : 0.08 }]}>
                        Today was a productive day. Finished the design review and had a great workout. Need to remember to call Mom tomorrow. Feeling grateful for the sunny weather...
                    </Text>
                </View>

                {/* Foreground Content */}
                <Animated.View style={[styles.canvasForeground, { opacity: contentOpacity }]}>
                    <View style={styles.mockHeader}>
                        <Text style={styles.mockHeaderText}>Today</Text>
                    </View>

                    <View style={styles.mockSection}>
                        <View style={styles.mockSectionHeader}>
                            <ListTodo size={16} color="#000" />
                            <Text style={styles.mockSectionTitle}>Tasks</Text>
                        </View>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.mockTask}>
                                <View style={styles.mockCheckbox} />
                                <View style={styles.mockTaskLine} />
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Hint */}
                <View style={styles.canvasHint}>
                    <Text style={styles.canvasHintText}>
                        {isFocused ? 'Tap to show tasks' : 'Tap anywhere to reveal note'}
                    </Text>
                </View>
            </Pressable>
        </View>
    );
}

// ============================================
// CONCEPT 3: Morning/Evening Duality
// ============================================
function Concept3MorningEvening() {
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning');

    const toggleTime = () => {
        Haptics.selectionAsync();
        setTimeOfDay(t => t === 'morning' ? 'evening' : 'morning');
    };

    const isMorning = timeOfDay === 'morning';

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 3</Text>
                <Text style={styles.conceptTitle}>Morning/Evening</Text>
                <Text style={styles.conceptSubtitle}>Contextual prompts based on time of day</Text>
            </View>

            <View style={styles.mockPhone}>
                <LinearGradient
                    colors={isMorning ? ['#FFF9E6', '#FFE4B5'] : ['#1a1a2e', '#16213e']}
                    style={styles.timeGradient}
                >
                    <Pressable onPress={toggleTime} style={styles.timeToggle}>
                        <Text style={styles.timeToggleText}>Tap to toggle time</Text>
                    </Pressable>

                    <View style={styles.timeHeader}>
                        {isMorning ? (
                            <Sun size={32} color="#FF9500" />
                        ) : (
                            <Moon size={32} color="#5856D6" />
                        )}
                        <Text style={[styles.timeGreeting, { color: isMorning ? '#000' : '#fff' }]}>
                            {isMorning ? 'Good Morning' : 'Good Evening'}
                        </Text>
                    </View>

                    <View style={[styles.timeNoteCard, { backgroundColor: isMorning ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.timePrompt, { color: isMorning ? '#8E8E93' : 'rgba(255,255,255,0.6)' }]}>
                            {isMorning
                                ? "What do you intend to accomplish today?"
                                : "What are you grateful for today?"
                            }
                        </Text>
                        <View style={styles.timeInputArea}>
                            <Text style={[styles.timeInputPlaceholder, { color: isMorning ? '#C7C7CC' : 'rgba(255,255,255,0.3)' }]}>
                                Start writing...
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timeQuickStats}>
                        <View style={styles.timeStatItem}>
                            <Text style={[styles.timeStatNumber, { color: isMorning ? '#000' : '#fff' }]}>3</Text>
                            <Text style={[styles.timeStatLabel, { color: isMorning ? '#8E8E93' : 'rgba(255,255,255,0.5)' }]}>Tasks</Text>
                        </View>
                        <View style={styles.timeStatItem}>
                            <Text style={[styles.timeStatNumber, { color: isMorning ? '#000' : '#fff' }]}>2/4</Text>
                            <Text style={[styles.timeStatLabel, { color: isMorning ? '#8E8E93' : 'rgba(255,255,255,0.5)' }]}>Habits</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}

// ============================================
// CONCEPT 4: Pull Down to Reflect
// ============================================
function Concept4PullDown() {
    const [isPulledDown, setIsPulledDown] = useState(false);
    const pullAnim = useRef(new Animated.Value(0)).current;

    const togglePull = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const toValue = isPulledDown ? 0 : 1;
        Animated.spring(pullAnim, {
            toValue,
            useNativeDriver: true,
            damping: 18,
            stiffness: 80,
        }).start();
        setIsPulledDown(!isPulledDown);
    };

    const noteTranslateY = pullAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_HEIGHT * 0.6, 0],
    });

    const contentTranslateY = pullAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCREEN_HEIGHT * 0.5],
    });

    const handleOpacity = pullAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 4</Text>
                <Text style={styles.conceptTitle}>Pull Down to Reflect</Text>
                <Text style={styles.conceptSubtitle}>Like iOS Notification Center gesture</Text>
            </View>

            <View style={styles.mockPhone}>
                {/* Note Panel (slides down) */}
                <Animated.View style={[styles.pullDownNote, { transform: [{ translateY: noteTranslateY }] }]}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.pullDownNoteGradient}
                    >
                        <View style={styles.pullDownNoteContent}>
                            <Text style={styles.pullDownDate}>January 18, 2025</Text>
                            <Text style={styles.pullDownTitle}>Today's Reflection</Text>

                            <View style={styles.pullDownInputArea}>
                                <Text style={styles.pullDownPlaceholder}>How was your day? What are you grateful for?</Text>
                            </View>

                            <View style={styles.pullDownStats}>
                                <View style={styles.pullDownStatItem}>
                                    <Flame size={16} color="#FFD60A" />
                                    <Text style={styles.pullDownStatText}>7 day streak</Text>
                                </View>
                                <View style={styles.pullDownStatItem}>
                                    <PenLine size={16} color="#fff" />
                                    <Text style={styles.pullDownStatText}>234 words this week</Text>
                                </View>
                            </View>
                        </View>
                        <Pressable onPress={togglePull} style={styles.pullDownDismiss}>
                            <ChevronDown size={24} color="rgba(255,255,255,0.5)" />
                        </Pressable>
                    </LinearGradient>
                </Animated.View>

                {/* Main Content */}
                <Animated.View style={[styles.pullDownContent, { transform: [{ translateY: contentTranslateY }] }]}>
                    {/* Pull handle */}
                    <Animated.View style={[styles.pullHandle, { opacity: handleOpacity }]}>
                        <Pressable onPress={togglePull} style={styles.pullHandleInner}>
                            <ChevronDown size={20} color="#8E8E93" />
                            <Text style={styles.pullHandleText}>Pull down to reflect</Text>
                        </Pressable>
                    </Animated.View>

                    <View style={styles.mockHeader}>
                        <Text style={styles.mockHeaderText}>Today</Text>
                    </View>

                    <View style={styles.mockSection}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.mockTask}>
                                <View style={styles.mockCheckbox} />
                                <View style={styles.mockTaskLine} />
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

// ============================================
// CONCEPT 5: Time Capsule Notes
// ============================================
function Concept5TimeCapsule() {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 5</Text>
                <Text style={styles.conceptTitle}>Time Capsule</Text>
                <Text style={styles.conceptSubtitle}>Notes as letters to your future self</Text>
            </View>

            <View style={styles.mockPhone}>
                <View style={styles.capsuleContainer}>
                    {/* Header */}
                    <View style={styles.capsuleHeader}>
                        <Clock size={20} color="#5856D6" />
                        <Text style={styles.capsuleHeaderText}>Time Capsule</Text>
                    </View>

                    {/* Today's Entry */}
                    <View style={styles.capsuleCard}>
                        <Text style={styles.capsuleDate}>January 18, 2025</Text>
                        <Text style={styles.capsulePrompt}>Write a note to your future self...</Text>

                        <View style={styles.capsuleInput}>
                            <Text style={styles.capsuleInputText}>Start writing...</Text>
                        </View>

                        <Pressable
                            style={styles.capsuleScheduleBtn}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setShowOptions(!showOptions);
                            }}
                        >
                            <Sparkles size={16} color="#5856D6" />
                            <Text style={styles.capsuleScheduleText}>When should you see this again?</Text>
                        </Pressable>

                        {showOptions && (
                            <View style={styles.capsuleOptions}>
                                {['1 Week', '1 Month', '3 Months', '1 Year'].map(option => (
                                    <Pressable key={option} style={styles.capsuleOption}>
                                        <Text style={styles.capsuleOptionText}>{option}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Past Capsule (Surfaced) */}
                    <View style={styles.capsuleSurfaced}>
                        <View style={styles.capsuleSurfacedBadge}>
                            <Sparkles size={12} color="#fff" />
                            <Text style={styles.capsuleSurfacedBadgeText}>From 1 month ago</Text>
                        </View>
                        <Text style={styles.capsuleSurfacedDate}>December 18, 2024</Text>
                        <Text style={styles.capsuleSurfacedText}>
                            "Remember to appreciate the small moments. You've been working so hard..."
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ============================================
// CONCEPT 6: Long-press the Date
// ============================================
function Concept6LongPressDate() {
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const noteAnim = useRef(new Animated.Value(0)).current;

    const toggleNote = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const toValue = isNoteOpen ? 0 : 1;
        Animated.spring(noteAnim, {
            toValue,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
        }).start();
        setIsNoteOpen(!isNoteOpen);
    };

    const noteScale = noteAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1],
    });

    const noteOpacity = noteAnim;

    const contentOpacity = noteAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    return (
        <View style={styles.conceptContainer}>
            <View style={styles.conceptHeader}>
                <Text style={styles.conceptNumber}>Concept 6</Text>
                <Text style={styles.conceptTitle}>Long-press Date</Text>
                <Text style={styles.conceptSubtitle}>The date header becomes the portal to notes</Text>
            </View>

            <View style={styles.mockPhone}>
                {/* Normal State */}
                <Animated.View style={[styles.longPressContent, { opacity: contentOpacity }]}>
                    <Pressable
                        onLongPress={toggleNote}
                        delayLongPress={300}
                        style={styles.longPressDateHeader}
                    >
                        <Text style={styles.longPressSubDate}>SATURDAY • TODAY</Text>
                        <Text style={styles.longPressMainDate}>Jan 18, 2025</Text>
                        <Text style={styles.longPressHint}>Hold to write note</Text>
                    </Pressable>

                    <View style={styles.mockSection}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.mockTask}>
                                <View style={styles.mockCheckbox} />
                                <View style={styles.mockTaskLine} />
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Note Overlay */}
                {isNoteOpen && (
                    <Animated.View
                        style={[
                            styles.longPressOverlay,
                            {
                                opacity: noteOpacity,
                                transform: [{ scale: noteScale }],
                            }
                        ]}
                    >
                        <BlurView intensity={80} tint="light" style={styles.longPressBlur}>
                            <View style={styles.longPressNote}>
                                <View style={styles.longPressNoteHeader}>
                                    <View>
                                        <Text style={styles.longPressNoteDate}>January 18, 2025</Text>
                                        <Text style={styles.longPressNoteTitle}>Today's Note</Text>
                                    </View>
                                    <Pressable onPress={toggleNote} style={styles.longPressDoneBtn}>
                                        <Text style={styles.longPressDoneText}>Done</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.longPressNoteInput}>
                                    <Text style={styles.longPressNotePlaceholder}>
                                        What's on your mind today?
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function NoteConceptsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#000" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Daily Note Concepts</Text>
                    <View style={{ width: 44 }} />
                </View>

                <Text style={styles.instructions}>
                    Swipe horizontally to explore each concept. Interact with the mock screens!
                </Text>

                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={SCREEN_WIDTH}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Concept1CaptureBar />
                    <Concept2DailyCanvas />
                    <Concept3MorningEvening />
                    <Concept4PullDown />
                    <Concept5TimeCapsule />
                    <Concept6LongPressDate />
                </ScrollView>

                <View style={[styles.pageIndicator, { paddingBottom: insets.bottom + 16 }]}>
                    <Text style={styles.pageIndicatorText}>← Swipe to explore all 6 concepts →</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

// ============================================
// STYLES
// ============================================
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    instructions: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        paddingHorizontal: 32,
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 0,
    },
    pageIndicator: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    pageIndicatorText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
    },

    // Concept Container
    conceptContainer: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 20,
    },
    conceptHeader: {
        marginBottom: 16,
    },
    conceptNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5856D6',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    conceptTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    conceptSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },

    // Mock Phone
    mockPhone: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    mockHeader: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    mockHeaderText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
    },
    mockContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mockSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    mockSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    mockSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
    mockTask: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F8F8FA',
        borderRadius: 16,
        marginBottom: 8,
    },
    mockCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D1D6',
    },
    mockTaskLine: {
        flex: 1,
        height: 12,
        backgroundColor: '#E5E5EA',
        borderRadius: 6,
    },
    mockHabitCard: {
        width: 80,
        height: 90,
        backgroundColor: '#F8F8FA',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mockEmoji: {
        fontSize: 28,
    },

    // Concept 1: Capture Bar
    captureBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
    },
    captureBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 12,
    },
    captureBarPlaceholder: {
        fontSize: 16,
        color: '#8E8E93',
    },
    captureBarExpanded: {
        flex: 1,
        paddingTop: 16,
    },
    captureBarExpandedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    captureBarExpandedTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    captureBarDone: {
        fontSize: 17,
        fontWeight: '600',
        color: '#5856D6',
    },
    captureBarInput: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        lineHeight: 26,
    },

    // Concept 2: Daily Canvas
    canvasBackground: {
        position: 'absolute',
        top: 80,
        left: 20,
        right: 20,
        bottom: 20,
    },
    canvasText: {
        fontSize: 22,
        lineHeight: 34,
        color: '#5856D6',
        fontStyle: 'italic',
    },
    canvasForeground: {
        flex: 1,
    },
    canvasHint: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    canvasHintText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },

    // Concept 3: Morning/Evening
    timeGradient: {
        flex: 1,
        padding: 20,
    },
    timeToggle: {
        alignItems: 'center',
        marginBottom: 12,
    },
    timeToggleText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeHeader: {
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    timeGreeting: {
        fontSize: 28,
        fontWeight: '700',
    },
    timeNoteCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    timePrompt: {
        fontSize: 14,
        marginBottom: 12,
    },
    timeInputArea: {
        minHeight: 120,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 16,
        padding: 16,
    },
    timeInputPlaceholder: {
        fontSize: 16,
    },
    timeQuickStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
    },
    timeStatItem: {
        alignItems: 'center',
    },
    timeStatNumber: {
        fontSize: 32,
        fontWeight: '800',
    },
    timeStatLabel: {
        fontSize: 13,
    },

    // Concept 4: Pull Down
    pullDownNote: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.6,
        zIndex: 10,
    },
    pullDownNoteGradient: {
        flex: 1,
        padding: 20,
    },
    pullDownNoteContent: {
        flex: 1,
        paddingTop: 20,
    },
    pullDownDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
    },
    pullDownTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 20,
    },
    pullDownInputArea: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 16,
    },
    pullDownPlaceholder: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
    },
    pullDownStats: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 16,
    },
    pullDownStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pullDownStatText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    pullDownDismiss: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    pullDownContent: {
        flex: 1,
        backgroundColor: '#fff',
    },
    pullHandle: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    pullHandleInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    pullHandleText: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
    },

    // Concept 5: Time Capsule
    capsuleContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#FAFAFA',
    },
    capsuleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    capsuleHeaderText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    capsuleCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    capsuleDate: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 8,
    },
    capsulePrompt: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 16,
    },
    capsuleInput: {
        backgroundColor: '#F8F8FA',
        borderRadius: 16,
        padding: 16,
        minHeight: 80,
        marginBottom: 16,
    },
    capsuleInputText: {
        fontSize: 15,
        color: '#C7C7CC',
    },
    capsuleScheduleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: '#F0EFFF',
        borderRadius: 12,
    },
    capsuleScheduleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5856D6',
    },
    capsuleOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    capsuleOption: {
        backgroundColor: '#5856D6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    capsuleOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    capsuleSurfaced: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 2,
        borderColor: '#5856D6',
        borderStyle: 'dashed',
    },
    capsuleSurfacedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#5856D6',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    capsuleSurfacedBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    capsuleSurfacedDate: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 8,
    },
    capsuleSurfacedText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#000',
        lineHeight: 24,
    },

    // Concept 6: Long-press Date
    longPressContent: {
        flex: 1,
    },
    longPressDateHeader: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
    },
    longPressSubDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    longPressMainDate: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1,
    },
    longPressHint: {
        fontSize: 12,
        color: '#5856D6',
        marginTop: 8,
        fontWeight: '600',
    },
    longPressOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    longPressBlur: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    longPressNote: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
    },
    longPressNoteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    longPressNoteDate: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 4,
    },
    longPressNoteTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#000',
    },
    longPressDoneBtn: {
        backgroundColor: '#5856D6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    longPressDoneText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    longPressNoteInput: {
        backgroundColor: '#F8F8FA',
        borderRadius: 20,
        padding: 20,
        minHeight: 200,
    },
    longPressNotePlaceholder: {
        fontSize: 17,
        color: '#C7C7CC',
        lineHeight: 26,
    },
});
