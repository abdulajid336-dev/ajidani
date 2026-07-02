import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { supabase } from './Supabase';
import * as ImageManipulator from 'expo-image-manipulator';

export default function UploadConfirmScreen({
    navigation,
    route,
}) {
    const [image, setImage] = useState(null);
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [mediaType, setMediaType] = useState('image');
    useEffect(() => {
        if (route.params?.editedMedia) {
            setImage(route.params.editedMedia);
            setMediaType(route.params.mediaType);
        }
    }, [route.params]);

    async function pickImage(type = 'image') {
        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    type === 'video'
                        ? ImagePicker.MediaTypeOptions.Videos
                        : ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7,
            });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            let finalUri = uri;

            if (type === 'image') {
                const result = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 1920 } }],
                    {
                        compress: 0.7,
                        format: ImageManipulator.SaveFormat.JPEG,
                    }
                );

                finalUri = result.uri;
            }

            navigation.navigate('MediaEditor', {
                mediaUri: finalUri,
                mediaType: type,
            });

        }
    }

    async function uploadImage() {

        if (uploading) return;

        setUploading(true);

        if (!image) {
            alert('Pilih gambar dulu!');
            setUploading(false);
            return;
        }

        try {
            const extension =
                mediaType === 'video'
                    ? 'mp4'
                    : 'jpg';

            const mimeType =
                mediaType === 'video'
                    ? 'video/mp4'
                    : 'image/jpeg';

            const fileName =
                `user-${Date.now()}.${extension}`;

            const formData = new FormData();

            formData.append('file', {
                uri: image,
                name: fileName,
                type: mimeType,
            });

            const { error } = await supabase.storage
                .from('posts')
                .upload(fileName, formData, {
                    contentType: mimeType,
                });

            if (error) {
                setUploading(false);
                alert(error.message);
                return;
            }

            const { data: urlData } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName);

            const imageUrl = urlData.publicUrl;

            const {
                data: { user },
            } = await supabase.auth.getUser();
            
            const { error: dbError } = await supabase
                .from('posts')
                .insert([
                    {
                        image_url: imageUrl,
                        user_id: user.id,
                        title: title,
                        caption: caption,
                        status: 'approved',
                        category: 'umum',
                        is_admin_post: false,
                        media_type: mediaType,
                    }
                ]);

            if (dbError) {
                setUploading(false);
                alert(dbError.message);
                return;
            }
            setUploading(false);
            alert('Upload berhasil 🔥');

            setTitle('');
            setCaption('');
            setImage(null);

            navigation.navigate('Main', {
                screen: 'Home',
            });

        } catch (err) {
            setUploading(false);
            alert('Upload gagal');
            console.log(err);
        }
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f7faf7',
                justifyContent: 'flex-start',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 5,
            }}
        >
            {!image ? (
                <View
                    style={{
                        flex: 1,
                        width: '100%',
                        alignItems: 'center',
                        paddingTop: 40,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 50,
                            marginBottom: 10,
                        }}
                    >
                        📸
                    </Text>

                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: '#2e7d32',
                            marginBottom: 10,
                        }}
                    >
                        Bagikan Informasi Desa
                    </Text>

                    <Text
                        style={{
                            color: '#666',
                            textAlign: 'center',
                            marginBottom: 40,
                        }}
                    >
                        Upload kegiatan dan informasi
                        {'\n'}
                        untuk masyarakat Kerticala
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '90%',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => pickImage('image')}
                            style={{
                                width: '48%',
                                height: 100,
                                backgroundColor: '#2196F3',
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 5,
                            }}
                        >
                            <Text style={{ fontSize: 30 }}>
                                🖼️
                            </Text>

                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    marginTop: 5,
                                }}
                            >
                                Pilih foto
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => pickImage('video')}
                            style={{
                                width: '48%',
                                height: 100,
                                backgroundColor: '#9C27B0',
                                borderRadius: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 5,
                            }}
                        >
                            <Text style={{ fontSize: 30 }}>
                                🎬
                            </Text>

                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    marginTop: 5,
                                }}
                            >
                                Pilih Video
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            ) : (
                <>

                    <View
                        style={{
                            flexDirection: 'row',
                            gap: 15,
                            marginTop: 25,
                            marginBottom: 20,
                        }}
                    >
                        <TouchableOpacity
                            disabled={uploading}
                            onPress={uploadImage}
                            style={{
                                backgroundColor:
                                    uploading ? 'gray' : 'green',
                                paddingVertical: 12,
                                paddingHorizontal: 25,
                                borderRadius: 10,
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            >
                                {uploading
                                    ? 'Mengupload...'
                                    : 'Upload'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setImage(null);
                            }}
                            style={{
                                backgroundColor: 'red',
                                paddingVertical: 12,
                                paddingHorizontal: 25,
                                borderRadius: 10,
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>

                    </View>
                    <TextInput
                        placeholder="Tulis judul kegiatan..."
                        placeholderTextColor="#666"
                        value={title}
                        onChangeText={setTitle}
                        style={{
                            backgroundColor: '#f5f5f5',
                            color: 'black',
                            width: '100%',
                            height: 50,
                            paddingHorizontal: 15,
                            paddingVertical: 10,
                            borderRadius: 10,
                            marginBottom: 15,
                        }}
                    />
                    <TextInput
                        placeholder="Tulis keterangan kegiatan..."
                        placeholderTextColor="#999"
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        style={{
                            backgroundColor: '#f5f5f5',
                            color: 'black',
                            width: '100%',
                            padding: 15,
                            borderRadius: 10,
                            marginBottom: 20,
                            minHeight: 180,
                        }}
                    />

                    <Image
                        source={{ uri: image }}
                        resizeMode="cover"
                        style={{
                            width: '100%',
                            height: 250,
                            borderRadius: 20,
                            marginBottom: 20,
                        }}
                    />
                </>
            )}
        </View>
    );
}