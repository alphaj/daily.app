// Native implementation (iOS/Android)
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

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
    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <DateTimePicker
                    value={value}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                        onChange(date);
                    }}
                    minimumDate={minimumDate}
                    style={styles.picker}
                />
            </View>
        );
    }

    // Android
    if (!show) return null;

    return (
        <DateTimePicker
            value={value}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={(event, date) => {
                onClose?.();
                if (date) onChange(date);
            }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        overflow: 'hidden',
    },
    picker: {
        height: 120,
        marginTop: -10,
    },
});
