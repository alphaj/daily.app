import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Inbox, Target, ListTodo, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export type NavRoute = 'home' | 'inbox' | 'projects' | 'habits' | 'menu';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

const NAV_ITEMS: { route: NavRoute; path: string; icon: any }[] = [
    { route: 'home', path: '/', icon: LayoutGrid },
    { route: 'projects', path: '/projects', icon: Target },
    { route: 'habits', path: '/habits', icon: ListTodo },
    { route: 'inbox', path: '/inbox', icon: Inbox },
];

function getActiveRoute(pathname: string): NavRoute {
    if (pathname === '/') return 'home';
    if (pathname === '/inbox' || pathname === '/brain-dump') return 'inbox';
    if (pathname === '/projects' || pathname.startsWith('/project/')) return 'projects';
    if (pathname === '/habits' || pathname === '/habit-detail') return 'habits';
    if (pathname === '/menu') return 'menu';
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
        router.replace(path as any);
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

    // Calculate safe bottom padding - smaller on web
    const bottomPadding = Platform.OS === 'web'
        ? 12
        : Math.max(insets.bottom, 20);

    const ContainerComponent = Platform.OS === 'web' ? View : BlurView;
    const containerProps = Platform.OS === 'web'
        ? {}
        : { intensity: 80, tint: 'light' as const };

    return (
        <ContainerComponent
            style={[styles.container, { paddingBottom: bottomPadding }]}
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
                                color={isActive ? '#5856D6' : '#8E8E93'}
                                strokeWidth={isActive ? 2 : 1.5}
                            />
                        </Pressable>
                    );
                })}

                <Pressable style={styles.fab} onPress={handleFabPress}>
                    <Plus size={24} color="#5856D6" strokeWidth={2} />
                </Pressable>

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
                                color={isActive ? '#5856D6' : '#8E8E93'}
                                strokeWidth={isActive ? 2 : 1.5}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </ContainerComponent>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.8)',
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
        justifyContent: 'space-around',
        paddingTop: 8,
        paddingHorizontal: 16,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        minWidth: 48,
    },
    fab: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(88, 86, 214, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
