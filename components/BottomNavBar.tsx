import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Inbox, Lightbulb, ListTodo, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export type NavRoute = 'home' | 'inbox' | 'projects' | 'habits' | 'menu';

interface BottomNavBarProps {
    onFabPress?: () => void;
}

const NAV_ITEMS: { route: NavRoute; path: string; icon: any }[] = [
    { route: 'home', path: '/', icon: LayoutGrid },
    { route: 'projects', path: '/projects', icon: Lightbulb },
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
            // Default: navigate to add based on current screen
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

    // Insert FAB in the middle
    const leftItems = NAV_ITEMS.slice(0, 2);
    const rightItems = NAV_ITEMS.slice(2);

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
                            color={isActive ? '#5856D6' : '#000'}
                            strokeWidth={1.5}
                        />
                    </Pressable>
                );
            })}

            <Pressable style={styles.fab} onPress={handleFabPress}>
                <Plus size={28} color="#000" strokeWidth={1.5} />
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
                            color={isActive ? '#5856D6' : '#000'}
                            strokeWidth={1.5}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 16,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5EA',
    },
    tab: {
        padding: 8,
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
    },
});
