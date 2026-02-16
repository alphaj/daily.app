import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Briefcase } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface WorkToggleRowProps {
    isWork: boolean;
    onToggle: (value: boolean) => void;
}

export function WorkToggleRow({ isWork, onToggle }: WorkToggleRowProps) {
    const handleToggle = (value: boolean) => {
        Haptics.selectionAsync();
        onToggle(value);
    };

    return (
        <View style={styles.row}>
            <View style={styles.left}>
                <View style={[styles.iconContainer, { backgroundColor: isWork ? '#5856D6' : '#8E8E93' }]}>
                    <Briefcase size={18} color="#fff" />
                </View>
                <Text style={styles.label}>Work Related</Text>
            </View>
            <Switch
                value={isWork}
                onValueChange={handleToggle}
                trackColor={{ false: '#E5E5EA', true: '#5856D6' }}
                thumbColor="#fff"
                ios_backgroundColor="#E5E5EA"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 17,
        color: '#000',
        fontWeight: '400',
    },
});
