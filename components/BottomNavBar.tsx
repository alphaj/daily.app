import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Settings, Infinity, Plus, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export type NavRoute = 'home' | 'life' | 'menu' | 'command' | 'calendar';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

const NAV_ITEMS: { route: NavRoute; path: string; icon: any; label: string }[] = [
    { route: 'home', path: '/', icon: LayoutGrid, label: 'Home' },
    { route: 'life', path: '/life', icon: Infinity, label: 'Life' },
    { route: 'command', path: '', icon: Plus, label: 'Capture' }, // Middle button
    { route: 'calendar', path: '/history', icon: Calendar, label: 'Calendar' },
    { route: 'menu', path: '/menu', icon: Settings, label: 'Profile' },
];

function getActiveRoute(pathname: string): NavRoute {
    if (pathname === '/') return 'home';
    if (pathname === '/menu') return 'menu';
    if (pathname === '/inbox') return 'home';
    if (pathname === '/history') return 'calendar';
    // Life encompasses projects, habits, money, supplements, later
    if (
        pathname === '/life' ||
        pathname === '/projects' ||
        pathname.startsWith('/project/') ||
        pathname === '/habits' ||
        pathname === '/habit-detail' ||
        pathname === '/money' ||
        pathname === '/add-supplement' ||
        pathname === '/edit-supplement' ||
        pathname === '/later' ||
        pathname === '/health'
    ) return 'life';

    return 'home';
}

export function BottomNavBar({ onFabPress }: BottomNavBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const activeRoute = getActiveRoute(pathname);

    const handleNavPress = (route: NavRoute, path: string) => {
        Haptics.selectionAsync();

        if (route === 'command') {
            onFabPress?.();
            return;
        }

        if (pathname === path) return;

        // Use push for Settings so swipe-back gesture works
        if (route === 'menu') {
            router.push(path as any);
        } else {
            router.replace(path as any);
        }
    };

    const ContainerComponent = Platform.OS === 'web' ? View : BlurView;
    const containerProps = Platform.OS === 'web'
        ? {}
        : { intensity: 40, tint: 'light' as const }; // Reduced intensity for glass effect

    return (
        <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <ContainerComponent
                style={styles.container}
                {...containerProps}
            >
                <View style={styles.navContent}>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeRoute === item.route;
                        const isCommand = item.route === 'command';

                        if (isCommand) {
                            return (
                                <Pressable
                                    key={item.route}
                                    style={styles.commandTab}
                                    onPress={() => handleNavPress(item.route, item.path)}
                                >
                                    <View style={styles.commandButton}>
                                        <Icon size={24} color="#fff" strokeWidth={2.5} />
                                    </View>
                                </Pressable>
                            )
                        }

                        return (
                            <Pressable
                                key={item.route}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => handleNavPress(item.route, item.path)}
                            >
                                <Icon
                                    size={24}
                                    color={isActive ? '#000' : '#8E8E93'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <Text style={[styles.label, isActive && styles.labelActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ContainerComponent>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'box-none',
        zIndex: 100,
    },
    container: {
        width: '90%',
        maxWidth: 380,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.7)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 6,
        height: 72,
    },
    tab: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 34,
        gap: 4,
    },
    tabActive: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    commandTab: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commandButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: '#8E8E93',
        letterSpacing: -0.1,
    },
    labelActive: {
        color: '#000',
        fontWeight: '700',
    },
    // Leaving these for safety if referenced elsewhere, though unused in new design
    fabWrapper: {},
    fabSpacer: {},
    fabInner: {}
});
