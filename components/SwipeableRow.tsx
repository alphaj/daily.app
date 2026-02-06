import React, { Component } from 'react';
import { Animated, StyleSheet, View, I18nManager, Dimensions } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Trash2, CheckCircle2, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    onConvertToTask?: () => void;
    onConvertToHabit?: () => void;
    rightActionColor?: string;
    rightActionIcon?: React.ReactNode;
    leftActionIcon?: React.ReactNode;
    style?: object;
}

export default class SwipeableRow extends Component<SwipeableRowProps> {
    private swipeableRow: Swipeable | null = null;

    private renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragAnimatedValue: Animated.AnimatedInterpolation<number>
    ) => {
        const { rightActionColor = '#FF3B30', rightActionIcon } = this.props;
        const trans = dragAnimatedValue.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });

        return (
            <View style={{ width: 80, flexDirection: 'row' }}>
                <Animated.View
                    style={[
                        {
                            flex: 1,
                            backgroundColor: rightActionColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            transform: [{ translateX: trans }],
                        },
                    ]}
                >
                    <RectButton
                        style={styles.rightAction}
                        onPress={this.handleDelete}
                    >
                        {rightActionIcon || <Trash2 size={24} color="#fff" />}
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
                        {this.props.leftActionIcon || <CheckCircle2 size={22} color="#fff" strokeWidth={2} />}
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    private handleConvertToTask = () => {
        this.swipeableRow?.close();
        this.props.onConvertToTask?.();
    };

    private handleConvertToHabit = () => {
        this.swipeableRow?.close();
        this.props.onConvertToHabit?.();
    };

    private handleSwipeableOpen = (direction: 'left' | 'right') => {
        // Only provide haptic feedback when fully swiped
        // User must tap the delete button to actually delete
        if (direction === 'right') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    render() {
        const { children, onConvertToTask, onConvertToHabit, style } = this.props;
        const hasLeftActions = onConvertToTask || onConvertToHabit;

        return (
            <Swipeable
                ref={this.updateRef}
                friction={2}
                enableTrackpadTwoFingerGesture
                overshootRight={true}
                rightThreshold={80} // Threshold for full wipe
                renderLeftActions={hasLeftActions ? this.renderLeftActions : undefined}
                renderRightActions={this.renderRightActions}
                onSwipeableOpen={this.handleSwipeableOpen}
                containerStyle={[styles.swipeableContainer, style]}
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
        width: 80, // Fixed width for the button hit area
    },
    swipeableContainer: {
        backgroundColor: 'transparent',
    }
});
