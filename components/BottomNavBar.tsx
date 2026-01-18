import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Settings, Target, ListTodo, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export type NavRoute = 'home' | 'menu' | 'projects' | 'habits';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

const NAV_ITEMS: { route: NavRoute; path: string; icon: any; label: string }[] = [
    { route: 'home', path: '/', icon: LayoutGrid, label: 'Home' },
    { route: 'projects', path: '/projects', icon: Target, label: 'Projects' },
    { route: 'habits', path: '/habits', icon: ListTodo, label: 'Habits' },
    { route: 'menu', path: '/menu', icon: Settings, label: 'Menu' },
];

function getActiveRoute(pathname: string): NavRoute {
    if (pathname === '/') return 'home';
    if (pathname === '/menu') return 'menu';
    if (pathname === '/projects' || pathname.startsWith('/project/')) return 'projects';
    if (pathname === '/habits' || pathname === '/habit-detail') return 'habits';

    return 'home';
}

export function BottomNavBar({ onFabPress }: BottomNavBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const activeRoute = getActiveRoute(pathname);

    const handleNavPress = (route: NavRoute, path: string) => {
        if (route === activeRoute) return;
        Haptics.selectionAsync();
        // Use push for menu so swipe-back gesture works
        if (route === 'menu') {
            router.push(path as any);
        } else {
            router.replace(path as any);
        }
    };

    const handleFabPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onFabPress) {
            onFabPress();
        } else {
            switch (activeRoute) {
                case 'habits':
                    router.push('/add-habit');
                    break;
                case 'projects':
                    router.push('/add-project');
                    break;
                default:
                    router.push('/add-todo');
                    break;
            }
        }
    };

    const leftItems = NAV_ITEMS.slice(0, 2);
    const rightItems = NAV_ITEMS.slice(2);

    const ContainerComponent = Platform.OS === 'web' ? View : BlurView;
    const containerProps = Platform.OS === 'web'
        ? {}
        : { intensity: 80, tint: 'light' as const };

    return (
        <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* FAB positioned absolutely to avoid clipping */}
            <Pressable style={styles.fabWrapper} onPress={handleFabPress}>
                <View style={styles.fabInner}>
                    <Plus size={24} color="#fff" strokeWidth={3} />
                </View>
            </Pressable>

            <ContainerComponent
                style={styles.container}
                {...containerProps}
            >
                <View style={styles.navContent}>
                    {leftItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeRoute === item.route;
                        return (
                            <Pressable
                                key={item.route}
                                style={styles.tab}
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

                    {/* Spacer for FAB */}
                    <View style={styles.fabSpacer} />

                    {rightItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeRoute === item.route;
                        return (
                            <Pressable
                                key={item.route}
                                style={styles.tab}
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
    },
    container: {
        width: '92%',
        maxWidth: 400,
        borderRadius: 36,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.85)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            },
        }),
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 70, // Fixed height for consistency
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: '#8E8E93',
    },
    labelActive: {
        color: '#000',
        fontWeight: '700',
    },
    fabWrapper: {
        position: 'absolute',
        top: -20,
        alignSelf: 'center',
        zIndex: 10,
    },
    fabSpacer: {
        width: 60,
        height: 50,
    },
    fabInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000', // Black FAB for contrast
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 3,
        borderColor: '#fff',
    }
});
