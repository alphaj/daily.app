import { useState, useCallback, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGoBack } from '@/lib/useGoBack';
import { useTodos } from '@/contexts/TodoContext';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { useBuddy } from '@/contexts/BuddyContext';
import { useSync } from '@/contexts/SyncContext';
import { suggestEmoji } from '@/utils/emojiSuggest';
import { assignTaskToBuddy, createTogetherTask } from '@/lib/sync';
import * as Haptics from '@/lib/haptics';
import { format, isToday, isTomorrow } from 'date-fns';
import type { TimeOfDay, RepeatOption, Subtask } from '@/types/todo';

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export const TIME_OF_DAY_OPTIONS: { label: string; value: TimeOfDay; icon: string }[] = [
    { label: 'Morning', value: 'morning', icon: '☀️' },
    { label: 'Afternoon', value: 'afternoon', icon: '🌤' },
    { label: 'Evening', value: 'evening', icon: '🌙' },
    { label: 'Anytime', value: 'anytime', icon: '🕐' },
];

export const DURATION_OPTIONS: { label: string; value: number }[] = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '45m', value: 45 },
    { label: '1h', value: 60 },
    { label: '1h 30m', value: 90 },
    { label: '2h', value: 120 },
];

export const REPEAT_OPTIONS: { label: string; value: RepeatOption }[] = [
    { label: 'None', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekdays', value: 'weekdays' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
];

export const EMOJI_OPTIONS = [
    '🌅', '☀️', '🌙', '⏰', '🛏️', '🪥',
    '🧘', '💧', '🏃', '🏋️', '🤸', '🚴', '🏊', '⚽', '🎾', '💪',
    '🍳', '🥗', '🍎', '🥑', '🍵', '☕', '🫐', '🥦', '🥕', '🍕',
    '📝', '💼', '💻', '📧', '📅', '✅', '🗂️', '📎', '🖊️', '📊',
    '📖', '🎯', '💡', '🎓', '🧠', '🎨', '🎵', '🎹', '✍️', '🌐',
    '💊', '🩺', '🧖', '💆', '🛁', '😴', '🩷', '🧊',
    '🌸', '🍃', '🌿', '🦋', '✨', '💫', '🕯️', '🙏', '🪴', '🌈',
    '👨‍👩‍👧', '💬', '📞', '🤝', '💌', '🎁', '🥰', '👋', '🎉', '🎂',
    '💰', '💵', '📈', '🏦', '💳', '🏠', '🧹', '🧺', '📦', '🧸',
    '✈️', '🚗', '🚆', '🏖️', '🗺️', '🧳', '⛰️', '🏕️',
    '🐕', '🐈', '🐟', '🐦', '🦮',
    '🔧', '🛒', '📸', '🎮', '📱', '🔑', '💎', '🌟', '⭐', '🚀',
];

export const EMOJI_BG_COLORS = [
    '#D4C5F0', '#C8B8E8', '#E0D4F5', '#EDE5FA', '#F5F0FF',
    '#C5D8F0', '#D4E4F7', '#E3EDFB', '#B8D8E8', '#D0EAF0',
    '#B8E0C8', '#C8E8D4', '#D8F0E4', '#A8D8B8', '#C0E8C8',
    '#F0D4D8', '#F5DDE0', '#FAE8EA', '#E8C0C8', '#F0D0D8',
    '#F0D8C0', '#F5E0CC', '#FAE8D8', '#E8C8A8', '#F0D4B8',
    '#F0ECC0', '#F5F0CC', '#FAF5D8', '#E8E4A8', '#F0ECB8',
];

export function useAddTodoForm() {
    const goBack = useGoBack();
    const { addTodo } = useTodos();
    const { isWorkMode } = useWorkMode();
    const { activeBuddies, hasActiveBuddy, getBuddy } = useBuddy();
    const { syncNow } = useSync();
    const { timeOfDay: initialTimeOfDay, forBuddyId } = useLocalSearchParams<{ timeOfDay?: string; forBuddyId?: string }>();

    const hasPartner = hasActiveBuddy;
    const [assignToPartnerId, setAssignToPartnerId] = useState<string | null>(forBuddyId ?? null);
    const assignToPartner = !!assignToPartnerId;
    const assignedPartnership = assignToPartnerId
        ? getBuddy(assignToPartnerId)
        : (activeBuddies.length === 1 ? activeBuddies[0] : null);

    const [togetherPartnerId, setTogetherPartnerId] = useState<string | null>(null);
    const isTogether = !!togetherPartnerId;

    const [title, setTitle] = useState('');
    const [emoji, setEmoji] = useState<string | undefined>('🌤');
    const [emojiColor, setEmojiColor] = useState<string | undefined>(undefined);
    const userPickedEmoji = useRef(false);
    const [dueDate, setDueDate] = useState<Date | null>(new Date());
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
    const [repeat, setRepeat] = useState<RepeatOption>('none');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(() => {
        if (initialTimeOfDay && ['anytime', 'morning', 'afternoon', 'evening'].includes(initialTimeOfDay)) {
            return initialTimeOfDay as TimeOfDay;
        }
        return undefined;
    });
    const [isPrivate, setIsPrivate] = useState(false);
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; emoji: string }[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState<{ id: string; title: string; emoji: string } | null>(null);

    const canSave = title.trim().length > 0;

    const handleTitleChange = useCallback((text: string) => {
        setTitle(text);
        if (!userPickedEmoji.current) {
            setEmoji(suggestEmoji(text) || '🌤');
        }
    }, []);

    const addSubtask = useCallback(() => {
        if (newSubtaskTitle.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const trimmed = newSubtaskTitle.trim();
            setSubtasks(prev => [...prev, {
                id: generateId(),
                title: trimmed,
                emoji: suggestEmoji(trimmed) || '📋',
            }]);
            setNewSubtaskTitle('');
        }
    }, [newSubtaskTitle]);

    const removeSubtask = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSubtasks(prev => prev.filter(st => st.id !== id));
    }, []);

    const updateSubtaskEmoji = useCallback((id: string, newEmoji: string) => {
        setSubtasks(prev => prev.map(st => st.id === id ? { ...st, emoji: newEmoji } : st));
    }, []);

    const startEditingSubtask = useCallback((st: { id: string; title: string; emoji: string }) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setEditingSubtask({ ...st });
    }, []);

    const saveEditingSubtask = useCallback(() => {
        if (editingSubtask && editingSubtask.title.trim()) {
            setSubtasks(prev => prev.map(st =>
                st.id === editingSubtask.id
                    ? { ...st, title: editingSubtask.title.trim(), emoji: editingSubtask.emoji }
                    : st
            ));
        }
        setEditingSubtask(null);
    }, [editingSubtask]);

    const pickEmoji = useCallback((e: string) => {
        Haptics.selectionAsync();
        if (emoji === e) {
            setEmoji(suggestEmoji(title));
            userPickedEmoji.current = false;
        } else {
            setEmoji(e);
            userPickedEmoji.current = true;
        }
    }, [emoji, title]);

    const clearEmoji = useCallback(() => {
        Haptics.selectionAsync();
        setEmoji(suggestEmoji(title));
        setEmojiColor(undefined);
        userPickedEmoji.current = false;
    }, [title]);

    const executeSave = useCallback(async (): Promise<boolean> => {
        if (!title.trim() || saving) return false;
        setSaving(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const subtaskData: Subtask[] = subtasks.map(st => ({
            id: st.id,
            title: st.title,
            emoji: st.emoji,
            completed: false,
        }));

        if (isTogether && hasPartner) {
            const targetPartnerId = togetherPartnerId!;
            const togetherPartnership = getBuddy(targetPartnerId);
            const taskId = generateId();
            const taskData = {
                id: taskId,
                title: title.trim(),
                createdAt: new Date().toISOString(),
                dueDate: (dueDate || new Date()).toISOString().split('T')[0],
                dueTime: undefined as string | undefined,
                priority: undefined as string | undefined,
                isWork: isWorkMode,
                emoji,
                emojiColor,
                estimatedMinutes,
                timeOfDay,
                repeat: repeat !== 'none' ? repeat : undefined,
                subtasks: subtaskData.length > 0 ? subtaskData : undefined,
            };

            // Create local todo with together fields
            await addTodo(title.trim(), dueDate || new Date(), undefined, isWorkMode, undefined, {
                emoji,
                emojiColor,
                estimatedMinutes,
                timeOfDay,
                repeat: repeat !== 'none' ? repeat : undefined,
                subtasks: subtaskData.length > 0 ? subtaskData : undefined,
                isTogether: true,
                togetherPartnerId: targetPartnerId,
                togetherPartnerName: togetherPartnership?.partner_name ?? undefined,
                togetherPartnerAvatarUrl: togetherPartnership?.partner_avatar_url ?? undefined,
            });

            // Call RPC to create together task for partner
            const result = await createTogetherTask(taskData, targetPartnerId);
            if (result.error) {
                setSaving(false);
                Alert.alert('Could not create together task', result.error);
                return false;
            }

            // Update local todo with togetherGroupId
            if (result.togetherGroupId) {
                const raw = await AsyncStorage.getItem('daily_todos');
                if (raw) {
                    const todos: any[] = JSON.parse(raw);
                    const updated = todos.map(t =>
                        t.title === title.trim() && t.isTogether && !t.togetherGroupId
                            ? { ...t, togetherGroupId: result.togetherGroupId }
                            : t
                    );
                    await AsyncStorage.setItem('daily_todos', JSON.stringify(updated));
                }
            }

            syncNow();
        } else if (assignToPartner && hasPartner) {
            const targetPartnerId = assignToPartnerId ?? assignedPartnership?.partner_id ?? undefined;
            const result = await assignTaskToBuddy({
                id: generateId(),
                title: title.trim(),
                createdAt: new Date().toISOString(),
                dueDate: (dueDate || new Date()).toISOString().split('T')[0],
                dueTime: undefined,
                priority: undefined,
                isWork: isWorkMode,
                emoji,
                emojiColor,
                estimatedMinutes,
                timeOfDay,
                repeat: repeat !== 'none' ? repeat : undefined,
                subtasks: subtaskData.length > 0 ? subtaskData : undefined,
            }, targetPartnerId);

            if (result.error) {
                setSaving(false);
                Alert.alert('Could not assign task', result.error);
                return false;
            }
            syncNow();
        } else {
            addTodo(title.trim(), dueDate || new Date(), undefined, isWorkMode, undefined, {
                emoji,
                emojiColor,
                estimatedMinutes,
                timeOfDay,
                repeat: repeat !== 'none' ? repeat : undefined,
                subtasks: subtaskData.length > 0 ? subtaskData : undefined,
                isPrivate: isPrivate || undefined,
            });
        }
        return true;
    }, [title, saving, subtasks, isTogether, togetherPartnerId, assignToPartner, hasPartner, assignToPartnerId, assignedPartnership, getBuddy, dueDate, isWorkMode, emoji, emojiColor, estimatedMinutes, timeOfDay, repeat, isPrivate, addTodo, syncNow]);

    const getDateLabel = useCallback((): string => {
        if (!dueDate) return 'None';
        if (isToday(dueDate)) return 'Today';
        if (isTomorrow(dueDate)) return 'Tomorrow';
        return format(dueDate, 'MMM d');
    }, [dueDate]);

    const getTimeOfDayLabel = useCallback((): string => {
        if (!timeOfDay) return 'None';
        const opt = TIME_OF_DAY_OPTIONS.find(o => o.value === timeOfDay);
        return opt ? opt.label : 'None';
    }, [timeOfDay]);

    const getDurationLabel = useCallback((): string => {
        if (!estimatedMinutes) return 'None';
        return formatDuration(estimatedMinutes);
    }, [estimatedMinutes]);

    const getRepeatLabel = useCallback((): string => {
        if (repeat === 'none') return 'None';
        const opt = REPEAT_OPTIONS.find(o => o.value === repeat);
        return opt ? opt.label : 'None';
    }, [repeat]);

    return {
        goBack,
        title, handleTitleChange,
        emoji, setEmoji, emojiColor, setEmojiColor,
        pickEmoji, clearEmoji, userPickedEmoji,
        dueDate, setDueDate,
        timeOfDay, setTimeOfDay,
        estimatedMinutes, setEstimatedMinutes,
        repeat, setRepeat,
        isPrivate, setIsPrivate,
        subtasks,
        newSubtaskTitle, setNewSubtaskTitle,
        addSubtask, removeSubtask, updateSubtaskEmoji,
        editingSubtask, setEditingSubtask,
        startEditingSubtask, saveEditingSubtask,
        hasPartner,
        activeBuddies,
        assignToPartnerId, setAssignToPartnerId,
        assignToPartner,
        assignedPartnership,
        togetherPartnerId, setTogetherPartnerId,
        isTogether,
        saving, canSave, executeSave,
        getDateLabel, getTimeOfDayLabel, getDurationLabel, getRepeatLabel,
    };
}

export type AddTodoFormState = ReturnType<typeof useAddTodoForm>;
