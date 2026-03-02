/**
 * Bottom Nav Bar — "Liquid"
 * Floating bar with a smooth sliding accent pill that animates between tabs.
 * Soft, rounded, playful. Uses reanimated for buttery spring physics.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarRange, Clock, Heart, User, Plus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useBuddy } from '@/contexts/BuddyContext';
import { useBuddyInteractions } from '@/hooks/useBuddyInteractions';

export type NavRoute = 'today' | 'schedule' | 'buddy' | 'profile';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

function getActiveRoute(pathname: string): NavRoute {
    if (pathname === '/schedule') return 'schedule';
    if (pathname === '/buddy' || pathname.startsWith('/buddy-detail')) return 'buddy';
    if (pathname === '/menu' || pathname.startsWith('/settings-') || pathname === '/buddy-settings' || pathname === '/incomplete') return 'profile';
    return 'today';
}

// Slot indices: 0=today, 1=schedule, [2=FAB], 3=buddy, 4=profile
function getSlotIndex(route: NavRoute): number {
    switch (route) {
        case 'today': return 0;
        case 'schedule': return 1;
        case 'buddy': return 3;
        case 'profile': return 4;
    }
}

const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };
const BAR_PAD = 6;
const TOTAL_SLOTS = 5;

export function BottomNavBar(_props: BottomNavBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { activeBuddies } = useBuddy();
    const { unreadCount } = useBuddyInteractions();
    const activeRoute = getActiveRoute(pathname);

    const [barWidth, setBarWidth] = useState(0);
    const pillX = useSharedValue(0);

    const handleBarLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setBarWidth(w);
        const slotWidth = (w - BAR_PAD * 2) / TOTAL_SLOTS;
        const idx = getSlotIndex(activeRoute);
        pillX.value = BAR_PAD + idx * slotWidth;
    }, [activeRoute]);

    const handleNavPress = (route: NavRoute, path: string) => {
        Haptics.selectionAsync();
        if (pathname === path) return;
        if (barWidth > 0) {
            const slotWidth = (barWidth - BAR_PAD * 2) / TOTAL_SLOTS;
            const idx = getSlotIndex(route);
            pillX.value = withSpring(BAR_PAD + idx * slotWidth, SPRING_CONFIG);
        }
        router.replace(path as any);
    };

    const buddyLabel = activeBuddies.length === 1
        ? activeBuddies[0].partner_name?.split(' ')[0] ?? 'Buddy'
        : activeBuddies.length > 1 ? 'Buddies' : 'Buddy';

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-todo' as any);
    };

    const navItems: { route: NavRoute; path: string; icon: any; label: string }[] = [
        { route: 'today', path: '/history', icon: CalendarRange, label: 'Today' },
        { route: 'schedule', path: '/schedule', icon: Clock, label: 'Schedule' },
        { route: 'buddy', path: '/buddy', icon: Heart, label: buddyLabel },
        { route: 'profile', path: '/menu', icon: User, label: 'Profile' },
    ];

    const slotWidth = barWidth > 0 ? (barWidth - BAR_PAD * 2) / TOTAL_SLOTS : 0;

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: pillX.value }],
        width: slotWidth,
    }));

    const renderNavItem = (item: typeof navItems[0]) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.route;

        return (
            <Pressable
                key={item.route}
                style={styles.tab}
                onPress={() => handleNavPress(item.route, item.path)}
            >
                <Icon
                    size={20}
                    color={isActive ? '#FFFFFF' : '#8E8E93'}
                    strokeWidth={isActive ? 2.0 : 1.4}
                />
                <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                    {item.label}
                </Text>
                {item.route === 'buddy' && unreadCount > 0 && (
                    <View style={[styles.unreadBadge, isActive && styles.unreadBadgeOnPill]} />
                )}
            </Pressable>
        );
    };

    return (
        <View style={[styles.outerWrapper, { bottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.shadowContainer}>
                <View style={styles.bar} onLayout={handleBarLayout}>
                    {/* Sliding pill */}
                    {barWidth > 0 && (
                        <Animated.View style={[styles.pill, pillStyle]}>
                            <View style={styles.pillInner} />
                        </Animated.View>
                    )}
                    {/* Nav items */}
                    <View style={styles.navContent}>
                        {renderNavItem(navItems[0])}
                        {renderNavItem(navItems[1])}
                        <Pressable
                            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                            onPress={handleAddPress}
                        >
                            <Plus size={20} color="#1C1C1E" strokeWidth={2.5} />
                        </Pressable>
                        {renderNavItem(navItems[2])}
                        {renderNavItem(navItems[3])}
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        left: 24,
        right: 24,
        zIndex: 100,
    },
    shadowContainer: {
        borderRadius: 28,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: { elevation: 10 },
        }),
    },
    bar: {
        backgroundColor: '#F5F5F7',
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
    },
    pill: {
        position: 'absolute',
        top: 6,
        height: 56 - 12,
        zIndex: 0,
    },
    pillInner: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        marginHorizontal: 2,
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 6,
        zIndex: 1,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        gap: 2,
    },
    label: {
        fontSize: 9,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    labelActive: {
        color: 'rgba(255,255,255,0.85)',
    },
    addButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    addButtonPressed: {
        opacity: 0.5,
    },
    unreadBadge: {
        position: 'absolute',
        top: 10,
        right: '25%',
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#FF3B30',
        borderWidth: 1.5,
        borderColor: '#F5F5F7',
    },
    unreadBadgeOnPill: {
        borderColor: '#1C1C1E',
    },
});
