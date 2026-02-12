import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSupplementIcon } from '@/lib/supplementIcons';

interface SupplementIconProps {
    name: string;
    size?: number;
}

export const SupplementIcon = memo(function SupplementIcon({
    name,
    size = 26,
}: SupplementIconProps) {
    const { icon, color } = getSupplementIcon(name);
    const circleSize = size * 1.6;

    return (
        <View
            style={[
                styles.circle,
                {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: color + '1A', // 10% opacity
                },
            ]}
        >
            <MaterialCommunityIcons
                name={icon as any}
                size={size}
                color={color}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    circle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
