import React, { useRef, useEffect } from 'react';
import { View, Image, Text, PanResponder, Animated } from 'react-native';

// KOMPONEN BORDER KEDIP-KEDIP
const DragHint = ({ width, height }) => {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View 
            pointerEvents="none"
            style={{
                position: 'absolute',
                width: width,
                height: height,
                left: 0,
                top: 0,
                borderWidth: 4,
                borderColor: '#00C851',
                borderRadius: 10,
                opacity: opacity,
            }} 
        />
    );
};

export default function EditorCanvas({
    editedUri,
    objects,
    selectedObjectId,
    setSelectedObjectId,
    onMoveObject,
    onMeasureObject,
}) {
    return (
        <View style={{ flex: 1 }}>
            <Image source={{ uri: editedUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />

            {objects.map((obj) => {
                const panResponder = PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onPanResponderGrant: () => {
                        setSelectedObjectId(obj.id);
                    },
                    onPanResponderMove: (_, gesture) => {
                        onMoveObject(obj.id, obj.x + gesture.dx, obj.y + gesture.dy);
                    },
                });

                const objWidth = obj.width || 120;
                const objHeight = obj.height || 50;

                return (
                    <View
                        key={obj.id}
                        {...panResponder.panHandlers}
                        style={{
                            position: 'absolute',
                            left: obj.x,
                            top: obj.y,
                        }}
                    >
                        {/* GANTI VIEW BIASA JADI DragHint BUAT KEDIP-KEDIP */}
                        {obj.showHint && (
                            <View 
                                style={{
                                    position: 'absolute',
                                    width: objWidth + 20,
                                    height: objHeight + 20,
                                    left: -10,
                                    top: -10,
                                }}
                                onLayout={(e) => {
                                    const { width, height } = e.nativeEvent.layout;
                                    if (width !== obj.width + 20 || height !== obj.height + 20) {
                                        onMeasureObject(obj.id, width - 20, height - 20);
                                    }
                                }}
                            >
                                <DragHint width={objWidth + 20} height={objHeight + 20} />
                            </View>
                        )}

                        <View
                            onLayout={(e) => {
                                const { width, height } = e.nativeEvent.layout;
                                if (width !== obj.width || height !== obj.height) {
                                    onMeasureObject(obj.id, width, height);
                                }
                            }}
                        >
                            {obj.type === 'text' ? (
                                <Text style={{
                                    color: obj.color,
                                    fontSize: obj.fontSize,
                                    fontWeight: obj.fontWeight,
                                    textAlign: obj.textAlign,
                                    paddingHorizontal: 6,
                                    paddingVertical: 3,
                                }}>
                                    {obj.value}
                                </Text>
                            ) : (
                                <Text style={{ fontSize: obj.fontSize }}>{obj.value}</Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
