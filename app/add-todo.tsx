import React from 'react';
import { View } from 'react-native';
import { useAddTodoForm } from '@/hooks/useAddTodoForm';
import { AddTodoThings } from '@/components/add-todo/AddTodoThings';

export default function AddTodoScreen() {
    const form = useAddTodoForm();

    return (
        <View style={{ flex: 1 }}>
            <AddTodoThings form={form} />
        </View>
    );
}
