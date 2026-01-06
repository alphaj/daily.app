import React, { Component } from 'react';
import { Animated, StyleSheet, View, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Trash2, CheckCircle2, Zap } from 'lucide-react-native';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    onConvertToTask?: () => void;
    onConvertToHabit?: () => void;
}

export default class SwipeableRow extends Component<SwipeableRowProps> {
    private swipeableRow: Swipeable | null = null;

    private renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        _dragAnimatedValue: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [64, 0],
        });
        return (
            <View style={{ width: 64, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
                <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
                    <RectButton
                        style={[styles.rightAction, { backgroundColor: '#FF3B30' }]}
                        onPress={this.handleDelete}
                    >
                        <Trash2 size={24} color="#fff" />
                    </RectButton>
                </Animated.View>
            </View>
        );
    };

    private renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        _dragAnimatedValue: Animated.AnimatedInterpolation<number>
    ) => {
        const { onConvertToTask, onConvertToHabit } = this.props;

        // Only show left actions if handlers are provided
        if (!onConvertToTask && !onConvertToHabit) return null;

        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-128, 0],
        });

        return (
            <Animated.View
                style={[
                    styles.leftActionsContainer,
                    { transform: [{ translateX: trans }] }
                ]}
            >
                {onConvertToTask && (
                    <RectButton
                        style={[styles.leftAction, { backgroundColor: '#34C759' }]}
                        onPress={this.handleConvertToTask}
                    >
                        <CheckCircle2 size={22} color="#fff" strokeWidth={2} />
                    </RectButton>
                )}
                {onConvertToHabit && (
                    <RectButton
                        style={[styles.leftAction, { backgroundColor: '#5856D6' }]}
                        onPress={this.handleConvertToHabit}
                    >
                        <Zap size={22} color="#fff" strokeWidth={2} />
                    </RectButton>
                )}
            </Animated.View>
        );
    };

    private updateRef = (ref: Swipeable) => {
        this.swipeableRow = ref;
    };

    private handleDelete = () => {
        this.swipeableRow?.close();
        this.props.onDelete();
    };

    private handleConvertToTask = () => {
        this.swipeableRow?.close();
        this.props.onConvertToTask?.();
    };

    private handleConvertToHabit = () => {
        this.swipeableRow?.close();
        this.props.onConvertToHabit?.();
    };

    render() {
        const { children, onConvertToTask, onConvertToHabit } = this.props;
        const hasLeftActions = onConvertToTask || onConvertToHabit;

        return (
            <Swipeable
                ref={this.updateRef}
                friction={2}
                enableTrackpadTwoFingerGesture
                leftThreshold={hasLeftActions ? 40 : undefined}
                rightThreshold={40}
                renderLeftActions={hasLeftActions ? this.renderLeftActions : undefined}
                renderRightActions={this.renderRightActions}
                containerStyle={styles.swipeableContainer}
            >
                {children}
            </Swipeable>
        );
    }
}

const styles = StyleSheet.create({
    leftActionsContainer: {
        width: 128,
        flexDirection: 'row',
    },
    leftAction: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightAction: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    swipeableContainer: {
        backgroundColor: 'transparent',
    }
});
