import React, { useState } from 'react';
import { supabase } from './Supabase';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function AdminUploadScreen({ route }) {
  const { category } = route.params;

  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [thumbnail, setThumbnail] = useState(null);

  async function pickMedia(type) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,

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
              {
                time: 1000,
              }
            );

          setThumbnail(thumbnailUri);
          
        } catch (e) {
          
        }
      }
    }
  }
  async function uploadImage() {
    if (!image) {
      alert('Pilih gambar dulu!');
      return;
    }

    try {
      const formData = new FormData();

      const extension =
        mediaType === 'video'
          ? 'mp4'
          : 'jpg';

      const mimeType =
        mediaType === 'video'
          ? 'video/mp4'
          : 'image/jpeg';

      const fileName =
        `admin-${Date.now()}.${extension}`;

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

      const postData = {
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        user_id: user.id,
        title: title,
        caption: caption,
        status: 'approved',
        category,

        author_name: profile?.name || '',
        author_avatar: profile?.avatar_url || '',
        is_admin_post: true,
        media_type: mediaType,
      };

      const { error: dbError } = await supabase
        .from('posts')
        .insert([postData]);

      if (dbError) {
        console.log('DB ERROR =', dbError);
        alert(dbError.message);
        return;
      }

      alert('Upload berhasil');

      setTitle('');
      setCaption('');
      setImage(null);
    } catch (err) {
      console.log(err);
      alert('Upload gagal');
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        padding: 15,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
        }}
      >
        Upload {category}
      </Text>

      {!image ? (
        <>
          <TouchableOpacity
            onPress={() => pickMedia('image')}
            style={{
              backgroundColor: '#4CAF50',
              padding: 20,
              borderRadius: 15,
              marginBottom: 15,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 22,
                textAlign: 'center',
              }}
            >
              📷
            </Text>

            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
                marginTop: 8,
              }}
            >
              Pilih Foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickMedia('video')}
            style={{
              backgroundColor: '#2196F3',
              padding: 20,
              borderRadius: 15,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 22,
                textAlign: 'center',
              }}
            >
              🎥
            </Text>

            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
                marginTop: 8,
              }}
            >
              Pilih Video
            </Text>
          </TouchableOpacity>
        </>

      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 15,
            }}
          >
            <TouchableOpacity
              onPress={uploadImage}
              style={{
                flex: 1,
                backgroundColor: 'green',
                padding: 15,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Upload
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickMedia(mediaType)}
              style={{
                flex: 1,
                backgroundColor: 'red',
                padding: 15,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Ganti Foto
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Tulis judul..."
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            style={{
              backgroundColor: '#1e1e1e',
              color: 'white',
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
            }}
          />
          <TextInput
            placeholder="Tulis keterangan..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            textAlignVertical="top"
            style={{
              backgroundColor: '#1e1e1e',
              color: 'white',
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              minHeight: 120,
            }}
          />

          <Image
            source={{ uri: image }}
            style={{
              width: '100%',
              height: 350,
              borderRadius: 15,
            }}
          />
        </>
      )}
    </View>
  );
}