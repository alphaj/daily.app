import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarRange, CircleDashed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export type NavRoute = 'today' | 'focus';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

const NAV_ITEMS: { route: NavRoute; path: string; icon: any; label: string }[] = [
    { route: 'today', path: '/history', icon: CalendarRange, label: 'Today' },
    { route: 'focus', path: '/flow', icon: CircleDashed, label: 'Focus' },
];

function getActiveRoute(pathname: string): NavRoute {
    if (pathname === '/flow') return 'focus';
    return 'today';
}

export function BottomNavBar({ onFabPress }: BottomNavBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const activeRoute = getActiveRoute(pathname);

    const handleNavPress = (route: NavRoute, path: string) => {
        Haptics.selectionAsync();
        if (pathname === path) return;
        router.replace(path as any);
    };

    return (
        <View style={[styles.outerWrapper, { bottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.shadowContainer}>
                <View style={styles.container}>
                    <View style={styles.navContent}>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeRoute === item.route;

                            return (
                                <Pressable
                                    key={item.route}
                                    style={[styles.tab, isActive && styles.tabActive]}
                                    onPress={() => handleNavPress(item.route, item.path)}
                                >
                                    {isActive ? (
                                        <View style={styles.activePillOuter}>
                                            <View style={styles.activePillContent}>
                                                <Icon
                                                    size={20}
                                                    color="#1C1C1E"
                                                    strokeWidth={2.2}
                                                />
                                                <Text style={styles.activeLabel}>
                                                    {item.label}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.inactiveIcon}>
                                            <Icon
                                                size={22}
                                                color="#6E6E73"
                                                strokeWidth={1.6}
                                            />
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 100,
    },
    shadowContainer: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    container: {
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    tabActive: {
        flex: 1.6,
    },
    inactiveIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    activePillOuter: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: 'rgba(120, 120, 128, 0.08)',
    },
    activePillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    activeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.2,
    },
});
