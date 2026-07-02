import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Keyboard,
    Animated,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Modal,
    FlatList,
    BackHandler,
    ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { supabase } from './Supabase';
import EditorCanvas from '../components/EditorCanvas';
import { moveObject, clampPosition } from '../editor/editorHelpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😭', '😡', '👍', '👎', '❤', '🔥', '💯', '🎉', '✨', '🌟', '💪', '🙏', '👀', '🤷', '😴', '🤢', '🤮', '🥳', '😱', '💀', '👻', '🤡', '💩', '🤠'];

const COLORS = [
    '#FFFFFF', '#000000', '#FF0000', '#FF7F00', '#FFFF00',
    '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF',
    '#FFC0CB', '#808080', '#A52A2A', '#FFD700', '#00C851'
];

const DEFAULT_TEXT = 'Teks';

export default function MediaEditorScreen({ route, navigation }) {
    const { mediaUri } = route.params;
    const insets = useSafeAreaInsets();

    const [currentImageUri, setCurrentImageUri] = useState(mediaUri);
    const [caption, setCaption] = useState('');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [objects, setObjects] = useState([]);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [userId, setUserId] = useState(null);
    const [showEmojiModal, setShowEmojiModal] = useState(false);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [currentColor, setCurrentColor] = useState('#FFFFFF');

    const canvasRef = useRef();
    const textInputRef = useRef();
    const [keyboardHeight] = useState(new Animated.Value(0));

    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                Animated.timing(keyboardHeight, {
                    toValue: e.endCoordinates.height,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                Animated.timing(keyboardHeight, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useEffect(() => {
        getUser();

        const backAction = () => {
            if (isEditingText) {
                const selectedObj = objects.find(o => o.id === selectedObjectId);
                if (selectedObj && selectedObj.value === DEFAULT_TEXT) {
                    setObjects(prev => prev.filter(item => item.id !== selectedObjectId));
                }
                setIsEditingText(false);
                setSelectedObjectId(null);
                setShowColorPalette(false);
                Keyboard.dismiss();
                return true;
            }
            if (showColorPalette) {
                setShowColorPalette(false);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            if (isEditingText) {
                const selectedObj = objects.find(o => o.id === selectedObjectId);
                if (selectedObj && (selectedObj.value === DEFAULT_TEXT || selectedObj.value.trim() === '')) {
                    setObjects(prev => prev.filter(item => item.id !== selectedObjectId));
                }
                setIsEditingText(false);
                setSelectedObjectId(null);
                setShowColorPalette(false);
            }
        });

        return () => {
            backHandler.remove();
            keyboardDidHideListener.remove();
        };
    }, [isEditingText, selectedObjectId, objects, showColorPalette]);

    useEffect(() => {
        if (isEditingText && textInputRef.current) {
            setTimeout(() => textInputRef.current?.focus(), 100);
        }
    }, [isEditingText, selectedObjectId]);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id);
    };

    const handleMoveObject = (id, x, y) => {
        if (isEditingText) return;

        setObjects((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, showHint: false } : item
            )
        );

        const item = objects.find((obj) => obj.id === id);
        if (!item) return;
        const pos = clampPosition(x, y, item.width, item.height, canvasSize.width, canvasSize.height);
        setObjects((prev) => moveObject(prev, id, pos.x, pos.y));
    };

    const handleMeasureObject = (id, width, height) => {
        setObjects((prev) =>
            prev.map((item) => (item.id === id ? { ...item, width, height } : item))
        );
    };

    const handleAddText = () => {
        if (canvasSize.width === 0) return;

        const id = Date.now();
        const FULL_WIDTH = canvasSize.width * 0.9;
        const CENTER_X = (canvasSize.width / 2) - (FULL_WIDTH / 2);
        const DEFAULT_HEIGHT = 40;

        const newObject = {
            id,
            type: 'text',
            value: DEFAULT_TEXT,
            x: CENTER_X,
            y: (canvasSize.height / 2) - (DEFAULT_HEIGHT / 2),
            width: FULL_WIDTH,
            height: DEFAULT_HEIGHT,
            fontSize: 22,
            fontWeight: 'bold',
            color: currentColor,
            textAlign: 'center',
            showHint: true
        };
        setObjects((prev) => [...prev, newObject]);
        setSelectedObjectId(id);
        setIsEditingText(true);
    };

    const handleAddEmoji = (emoji) => {
        if (canvasSize.width === 0) return;

        const id = Date.now();
        const SIZE = 60;
        const newObject = {
            id,
            type: 'emoji',
            value: emoji,
            x: (canvasSize.width / 2) - (SIZE / 2),
            y: (canvasSize.height / 2) - (SIZE / 2),
            width: SIZE,
            height: SIZE,
            fontSize: 50,
            showHint: true
        };
        setObjects((prev) => [...prev, newObject]);
        setShowEmojiModal(false);
    };

    const handleSelectColor = (color) => {
        setCurrentColor(color);
        if (isEditingText && selectedObjectId) {
            setObjects((prev) =>
                prev.map((item) =>
                    item.id === selectedObjectId ? { ...item, color } : item
                )
            );
        }
        setShowColorPalette(false);
    };

    const handleTapOutside = () => {
        if (isEditingText) {
            const selectedObj = objects.find(o => o.id === selectedObjectId);
            if (selectedObj && (selectedObj.value === DEFAULT_TEXT || selectedObj.value.trim() === '')) {
                setObjects(prev => prev.filter(item => item.id !== selectedObjectId));
            }
            Keyboard.dismiss();
            setIsEditingText(false);
            setSelectedObjectId(null);
            setShowColorPalette(false);
        }
        if (showColorPalette) {
            setShowColorPalette(false);
        }
    };

    const handleUpload = async () => {
        if (!userId) {
            Alert.alert('Error', 'User belum login');
            return;
        }

        try {
            setUploading(true);
            setSelectedObjectId(null);
            setIsEditingText(false);
            setShowColorPalette(false);
            Keyboard.dismiss();

            await new Promise(resolve => setTimeout(resolve, 100));

            // 1. CAPTURE GAMBAR
            const uri = await captureRef(canvasRef, {
                format: 'jpg',
                quality: 0.9,
            });

            // 2. UPLOAD KE STORAGE
            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const fileName = `${userId}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(fileName, arrayBuffer, {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName);

            // 3. INSERT KE POSTS - HAPUS username ❌
            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    image_url: publicUrl,
                    title: title,
                    caption: caption,
                    user_id: userId,
                    status: 'approved',
                    category: 'umum',
                    // username: profileData?.name || 'User', // ❌ HAPUS BARIS INI
                });

            if (insertError) throw insertError;

            Alert.alert('Berhasil Upload', 'Postingan kamu udah tampil di Home Feed!');
            navigation.navigate('Main', {
                screen: 'Home',
                params: { resetHome: Date.now() }
            });

        } catch (error) {
            console.log('Upload error:', error);
            Alert.alert('Gagal', error.message || 'Upload gagal, coba lagi');
        } finally {
            setUploading(false);
        }
    };


    const selectedObject = isEditingText ? objects.find(o => o.id === selectedObjectId) : null;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" />

            <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: '#000'
                }}>
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                            'Keluar dari Editor?',
                            'Semua perubahan akan hilang kalo kamu hapus edit.',
                            [
                                { text: 'Lanjut Edit', style: 'cancel' },
                                { text: 'Hapus Edit', style: 'destructive', onPress: () => navigation.goBack() }
                            ]
                        );
                    }}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => setShowEmojiModal(true)} style={{ marginRight: 24 }}>
                            <MaterialCommunityIcons name="sticker-emoji" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddText} style={{ marginRight: 24 }}>
                            <MaterialCommunityIcons name="format-text" size={26} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowColorPalette(!showColorPalette)}
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: currentColor,
                                borderWidth: 2,
                                borderColor: '#fff'
                            }}
                        />
                    </View>
                </View>
            </SafeAreaView>

            <TouchableOpacity
                activeOpacity={1}
                onPress={handleTapOutside}
                style={{ flex: 1 }}
            >
                <View
                    ref={canvasRef}
                    collapsable={false}
                    onLayout={(e) => {
                        setCanvasSize({
                            width: e.nativeEvent.layout.width,
                            height: e.nativeEvent.layout.height,
                        });
                    }}
                    style={{ flex: 1, backgroundColor: '#000' }}
                >
                    <EditorCanvas
                        editedUri={currentImageUri}
                        objects={isEditingText ? objects.filter(obj => obj.id !== selectedObjectId) : objects}
                        selectedObjectId={selectedObjectId}
                        setSelectedObjectId={(id) => {
                            if (!isEditingText) setSelectedObjectId(id);
                        }}
                        onMoveObject={handleMoveObject}
                        onMeasureObject={handleMeasureObject}
                    />

                    {isEditingText && selectedObject ? (
                        <TextInput
                            ref={textInputRef}
                            value={selectedObject.value}
                            onChangeText={(text) =>
                                setObjects(
                                    objects.map((item) =>
                                        item.id === selectedObjectId ? { ...item, value: text } : item
                                    )
                                )
                            }
                            onContentSizeChange={(e) => {
                                const { height } = e.nativeEvent.contentSize;
                                handleMeasureObject(selectedObjectId, selectedObject.width, height);
                            }}
                            multiline
                            autoFocus
                            selectTextOnFocus
                            style={{
                                position: 'absolute',
                                left: selectedObject.x,
                                top: selectedObject.y,
                                width: selectedObject.width,
                                minHeight: selectedObject.height,
                                color: selectedObject.color,
                                fontSize: selectedObject.fontSize,
                                fontWeight: selectedObject.fontWeight,
                                textAlign: 'center',
                                backgroundColor: 'transparent',
                                padding: 0,
                            }}
                        />
                    ) : null}
                </View>
            </TouchableOpacity>

            {showColorPalette && (
                <View style={{
                    position: 'absolute',
                    top: insets.top + 60,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    paddingVertical: 12,
                    zIndex: 999
                }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        keyboardShouldPersistTaps="always"
                    >
                        {COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => handleSelectColor(color)}
                                activeOpacity={0.7}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: color,
                                    marginRight: 12,
                                    borderWidth: currentColor === color ? 3 : 2,
                                    borderColor: currentColor === color ? '#00C851' : '#fff',
                                }}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {!isEditingText && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        bottom: keyboardHeight,
                        left: 0,
                        right: 0,
                        backgroundColor: '#1a1a1a',
                        borderTopWidth: 1,
                        borderTopColor: '#333'
                    }}
                >
                    <SafeAreaView edges={['bottom']}>
                        <View style={{
                            paddingHorizontal: 8,
                            paddingTop: 8,
                            paddingBottom: 8,
                        }}>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Judul..."
                                placeholderTextColor="#888"
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    borderRadius: 20,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    color: '#fff',
                                    fontSize: 16,
                                    marginBottom: 8
                                }}
                            />

                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                            }}>
                                <TextInput
                                    value={caption}
                                    onChangeText={setCaption}
                                    placeholder="Tambah keterangan..."
                                    placeholderTextColor="#888"
                                    multiline
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#2a2a2a',
                                        borderRadius: 20,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        color: '#fff',
                                        fontSize: 16,
                                        maxHeight: 100,
                                        marginRight: 8
                                    }}
                                />
                                <TouchableOpacity
                                    onPress={handleUpload}
                                    disabled={uploading}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: title.trim() || caption.trim() || objects.length > 0 ? '#00C851' : '#555',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Ionicons name="send" size={22} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            )}

            <Modal
                visible={showEmojiModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEmojiModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingBottom: insets.bottom + 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Pilih Sticker</Text>
                            <TouchableOpacity onPress={() => setShowEmojiModal(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={EMOJI_LIST}
                            numColumns={6}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAddEmoji(item)}
                                    style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}
                                >
                                    <Text style={{ fontSize: 32 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}
