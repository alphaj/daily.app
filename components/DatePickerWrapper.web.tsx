// Web implementation - simple fallback
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface DatePickerWrapperProps {
    value: Date;
    onChange: (date: Date | undefined) => void;
    minimumDate?: Date;
    show: boolean;
    onClose?: () => void;
}

export default function DatePickerWrapper({
    value,
    onChange,
    minimumDate,
    show,
    onClose,
}: DatePickerWrapperProps) {
    const handlePress = () => {
        const dateStr = window.prompt(
            'Enter target date (YYYY-MM-DD):',
            format(value, 'yyyy-MM-dd')
        );
        if (dateStr) {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                onChange(parsed);
            }
        }
    };

    return (
        <Pressable style={styles.container} onPress={handlePress}>
            <Text style={styles.text}>
                {format(value, 'MMMM d, yyyy')}
            </Text>
            <Text style={styles.hint}>Tap to change</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    text: {
        fontSize: 17,
        color: '#000',
    },
    hint: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
});
