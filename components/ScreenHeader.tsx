import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    showBorder?: boolean;
}

/**
 * ScreenHeader: Standard iOS Large Title Layout for non-calendar screens
 */
export function ScreenHeader({
    title,
    subtitle,
    rightElement,
    showBorder = false,
}: ScreenHeaderProps) {
    return (
        <View style={[styles.container, showBorder && styles.border]}>
            {/* Top Row: Subtitle/Date (Left) | Actions (Right) */}
            <View style={styles.topRow}>
                {subtitle && (
                    <Text style={styles.subtitleLabel}>
                        {subtitle.toUpperCase()}
                    </Text>
                )}

                {rightElement && (
                    <View style={styles.rightElement}>
                        {rightElement}
                    </View>
                )}
            </View>

            {/* Large Title Row */}
            <View style={styles.titleRow}>
                <Text style={styles.largeTitle}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
        backgroundColor: 'transparent',
        paddingBottom: 4,
    },
    border: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 4,
        height: 32,
    },
    subtitleLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    rightElement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    titleRow: {
        paddingHorizontal: 20,
        marginBottom: 12,
        justifyContent: 'center',
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.3,
    },
});
