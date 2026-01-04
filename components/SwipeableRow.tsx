import React, { Component } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Trash2 } from 'lucide-react-native';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
}

export default class SwipeableRow extends Component<SwipeableRowProps> {
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
                        onPress={this.close}
                    >
                        <Trash2 size={24} color="#fff" />
                    </RectButton>
                </Animated.View>
            </View>
        );
    };

    private swipeableRow: Swipeable | null = null;

    private updateRef = (ref: Swipeable) => {
        this.swipeableRow = ref;
    };

    private close = () => {
        this.swipeableRow?.close();
        this.props.onDelete();
    };

    render() {
        const { children } = this.props;
        return (
            <Swipeable
                ref={this.updateRef}
                friction={2}
                enableTrackpadTwoFingerGesture
                rightThreshold={40}
                renderRightActions={this.renderRightActions}
                containerStyle={styles.swipeableContainer}
            >
                {children}
            </Swipeable>
        );
    }
}

const styles = StyleSheet.create({
    leftAction: {
        flex: 1,
        backgroundColor: '#497AFC',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        backgroundColor: 'transparent',
        padding: 10,
    },
    rightAction: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    swipeableContainer: {
        backgroundColor: '#fff',
    }
});
