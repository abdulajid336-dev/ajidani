import React, { useState } from 'react';
import {
    View,
    Image,
    Text,
    TouchableOpacity,
    TextInput,
} from 'react-native';

export default function MediaEditorVideoScreen({
    route,
    navigation,
}) {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    const {
        mediaUri,
        mediaType,
    } = route.params;

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f7faf7',
                alignItems: 'center',
                padding: 15,
            }}
        >
            <Image
                source={{ uri: mediaUri }}
                resizeMode="contain"
                style={{
                    width: '100%',
                    height: '45%',
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    bottom: 45,
                    left: 10,
                    right: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    backgroundColor: '#222',
                    paddingVertical: 12,
                    borderRadius: 20,
                }}
            >
                <Text style={{ color: 'white', fontSize: 22 }}>✂️</Text>
                <Text style={{ color: 'white', fontSize: 22 }}>😊</Text>
                <Text style={{ color: 'white', fontSize: 22 }}>✍️</Text>
                <Text style={{ color: 'white', fontSize: 22 }}>🖍️</Text>
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('UploadConfirm', {
                            editedMedia: mediaUri,
                            mediaType: mediaType,
                        });
                    }}
                >
                    <Text
                        style={{
                            color: '#00ff88',
                            fontSize: 30,
                            textAlign: 'center',
                        }}
                    >
                        ✔
                    </Text>

                    <Text
                        style={{
                            color: 'white',
                            fontSize: 12,
                            textAlign: 'center',
                        }}
                    >
                        Lanjut
                    </Text>
                </TouchableOpacity>
            </View>
        </View>

    );
}