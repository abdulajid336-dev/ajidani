import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from './Supabase';

export default function UploadScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [thumbnail, setThumbnail] = useState(null);

  async function pickImage(type = 'image') {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setImage(uri);
      setMediaType(type);

      if (type === 'video') {
        try {
          const { uri: thumbnailUri } =
            await VideoThumbnails.getThumbnailAsync(
              uri,
              { time: 1000 }
            );

          setThumbnail(thumbnailUri);
        } catch (e) {
          
        }
      }
    }
  }
  async function takePhoto(type = 'image') {
    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes:
          type === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setImage(uri);
      setMediaType(type);

      if (type === 'video') {
        try {
          const { uri: thumbnailUri } =
            await VideoThumbnails.getThumbnailAsync(
              uri,
              { time: 1000 }
            );

          setThumbnail(thumbnailUri);
        } catch (e) {
          
        }
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
      let thumbnailUrl = null;

      if (mediaType === 'video' && thumbnail) {
        const thumbName =
          `thumb-${Date.now()}.jpg`;

        const thumbFormData = new FormData();

        thumbFormData.append('file', {
          uri: thumbnail,
          name: thumbName,
          type: 'image/jpeg',
        });

        const { error: thumbError } =
          await supabase.storage
            .from('posts')
            .upload(
              thumbName,
              thumbFormData,
              {
                contentType: 'image/jpeg',
              }
            );

        if (!thumbError) {
          const {
            data: thumbUrlData,
          } = supabase.storage
            .from('posts')
            .getPublicUrl(thumbName);

          thumbnailUrl =
            thumbUrlData.publicUrl;
        }
      }

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
            thumbnail_url: thumbnailUrl,
            user_id: user.id,
            title: title,
            caption: caption,
            status: 'approved',
            category: 'umum',

            author_name: profile?.name || '',
            author_avatar: profile?.avatar_url || '',
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
              marginBottom: 15,
            }}
          >
            <TouchableOpacity
              onPress={() => takePhoto('image')}
              style={{
                width: '48%',
                height: 100,
                backgroundColor: '#4CAF50',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 30 }}>
                📷
              </Text>

              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginTop: 5,
                }}
              >
                Ambil Foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => takePhoto('video')}
              style={{
                width: '48%',
                height: 100,
                backgroundColor: '#FF9800',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 30 }}>
                🎥
              </Text>

              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginTop: 5,
                }}
              >
                Rekam Video
              </Text>
            </TouchableOpacity>
          </View>

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
                Pilih Foto Galeri
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
                Pilih Video Galeri
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
                pickImage();
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
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            style={{
              backgroundColor: '#222',
              color: 'white',
              width: '100%',
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              Height: 40,
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
              backgroundColor: '#222',
              color: 'white',
              width: '100%',
              padding: 15,
              borderRadius: 10,
              marginBottom: 20,
              minHeight: 180,
            }}
          />

          <Image
            source={{ uri: image }}
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