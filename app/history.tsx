import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavBar } from '@/components/BottomNavBar';

export default function CalendarScreen() {
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.content}>
                    <Text style={styles.title}>Calendar Removed</Text>
                    <Text style={styles.message}>
                        The calendar feature has been temporarily removed due to stability issues.
                    </Text>
                </View>
            </SafeAreaView>
            <BottomNavBar />
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
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
