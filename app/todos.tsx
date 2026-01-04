import { useRouter } from 'expo-router';
import {
    Calendar,
    ChevronLeft,
    MoreHorizontal,
    Plus,
    Zap,
    Search,
    Menu,
    Check,
    Circle,
} from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTodos } from '@/contexts/TodoContext';
import type { Todo } from '@/types/todo';

type FilterType = 'all' | 'active' | 'completed';

import SwipeableRow from '@/components/SwipeableRow';

function TodoItem({
    todo,
    toggleTodo,
    deleteTodo
}: {
    todo: Todo;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
}) {
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleTodo(todo.id);
    }, [todo.id, toggleTodo]);

    const handleDelete = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        deleteTodo(todo.id);
    }, [todo.id, deleteTodo]);

    return (
        <SwipeableRow onDelete={handleDelete}>
            <Pressable style={styles.todoItem} onPress={handlePress}>
                <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
                    {todo.completed && <Check size={16} color="#fff" strokeWidth={3} />}
                </View>
                <View style={styles.todoContent}>
                    <Text style={[styles.todoText, todo.completed && styles.todoTextChecked]}>
                        {todo.title}
                    </Text>
                    <Text style={styles.todoDate}>
                        {todo.dueDate ? new Date(todo.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                        }) : 'No date'}
                    </Text>
                </View>
            </Pressable>
        </SwipeableRow>
    );
}

export default function TodosScreen() {
    const router = useRouter();
    const { todos, toggleTodo, deleteTodo } = useTodos();
    const [filter, setFilter] = useState<FilterType>('all');

    const handleAddPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/add-todo');
    };

    const handleFilterChange = (newFilter: FilterType) => {
        Haptics.selectionAsync();
        setFilter(newFilter);
    };

    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });

    const activeTodos = todos.filter((t) => !t.completed).length;
    const completedTodos = todos.filter((t) => t.completed).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.iconButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={styles.logoText}>daily.app</Text>
                    <Text style={styles.headerTitle}>To Do List</Text>
                </View>

                <Pressable style={styles.iconButton}>
                    <MoreHorizontal size={24} color="#000" />
                </Pressable>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <Pressable
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => handleFilterChange('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        All ({todos.length})
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
                    onPress={() => handleFilterChange('active')}
                >
                    <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
                        Active ({activeTodos})
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
                    onPress={() => handleFilterChange('completed')}
                >
                    <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
                        Done ({completedTodos})
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {filteredTodos.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Circle size={48} color="#C7C7CC" strokeWidth={1} />
                        <Text style={styles.emptyTitle}>
                            {filter === 'completed' ? 'No completed tasks' : 'No tasks yet'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {filter === 'completed'
                                ? 'Complete some tasks to see them here'
                                : 'Tap the + button to add your first task'}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.todoList}>
                        {filteredTodos.map((todo) => (
                            <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} deleteTodo={deleteTodo} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <Pressable style={styles.bottomTab} onPress={() => router.push('/menu')}>
                    <Menu size={24} color="#000" strokeWidth={1.5} />
                </Pressable>
                <Pressable style={styles.bottomTab} onPress={() => router.replace('/')}>
                    <Calendar size={24} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={styles.fab} onPress={handleAddPress}>
                    <Plus size={28} color="#000" strokeWidth={1.5} />
                </Pressable>

                <Pressable style={styles.bottomTab} onPress={() => router.replace('/habits')}>
                    <Zap size={24} color="#000" strokeWidth={1.5} />
                </Pressable>
                <Pressable style={[styles.bottomTab, styles.bottomTabActive]}>
                    <Search size={24} color="#5856D6" strokeWidth={1.5} />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    iconButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
        gap: 4,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -1.0,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 4,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    filterTabActive: {
        backgroundColor: '#fff',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    filterTextActive: {
        color: '#000',
    },
    content: {
        flex: 1,
    },
    todoList: {
        paddingHorizontal: 24,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#5856D6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    checkboxChecked: {
        backgroundColor: '#5856D6',
        borderColor: '#5856D6',
    },
    todoContent: {
        flex: 1,
    },
    todoText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
        marginBottom: 4,
    },
    todoTextChecked: {
        color: '#C7C7CC',
        textDecorationLine: 'line-through',
    },
    todoDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 8,
        textAlign: 'center',
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingBottom: 20,
    },
    bottomTab: {
        padding: 4,
    },
    bottomTabActive: {
        opacity: 1,
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
