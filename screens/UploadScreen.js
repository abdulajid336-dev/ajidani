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
import * as ImageManipulator from 'expo-image-manipulator';

export default function UploadScreen({
  navigation,
  route,
}) {
  const [image, setImage] = useState(null);
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

      if (type === 'image') {
        navigation.navigate('MediaEditor', {
          mediaUri: finalUri,
          mediaType: type,
        });
      } else {
        navigation.navigate('MediaEditorVideo', {
          mediaUri: finalUri,
          mediaType: type,
        });
      }

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

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

      navigation.navigate('Home');
    }
    catch (err) {
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
      ) : null}
    </View>
  );
}