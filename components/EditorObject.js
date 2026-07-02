import React from 'react';
import { View, Text, PanResponder } from 'react-native';

export default function EditorObject({
    item,
    selected,
    onPress,
    onMove,
    onMeasure,
}) {
    let startX = item.x;
    let startY = item.y;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            onPress();
            startX = item.x;
            startY = item.y;
        },
        onPanResponderMove: (evt, gestureState) => {
            onMove(
                startX + gestureState.dx,
                startY + gestureState.dy
            );
        },
    });

    return (
        <View
            {...panResponder.panHandlers}
            style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                minWidth: item.width,
                alignItems: 'center',
            }}
        >
            <Text
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    onMeasure?.(item.id, width, height);
                }}
                style={{
                    color: item.color || '#FFFFFF',
                    fontSize: item.fontSize || 22,
                    fontWeight: item.fontWeight || 'bold',
                    textAlign: 'center',
                    backgroundColor: selected ? 'rgba(0,0,0,0.15)' : 'transparent',
                    paddingHorizontal: selected ? 4 : 0,
                    borderRadius: 4,
                    flexWrap: 'wrap',
                }}
            >{item.value ? item.value : ' '}</Text>
        </View>
    );
}
