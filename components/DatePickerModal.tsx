import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    Animated,
    Dimensions,
    Platform,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Calendar, Sun, Sunrise, XCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, isToday, isTomorrow, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from 'date-fns';
import { useHaptics } from '@/hooks/useHaptics';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
}

// Custom calendar component that works on all platforms
function CustomCalendar({
    value,
    onChange,
    minimumDate
}: {
    value: Date;
    onChange: (date: Date) => void;
    minimumDate?: Date;
}) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(value));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    const prevMonth = () => {
        Haptics.selectionAsync();
        setCurrentMonth(prev => addDays(startOfMonth(prev), -1));
    };
    const nextMonth = () => {
        Haptics.selectionAsync();
        setCurrentMonth(prev => addDays(endOfMonth(prev), 1));
    };

    const minDate = minimumDate ? startOfDay(minimumDate) : null;

    return (
        <View style={calendarStyles.container}>
            <View style={calendarStyles.header}>
                <Pressable onPress={prevMonth} style={calendarStyles.navButton}>
                    <ChevronLeft size={20} color="#007AFF" />
                </Pressable>
                <Text style={calendarStyles.monthText}>
                    {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <Pressable onPress={nextMonth} style={calendarStyles.navButton}>
                    <ChevronRight size={20} color="#007AFF" />
                </Pressable>
            </View>

            <View style={calendarStyles.weekDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <Text key={i} style={calendarStyles.weekDayText}>{day}</Text>
                ))}
            </View>

            <View style={calendarStyles.daysGrid}>
                {Array(startDayOfWeek).fill(null).map((_, i) => (
                    <View key={`empty-${i}`} style={calendarStyles.dayCell} />
                ))}
                {days.map((day) => {
                    const isSelected = isSameDay(day, value);
                    const isDisabled = minDate && isBefore(day, minDate);
                    const isTodayDate = isToday(day);

                    return (
                        <Pressable
                            key={day.toISOString()}
                            style={[
                                calendarStyles.dayCell,
                                isSelected && calendarStyles.dayCellSelected,
                                isDisabled && calendarStyles.dayCellDisabled,
                            ]}
                            onPress={() => {
                                if (!isDisabled) {
                                    Haptics.selectionAsync();
                                    onChange(day);
                                }
                            }}
                            disabled={isDisabled}
                        >
                            <Text style={[
                                calendarStyles.dayText,
                                isSelected && calendarStyles.dayTextSelected,
                                isDisabled && calendarStyles.dayTextDisabled,
                                isTodayDate && !isSelected && calendarStyles.dayTextToday,
                            ]}>
                                {format(day, 'd')}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const calendarStyles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
    },
    monthText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    weekDays: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCellSelected: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
    },
    dayCellDisabled: {
        opacity: 0.3,
    },
    dayText: {
        fontSize: 16,
        color: '#1C1C1E',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    dayTextDisabled: {
        color: '#C7C7CC',
    },
    dayTextToday: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export function DatePickerModal({
    visible,
    onClose,
    selectedDate,
    onSelectDate,
}: DatePickerModalProps) {
    const { width: screenWidth } = useWindowDimensions();
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(visible);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [tempDate, setTempDate] = useState(selectedDate || new Date());

    const modalWidth = Math.min(screenWidth - 32, 380);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            setShowCustomPicker(false);
            setTempDate(selectedDate || new Date());
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 300,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsVisible(false);
            });
        }
    }, [visible, scaleAnim, opacityAnim, selectedDate]);

    const haptics = useHaptics();

    const handleSelect = (date: Date | null) => {
        haptics.action();
        onSelectDate(date);
        onClose();
    };

    const handleConfirmCustomDate = () => {
        haptics.doubleTap();
        handleSelect(tempDate);
    };

    if (!isVisible) return null;

    const quickOptions = [
        { label: 'Today', icon: Sun, date: new Date(), color: '#007AFF' },
        { label: 'Tomorrow', icon: Sunrise, date: addDays(new Date(), 1), color: '#FF9500' },
        { label: 'No Date', icon: XCircle, date: null, color: '#8E8E93' },
    ];

    return (
        <Modal
            transparent
            visible={true}
            statusBarTranslucent
            onRequestClose={onClose}
            animationType="none"
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                        {Platform.OS === 'web' ? (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                        ) : (
                            <BlurView
                                intensity={Platform.OS === 'ios' ? 30 : 50}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                    </Pressable>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.contentContainer,
                        {
                            width: modalWidth,
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Due Date</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={12}
                            style={({ pressed }) => [
                                styles.closeButton,
                                pressed && styles.closeButtonPressed,
                            ]}
                        >
                            <X size={20} color="#8E8E93" />
                        </Pressable>
                    </View>

                    <View style={styles.optionsContainer}>
                        {quickOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = option.date === null
                                ? selectedDate === null
                                : selectedDate && option.date &&
                                format(option.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

                            return (
                                <Pressable
                                    key={option.label}
                                    style={({ pressed }) => [
                                        styles.optionButton,
                                        isSelected && styles.optionButtonSelected,
                                        pressed && styles.optionButtonPressed,
                                    ]}
                                    onPress={() => handleSelect(option.date)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                                        <Icon size={22} color={option.color} />
                                    </View>
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]} numberOfLines={1}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.separator} />

                    {!showCustomPicker ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.customDateButton,
                                pressed && styles.customDateButtonPressed,
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setShowCustomPicker(true);
                            }}
                        >
                            <Calendar size={20} color="#007AFF" />
                            <Text style={styles.customDateText}>Pick a custom date...</Text>
                        </Pressable>
                    ) : (
                        <View style={styles.pickerContainer}>
                            <CustomCalendar
                                value={tempDate}
                                onChange={setTempDate}
                                minimumDate={new Date()}
                            />
                            <Pressable
                                style={styles.confirmButton}
                                onPress={handleConfirmCustomDate}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#E5E5EA',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: '#F9F9F9',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionButtonSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#E3F2FD',
    },
    optionButtonPressed: {
        opacity: 0.8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1C1C1E',
        textAlign: 'center',
    },
    optionTextSelected: {
        color: '#007AFF',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 16,
    },
    customDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        gap: 8,
    },
    customDateButtonPressed: {
        backgroundColor: '#F2F2F7',
    },
    customDateText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#007AFF',
    },
    pickerContainer: {
        alignItems: 'center',
    },
    confirmButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
